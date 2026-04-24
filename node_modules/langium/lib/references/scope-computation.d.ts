/******************************************************************************
 * Copyright 2021-2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { LangiumCoreServices } from '../services.js';
import type { AstNode, AstNodeDescription } from '../syntax-tree.js';
import { CancellationToken } from '../utils/cancellation.js';
import { MultiMap } from '../utils/collections.js';
import type { AstNodeDescriptionProvider } from '../workspace/ast-descriptions.js';
import type { LangiumDocument, LocalSymbols } from '../workspace/documents.js';
import type { NameProvider } from './name-provider.js';
/**
 * Language-specific service for precomputing global and local scopes. The service methods are executed
 * as the first and second phase in the `DocumentBuilder`.
 */
export interface ScopeComputation {
    /**
     * Creates descriptions of all AST nodes that shall be exported into the _global_ scope from the given
     * document. These descriptions are gathered by the `IndexManager` and stored in the global index so
     * they can be referenced from other documents.
     *
     * _Note:_ You should not resolve any cross-references in this service method. Cross-reference resolution
     * depends on the scope computation phase to be completed (`computeScope` method), which runs after the
     * initial indexing where this method is used.
     *
     * @param document The document from which to gather exported AST nodes.
     * @param cancelToken Indicates when to cancel the current operation.
     * @throws `OperationCanceled` if a user action occurs during execution
     */
    collectExportedSymbols(document: LangiumDocument, cancelToken?: CancellationToken): Promise<AstNodeDescription[]>;
    /**
     * Creates descriptions of the _local_ symbols being accessible within a document.
     * The result is a `LocalSymbols` table assigning sets of AST node descriptions to the corresponding
     * nodes/subtrees within the AST. The descriptions are considered in the default reference resolution
     * implementation, i.e. they are used by the `ScopeProvider` service to determine which symbols
     * are visible in the context of a specific cross-reference.
     *
     * _Note:_ You should not resolve any cross-references in this service method. Cross-reference
     * resolution depends on the scope computation phase to be completed.
     *
     * @param document The document for which to compute its local symbols.
     * @param cancelToken Indicates when to cancel the current operation.
     * @throws `OperationCanceled` if a user action occurs during execution
     */
    collectLocalSymbols(document: LangiumDocument, cancelToken?: CancellationToken): Promise<LocalSymbols>;
}
/**
 * The default scope computation creates and collects descriptions of the AST nodes to be exported into the
 * _global_ scope from the given document. By default those are the document's root AST node and its directly
 * contained child nodes.
 *
 * Besides, it gathers all AST nodes that have a name (according to the `NameProvider` service) and that are to be
 * included in the local scope of their particular container nodes. They are collected in a `DocumentSymbols` table.
 * As a result, for every cross-reference in the AST, target elements from the same level (siblings) and further up
 * towards the root (parents and siblings of parents) are visible.
 * Elements being nested inside lower levels (children, children of siblings and parents' siblings)
 * are _invisible_ by default, but that can be changed by customizing this service.
 */
export declare class DefaultScopeComputation implements ScopeComputation {
    protected readonly nameProvider: NameProvider;
    protected readonly descriptions: AstNodeDescriptionProvider;
    constructor(services: LangiumCoreServices);
    collectExportedSymbols(document: LangiumDocument, cancelToken?: CancellationToken): Promise<AstNodeDescription[]>;
    /**
     * Creates {@link AstNodeDescription AstNodeDescriptions} for the given {@link AstNode parentNode} and its children.
     * The list of children to be considered is determined by the function parameter {@link children}.
     * By default only the direct children of {@link parentNode} are visited, nested nodes are not exported.
     *
     * @param parentNode AST node to be exported, i.e., of which an {@link AstNodeDescription} shall be added to the returned list.
     * @param document The document containing the AST node to be exported.
     * @param children A function called with {@link parentNode} as single argument and returning an {@link Iterable} supplying the children to be visited, which must be directly or transitively contained in {@link parentNode}.
     * @param cancelToken Indicates when to cancel the current operation.
     * @throws `OperationCancelled` if a user action occurs during execution.
     * @returns A list of {@link AstNodeDescription AstNodeDescriptions} to be published to index.
     */
    collectExportedSymbolsForNode(parentNode: AstNode, document: LangiumDocument<AstNode>, children?: (root: AstNode) => Iterable<AstNode>, cancelToken?: CancellationToken): Promise<AstNodeDescription[]>;
    /**
     * Adds a single node to the list of exports if it has a name. Override this method to change how
     * symbols are exported, e.g. by modifying their exported name.
     */
    protected addExportedSymbol(node: AstNode, exports: AstNodeDescription[], document: LangiumDocument): void;
    collectLocalSymbols(document: LangiumDocument, cancelToken?: CancellationToken): Promise<LocalSymbols>;
    /**
     * Adds a single node to the local symbols of its containing document if it has a name.
     * The default implementation makes the node visible in the subtree of its container if it does have a container.
     * Override this method to change this, e.g. by increasing the visibility to a higher level in the AST.
     */
    protected addLocalSymbol(node: AstNode, document: LangiumDocument, symbols: MultiMap<AstNode, AstNodeDescription>): void;
}
//# sourceMappingURL=scope-computation.d.ts.map