/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/LoaderTargetPlugin.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Compiler } from "../Compiler";
import type { Target } from "../config";
export declare class LoaderTargetPlugin {
    readonly target: Target;
    /**
     * @param target the target
     */
    constructor(target: Target);
    /**
     * Apply the plugin
     * @param compiler the compiler instance
     * @returns
     */
    apply(compiler: Compiler): void;
}
