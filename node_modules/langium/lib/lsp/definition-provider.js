/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { LocationLink } from 'vscode-languageserver';
import { getDocument } from '../utils/ast-utils.js';
import { findDeclarationNodeAtOffset, getDatatypeNode } from '../utils/cst-utils.js';
export class DefaultDefinitionProvider {
    constructor(services) {
        this.nameProvider = services.references.NameProvider;
        this.references = services.references.References;
        this.grammarConfig = services.parser.GrammarConfig;
    }
    getDefinition(document, params, _cancelToken) {
        const rootNode = document.parseResult.value;
        if (rootNode.$cstNode) {
            const cst = rootNode.$cstNode;
            const sourceCstNode = findDeclarationNodeAtOffset(cst, document.textDocument.offsetAt(params.position), this.grammarConfig.nameRegexp);
            if (sourceCstNode) {
                return this.collectLocationLinks(sourceCstNode, params);
            }
        }
        return undefined;
    }
    collectLocationLinks(sourceCstNode, _params) {
        const goToLinks = this.findLinks(sourceCstNode);
        if (goToLinks.length > 0) {
            return goToLinks.map(link => LocationLink.create(link.targetDocument.textDocument.uri, (link.target.astNode.$cstNode ?? link.target).range, link.target.range, link.source.range));
        }
        return undefined;
    }
    findLinks(source) {
        const datatypeSourceNode = getDatatypeNode(source) ?? source;
        const targets = this.references.findDeclarationNodes(source);
        const links = [];
        for (const target of targets) {
            const targetDocument = getDocument(target.astNode);
            if (targets && targetDocument) {
                links.push({
                    source: datatypeSourceNode,
                    target,
                    targetDocument
                });
            }
        }
        return links;
    }
}
//# sourceMappingURL=definition-provider.js.map