import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import * as liteTapable from "@rspack/lite-tapable";
import type { Chunk } from "../Chunk";
import { type Compilation } from "../Compilation";
import type Hash from "../util/hash";
import { RspackBuiltinPlugin } from "./base";
export type CompilationHooks = {
    chunkHash: liteTapable.SyncHook<[Chunk, Hash]>;
};
export declare class JavascriptModulesPlugin extends RspackBuiltinPlugin {
    name: BuiltinPluginName;
    affectedHooks: "compilation";
    raw(): BuiltinPlugin;
    static getCompilationHooks(compilation: Compilation): CompilationHooks;
}
