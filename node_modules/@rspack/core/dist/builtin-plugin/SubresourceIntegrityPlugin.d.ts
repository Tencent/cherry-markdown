import { type RawSubresourceIntegrityPluginOptions } from "@rspack/binding";
import type { Compiler } from "../Compiler";
export type SubresourceIntegrityHashFunction = "sha256" | "sha384" | "sha512";
export type SubresourceIntegrityPluginOptions = {
    hashFuncNames?: [
        SubresourceIntegrityHashFunction,
        ...SubresourceIntegrityHashFunction[]
    ];
    htmlPlugin?: string | false;
    enabled?: "auto" | boolean;
};
export type NativeSubresourceIntegrityPluginOptions = Omit<RawSubresourceIntegrityPluginOptions, "htmlPlugin"> & {
    htmlPlugin: string | false;
};
/**
 * Note: This is not a webpack public API, maybe removed in future.
 * @internal
 */
declare const NativeSubresourceIntegrityPlugin: {
    new (options: NativeSubresourceIntegrityPluginOptions): {
        name: string;
        _args: [options: NativeSubresourceIntegrityPluginOptions];
        affectedHooks: keyof import("../Compiler").CompilerHooks | undefined;
        raw(compiler: Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: Compiler): void;
    };
};
export declare class SubresourceIntegrityPlugin extends NativeSubresourceIntegrityPlugin {
    private integrities;
    private options;
    constructor(options?: SubresourceIntegrityPluginOptions);
    private isEnabled;
    private getIntegrityChecksumForAsset;
    private handleHwpPluginArgs;
    private handleHwpBodyTags;
    private processTag;
    apply(compiler: Compiler): void;
}
export {};
