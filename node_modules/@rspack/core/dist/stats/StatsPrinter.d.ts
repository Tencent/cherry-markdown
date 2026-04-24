import { HookMap, SyncBailHook, SyncWaterfallHook } from "@rspack/lite-tapable";
import type { StatsAsset, StatsChunk, StatsChunkGroup, StatsCompilation, StatsModule, StatsModuleReason } from "./statsFactoryUtils";
type PrintedElement = {
    element: string;
    content: string;
};
type KnownStatsPrinterContext = {
    type?: string;
    compilation?: StatsCompilation;
    chunkGroup?: StatsChunkGroup;
    asset?: StatsAsset;
    module?: StatsModule;
    chunk?: StatsChunk;
    moduleReason?: StatsModuleReason;
    bold?: (str: string) => string;
    yellow?: (str: string) => string;
    red?: (str: string) => string;
    green?: (str: string) => string;
    magenta?: (str: string) => string;
    cyan?: (str: string) => string;
    formatFilename?: (file: string, oversize?: boolean) => string;
    formatModuleId?: (id: string) => string;
    formatChunkId?: ((id: string, direction?: "parent" | "child" | "sibling") => string) | undefined;
    formatSize?: (size: number) => string;
    formatDateTime?: (dateTime: number) => string;
    formatFlag?: (flag: string) => string;
    formatTime?: (time: number, boldQuantity?: boolean) => string;
    chunkGroupKind?: string;
};
export type StatsPrinterContext = KnownStatsPrinterContext & Record<string, any>;
export declare class StatsPrinter {
    private _levelHookCache;
    private _inPrint;
    hooks: Readonly<{
        sortElements: HookMap<SyncBailHook<[string[], StatsPrinterContext], true | void>>;
        printElements: HookMap<SyncBailHook<[PrintedElement[], StatsPrinterContext], string>>;
        sortItems: HookMap<SyncBailHook<[any[], StatsPrinterContext], true>>;
        getItemName: HookMap<SyncBailHook<[any, StatsPrinterContext], string>>;
        printItems: HookMap<SyncBailHook<[string[], StatsPrinterContext], string>>;
        print: HookMap<SyncBailHook<[{}, StatsPrinterContext], string>>;
        result: HookMap<SyncWaterfallHook<[string, StatsPrinterContext]>>;
    }>;
    constructor();
    /**
     * get all level hooks
     */
    private _getAllLevelHooks;
    private _forEachLevel;
    private _forEachLevelWaterfall;
    print(type: string, object: {
        [key: string]: any;
    }, baseContext?: {
        [key: string]: any;
    }): string;
    private _print;
}
export {};
