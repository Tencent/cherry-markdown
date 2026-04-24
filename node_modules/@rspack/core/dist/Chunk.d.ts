import { type ChunkGroup } from "@rspack/binding";
interface ChunkMaps {
    hash: Record<string | number, string>;
    contentHash: Record<string | number, Record<string, string>>;
    name: Record<string | number, string>;
}
declare module "@rspack/binding" {
    interface Chunk {
        readonly files: ReadonlySet<string>;
        readonly runtime: ReadonlySet<string>;
        readonly auxiliaryFiles: ReadonlySet<string>;
        readonly groupsIterable: ReadonlySet<ChunkGroup>;
        getChunkMaps(realHash: boolean): ChunkMaps;
    }
}
export { Chunk } from "@rspack/binding";
