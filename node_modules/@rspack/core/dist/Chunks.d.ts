import { Chunks } from "@rspack/binding";
declare module "@rspack/binding" {
    interface Chunks {
        [Symbol.iterator](): SetIterator<Chunk>;
        entries(): SetIterator<[Chunk, Chunk]>;
        values(): SetIterator<Chunk>;
        keys(): SetIterator<Chunk>;
        forEach(callbackfn: (value: Chunk, value2: Chunk, set: ReadonlySet<Chunk>) => void, thisArg?: any): void;
        has(value: Chunk): boolean;
    }
}
export default Chunks;
