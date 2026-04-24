export declare const SizeLimitsPlugin: {
    new (options: {
        assetFilter?: (assetFilename: string) => boolean;
        hints?: false | "warning" | "error";
        maxAssetSize?: number;
        maxEntrypointSize?: number;
    }): {
        name: string;
        _args: [options: {
            assetFilter?: (assetFilename: string) => boolean;
            hints?: false | "warning" | "error";
            maxAssetSize?: number;
            maxEntrypointSize?: number;
        }];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
