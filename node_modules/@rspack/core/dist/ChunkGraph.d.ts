import type { RuntimeSpec } from "./util/runtime";
declare module "@rspack/binding" {
    interface ChunkGraph {
        getModuleChunksIterable(module: Module): Iterable<Chunk>;
        getOrderedChunkModulesIterable(chunk: Chunk, compareFn: (a: Module, b: Module) => number): Iterable<Module>;
        getModuleHash(module: Module, runtime: RuntimeSpec): string | null;
    }
}
export { ChunkGraph } from "@rspack/binding";
