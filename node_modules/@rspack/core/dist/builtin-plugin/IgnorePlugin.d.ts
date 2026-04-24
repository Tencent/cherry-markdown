import { type RawIgnorePluginOptions } from "@rspack/binding";
export type IgnorePluginOptions = {
    /** A RegExp to test the resource against. */
    resourceRegExp: NonNullable<RawIgnorePluginOptions["resourceRegExp"]>;
    /** A RegExp to test the context (directory) against. */
    contextRegExp?: RawIgnorePluginOptions["contextRegExp"];
} | {
    /** A Filter function that receives `resource` and `context` as arguments, must return boolean. */
    checkResource: NonNullable<RawIgnorePluginOptions["checkResource"]>;
};
export declare const IgnorePlugin: {
    new (options: IgnorePluginOptions): {
        name: string;
        _args: [options: IgnorePluginOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
