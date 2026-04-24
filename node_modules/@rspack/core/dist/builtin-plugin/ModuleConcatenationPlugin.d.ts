import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import { RspackBuiltinPlugin } from "./base";
export declare class ModuleConcatenationPlugin extends RspackBuiltinPlugin {
    name: BuiltinPluginName;
    affectedHooks: "compilation";
    raw(): BuiltinPlugin;
}
