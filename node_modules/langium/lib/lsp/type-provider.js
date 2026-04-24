/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { CancellationToken } from '../utils/cancellation.js';
import { findDeclarationNodeAtOffset } from '../utils/cst-utils.js';
export class AbstractTypeDefinitionProvider {
    constructor(services) {
        this.references = services.references.References;
    }
    async getTypeDefinition(document, params, cancelToken = CancellationToken.None) {
        const rootNode = document.parseResult.value;
        if (rootNode.$cstNode) {
            const sourceCstNode = findDeclarationNodeAtOffset(rootNode.$cstNode, document.textDocument.offsetAt(params.position));
            if (sourceCstNode) {
                const nodeDeclarations = this.references.findDeclarations(sourceCstNode);
                const links = [];
                for (const node of nodeDeclarations) {
                    const location = await this.collectGoToTypeLocationLinks(node, cancelToken);
                    if (location) {
                        links.push(...location);
                    }
                }
            }
        }
        return undefined;
    }
}
//# sourceMappingURL=type-provider.js.map