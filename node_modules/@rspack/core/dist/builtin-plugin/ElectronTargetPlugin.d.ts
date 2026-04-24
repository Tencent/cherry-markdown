export declare const ElectronTargetPlugin: {
    new (context?: string | undefined): {
        name: string;
        _args: [context?: string | undefined];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
