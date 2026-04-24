export declare const EnableWasmLoadingPlugin: {
    new (type: string): {
        name: string;
        _args: [type: string];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
