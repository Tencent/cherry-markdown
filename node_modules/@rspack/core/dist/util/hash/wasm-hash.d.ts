/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/util/hash/wasm-hash.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
type Exports = WebAssembly.Instance["exports"] & {
    init: () => void;
    update: (b: number) => void;
    memory: WebAssembly.Memory;
    final: (b: number) => void;
};
export declare class WasmHash {
    exports: Exports;
    instancesPool: WebAssembly.Instance[];
    buffered: number;
    mem: Buffer;
    chunkSize: number;
    digestSize: number;
    /**
     * @param instance wasm instance
     * @param instancesPool pool of instances
     * @param chunkSize size of data chunks passed to wasm
     * @param digestSize size of digest returned by wasm
     */
    constructor(instance: WebAssembly.Instance, instancesPool: WebAssembly.Instance[], chunkSize: number, digestSize: number);
    reset(): void;
    /**
     * @param data data
     * @param encoding encoding
     * @returns itself
     */
    update(data: Buffer | string, encoding?: BufferEncoding): this;
    /**
     * @param {string} data data
     * @param {BufferEncoding=} encoding encoding
     * @returns {void}
     */
    _updateWithShortString(data: string, encoding?: BufferEncoding): void;
    /**
     * @param data data
     * @returns
     */
    _updateWithBuffer(data: Buffer): void;
    digest(type: BufferEncoding): string | Buffer<ArrayBuffer>;
}
declare const create: (wasmModule: WebAssembly.Module, instancesPool: WasmHash[], chunkSize: number, digestSize: number) => WasmHash;
export default create;
