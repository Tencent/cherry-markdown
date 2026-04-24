/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/LoaderOptionsPlugin.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Compiler } from "../Compiler";
import type { MatchObject } from "./ModuleFilenameHelpers";
type LoaderOptionsPluginOptions = MatchObject & {
    [key: string]: unknown;
};
export declare class LoaderOptionsPlugin {
    options: LoaderOptionsPluginOptions;
    /**
     * @param options options object
     */
    constructor(options?: LoaderOptionsPluginOptions);
    /**
     * Apply the plugin
     * @param compiler the compiler instance
     * @returns
     */
    apply(compiler: Compiler): void;
}
export {};
