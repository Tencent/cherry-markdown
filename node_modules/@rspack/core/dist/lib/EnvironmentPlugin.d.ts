/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/EnvironmentPlugin.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Compiler } from "../Compiler";
declare class EnvironmentPlugin {
    keys: string[];
    defaultValues: Record<string, string | undefined | null>;
    constructor(...keys: string[] | [Record<string, string | undefined | null> | string | string[]]);
    /**
     * Apply the plugin
     * @param compiler the compiler instance
     * @returns
     */
    apply(compiler: Compiler): void;
}
export { EnvironmentPlugin };
