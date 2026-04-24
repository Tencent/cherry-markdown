/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/cache/getLazyHashedEtag.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type Hash from "../../util/hash";
export type HashConstructor = typeof Hash;
export interface HashableObject {
    updateHash(hash: Hash): void;
}
declare class LazyHashedEtag {
    _obj: HashableObject;
    _hash?: string;
    _hashFunction: string | HashConstructor;
    /**
     * @param obj object with updateHash method
     * @param hashFunction the hash function to use
     */
    constructor(obj: HashableObject, hashFunction?: string | HashConstructor);
    /**
     * @returns hash of object
     */
    toString(): string;
}
/**
 * @param obj object with updateHash method
 * @param ashFunction the hash function to use
 * @returns etag
 */
export declare const getter: (obj: HashableObject, hashFunction?: string | HashConstructor) => LazyHashedEtag;
export default getter;
