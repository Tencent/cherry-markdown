/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/node/NodeTemplatePlugin.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Compiler } from "../Compiler";
export type NodeTemplatePluginOptions = {
    asyncChunkLoading?: boolean;
};
export default class NodeTemplatePlugin {
    private _options;
    constructor(_options?: NodeTemplatePluginOptions);
    apply(compiler: Compiler): void;
}
