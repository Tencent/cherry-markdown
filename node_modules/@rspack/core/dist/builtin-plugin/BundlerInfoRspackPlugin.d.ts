export type BundleInfoOptions = {
    version?: string;
    bundler?: string;
    force?: boolean | string[];
};
export declare const BundlerInfoRspackPlugin: {
    new (options: BundleInfoOptions): {
        name: string;
        _args: [options: BundleInfoOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
