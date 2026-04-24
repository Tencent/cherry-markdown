export type DllEntryPluginOptions = {
    name: string;
};
export declare const DllEntryPlugin: {
    new (context: string, entries: string[], options: DllEntryPluginOptions): {
        name: string;
        _args: [context: string, entries: string[], options: DllEntryPluginOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
