/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/Cache.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import { AsyncParallelHook, AsyncSeriesBailHook, SyncHook } from "@rspack/lite-tapable";
import type { WebpackError } from "./WebpackError";
export interface Etag {
    toString(): string;
}
export type CallbackCache<T> = (err?: WebpackError | null, result?: T) => void;
type GotHandler<T = any> = (result: T | null, callback: (error: Error | null) => void) => void;
export declare class Cache {
    static STAGE_DISK: number;
    static STAGE_MEMORY: number;
    static STAGE_DEFAULT: number;
    static STAGE_NETWORK: number;
    hooks: {
        get: AsyncSeriesBailHook<[string, Etag | null, GotHandler[]], any>;
        store: AsyncParallelHook<[string, Etag | null, any]>;
        storeBuildDependencies: AsyncParallelHook<[Iterable<string>]>;
        beginIdle: SyncHook<[]>;
        endIdle: AsyncParallelHook<[]>;
        shutdown: AsyncParallelHook<[]>;
    };
    constructor();
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
     * @param data the value to store
     * @param callback signals when the value is stored
     * @returns
     */
    store<T>(identifier: string, etag: Etag | null, data: T, callback: CallbackCache<void>): void;
    /**
     * After this method has succeeded the cache can only be restored when build dependencies are
     * @param dependencies list of all build dependencies
     * @param callback signals when the dependencies are stored
     * @returns
     */
    storeBuildDependencies(dependencies: Iterable<string>, callback: CallbackCache<void>): void;
    beginIdle(): void;
    /**
     * @param callback signals when the call finishes
     * @returns
     */
    endIdle(callback: CallbackCache<void>): void;
    /**
     * @param callback signals when the call finishes
     * @returns
     */
    shutdown(callback: CallbackCache<void>): void;
}
export default Cache;
