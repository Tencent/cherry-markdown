import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import type { Compiler } from "../Compiler";
import type { ChunkLoading, OutputModule, WasmLoading, WorkerPublicPath } from "../config";
import { RspackBuiltinPlugin } from "./base";
export declare class WorkerPlugin extends RspackBuiltinPlugin {
    private chunkLoading;
    private wasmLoading;
    private module;
    private workerPublicPath;
    name: BuiltinPluginName;
    constructor(chunkLoading: ChunkLoading, wasmLoading: WasmLoading, module: OutputModule, workerPublicPath: WorkerPublicPath);
    raw(compiler: Compiler): BuiltinPlugin;
}
