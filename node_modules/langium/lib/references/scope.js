/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { MultiMap } from '../utils/collections.js';
import { EMPTY_STREAM, stream } from '../utils/stream.js';
/**
 * The default scope implementation is based on a `Stream`. It has an optional _outer scope_ describing
 * the next level of elements, which are queried when a target element is not found in the stream provided
 * to this scope.
 */
export class StreamScope {
    constructor(elements, outerScope, options) {
        this.elements = elements;
        this.outerScope = outerScope;
        this.caseInsensitive = options?.caseInsensitive ?? false;
        this.concatOuterScope = options?.concatOuterScope ?? true;
    }
    getAllElements() {
        if (this.outerScope) {
            return this.elements.concat(this.outerScope.getAllElements());
        }
        else {
            return this.elements;
        }
    }
    getElement(name) {
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
    getElements(name) {
        const lowerCaseName = this.caseInsensitive ? name.toLowerCase() : name;
        const local = this.caseInsensitive
            ? this.elements.filter(e => e.name.toLowerCase() === lowerCaseName)
            : this.elements.filter(e => e.name === name);
        if ((this.concatOuterScope || local.isEmpty()) && this.outerScope) {
            return local.concat(this.outerScope.getElements(name));
        }
        else {
            return local;
        }
    }
}
export class MapScope {
    constructor(elements, outerScope, options) {
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
    getElement(name) {
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
    getElements(name) {
        const localName = this.caseInsensitive ? name.toLowerCase() : name;
        const local = this.elements.get(localName);
        const arr = local ? [local] : [];
        if ((this.concatOuterScope || arr.length > 0) && this.outerScope) {
            return stream(arr).concat(this.outerScope.getElements(name));
        }
        else {
            return stream(arr);
        }
    }
    getAllElements() {
        let elementStream = stream(this.elements.values());
        if (this.outerScope) {
            elementStream = elementStream.concat(this.outerScope.getAllElements());
        }
        return elementStream;
    }
}
export class MultiMapScope {
    constructor(elements, outerScope, options) {
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
    getElement(name) {
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
    getElements(name) {
        const localName = this.caseInsensitive ? name.toLowerCase() : name;
        const local = this.elements.get(localName);
        if ((this.concatOuterScope || local.length === 0) && this.outerScope) {
            return stream(local).concat(this.outerScope.getElements(name));
        }
        else {
            return stream(local);
        }
    }
    getAllElements() {
        let elementStream = stream(this.elements.values());
        if (this.outerScope) {
            elementStream = elementStream.concat(this.outerScope.getAllElements());
        }
        return elementStream;
    }
}
export const EMPTY_SCOPE = {
    getElement() {
        return undefined;
    },
    getElements() {
        return EMPTY_STREAM;
    },
    getAllElements() {
        return EMPTY_STREAM;
    }
};
//# sourceMappingURL=scope.js.map