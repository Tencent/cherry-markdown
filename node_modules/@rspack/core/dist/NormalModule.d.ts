import * as liteTapable from "@rspack/lite-tapable";
import type { Compilation } from "./Compilation";
import type { LoaderContext } from "./config";
import type { Module } from "./Module";
export interface NormalModuleCompilationHooks {
    loader: liteTapable.SyncHook<[LoaderContext, Module]>;
    readResourceForScheme: any;
    readResource: liteTapable.HookMap<liteTapable.AsyncSeriesBailHook<[LoaderContext], string | Buffer>>;
}
declare module "@rspack/binding" {
    interface NormalModuleConstructor {
        getCompilationHooks(compilation: Compilation): NormalModuleCompilationHooks;
    }
}
export { NormalModule } from "@rspack/binding";
