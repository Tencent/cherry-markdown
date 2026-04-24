/******************************************************************************
* Copyright 2021 TypeFox GmbH
* This program and the accompanying materials are made available under the
* terms of the MIT License, which is available in the project root.
******************************************************************************/

import type { AstNode, CstNode } from '../../syntax-tree.js';
import type { Stream } from '../../utils/stream.js';
import type { ReferenceDescription } from '../../workspace/ast-descriptions.js';
import type { AbstractParserRule, Action, Assignment, Interface, Type, TypeAttribute } from '../../languages/generated/ast.js';
import type { FindReferencesOptions } from '../../references/references.js';
import { DefaultReferences } from '../../references/references.js';
import { getContainerOfType, getDocument } from '../../utils/ast-utils.js';
import { toDocumentSegment } from '../../utils/cst-utils.js';
import { findAssignment, findNodeForKeyword, findNodeForProperty, getActionAtElement } from '../../utils/grammar-utils.js';
import { stream } from '../../utils/stream.js';
import { UriUtils } from '../../utils/uri-utils.js';
import { isAbstractParserRule, isAction, isAssignment, isInfixRule, isInterface, isParserRule, isType, isTypeAttribute } from '../../languages/generated/ast.js';
import { extractAssignments } from '../internal-grammar-util.js';
import { collectChildrenTypes, collectSuperTypes } from '../type-system/types-util.js';
import { assertUnreachable } from '../../utils/errors.js';

export class LangiumGrammarReferences extends DefaultReferences {

    override findDeclarations(sourceCstNode: CstNode): AstNode[] {
        const nodeElem = sourceCstNode.astNode;
        const assignment = findAssignment(sourceCstNode);
        if (assignment && assignment.feature === 'feature') {
            // Only search for a special declaration if the cst node is the feature property of the action/assignment
            if (isAssignment(nodeElem)) {
                const decl = this.findAssignmentDeclaration(nodeElem);
                return decl ? [decl] : [];
            } else if (isAction(nodeElem)) {
                const decl = this.findActionDeclaration(nodeElem);
                return decl ? [decl] : [];
            }
        }
        return super.findDeclarations(sourceCstNode);
    }

    override findReferences(targetNode: AstNode, options: FindReferencesOptions): Stream<ReferenceDescription> {
        if (isTypeAttribute(targetNode)) {
            return this.findReferencesToTypeAttribute(targetNode, options.includeDeclaration ?? false);
        } else {
            return super.findReferences(targetNode, options);
        }
    }

    protected findReferencesToTypeAttribute(targetNode: TypeAttribute, includeDeclaration: boolean): Stream<ReferenceDescription> {
        const refs: ReferenceDescription[] = [];
        const interfaceNode = getContainerOfType(targetNode, isInterface);
        if (interfaceNode) {
            if (includeDeclaration) {
                refs.push(...this.getSelfReferences(targetNode));
            }
            const interfaces = collectChildrenTypes(interfaceNode, this, this.documents, this.nodeLocator);
            const targetRules: Array<AbstractParserRule | Action> = [];
            interfaces.forEach(interf => {
                const rules = this.findRulesWithReturnType(interf);
                targetRules.push(...rules);
            });
            targetRules.forEach(rule => {
                const references = this.createReferencesToAttribute(rule, targetNode);
                refs.push(...references);
            });
        }
        return stream(refs);
    }

