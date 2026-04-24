import type binding from "@rspack/binding";
import type { JsOriginRecord } from "@rspack/binding";
import type { Compilation } from "../Compilation";
import type { StatsOptions } from "../config";
import type { StatsFactory, StatsFactoryContext } from "./StatsFactory";
export type KnownStatsChunkGroup = {
    name?: string;
    chunks?: (string | number)[];
    assets?: {
        name: string;
        size?: number;
    }[];
    filteredAssets?: number;
    assetsSize?: number;
    auxiliaryAssets?: {
        name: string;
        size?: number;
    }[];
    filteredAuxiliaryAssets?: number;
    auxiliaryAssetsSize?: number;
    children?: {
        preload?: StatsChunkGroup[];
        prefetch?: StatsChunkGroup[];
    };
    childAssets?: {
        preload?: string[];
        prefetch?: string[];
    };
    isOverSizeLimit?: boolean;
};
export type KnownStatsChunk = {
    type: string;
    rendered: boolean;
    initial: boolean;
    entry: boolean;
    reason?: string;
    size: number;
    sizes?: Record<string, number>;
    names?: string[];
    idHints?: string[];
    runtime?: string[];
    files?: string[];
    auxiliaryFiles?: string[];
    hash?: string;
    childrenByOrder?: Record<string, (string | number)[]>;
    id?: string | number;
    siblings?: (string | number)[];
    parents?: (string | number)[];
    children?: (string | number)[];
    modules?: StatsModule[];
    filteredModules?: number;
    origins?: StatsChunkOrigin[];
};
export type KnownAssetInfo = {
    immutable?: boolean;
    minimized?: boolean;
    fullhash?: string | string[];
    chunkhash?: string | string[];
    contenthash?: string | string[];
    sourceFilename?: string;
    copied?: boolean;
    size?: number;
    development?: boolean;
    hotModuleReplacement?: boolean;
    javascriptModule?: boolean;
    related?: Record<string, string | string[]>;
};
export type AssetInfo = KnownAssetInfo & Record<string, any>;
export type StatsChunkGroup = KnownStatsChunkGroup & Record<string, any>;
export type KnownStatsAsset = {
    type: string;
    name: string;
    info: AssetInfo;
    size: number;
    emitted: boolean;
    cached: boolean;
    related?: StatsAsset[];
    chunkNames?: (string | number)[];
    chunkIdHints?: (string | number)[];
    chunks?: (string | null | undefined)[];
    auxiliaryChunkNames?: (string | number)[];
    auxiliaryChunks?: (string | null | undefined)[];
    auxiliaryChunkIdHints?: (string | number)[];
    filteredRelated?: number;
    isOverSizeLimit?: boolean;
};
export type StatsAsset = KnownStatsAsset & Record<string, any>;
export type StatsChunk = KnownStatsChunk & Record<string, any>;
export type KnownStatsModule = {
    type: string;
    moduleType: string;
    layer?: string;
    identifier?: string;
    name?: string;
    nameForCondition?: string;
    index?: number;
    index2?: number;
    preOrderIndex?: number;
    postOrderIndex?: number;
    size: number;
    sizes: Record<string, number>;
    cacheable?: boolean;
    built: boolean;
    codeGenerated: boolean;
    buildTimeExecuted: boolean;
    cached: boolean;
    optional?: boolean;
    orphan?: boolean;
    id?: string | number | null;
    issuerId?: string | number | null;
    chunks?: string[];
    assets?: string[];
    dependent?: boolean;
    issuer?: string;
    issuerName?: string;
    issuerPath?: StatsModuleIssuer[];
    failed?: boolean;
    errors?: number;
    warnings?: number;
    profile?: StatsProfile;
    reasons?: StatsModuleReason[];
    usedExports?: boolean | string[] | null;
    providedExports?: string[] | null;
    optimizationBailout?: string[] | null;
    depth?: number;
    modules?: StatsModule[];
    filteredModules?: number;
    source?: string | Buffer;
};
export type StatsProfile = KnownStatsProfile & Record<string, any>;
export type KnownStatsProfile = {
    total: number;
    resolving: number;
    building: number;
};
export type StatsModule = KnownStatsModule & Record<string, any>;
export type KnownStatsModuleIssuer = {
    identifier?: string;
    name?: string;
    id?: string | number | null;
};
export type StatsModuleIssuer = KnownStatsModuleIssuer & Record<string, any>;
export declare enum StatsErrorCode {
    /**
     * Warning generated when either builtin `SwcJsMinimizer` or `LightningcssMinimizer` fails to minify the code.
     */
    ChunkMinificationError = "ChunkMinificationError",
    /**
     * Warning generated when either builtin `SwcJsMinimizer` or `LightningcssMinimizer` fails to minify the code.
     */
    ChunkMinificationWarning = "ChunkMinificationWarning",
    /**
     * Error generated when a module is failed to be parsed
     */
    ModuleParseError = "ModuleParseError",
    /**
     * Warning generated when a module is failed to be parsed
     */
    ModuleParseWarning = "ModuleParseWarning",
    /**
     * Error generated when a module is failed to be built (i.e being built by a
     * loader)
     */
    ModuleBuildError = "ModuleBuildError"
}
export type KnownStatsError = {
    message: string;
    code?: StatsErrorCode | string;
    chunkName?: string;
    chunkEntry?: boolean;
    chunkInitial?: boolean;
    /**
     * A custom filename associated with this error/warning.
     */
    file?: string;
    /**
     * The identifier of the module related to this error/warning.
     * Usually an absolute path, may include inline loader requests.
     * @example
     * - `/path/to/project/src/index.js`
     * - `!builtin:react-refresh-loader!/path/to/project/src/index.css`
     */
    moduleIdentifier?: string;
    /**
     * The readable name of the module related to this error/warning.
     * Usually a relative path, no inline loader requests.
     * @example
     * - `"./src/index.js"`
     * - `"./src/index.css"`
     */
    moduleName?: string;
    loc?: string;
    chunkId?: string | number;
    moduleId?: string | number | null;
    moduleTrace?: StatsModuleTraceItem[];
    details?: any;
    stack?: string;
};
export type StatsError = KnownStatsError & Record<string, any>;
export type StatsModuleTraceItem = {
    originIdentifier?: string;
    originName?: string;
    moduleIdentifier?: string;
    moduleName?: string;
    originId?: string | number | null;
    moduleId?: string | number | null;
    dependencies?: StatsModuleTraceDependency[];
};
export type StatsModuleTraceDependency = KnownStatsModuleTraceDependency & Record<string, any>;
export type KnownStatsModuleTraceDependency = {
    loc: string;
};
export type KnownStatsModuleReason = {
    moduleIdentifier?: string;
    module?: string;
    moduleName?: string;
    resolvedModuleIdentifier?: string;
    resolvedModule?: string;
    type?: string;
    active: boolean;
    explanation?: string;
    userRequest?: string;
    loc?: string;
    moduleId?: string | number | null;
    resolvedModuleId?: string | number | null;
};
export type StatsModuleReason = KnownStatsModuleReason & Record<string, any>;
export type KnownStatsChunkOrigin = {
    module: string;
    moduleIdentifier: string;
    moduleName: string;
    loc: string;
    request: string;
    moduleId?: string | number | null;
};
export type StatsChunkOrigin = KnownStatsChunkOrigin & Record<string, any>;
export type KnownStatsCompilation = {
    /**
     * webpack version.
     * this is a hack to be compatible with plugin which detect webpack's version
     */
    version?: string;
    /** rspack version */
    rspackVersion?: string;
    name?: string;
    hash?: string;
    time?: number;
    builtAt?: number;
    publicPath?: string;
    outputPath?: string;
    assets?: StatsAsset[];
    assetsByChunkName?: Record<string, string[]>;
    chunks?: StatsChunk[];
    modules?: StatsModule[];
    entrypoints?: Record<string, StatsChunkGroup>;
    namedChunkGroups?: Record<string, StatsChunkGroup>;
    errors?: StatsError[];
    errorsCount?: number;
    warnings?: StatsError[];
    warningsCount?: number;
    filteredModules?: number;
    children?: StatsCompilation[];
    logging?: Record<string, StatsLogging>;
};
export type StatsCompilation = KnownStatsCompilation & Record<string, any>;
export type StatsLogging = KnownStatsLogging & Record<string, any>;
export type KnownStatsLogging = {
    entries: StatsLoggingEntry[];
    filteredEntries: number;
    debug: boolean;
};
export type StatsLoggingEntry = KnownStatsLoggingEntry & Record<string, any>;
export type KnownStatsLoggingEntry = {
    type: string;
    message: string;
    trace?: string[] | undefined;
    children?: StatsLoggingEntry[] | undefined;
    args?: any[] | undefined;
    time?: number | undefined;
};
type ExtractorsByOption<T, O> = {
    [x: string]: (object: O, data: T, context: StatsFactoryContext, options: any, factory: StatsFactory) => void;
};
export type PreprocessedAsset = binding.JsStatsAsset & {
    type: string;
    related: PreprocessedAsset[];
    info: binding.JsStatsAssetInfo;
};
export type SimpleExtractors = {
    compilation: ExtractorsByOption<Compilation, StatsCompilation>;
    asset$visible: ExtractorsByOption<PreprocessedAsset, StatsAsset>;
    asset: ExtractorsByOption<PreprocessedAsset, StatsAsset>;
    chunkGroup: ExtractorsByOption<{
        name: string;
        chunkGroup: binding.JsStatsChunkGroup;
    }, StatsChunkGroup>;
    module: ExtractorsByOption<binding.JsStatsModule, StatsModule>;
    module$visible: ExtractorsByOption<binding.JsStatsModule, StatsModule>;
    moduleIssuer: ExtractorsByOption<binding.JsStatsModuleIssuer, StatsModuleIssuer>;
    profile: ExtractorsByOption<binding.JsStatsModuleProfile, StatsProfile>;
    moduleReason: ExtractorsByOption<binding.JsStatsModuleReason, StatsModuleReason>;
    chunk: ExtractorsByOption<binding.JsStatsChunk, KnownStatsChunk>;
    chunkOrigin: ExtractorsByOption<JsOriginRecord, StatsChunkOrigin>;
    error: ExtractorsByOption<binding.JsStatsError, StatsError>;
    warning: ExtractorsByOption<binding.JsStatsError, StatsError>;
    moduleTraceItem: ExtractorsByOption<binding.JsStatsModuleTrace, StatsModuleTraceItem>;
    moduleTraceDependency: ExtractorsByOption<binding.JsStatsModuleTraceDependency, StatsModuleTraceDependency>;
};
export declare const iterateConfig: (config: Record<string, Record<string, Function>>, options: StatsOptions, fn: (a1: string, a2: Function) => void) => void;
type Child = {
    children?: ItemChildren;
    filteredChildren?: number;
};
type ItemChildren = Child[];
export declare const collapse: (children: ItemChildren) => Child[];
export declare const spaceLimited: (itemsAndGroups: ItemChildren, max: number, filteredChildrenLineReserved?: boolean) => {
    children: any;
    filteredChildren: any;
};
export declare const countWithChildren: (compilation: Compilation, getItems: (compilation: Compilation, key: string) => any[]) => number;
export declare const sortByField: (field: string) => ((a1: Object, a2: Object) => number);
export declare const assetGroup: (children: StatsAsset[]) => {
    size: number;
};
export declare const moduleGroup: (children: {
    size: number;
    sizes: Record<string, number>;
}[]) => {
    size: number;
    sizes: Record<string, number>;
};
export declare const mergeToObject: (items: {
    [key: string]: any;
    name: string;
}[]) => Object;
export declare const errorsSpaceLimit: (errors: StatsError[], max: number) => {
    errors: StatsError[];
    filtered: number;
};
export declare const warningFromStatsWarning: (warning: binding.JsStatsError) => Error;
export {};
