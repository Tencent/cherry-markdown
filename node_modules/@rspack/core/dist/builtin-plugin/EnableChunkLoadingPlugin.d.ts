/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/3919c84/lib/javascript/EnableChunkLoadingPlugin.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { ChunkLoadingType, Compiler } from "../exports";
declare const EnableChunkLoadingPluginInner: {
    new (type: string): {
        name: string;
        _args: [type: string];
        affectedHooks: keyof import("../Compiler").CompilerHooks | undefined;
        raw(compiler: Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: Compiler): void;
    };
};
export declare class EnableChunkLoadingPlugin extends EnableChunkLoadingPluginInner {
    static setEnabled(compiler: Compiler, type: ChunkLoadingType): void;
    static checkEnabled(compiler: Compiler, type: ChunkLoadingType): void;
    apply(compiler: Compiler): void;
}
export {};
