/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { LocationLink, Range } from 'vscode-languageserver';
import { DefaultDefinitionProvider } from '../../lsp/index.js';
import { streamContents } from '../../utils/ast-utils.js';
import { findAssignment } from '../../utils/grammar-utils.js';
import { isGrammarImport } from '../../languages/generated/ast.js';
import { resolveImport } from '../internal-grammar-util.js';
export class LangiumGrammarDefinitionProvider extends DefaultDefinitionProvider {
    constructor(services) {
        super(services);
        this.documents = services.shared.workspace.LangiumDocuments;
    }
    collectLocationLinks(sourceCstNode, _params) {
        const pathFeature = 'path';
        if (isGrammarImport(sourceCstNode.astNode) && findAssignment(sourceCstNode)?.feature === pathFeature) {
            const importedGrammar = resolveImport(this.documents, sourceCstNode.astNode);
            if (importedGrammar?.$document) {
                const targetObject = this.findTargetObject(importedGrammar) ?? importedGrammar;
                const selectionRange = this.nameProvider.getNameNode(targetObject)?.range ?? Range.create(0, 0, 0, 0);
                const previewRange = targetObject.$cstNode?.range ?? Range.create(0, 0, 0, 0);
                return [
                    LocationLink.create(importedGrammar.$document.uri.toString(), previewRange, selectionRange, sourceCstNode.range)
                ];
            }
            return undefined;
        }
        return super.collectLocationLinks(sourceCstNode, _params);
    }
    findTargetObject(importedGrammar) {
        // Jump to grammar name or the first element
        if (importedGrammar.isDeclared) {
            return importedGrammar;
        }
        return streamContents(importedGrammar).head();
    }
}
//# sourceMappingURL=grammar-definition.js.map