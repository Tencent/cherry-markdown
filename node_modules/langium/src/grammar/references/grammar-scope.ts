/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { Scope } from '../../references/scope.js';
import type { LangiumCoreServices } from '../../services.js';
import type { AstNode, AstNodeDescription, ReferenceInfo } from '../../syntax-tree.js';
import type { MultiMap } from '../../utils/collections.js';
import type { AstNodeLocator } from '../../workspace/ast-node-locator.js';
import type { DocumentSegment, LangiumDocument, LangiumDocuments } from '../../workspace/documents.js';
import type { Grammar } from '../../languages/generated/ast.js';
import { EMPTY_SCOPE, MultiMapScope } from '../../references/scope.js';
import { DefaultScopeComputation } from '../../references/scope-computation.js';
import { DefaultScopeProvider } from '../../references/scope-provider.js';
import { findRootNode, getContainerOfType, getDocument, streamAllContents } from '../../utils/ast-utils.js';
import { toDocumentSegment } from '../../utils/cst-utils.js';
import { AbstractType, InferredType, Interface, NamedArgument, Type, isAbstractParserRule, isAction, isGrammar, isReturnType, isRuleCall } from '../../languages/generated/ast.js';
import { resolveImportUri } from '../internal-grammar-util.js';

export class LangiumGrammarScopeProvider extends DefaultScopeProvider {

    protected readonly langiumDocuments: LangiumDocuments;

    constructor(services: LangiumCoreServices) {
        super(services);
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    }

    override getScope(context: ReferenceInfo): Scope {
        if (context.container.$type === NamedArgument.$type && context.property === 'parameter') {
            return this.getNamedArgumentScope(context);
        }
        const referenceType = this.reflection.getReferenceType(context);
        if (referenceType === AbstractType.$type) {
            return this.getTypeScope(referenceType, context);
        } else {
            return super.getScope(context);
        }
    }

    private getNamedArgumentScope(context: ReferenceInfo): Scope {
        const ruleCall = context.container.$container;
        if (!isRuleCall(ruleCall)) {
            return EMPTY_SCOPE;
        }
        const rule = ruleCall.rule.ref;
        if (!isAbstractParserRule(rule)) {
            return EMPTY_SCOPE;
        }
        return this.createScopeForNodes(rule.parameters);
    }

    private getTypeScope(referenceType: string, context: ReferenceInfo): Scope {
        const localSymbols = getDocument(context.container).localSymbols;
        const rootNode = findRootNode(context.container);

        if (localSymbols && rootNode && localSymbols.has(rootNode)) {
            const globalScope = this.getGlobalScope(referenceType, context);
            const localScope = localSymbols.getStream(rootNode).filter(
                des => des.type === Interface.$type || des.type === Type.$type || des.type === InferredType.$type
            );

            return this.createScope(localScope, globalScope);

        } else {
            return this.getGlobalScope(referenceType, context);
        }
    }

    protected override getGlobalScope(referenceType: string, context: ReferenceInfo): Scope {
        const grammar = getContainerOfType(context.container, isGrammar);
        if (!grammar) {
            return EMPTY_SCOPE;
        }
        const importedUris = new Set<string>();
        this.gatherImports(grammar, importedUris);
        let importedElements = this.indexManager.allElements(referenceType, importedUris);
        if (referenceType === AbstractType.$type) {
            importedElements = importedElements.filter(des => des.type === Interface.$type || des.type === Type.$type || des.type === InferredType.$type);
        }
        return new MultiMapScope(importedElements);
    }

    private gatherImports(grammar: Grammar, importedUris: Set<string>): void {
        for (const imp0rt of grammar.imports) {
            const uri = resolveImportUri(imp0rt);
            if (uri && !importedUris.has(uri.toString())) {
                importedUris.add(uri.toString());
                const importedDocument = this.langiumDocuments.getDocument(uri);
                if (importedDocument) {
                    const rootNode = importedDocument.parseResult.value;
                    if (isGrammar(rootNode)) {
                        this.gatherImports(rootNode, importedUris);
                    }
                }
            }
        }
    }

}

