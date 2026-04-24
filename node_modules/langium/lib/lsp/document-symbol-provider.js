/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { streamContents } from '../utils/ast-utils.js';
export class DefaultDocumentSymbolProvider {
    constructor(services) {
        this.nameProvider = services.references.NameProvider;
        this.nodeKindProvider = services.shared.lsp.NodeKindProvider;
    }
    getSymbols(document, _params, _cancelToken) {
        return this.getSymbol(document, document.parseResult.value);
    }
    getSymbol(document, astNode) {
        const nameNode = this.nameProvider.getNameNode(astNode);
        if (nameNode && astNode.$cstNode) {
            const computedName = this.nameProvider.getName(astNode);
            return [this.createSymbol(document, astNode, astNode.$cstNode, nameNode, computedName)];
        }
        else {
            return this.getChildSymbols(document, astNode) || [];
        }
    }
    createSymbol(document, astNode, cstNode, nameNode, computedName) {
        return {
            kind: this.nodeKindProvider.getSymbolKind(astNode),
            name: computedName || nameNode.text,
            range: cstNode.range,
            selectionRange: nameNode.range,
            children: this.getChildSymbols(document, astNode)
        };
    }
    getChildSymbols(document, astNode) {
        const children = [];
        for (const child of streamContents(astNode)) {
            const result = this.getSymbol(document, child);
            children.push(...result);
        }
        if (children.length > 0) {
            return children;
        }
        return undefined;
    }
}
//# sourceMappingURL=document-symbol-provider.js.map