import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import type { Compiler } from "../Compiler";
import type { OptimizationSplitChunksOptions } from "../config";
import { RspackBuiltinPlugin } from "./base";
export declare class SplitChunksPlugin extends RspackBuiltinPlugin {
    private options;
    name: BuiltinPluginName;
    affectedHooks: "thisCompilation";
    constructor(options: OptimizationSplitChunksOptions);
    raw(compiler: Compiler): BuiltinPlugin;
}
