import { type RawEvalDevToolModulePluginOptions } from "@rspack/binding";
export type { RawEvalDevToolModulePluginOptions as EvalDevToolModulePluginOptions };
export declare const EvalDevToolModulePlugin: {
    new (options: RawEvalDevToolModulePluginOptions): {
        name: string;
        _args: [options: RawEvalDevToolModulePluginOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
