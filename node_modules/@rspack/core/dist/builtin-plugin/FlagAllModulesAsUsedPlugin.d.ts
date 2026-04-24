export declare const FlagAllModulesAsUsedPlugin: {
    new (explanation: string): {
        name: string;
        _args: [explanation: string];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
