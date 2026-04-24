export type ProvidePluginOptions = Record<string, string | string[]>;
export declare const ProvidePlugin: {
    new (provide: ProvidePluginOptions): {
        name: string;
        _args: [provide: ProvidePluginOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
