import { type RawOccurrenceChunkIdsPluginOptions } from "@rspack/binding";
export declare const OccurrenceChunkIdsPlugin: {
    new (options?: RawOccurrenceChunkIdsPluginOptions | undefined): {
        name: string;
        _args: [options?: RawOccurrenceChunkIdsPluginOptions | undefined];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
