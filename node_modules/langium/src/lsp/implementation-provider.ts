/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { ImplementationParams, LocationLink } from 'vscode-languageserver';
import type { GrammarConfig } from '../languages/grammar-config.js';
import type { References } from '../references/references.js';
import type { LangiumServices } from './lsp-services.js';
import type { AstNode } from '../syntax-tree.js';
import type { MaybePromise } from '../utils/promise-utils.js';
import type { LangiumDocument } from '../workspace/documents.js';
import { CancellationToken } from '../utils/cancellation.js';
import { findDeclarationNodeAtOffset } from '../utils/cst-utils.js';

/**
 * Language-specific service for handling go to implementation requests.
 */
export interface ImplementationProvider {
    /**
     * Handles a go to implementation request.
     */
    getImplementation(document: LangiumDocument, params: ImplementationParams, cancelToken?: CancellationToken): MaybePromise<LocationLink[] | undefined>;
}

export abstract class AbstractGoToImplementationProvider implements ImplementationProvider {
    protected readonly references: References;
    protected readonly grammarConfig: GrammarConfig;

    constructor(services: LangiumServices) {
        this.references = services.references.References;
        this.grammarConfig = services.parser.GrammarConfig;
    }

    async getImplementation(document: LangiumDocument<AstNode>, params: ImplementationParams, cancelToken = CancellationToken.None): Promise<LocationLink[] | undefined> {
        const rootNode = document.parseResult.value;
        if (rootNode.$cstNode) {
            const sourceCstNode = findDeclarationNodeAtOffset(rootNode.$cstNode, document.textDocument.offsetAt(params.position), this.grammarConfig.nameRegexp);
            if (sourceCstNode) {
                const nodeDeclarations = this.references.findDeclarations(sourceCstNode);
                const links: LocationLink[] = [];
                for (const node of nodeDeclarations) {
                    const location = await this.collectGoToImplementationLocationLinks(node, cancelToken);
                    if (location) {
                        links.push(...location);
                    }
                }
            }
        }
        return undefined;
    }

    abstract collectGoToImplementationLocationLinks(element: AstNode, cancelToken: CancellationToken): MaybePromise<LocationLink[] | undefined>;
}
