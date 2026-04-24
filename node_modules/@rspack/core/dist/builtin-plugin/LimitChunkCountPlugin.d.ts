export type LimitChunkCountOptions = {
    chunkOverhead?: number;
    entryChunkMultiplicator?: number;
    maxChunks: number;
};
export declare const LimitChunkCountPlugin: {
    new (options: LimitChunkCountOptions): {
        name: string;
        _args: [options: LimitChunkCountOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
