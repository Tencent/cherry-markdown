export declare const EnsureChunkConditionsPlugin: {
    new (): {
        name: string;
        _args: [];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
