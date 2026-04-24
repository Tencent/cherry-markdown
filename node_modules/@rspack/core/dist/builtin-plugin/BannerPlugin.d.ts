import { type Chunk } from "@rspack/binding";
export type Rule = string | RegExp;
export type Rules = Rule[] | Rule;
export type BannerFunction = (args: {
    hash: string;
    chunk: Chunk;
    filename: string;
}) => string;
export type BannerContent = string | BannerFunction;
export type BannerPluginOptions = {
    /** Specifies the banner, it will be wrapped in a comment. */
    banner: BannerContent;
    /** If true, the banner will only be added to the entry chunks. */
    entryOnly?: boolean;
    /** Exclude all modules matching any of these conditions. */
    exclude?: Rules;
    /** Include all modules matching any of these conditions. */
    include?: Rules;
    /** If true, banner will not be wrapped in a comment. */
    raw?: boolean;
    /** If true, banner will be placed at the end of the output. */
    footer?: boolean;
    /**
     * The stage of the compilation in which the banner should be injected.
     * @default PROCESS_ASSETS_STAGE_ADDITIONS (-100)
     */
    stage?: number;
    /** Include all modules that pass test assertion. */
    test?: Rules;
};
export type BannerPluginArgument = BannerContent | BannerPluginOptions;
export declare const BannerPlugin: {
    new (args: BannerPluginArgument): {
        name: string;
        _args: [args: BannerPluginArgument];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
