/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/IgnoreWarningsPlugin.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Compiler, IgnoreWarningsNormalized, RspackPluginInstance } from "..";
declare class IgnoreWarningsPlugin implements RspackPluginInstance {
    _ignorePattern: IgnoreWarningsNormalized;
    name: string;
    /**
     * @param ignoreWarnings conditions to ignore warnings
     */
    constructor(ignorePattern: IgnoreWarningsNormalized);
    /**
     * Apply the plugin
     * @param compiler the compiler instance
     * @returns
     */
    apply(compiler: Compiler): void;
}
export default IgnoreWarningsPlugin;
