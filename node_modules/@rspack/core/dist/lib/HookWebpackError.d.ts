/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/HookWebpackError.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Callback } from "@rspack/lite-tapable";
import WebpackError from "./WebpackError";
export declare class HookWebpackError extends WebpackError {
    hook: string;
    error: Error;
    /**
     * Creates an instance of HookWebpackError.
     * @param error inner error
     * @param hook name of hook
     */
    constructor(error: Error, hook: string);
}
export default HookWebpackError;
/**
 * @param error an error
 * @param hook name of the hook
 * @returns a webpack error
 */
export declare const makeWebpackError: (error: Error, hook: string) => WebpackError;
/**
 * @param callback webpack error callback
 * @param hook name of hook
 * @returns generic callback
 */
export declare const makeWebpackErrorCallback: <T>(callback: (error?: WebpackError | null, result?: T) => void, hook: string) => Callback<Error, T>;
/**
 * @param fn function which will be wrapping in try catch
 * @param hook name of hook
 * @returns the result
 */
export declare const tryRunOrWebpackError: <T>(fn: () => T, hook: string) => T;
