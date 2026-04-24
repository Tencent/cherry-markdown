import { type RawRstestPluginOptions } from "@rspack/binding";
export type RstestPluginArgument = Partial<Omit<RawRstestPluginOptions, "handler">> | ((percentage: number, msg: string, ...args: string[]) => void) | undefined;
export declare const RstestPlugin: {
    new (rstest: RawRstestPluginOptions): {
        name: string;
        _args: [rstest: RawRstestPluginOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
