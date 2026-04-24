/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/Watching.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Callback } from "@rspack/lite-tapable";
import type { Compiler } from ".";
import { Stats } from ".";
import type { WatchOptions } from "./config";
import type { Watcher } from "./util/fs";
export declare class Watching {
    #private;
    watcher?: Watcher;
    pausedWatcher?: Watcher;
    compiler: Compiler;
    handler: Callback<Error, Stats>;
    callbacks: Callback<Error, void>[];
    watchOptions: WatchOptions;
    lastWatcherStartTime: number;
    running: boolean;
    blocked: boolean;
    isBlocked: () => boolean;
    onChange: () => void;
    onInvalid: () => void;
    invalid: boolean;
    startTime?: number;
    suspended: boolean;
    constructor(compiler: Compiler, watchOptions: WatchOptions, handler: Callback<Error, Stats>);
    watch(files: Iterable<string> & {
        added?: Iterable<string>;
        removed?: Iterable<string>;
    }, dirs: Iterable<string> & {
        added?: Iterable<string>;
        removed?: Iterable<string>;
    }, missing: Iterable<string> & {
        added?: Iterable<string>;
        removed?: Iterable<string>;
    }): void;
    close(callback?: () => void): void;
    invalidate(callback?: Callback<Error, void>): void;
    /**
     * @internal This is not a public API yet, still unstable, might change in the future
     */
    invalidateWithChangesAndRemovals(changedFiles?: Set<string>, removedFiles?: Set<string>, callback?: Callback<Error, void>): void;
    /**
     * The reason why this is _done instead of #done, is that in Webpack,
     * it will rewrite this function to another function
     */
    private _done;
    suspend(): void;
    resume(): void;
}
