/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { AstNodeDescription } from '../syntax-tree.js';
import { MultiMap } from '../utils/collections.js';
import type { Stream } from '../utils/stream.js';
import { EMPTY_STREAM, stream } from '../utils/stream.js';

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
export class StreamScope implements Scope {
    readonly elements: Stream<AstNodeDescription>;
    readonly outerScope?: Scope;
    readonly caseInsensitive: boolean;
    readonly concatOuterScope: boolean;

    constructor(elements: Stream<AstNodeDescription>, outerScope?: Scope, options?: ScopeOptions) {
        this.elements = elements;
        this.outerScope = outerScope;
        this.caseInsensitive = options?.caseInsensitive ?? false;
        this.concatOuterScope = options?.concatOuterScope ?? true;
    }

    getAllElements(): Stream<AstNodeDescription> {
        if (this.outerScope) {
            return this.elements.concat(this.outerScope.getAllElements());
        } else {
            return this.elements;
        }
    }

    getElement(name: string): AstNodeDescription | undefined {
        const lowerCaseName = this.caseInsensitive ? name.toLowerCase() : name;
        const local = this.caseInsensitive
            ? this.elements.find(e => e.name.toLowerCase() === lowerCaseName)
            : this.elements.find(e => e.name === name);
        if (local) {
            return local;
        }
        if (this.outerScope) {
            return this.outerScope.getElement(name);
        }
        return undefined;
    }

    getElements(name: string): Stream<AstNodeDescription> {
        const lowerCaseName = this.caseInsensitive ? name.toLowerCase() : name;
        const local = this.caseInsensitive
            ? this.elements.filter(e => e.name.toLowerCase() === lowerCaseName)
            : this.elements.filter(e => e.name === name);
        if ((this.concatOuterScope || local.isEmpty()) && this.outerScope) {
            return local.concat(this.outerScope.getElements(name));
        } else {
            return local;
        }
    }
}

export class MapScope implements Scope {
    readonly elements: Map<string, AstNodeDescription>;
    readonly outerScope?: Scope;
    readonly caseInsensitive: boolean;
    readonly concatOuterScope: boolean;

    constructor(elements: Iterable<AstNodeDescription>, outerScope?: Scope, options?: ScopeOptions) {
        this.elements = new Map();
        this.caseInsensitive = options?.caseInsensitive ?? false;
        this.concatOuterScope = options?.concatOuterScope ?? true;
        for (const element of elements) {
            const name = this.caseInsensitive
                ? element.name.toLowerCase()
                : element.name;
            this.elements.set(name, element);
        }
        this.outerScope = outerScope;
    }

    getElement(name: string): AstNodeDescription | undefined {
        const localName = this.caseInsensitive ? name.toLowerCase() : name;
        const local = this.elements.get(localName);
        if (local) {
            return local;
        }
        if (this.outerScope) {
            return this.outerScope.getElement(name);
        }
        return undefined;
    }

    getElements(name: string): Stream<AstNodeDescription> {
        const localName = this.caseInsensitive ? name.toLowerCase() : name;
        const local = this.elements.get(localName);
        const arr = local ? [local] : [];
        if ((this.concatOuterScope || arr.length > 0) && this.outerScope) {
            return stream(arr).concat(this.outerScope.getElements(name));
        } else {
            return stream(arr);
        }
    }

    getAllElements(): Stream<AstNodeDescription> {
        let elementStream = stream(this.elements.values());
        if (this.outerScope) {
            elementStream = elementStream.concat(this.outerScope.getAllElements());
        }
        return elementStream;
    }

}

export class MultiMapScope implements Scope {
    readonly elements: MultiMap<string, AstNodeDescription>;
    readonly outerScope?: Scope;
    readonly caseInsensitive: boolean;
    readonly concatOuterScope: boolean;

    constructor(elements: Iterable<AstNodeDescription>, outerScope?: Scope, options?: ScopeOptions) {
        this.elements = new MultiMap();
        this.caseInsensitive = options?.caseInsensitive ?? false;
        this.concatOuterScope = options?.concatOuterScope ?? true;
        for (const element of elements) {
            const name = this.caseInsensitive
                ? element.name.toLowerCase()
                : element.name;
            this.elements.add(name, element);
        }
        this.outerScope = outerScope;
    }

    getElement(name: string): AstNodeDescription | undefined {
        const localName = this.caseInsensitive ? name.toLowerCase() : name;
        const local = this.elements.get(localName)[0];
        if (local) {
            return local;
        }
        if (this.outerScope) {
            return this.outerScope.getElement(name);
        }
        return undefined;
    }

    getElements(name: string): Stream<AstNodeDescription> {
        const localName = this.caseInsensitive ? name.toLowerCase() : name;
        const local = this.elements.get(localName);
        if ((this.concatOuterScope || local.length === 0) && this.outerScope) {
            return stream(local).concat(this.outerScope.getElements(name));
        } else {
            return stream(local);
        }
    }

    getAllElements(): Stream<AstNodeDescription> {
        let elementStream = stream(this.elements.values());
        if (this.outerScope) {
            elementStream = elementStream.concat(this.outerScope.getAllElements());
        }
        return elementStream;
    }

}

export const EMPTY_SCOPE: Scope = {
    getElement(): undefined {
        return undefined;
    },
    getElements(): Stream<AstNodeDescription> {
        return EMPTY_STREAM;
    },
    getAllElements(): Stream<AstNodeDescription> {
        return EMPTY_STREAM;
    }
};
