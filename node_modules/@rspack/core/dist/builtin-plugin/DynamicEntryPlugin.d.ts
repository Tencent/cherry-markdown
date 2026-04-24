import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import type { Compiler } from "../Compiler";
import type { EntryDynamicNormalized } from "../config";
import { RspackBuiltinPlugin } from "./base";
export declare class DynamicEntryPlugin extends RspackBuiltinPlugin {
    private context;
    private entry;
    name: BuiltinPluginName;
    affectedHooks: "make";
    constructor(context: string, entry: EntryDynamicNormalized);
    raw(compiler: Compiler): BuiltinPlugin | undefined;
}
