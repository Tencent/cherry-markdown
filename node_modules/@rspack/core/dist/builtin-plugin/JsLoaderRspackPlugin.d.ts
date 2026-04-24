import type { Compiler } from "../Compiler";
export declare const JsLoaderRspackPlugin: {
    new (compiler: Compiler): {
        name: string;
        _args: [compiler: Compiler];
        affectedHooks: keyof import("../Compiler").CompilerHooks | undefined;
        raw(compiler: Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: Compiler): void;
    };
};
