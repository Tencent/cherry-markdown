import { type SourceMapDevToolPluginOptions } from "@rspack/binding";
export type { SourceMapDevToolPluginOptions };
export declare const SourceMapDevToolPlugin: {
    new (options: SourceMapDevToolPluginOptions): {
        name: string;
        _args: [options: SourceMapDevToolPluginOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
