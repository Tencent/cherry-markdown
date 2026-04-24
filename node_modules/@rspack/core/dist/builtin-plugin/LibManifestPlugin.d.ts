export type LibManifestPluginOptions = {
    context?: string;
    entryOnly?: boolean;
    format?: boolean;
    name?: string;
    path: string;
    type?: string;
};
export declare const LibManifestPlugin: {
    new (options: LibManifestPluginOptions): {
        name: string;
        _args: [options: LibManifestPluginOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