    protected createReferencesToAttribute(ruleOrAction: AbstractParserRule | Action, attribute: TypeAttribute): ReferenceDescription[] {
        const refs: ReferenceDescription[] = [];
        if (isParserRule(ruleOrAction)) {
            const assignment = extractAssignments(ruleOrAction.definition).find(a => a.feature === attribute.name);
            if (assignment?.$cstNode) {
                const leaf = this.nameProvider.getNameNode(assignment);
                if (leaf) {
                    const assignmentUri = getDocument(assignment).uri;
                    const attributeUri = getDocument(attribute).uri;
                    refs.push({
                        sourceUri: assignmentUri,
                        sourcePath: this.nodeLocator.getAstNodePath(assignment),
                        targetUri: attributeUri,
                        targetPath: this.nodeLocator.getAstNodePath(attribute),
                        segment: toDocumentSegment(leaf),
                        local: UriUtils.equals(assignmentUri, attributeUri)
                    });
                }
            }
        } else if (isInfixRule(ruleOrAction)) {
            let leaf: CstNode | undefined;
            if (attribute.name === 'left' || attribute.name === 'right') {
                // Use the 'on' keyword as segment
                leaf = findNodeForKeyword(ruleOrAction.$cstNode, 'on');
            } else if (attribute.name === 'operator') {
                // Use the rule definition in 'operators' as segment
                leaf = findNodeForProperty(ruleOrAction.$cstNode, 'operators');
            }

            if (leaf) {
                const ruleUri = getDocument(ruleOrAction).uri;
                const attributeUri = getDocument(attribute).uri;
                refs.push({
                    sourceUri: ruleUri,
                    sourcePath: this.nodeLocator.getAstNodePath(ruleOrAction),
                    targetUri: attributeUri,
                    targetPath: this.nodeLocator.getAstNodePath(attribute),
                    segment: toDocumentSegment(leaf),
                    local: UriUtils.equals(ruleUri, attributeUri)
                });
            }
        } else if (isAction(ruleOrAction)) {
            // If the action references the attribute directly
            if (ruleOrAction.feature === attribute.name) {
                const leaf = findNodeForProperty(ruleOrAction.$cstNode, 'feature');
                if (leaf) {
                    const actionUri = getDocument(ruleOrAction).uri;
                    const attributeUri = getDocument(attribute).uri;
                    refs.push({
                        sourceUri: actionUri,
                        sourcePath: this.nodeLocator.getAstNodePath(ruleOrAction),
                        targetUri: attributeUri,
                        targetPath: this.nodeLocator.getAstNodePath(attribute),
                        segment: toDocumentSegment(leaf),
                        local: UriUtils.equals(actionUri, attributeUri)
                    });
                }
            }
            // Find all references within the parser rule that contains this action
            const parserRule = getContainerOfType(ruleOrAction, isParserRule);
            refs.push(...this.createReferencesToAttribute(parserRule!, attribute));
        } else {
            assertUnreachable(ruleOrAction);
        }
        return refs;
    }

    protected findAssignmentDeclaration(assignment: Assignment): AstNode | undefined {
        const parserRule = getContainerOfType(assignment, isParserRule);
        const action = getActionAtElement(assignment);
        if (action) {
            const actionDeclaration = this.findActionDeclaration(action, assignment.feature);
            if (actionDeclaration) {
                return actionDeclaration;
            }
        }
        if (parserRule?.returnType?.ref) {
            if (isInterface(parserRule.returnType.ref) || isType(parserRule.returnType.ref)) {
                const interfaces = collectSuperTypes(parserRule.returnType.ref);
                for (const interf of interfaces) {
                    const typeAttribute = interf.attributes.find(att => att.name === assignment.feature);
                    if (typeAttribute) {
                        return typeAttribute;
                    }
                }
            }
        }
        return assignment;
    }

    protected findActionDeclaration(action: Action, featureName?: string): TypeAttribute | undefined {
        if (action.type?.ref) {
            const feature = featureName ?? action.feature;
            const interfaces = collectSuperTypes(action.type.ref);
            for (const interf of interfaces) {
                const typeAttribute = interf.attributes.find(att => att.name === feature);
                if (typeAttribute) {
                    return typeAttribute;
                }
            }
        }
        return undefined;
    }

    protected findRulesWithReturnType(interf: Interface | Type): Array<AbstractParserRule | Action> {
        const rules: Array<AbstractParserRule | Action> = [];
        const refs = this.index.findAllReferences(interf, this.nodeLocator.getAstNodePath(interf));
        for (const ref of refs) {
            const doc = this.documents.getDocument(ref.sourceUri);
            if (doc) {
                const astNode = this.nodeLocator.getAstNode(doc.parseResult.value, ref.sourcePath);
                if (isAbstractParserRule(astNode) || isAction(astNode)) {
                    rules.push(astNode);
                }
            }
        }
        return rules;
    }
}
