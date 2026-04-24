import type { ResolveData } from "../Module";
export declare const NormalModuleReplacementPlugin: {
    new (resourceRegExp: RegExp, newResource: string | ((data: ResolveData) => void)): {
        name: string;
        _args: [resourceRegExp: RegExp, newResource: string | ((data: ResolveData) => void)];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
