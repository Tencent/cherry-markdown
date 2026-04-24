export declare const ModuleInfoHeaderPlugin: {
    new (verbose: any): {
        name: string;
        _args: [verbose: any];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
