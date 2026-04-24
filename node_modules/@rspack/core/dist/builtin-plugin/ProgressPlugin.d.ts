import { type RawProgressPluginOptions } from "@rspack/binding";
export type ProgressPluginArgument = Partial<Omit<RawProgressPluginOptions, "handler">> | ((percentage: number, msg: string, ...args: string[]) => void) | undefined;
export declare const ProgressPlugin: {
    new (progress?: ProgressPluginArgument): {
        name: string;
        _args: [progress?: ProgressPluginArgument];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