export class LangiumGrammarScopeComputation extends DefaultScopeComputation {
    protected readonly astNodeLocator: AstNodeLocator;

    constructor(services: LangiumCoreServices) {
        super(services);
        this.astNodeLocator = services.workspace.AstNodeLocator;
    }

    protected override addExportedSymbol(node: AstNode, exports: AstNodeDescription[], document: LangiumDocument): void {
        // this function is called in order to export nodes to the GLOBAL scope

        /* Among others, TYPES need to be exported.
         * There are three ways to define types:
         * - explicit "type" declarations
         * - explicit "interface" declarations
         * - "inferred types", which can be distinguished into ...
         *     - inferred types with explicitly declared names, i.e. parser rules with "infers", actions with "infer"
         *       Note, that multiple explicitly inferred types might have the same name! Cross-references to such types are resolved to the first declaration.
         *     - implicitly inferred types, i.e. parser rules without "infers" and without "returns",
         *       which implicitly declare a type with the same name as the parser rule
         *       Note, that implicitly inferred types are unique, since names of parser rules must be unique.
         */

        // export the top-level elements: parser rules, terminal rules, types, interfaces
        super.addExportedSymbol(node, exports, document);

        // additionally, export inferred types:
        if (isAbstractParserRule(node)) {
            if (!node.returnType && !node.dataType) {
                // Export implicitly and explicitly inferred type from parser rule
                const typeNode = node.inferredType ?? node;
                exports.push(this.createInferredTypeDescription(typeNode, typeNode.name, document));
            }
            streamAllContents(node).forEach(childNode => {
                if (isAction(childNode) && childNode.inferredType) {
                    // Export explicitly inferred type from action
                    exports.push(this.createInferredTypeDescription(childNode.inferredType, childNode.inferredType.name, document));
                }
            });
        }
    }

    protected override addLocalSymbol(node: AstNode, document: LangiumDocument, symbols: MultiMap<AstNode, AstNodeDescription>): void {
        // for the precompution of the local scope
        if (isReturnType(node)) {
            return;
        }
        this.processTypeNode(node, document, symbols);
        this.processActionNode(node, document, symbols);
        super.addLocalSymbol(node, document, symbols);
    }

    /**
     * Add synthetic type into the scope in case of explicitly or implicitly inferred type:<br>
     * cases: `ParserRule: ...;` or `ParserRule infers Type: ...;`
     */
    protected processTypeNode(node: AstNode, document: LangiumDocument, symbols: MultiMap<AstNode, AstNodeDescription>): void {
        const container = node.$container;
        if (container && isAbstractParserRule(node) && !node.returnType && !node.dataType) {
            const typeNode = node.inferredType ?? node;
            symbols.add(container, this.createInferredTypeDescription(typeNode, typeNode.name, document));
        }
    }

    /**
     * Add synthetic type into the scope in case of explicitly inferred type:
     *
     * case: `{infer Action}`
     */
    protected processActionNode(node: AstNode, document: LangiumDocument, symbols: MultiMap<AstNode, AstNodeDescription>): void {
        const container = findRootNode(node);
        if (container && isAction(node) && node.inferredType) {
            symbols.add(container, this.createInferredTypeDescription(node.inferredType, node.inferredType.name, document));
        }
    }

    protected createInferredTypeDescription(node: AstNode, name: string, document: LangiumDocument = getDocument(node)): AstNodeDescription {
        let nameNodeSegment: DocumentSegment | undefined;
        const nameSegmentGetter = () => nameNodeSegment ??= toDocumentSegment(this.nameProvider.getNameNode(node) ?? node.$cstNode);
        return {
            node,
            name,
            get nameSegment() {
                return nameSegmentGetter();
            },
            selectionSegment: toDocumentSegment(node.$cstNode),
            type: InferredType.$type,
            documentUri: document.uri,
            path: this.astNodeLocator.getAstNodePath(node)
        };
    }
}
