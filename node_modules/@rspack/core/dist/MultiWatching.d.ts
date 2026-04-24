/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/MultiWatching.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Callback } from "@rspack/lite-tapable";
import type { MultiCompiler } from "./MultiCompiler";
import type { Watching } from "./Watching";
declare class MultiWatching {
    watchings: Watching[];
    compiler: MultiCompiler;
    /**
     * @param watchings - child compilers' watchers
     * @param compiler - the compiler
     */
    constructor(watchings: Watching[], compiler: MultiCompiler);
    invalidate(callback?: Callback<Error, void>): void;
    invalidateWithChangesAndRemovals(changedFiles?: Set<string>, removedFiles?: Set<string>, callback?: Callback<Error, void>): void;
    close(callback: Callback<Error, void>): void;
    suspend(): void;
    resume(): void;
}
export default MultiWatching;
