import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import { RspackBuiltinPlugin } from "../builtin-plugin/base";
import type { Compiler } from "../Compiler";
export declare class ShareRuntimePlugin extends RspackBuiltinPlugin {
    private enhanced;
    name: BuiltinPluginName;
    constructor(enhanced?: boolean);
    raw(compiler: Compiler): BuiltinPlugin | undefined;
}
