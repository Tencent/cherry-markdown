/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { LangiumCoreServices } from '../services.js';
import type { AstNode, CstNode } from '../syntax-tree.js';
import type { Stream } from '../utils/stream.js';
import type { ReferenceDescription } from '../workspace/ast-descriptions.js';
import type { AstNodeLocator } from '../workspace/ast-node-locator.js';
import type { IndexManager } from '../workspace/index-manager.js';
import type { NameProvider } from './name-provider.js';
import type { URI } from '../utils/uri-utils.js';
import type { LangiumDocuments } from '../workspace/documents.js';
/**
 * Language-specific service for finding references and declaration of a given `CstNode`.
 */
export interface References {
    /**
     * If the CstNode is a reference node the target AstNodes will be returned.
     * If the CstNode is a significant node of the CstNode this AstNode will be returned.
     *
     * @param sourceCstNode CstNode that points to a AstNode
     */
    findDeclarations(sourceCstNode: CstNode): AstNode[];
    /**
     * If the CstNode is a reference node the target CstNodes will be returned.
     * If the CstNode is a significant node of the CstNode this CstNode will be returned.
     *
     * @param sourceCstNode CstNode that points to a AstNode
     */
    findDeclarationNodes(sourceCstNode: CstNode): CstNode[];
    /**
     * Finds all references to the target node as references (local references) or reference descriptions.
     *
     * @param targetNode Specified target node whose references should be returned
     */
    findReferences(targetNode: AstNode, options: FindReferencesOptions): Stream<ReferenceDescription>;
}
export interface FindReferencesOptions {
    /**
     * When set, the `findReferences` method will only return references/declarations from the specified document.
     */
    documentUri?: URI;
    /**
     * Whether the returned list of references should include the declaration.
     */
    includeDeclaration?: boolean;
}
export declare class DefaultReferences implements References {
    protected readonly nameProvider: NameProvider;
    protected readonly index: IndexManager;
    protected readonly nodeLocator: AstNodeLocator;
    protected readonly documents: LangiumDocuments;
    protected hasMultiReference: boolean;
    constructor(services: LangiumCoreServices);
    findDeclarations(sourceCstNode: CstNode): AstNode[];
    /**
     * Returns all self-references for the specified node.
     * Since the node can be part of a multi-reference, this method returns all nodes that are part of the same multi-reference.
     */
    protected getSelfNodes(node: AstNode): AstNode[];
    protected getNodeFromReferenceDescription(ref?: ReferenceDescription): AstNode | undefined;
    findDeclarationNodes(sourceCstNode: CstNode): CstNode[];
    findReferences(targetNode: AstNode, options: FindReferencesOptions): Stream<ReferenceDescription>;
    protected getSelfReferences(targetNode: AstNode): ReferenceDescription[];
}
//# sourceMappingURL=references.d.ts.map