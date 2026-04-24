import binding from "@rspack/binding";
export interface CssChunkingPluginOptions {
    strict?: boolean;
    minSize?: number;
    maxSize?: number;
    /**
     * This plugin is intended to be generic, but currently requires some special handling for Next.js.
     * A `next` option has been added to accommodate this.
     * In the future, once the design of CssChunkingPlugin becomes more stable, this option may be removed.
     */
    nextjs?: boolean;
}
export declare const CssChunkingPlugin: {
    new (options?: CssChunkingPluginOptions | undefined): {
        name: string;
        _args: [options?: CssChunkingPluginOptions | undefined];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): binding.BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
