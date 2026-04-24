/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { AstNodeDescription } from '../syntax-tree.js';
import { MultiMap } from '../utils/collections.js';
import type { Stream } from '../utils/stream.js';
/**
 * A scope describes what target elements are visible from a specific cross-reference context.
 */
export interface Scope {
    /**
     * Find a target element matching the given name. If no element is found, `undefined` is returned.
     * If multiple matching elements are present, the selection of the returned element should be done
     * according to the semantics of your language. Usually it is the element that is most closely defined.
     *
     * @param name Name of the cross-reference target as it appears in the source text.
     */
    getElement(name: string): AstNodeDescription | undefined;
    /**
     * Finds all target elements matching the given name. If no element is found, an empty stream is returned.
     *
     * @param name Name of the cross-reference target as it appears in the source text.
     */
    getElements(name: string): Stream<AstNodeDescription>;
    /**
     * Create a stream of all elements in the scope. This is used to compute completion proposals to be
     * shown in the editor.
     */
    getAllElements(): Stream<AstNodeDescription>;
}
export interface ScopeOptions {
    /**
     * Whether the scope should be case insensitive.
     * Defaults to `false`.
     */
    caseInsensitive?: boolean;
    /**
     * Whether the outer scope should be concatenated with the local scope when calling `getElements`.
     * Defaults to `true`.
     */
    concatOuterScope?: boolean;
}
/**
 * The default scope implementation is based on a `Stream`. It has an optional _outer scope_ describing
 * the next level of elements, which are queried when a target element is not found in the stream provided
 * to this scope.
 */
export declare class StreamScope implements Scope {
    readonly elements: Stream<AstNodeDescription>;
    readonly outerScope?: Scope;
    readonly caseInsensitive: boolean;
    readonly concatOuterScope: boolean;
    constructor(elements: Stream<AstNodeDescription>, outerScope?: Scope, options?: ScopeOptions);
    getAllElements(): Stream<AstNodeDescription>;
    getElement(name: string): AstNodeDescription | undefined;
    getElements(name: string): Stream<AstNodeDescription>;
}
export declare class MapScope implements Scope {
    readonly elements: Map<string, AstNodeDescription>;
    readonly outerScope?: Scope;
    readonly caseInsensitive: boolean;
    readonly concatOuterScope: boolean;
    constructor(elements: Iterable<AstNodeDescription>, outerScope?: Scope, options?: ScopeOptions);
    getElement(name: string): AstNodeDescription | undefined;
    getElements(name: string): Stream<AstNodeDescription>;
    getAllElements(): Stream<AstNodeDescription>;
}
export declare class MultiMapScope implements Scope {
    readonly elements: MultiMap<string, AstNodeDescription>;
    readonly outerScope?: Scope;
    readonly caseInsensitive: boolean;
    readonly concatOuterScope: boolean;
    constructor(elements: Iterable<AstNodeDescription>, outerScope?: Scope, options?: ScopeOptions);
    getElement(name: string): AstNodeDescription | undefined;
    getElements(name: string): Stream<AstNodeDescription>;
    getAllElements(): Stream<AstNodeDescription>;
}
export declare const EMPTY_SCOPE: Scope;
//# sourceMappingURL=scope.d.ts.map