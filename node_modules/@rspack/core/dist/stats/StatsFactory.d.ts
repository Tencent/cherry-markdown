/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/tree/4b4ca3bb53f36a5b8fc6bc1bd976ed7af161bd80/lib/stats
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { JsStats, JsStatsCompilation, JsStatsError } from "@rspack/binding";
import { HookMap, SyncBailHook, SyncWaterfallHook } from "@rspack/lite-tapable";
import type { Compilation } from "../Compilation";
import { type GroupConfig } from "../util/smartGrouping";
export type KnownStatsFactoryContext = {
    type: string;
    makePathsRelative?: ((arg0: string) => string) | undefined;
    compilation: Compilation;
    cachedGetErrors?: ((arg0: Compilation) => JsStatsError[]) | undefined;
    cachedGetWarnings?: ((arg0: Compilation) => JsStatsError[]) | undefined;
    getStatsCompilation: (compilation: Compilation) => JsStatsCompilation;
    getInner: (compilation: Compilation) => JsStats;
};
export type StatsFactoryContext = KnownStatsFactoryContext & Record<string, any>;
type Hooks = Readonly<{
    extract: HookMap<SyncBailHook<[Object, any, StatsFactoryContext], undefined>>;
    filter: HookMap<SyncBailHook<[any, StatsFactoryContext, number, number], undefined>>;
    filterSorted: HookMap<SyncBailHook<[any, StatsFactoryContext, number, number], undefined>>;
    groupResults: HookMap<SyncBailHook<[GroupConfig<any>[], StatsFactoryContext], undefined>>;
    filterResults: HookMap<SyncBailHook<[any, StatsFactoryContext, number, number], undefined>>;
    sort: HookMap<SyncBailHook<[
        ((arg1: any, arg2: any) => number)[],
        StatsFactoryContext
    ], undefined>>;
    sortResults: HookMap<SyncBailHook<[
        ((arg1: any, arg2: any) => number)[],
        StatsFactoryContext
    ], undefined>>;
    result: HookMap<SyncWaterfallHook<[any[], StatsFactoryContext]>>;
    merge: HookMap<SyncBailHook<[any[], StatsFactoryContext], undefined>>;
    getItemName: HookMap<SyncBailHook<[any, StatsFactoryContext], string | undefined>>;
    getItemFactory: HookMap<SyncBailHook<[any, StatsFactoryContext], undefined>>;
}>;
type CacheHookMap = Map<string, SyncBailHook<[any[], StatsFactoryContext], any>[]>;
type CallFn = (...args: any[]) => any;
export declare class StatsFactory {
    hooks: Hooks;
    private _caches;
    private _inCreate;
    constructor();
    _getAllLevelHooks(hookMap: HookMap<any>, cache: CacheHookMap, type: string): any[];
    _forEachLevel(hookMap: HookMap<any>, cache: CacheHookMap, type: string, fn: CallFn): any;
    _forEachLevelWaterfall(hookMap: HookMap<any>, cache: CacheHookMap, type: string, data: any, fn: CallFn): any;
    _forEachLevelFilter(hookMap: HookMap<any>, cache: CacheHookMap, type: string, items: any[], fn: CallFn, forceClone: boolean): any[];
    create(type: string, data: any, baseContext: Omit<StatsFactoryContext, "type">): any;
    private _create;
}
export {};
