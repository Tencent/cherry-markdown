export declare const HttpExternalsRspackPlugin: {
    new (css: boolean, webAsync: boolean): {
        name: string;
        _args: [css: boolean, webAsync: boolean];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
