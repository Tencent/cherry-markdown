import type { Module } from "../../Module";
export declare const BuiltinLazyCompilationPlugin: {
    new (currentActiveModules: () => Set<string>, entries: boolean, imports: boolean, client: string, test?: RegExp | ((module: Module) => boolean) | undefined): {
        name: string;
        _args: [currentActiveModules: () => Set<string>, entries: boolean, imports: boolean, client: string, test?: RegExp | ((module: Module) => boolean) | undefined];
        affectedHooks: keyof import("../..").CompilerHooks | undefined;
        raw(compiler: import("../..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("../..").Compiler): void;
    };
};
