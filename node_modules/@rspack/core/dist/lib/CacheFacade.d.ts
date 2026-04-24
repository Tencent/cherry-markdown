/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/CacheFacade.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Cache, CallbackCache, Etag } from "./Cache";
import type { HashableObject, HashConstructor } from "./cache/getLazyHashedEtag";
import type WebpackError from "./WebpackError";
type CallbackNormalErrorCache<T> = (err?: WebpackError | null, result?: T) => void;
declare abstract class BaseCache {
    abstract get<T>(callback: CallbackCache<T>): void;
    abstract getPromise<T>(): Promise<T | undefined>;
    abstract store<T>(data: T, callback: CallbackCache<void>): void;
    abstract storePromise<T>(data: T): Promise<void>;
}
export declare class ItemCacheFacade implements BaseCache {
    _cache: Cache;
    _name: string;
    _etag: Etag | null;
    /**
     * @param cache the root cache
     * @param name the child cache item name
     * @param etag the etag
     * @returns
     */
    constructor(cache: Cache, name: string, etag: Etag | null);
    /**
     * @param callback signals when the value is retrieved
     * @returns
     */
    get<T>(callback: CallbackCache<T>): void;
    /**
     * @returns promise with the data
     */
    getPromise<T>(): Promise<T | undefined>;
    /**
     * @param data the value to store
     * @param callback signals when the value is stored
     * @returns
     */
    store<T>(data: T, callback: CallbackCache<void>): void;
    /**
     * @param data the value to store
     * @returns promise signals when the value is stored
     */
    storePromise<T>(data: T): Promise<void>;
    /**
     * @param computer function to compute the value if not cached
     * @param callback signals when the value is retrieved
     * @returns
     */
    provide<T>(computer: (callback: CallbackNormalErrorCache<T>) => void, callback: CallbackNormalErrorCache<T>): void;
    /**
     * @param computer function to compute the value if not cached
     * @returns promise with the data
     */
    providePromise<T>(computer: () => Promise<T> | T): Promise<T>;
}
export declare class CacheFacade {
    _name: string;
    _cache: Cache;
    _hashFunction: string | HashConstructor;
    /**
     * @param cache the root cache
     * @param name the child cache name
     * @param hashFunction the hash function to use
     */
    constructor(cache: Cache, name: string, hashFunction: string | HashConstructor);
    /**
     * @param name the child cache name#
     * @returns child cache
     */
    getChildCache(name: string): CacheFacade;
    /**
     * @param identifier the cache identifier
     * @param  etag the etag
     * @returns item cache
     */
    getItemCache(identifier: string, etag: Etag | null): ItemCacheFacade;
    /**
     * @param obj an hashable object
     * @returns an etag that is lazy hashed
     */
    getLazyHashedEtag(obj: HashableObject): Etag;
    /**
     * @param a an etag
     * @param b another etag
     * @returns an etag that represents both
     */
    mergeEtags(a: Etag, b: Etag): Etag;
    /**
     * @param identifier the cache identifier
     * @param etag the etag
     * @param callback signals when the value is retrieved
     * @returns
     */
    get<T>(identifier: string, etag: Etag | null, callback: CallbackCache<T>): void;
    /**
     * @param identifier the cache identifier
     * @param etag the etag
     * @returns promise with the data
     */
    getPromise<T>(identifier: string, etag: Etag | null): Promise<T | undefined>;
    /**
     * @param identifier the cache identifier
     * @param etag the etag
     * @param data the value to store
     * @param callback signals when the value is stored
     * @returns
     */
    store<T>(identifier: string, etag: Etag | null, data: T, callback: CallbackCache<void>): void;
    /**
     * @param identifier the cache identifier
     * @param etag the etag
     * @param data the value to store
     * @returns promise signals when the value is stored
     */
    storePromise<T>(identifier: string, etag: Etag | null, data: T): Promise<void>;
    /**
     * @param identifier the cache identifier
     * @param etag the etag
     * @param computer function to compute the value if not cached
     * @param callback signals when the value is retrieved
     * @returns
     */
    provide<T>(identifier: string, etag: Etag | null, computer: (callback: CallbackNormalErrorCache<T>) => void, callback: CallbackNormalErrorCache<T>): void;
    /**
     * @param identifier the cache identifier
     * @param etag the etag
     * @param computer function to compute the value if not cached
     * @returns promise with the data
     */
    providePromise<T>(identifier: string, etag: Etag | null, computer: () => Promise<T> | T): Promise<{} | T | null>;
}
export default CacheFacade;
