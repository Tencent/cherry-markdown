export interface ModuleFederationRuntimeOptions {
    entryRuntime?: string;
}
export declare const ModuleFederationRuntimePlugin: {
    new (options?: ModuleFederationRuntimeOptions | undefined): {
        name: string;
        _args: [options?: ModuleFederationRuntimeOptions | undefined];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
