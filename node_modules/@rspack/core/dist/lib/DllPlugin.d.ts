/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3bb53f36a5b8fc6bc1bd976ed7af161bd80/lib/DllPlugin.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Compiler } from "../Compiler";
export type DllPluginOptions = {
    /**
     * Context of requests in the manifest file (defaults to the webpack context).
     */
    context?: string;
    /**
     * If true, only entry points will be exposed.
     * @default true
     */
    entryOnly?: boolean;
    /**
     * If true, manifest json file (output) will be formatted.
     */
    format?: boolean;
    /**
     * Name of the exposed dll function (external name, use value of 'output.library').
     */
    name?: string;
    /**
     * Absolute path to the manifest json file (output).
     */
    path: string;
    /**
     * Type of the dll bundle (external type, use value of 'output.libraryTarget').
     */
    type?: string;
};
export declare class DllPlugin {
    private options;
    constructor(options: DllPluginOptions);
    apply(compiler: Compiler): void;
}
