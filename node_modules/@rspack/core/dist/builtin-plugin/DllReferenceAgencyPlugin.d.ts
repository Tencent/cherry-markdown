import { type RawDllReferenceAgencyPluginOptions } from "@rspack/binding";
export type DllReferenceAgencyPluginOptions = RawDllReferenceAgencyPluginOptions;
export declare const DllReferenceAgencyPlugin: {
    new (options: RawDllReferenceAgencyPluginOptions): {
        name: string;
        _args: [options: RawDllReferenceAgencyPluginOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
