/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3bb53f36a5b8fc6bc1bd976ed7af161bd80/lib/Compilation.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { AssetInfo, ChunkGroup, Dependency, ExternalObject, JsCompilation, JsRuntimeModule } from "@rspack/binding";
import binding from "@rspack/binding";
export type { AssetInfo } from "@rspack/binding";
import * as liteTapable from "@rspack/lite-tapable";
import type { Source } from "../compiled/webpack-sources";
import type { EntryOptions, EntryPlugin } from "./builtin-plugin";
import type { Chunk } from "./Chunk";
import type { ChunkGraph } from "./ChunkGraph";
import type { Compiler } from "./Compiler";
import type { ContextModuleFactory } from "./ContextModuleFactory";
import type { OutputNormalized, RspackOptionsNormalized, RspackPluginInstance, StatsOptions, StatsValue } from "./config";
import type { Entrypoint } from "./Entrypoint";
import WebpackError from "./lib/WebpackError";
import { Logger } from "./logging/Logger";
import type { Module } from "./Module";
import ModuleGraph from "./ModuleGraph";
import type { NormalModuleCompilationHooks } from "./NormalModule";
import type { NormalModuleFactory } from "./NormalModuleFactory";
import type { ResolverFactory } from "./ResolverFactory";
import type { RspackError } from "./RspackError";
import { RuntimeModule } from "./RuntimeModule";
import { Stats, type StatsAsset, type StatsError, type StatsModule } from "./Stats";
import { StatsFactory } from "./stats/StatsFactory";
import { StatsPrinter } from "./stats/StatsPrinter";
import type { InputFileSystem } from "./util/fs";
import type Hash from "./util/hash";
import "./Chunk";
import "./Chunks";
import "./ChunkGraph";
import "./CodeGenerationResults";
import type { CodeGenerationResult } from "./taps/compilation";
export type Assets = Record<string, Source>;
export interface Asset {
    name: string;
    source: Source;
    info: AssetInfo;
}
export type ChunkPathData = {
    id?: string;
    name?: string;
    hash?: string;
    contentHash?: Record<string, string>;
};
export type PathData = {
    filename?: string;
    hash?: string;
    contentHash?: string;
    runtime?: string;
    url?: string;
    id?: string;
    chunk?: Chunk | ChunkPathData;
    contentHashType?: string;
};
export interface LogEntry {
    type: string;
    args: any[];
    time?: number;
    trace?: string[];
}
export interface CompilationParams {
    normalModuleFactory: NormalModuleFactory;
    contextModuleFactory: ContextModuleFactory;
}
export interface KnownCreateStatsOptionsContext {
    forToString?: boolean;
}
export interface ExecuteModuleArgument {
    codeGenerationResult: CodeGenerationResult;
    moduleObject: {
        id: string;
        exports: any;
        loaded: boolean;
        error?: Error;
    };
}
export interface ExecuteModuleContext {
    [key: string]: (id: string) => any;
}
export interface KnownNormalizedStatsOptions {
    context: string;
    chunksSort: string;
    modulesSort: string;
    chunkModulesSort: string;
    nestedModulesSort: string;
    assetsSort: string;
    ids: boolean;
    cachedAssets: boolean;
    groupAssetsByEmitStatus: boolean;
    groupAssetsByPath: boolean;
    groupAssetsByExtension: boolean;
    assetsSpace: number;
    excludeAssets: ((value: string, asset: StatsAsset) => boolean)[];
    excludeModules: ((name: string, module: StatsModule, type: "module" | "chunk" | "root-of-chunk" | "nested") => boolean)[];
    warningsFilter: ((warning: StatsError, textValue: string) => boolean)[];
    cachedModules: boolean;
    orphanModules: boolean;
    dependentModules: boolean;
    runtimeModules: boolean;
    groupModulesByCacheStatus: boolean;
    groupModulesByLayer: boolean;
    groupModulesByAttributes: boolean;
    groupModulesByPath: boolean;
    groupModulesByExtension: boolean;
    groupModulesByType: boolean;
    entrypoints: boolean | "auto";
    chunkGroups: boolean;
    chunkGroupAuxiliary: boolean;
    chunkGroupChildren: boolean;
    chunkGroupMaxAssets: number;
    modulesSpace: number;
    chunkModulesSpace: number;
    nestedModulesSpace: number;
    logging: false | "none" | "error" | "warn" | "info" | "log" | "verbose";
    loggingDebug: ((value: string) => boolean)[];
    loggingTrace: boolean;
    chunkModules: boolean;
    chunkRelations: boolean;
    reasons: boolean;
    moduleAssets: boolean;
    nestedModules: boolean;
    source: boolean;
    usedExports: boolean;
    providedExports: boolean;
    optimizationBailout: boolean;
    depth: boolean;
    assets: boolean;
    chunks: boolean;
    errors: boolean;
    errorsCount: boolean;
    hash: boolean;
    modules: boolean;
    warnings: boolean;
    warningsCount: boolean;
}
export type CreateStatsOptionsContext = KnownCreateStatsOptionsContext & Record<string, any>;
export type NormalizedStatsOptions = KnownNormalizedStatsOptions & Omit<StatsOptions, keyof KnownNormalizedStatsOptions> & Record<string, any>;
export declare const checkCompilation: (compilation: Compilation) => void;
export declare class Compilation {
    #private;
    hooks: Readonly<{
        processAssets: liteTapable.AsyncSeriesHook<Assets>;
        afterProcessAssets: liteTapable.SyncHook<Assets>;
        childCompiler: liteTapable.SyncHook<[Compiler, string, number]>;
        log: liteTapable.SyncBailHook<[string, LogEntry], true>;
        additionalAssets: any;
        optimizeModules: liteTapable.SyncBailHook<Iterable<Module>, void>;
        afterOptimizeModules: liteTapable.SyncHook<Iterable<Module>>;
        optimizeTree: liteTapable.AsyncSeriesHook<[
            Iterable<Chunk>,
            Iterable<Module>
        ]>;
        optimizeChunkModules: liteTapable.AsyncSeriesBailHook<[
            Iterable<Chunk>,
            Iterable<Module>
        ], void>;
        finishModules: liteTapable.AsyncSeriesHook<[Iterable<Module>], void>;
        chunkHash: liteTapable.SyncHook<[Chunk, Hash]>;
        chunkAsset: liteTapable.SyncHook<[Chunk, string]>;
        processWarnings: liteTapable.SyncWaterfallHook<[WebpackError[]]>;
        succeedModule: liteTapable.SyncHook<[Module]>;
        stillValidModule: liteTapable.SyncHook<[Module]>;
        statsPreset: liteTapable.HookMap<liteTapable.SyncHook<[Partial<StatsOptions>, CreateStatsOptionsContext]>>;
        statsNormalize: liteTapable.SyncHook<[
            Partial<StatsOptions>,
            CreateStatsOptionsContext
        ]>;
        statsFactory: liteTapable.SyncHook<[StatsFactory, StatsOptions]>;
        statsPrinter: liteTapable.SyncHook<[StatsPrinter, StatsOptions]>;
        buildModule: liteTapable.SyncHook<[Module]>;
        executeModule: liteTapable.SyncHook<[
            ExecuteModuleArgument,
            ExecuteModuleContext
        ]>;
        additionalTreeRuntimeRequirements: liteTapable.SyncHook<[
            Chunk,
            Set<string>
        ]>;
        runtimeRequirementInTree: liteTapable.HookMap<liteTapable.SyncBailHook<[Chunk, Set<string>], void>>;
        runtimeModule: liteTapable.SyncHook<[JsRuntimeModule, Chunk]>;
        seal: liteTapable.SyncHook<[]>;
        afterSeal: liteTapable.AsyncSeriesHook<[], void>;
        needAdditionalPass: liteTapable.SyncBailHook<[], boolean>;
    }>;
    name?: string;
    startTime?: number;
    endTime?: number;
    compiler: Compiler;
    resolverFactory: ResolverFactory;
    inputFileSystem: InputFileSystem | null;
    options: RspackOptionsNormalized;
    outputOptions: OutputNormalized;
    logging: Map<string, LogEntry[]>;
    childrenCounters: Record<string, number>;
    children: Compilation[];
    chunkGraph: ChunkGraph;
    moduleGraph: ModuleGraph;
    fileSystemInfo: {
        createSnapshot(): null;
    };
    needAdditionalPass: boolean;
    [binding.COMPILATION_HOOKS_MAP_SYMBOL]: WeakMap<Compilation, NormalModuleCompilationHooks>;
    constructor(compiler: Compiler, inner: JsCompilation);
    get hash(): Readonly<string | null>;
    get fullHash(): Readonly<string | null>;
    /**
     * Get a map of all assets.
     */
    get assets(): Record<string, Source>;
    /**
     * Get a map of all entrypoints.
     */
    get entrypoints(): ReadonlyMap<string, Entrypoint>;
    get chunkGroups(): readonly ChunkGroup[];
    /**
     * Get the named chunk groups.
     *
     * Note: This is a proxy for webpack internal API, only method `get`, `keys`, `values` and `entries` are supported now.
     */
    get namedChunkGroups(): ReadonlyMap<string, Readonly<ChunkGroup>>;
    get modules(): ReadonlySet<Module>;
    get builtModules(): ReadonlySet<Module>;
    get chunks(): ReadonlySet<Chunk>;
    /**
     * Get the named chunks.
     *
     * Note: This is a proxy for webpack internal API, only method `get`, `keys`, `values` and `entries` are supported now.
     */
    get namedChunks(): ReadonlyMap<string, Readonly<binding.Chunk>>;
    get entries(): Map<string, EntryData>;
    get codeGenerationResults(): binding.CodeGenerationResults;
    getCache(name: string): import("./lib/CacheFacade").CacheFacade;
    createStatsOptions(statsValue: StatsValue | undefined, context?: CreateStatsOptionsContext): NormalizedStatsOptions;
    createStatsFactory(options: StatsOptions): StatsFactory;
    createStatsPrinter(options: StatsOptions): StatsPrinter;
    /**
     * Update an existing asset. Trying to update an asset that doesn't exist will throw an error.
     */
    updateAsset(filename: string, newSourceOrFunction: Source | ((source: Source) => Source), assetInfoUpdateOrFunction?: AssetInfo | ((assetInfo: AssetInfo) => AssetInfo | undefined)): void;
    /**
     * Emit an not existing asset. Trying to emit an asset that already exists will throw an error.
     *
     * @param file - file name
     * @param source - asset source
     * @param assetInfo - extra asset information
     */
    emitAsset(filename: string, source: Source, assetInfo?: AssetInfo): void;
    deleteAsset(filename: string): void;
    renameAsset(filename: string, newFilename: string): void;
    /**
     * Get an array of Asset
     */
    getAssets(): readonly Asset[];
    getAsset(name: string): Readonly<Asset> | void;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     *
     * @internal
     */
    __internal__pushRspackDiagnostic(diagnostic: binding.JsRspackDiagnostic): void;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     *
     * @internal
     */
    __internal__pushDiagnostic(diagnostic: ExternalObject<"Diagnostic">): void;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     *
     * @internal
     */
    __internal__pushDiagnostics(diagnostics: ExternalObject<"Diagnostic[]">): void;
    get errors(): RspackError[];
    set errors(errors: RspackError[]);
    get warnings(): RspackError[];
    set warnings(warnings: RspackError[]);
    getPath(filename: string, data?: PathData): string;
    getPathWithInfo(filename: string, data?: PathData): binding.PathWithInfo;
    getAssetPath(filename: string, data?: PathData): string;
    getAssetPathWithInfo(filename: string, data?: PathData): binding.PathWithInfo;
    getLogger(name: string | (() => string)): Logger;
    fileDependencies: {
        [Symbol.iterator](): Generator<string, void, unknown>;
        has(dep: string): boolean;
        add: (dep: string) => void;
        addAll: (deps: Iterable<string>) => void;
    };
    get __internal__addedFileDependencies(): string[];
    get __internal__removedFileDependencies(): string[];
    get __internal__addedContextDependencies(): string[];
    get __internal__removedContextDependencies(): string[];
    get __internal__addedMissingDependencies(): string[];
    get __internal__removedMissingDependencies(): string[];
    contextDependencies: {
        [Symbol.iterator](): Generator<string, void, unknown>;
        has(dep: string): boolean;
        add: (dep: string) => void;
        addAll: (deps: Iterable<string>) => void;
    };
    missingDependencies: {
        [Symbol.iterator](): Generator<string, void, unknown>;
        has(dep: string): boolean;
        add: (dep: string) => void;
        addAll: (deps: Iterable<string>) => void;
    };
    buildDependencies: {
        [Symbol.iterator](): Generator<string, void, unknown>;
        has(dep: string): boolean;
        add: (dep: string) => void;
        addAll: (deps: Iterable<string>) => void;
    };
    getStats(): Stats;
    createChildCompiler(name: string, outputOptions: OutputNormalized, plugins: RspackPluginInstance[]): Compiler;
    rebuildModule(module: Module, f: (err: Error | null, module: Module | null) => void): void;
    addRuntimeModule(chunk: Chunk, runtimeModule: RuntimeModule): void;
    addInclude(context: string, dependency: ReturnType<typeof EntryPlugin.createDependency>, options: EntryOptions, callback: (err?: null | WebpackError, module?: Module) => void): void;
    addEntry(context: string, dependency: ReturnType<typeof EntryPlugin.createDependency>, optionsOrName: EntryOptions | string, callback: (err?: null | WebpackError, module?: Module) => void): void;
    getWarnings(): WebpackError[];
    getErrors(): WebpackError[];
    /**
     * Get the `Source` of a given asset filename.
     *
     * Note: This is not a webpack public API, maybe removed in the future.
     *
     * @internal
     */
    __internal__getAssetSource(filename: string): Source | void;
    /**
     * Set the `Source` of an given asset filename.
     *
     * Note: This is not a webpack public API, maybe removed in future.
     *
     * @internal
     */
    __internal__setAssetSource(filename: string, source: Source): void;
    /**
     * Delete the `Source` of an given asset filename.
     *
     * Note: This is not a webpack public API, maybe removed in future.
     *
     * @internal
     */
    __internal__deleteAssetSource(filename: string): void;
    /**
     * Get a list of asset filenames.
     *
     * Note: This is not a webpack public API, maybe removed in future.
     *
     * @internal
     */
    __internal__getAssetFilenames(): string[];
    /**
     * Test if an asset exists.
     *
     * Note: This is not a webpack public API, maybe removed in future.
     *
     * @internal
     */
    __internal__hasAsset(name: string): boolean;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     *
     * @internal
     */
    __internal_getInner(): JsCompilation;
    get __internal__shutdown(): boolean;
    set __internal__shutdown(shutdown: boolean);
    seal(): void;
    unseal(): void;
    static PROCESS_ASSETS_STAGE_ADDITIONAL: number;
    static PROCESS_ASSETS_STAGE_PRE_PROCESS: number;
    static PROCESS_ASSETS_STAGE_DERIVED: number;
    static PROCESS_ASSETS_STAGE_ADDITIONS: number;
    static PROCESS_ASSETS_STAGE_NONE: number;
    static PROCESS_ASSETS_STAGE_OPTIMIZE: number;
    static PROCESS_ASSETS_STAGE_OPTIMIZE_COUNT: number;
    static PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY: number;
    static PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE: number;
    static PROCESS_ASSETS_STAGE_DEV_TOOLING: number;
    static PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE: number;
    static PROCESS_ASSETS_STAGE_SUMMARIZE: number;
    static PROCESS_ASSETS_STAGE_OPTIMIZE_HASH: number;
    static PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER: number;
    static PROCESS_ASSETS_STAGE_ANALYSE: number;
    static PROCESS_ASSETS_STAGE_REPORT: number;
}
export declare class EntryData {
    dependencies: Dependency[];
    includeDependencies: Dependency[];
    options: binding.JsEntryOptions;
    static __from_binding(binding: binding.JsEntryData): EntryData;
    private constructor();
}
export declare class Entries implements Map<string, EntryData> {
    #private;
    constructor(data: binding.JsEntries);
    clear(): void;
    forEach(callback: (value: EntryData, key: string, map: Map<string, EntryData>) => void, thisArg?: any): void;
    get size(): number;
    entries(): ReturnType<Map<string, EntryData>["entries"]>;
    values(): ReturnType<Map<string, EntryData>["values"]>;
    [Symbol.iterator](): ReturnType<Map<string, EntryData>["entries"]>;
    readonly [Symbol.toStringTag] = "Map";
    has(key: string): boolean;
    set(key: string, value: EntryData): this;
    delete(key: string): boolean;
    get(key: string): EntryData | undefined;
    keys(): ReturnType<Map<string, EntryData>["keys"]>;
}
