import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import type { Compiler } from "../Compiler";
import { RspackBuiltinPlugin } from "./base";
export declare class WebWorkerTemplatePlugin extends RspackBuiltinPlugin {
    name: BuiltinPluginName;
    raw(compiler: Compiler): BuiltinPlugin | undefined;
}
