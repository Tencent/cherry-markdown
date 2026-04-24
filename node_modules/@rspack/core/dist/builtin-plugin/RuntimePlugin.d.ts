import binding from "@rspack/binding";
import * as liteTapable from "@rspack/lite-tapable";
import type { Chunk } from "../Chunk";
import { type Compilation } from "../Compilation";
import type { CreatePartialRegisters } from "../taps/types";
export declare const RuntimePluginImpl: {
    new (): {
        name: string;
        _args: [];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): binding.BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
export type RuntimePluginHooks = {
    createScript: liteTapable.SyncWaterfallHook<[string, Chunk]>;
    createLink: liteTapable.SyncWaterfallHook<[string, Chunk]>;
    linkPreload: liteTapable.SyncWaterfallHook<[string, Chunk]>;
    linkPrefetch: liteTapable.SyncWaterfallHook<[string, Chunk]>;
};
declare const RuntimePlugin: typeof RuntimePluginImpl & {
    /**
     * @deprecated Use `getCompilationHooks` instead.
     */
    getHooks: (compilation: Compilation) => RuntimePluginHooks;
    getCompilationHooks: (compilation: Compilation) => RuntimePluginHooks;
};
export declare const createRuntimePluginHooksRegisters: CreatePartialRegisters<`RuntimePlugin`>;
export { RuntimePlugin };
