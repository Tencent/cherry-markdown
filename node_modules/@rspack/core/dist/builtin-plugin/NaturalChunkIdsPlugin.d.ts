import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import { RspackBuiltinPlugin } from "./base";
export declare class NaturalChunkIdsPlugin extends RspackBuiltinPlugin {
    name: BuiltinPluginName;
    affectedHooks: "compilation";
    raw(): BuiltinPlugin;
}
