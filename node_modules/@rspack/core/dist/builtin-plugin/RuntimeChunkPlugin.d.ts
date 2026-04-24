import { type RawRuntimeChunkOptions } from "@rspack/binding";
export type RuntimeChunkPluginOptions = RawRuntimeChunkOptions;
export declare const RuntimeChunkPlugin: {
    new (options: RawRuntimeChunkOptions): {
        name: string;
        _args: [options: RawRuntimeChunkOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
