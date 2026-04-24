/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/config/normalization.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { HttpUriPluginOptions } from "../builtin-plugin";
import type { Compilation } from "../Compilation";
import type WebpackError from "../lib/WebpackError";
import type { Amd, AssetModuleFilename, Bail, CacheOptions, ChunkFilename, ChunkLoading, ChunkLoadingGlobal, Clean, Context, CrossOriginLoading, CssChunkFilename, CssFilename, Dependencies, DevServer, DevTool, DevtoolFallbackModuleFilenameTemplate, DevtoolModuleFilenameTemplate, DevtoolNamespace, EnabledLibraryTypes, EnabledWasmLoadingTypes, EntryDescription, Environment, Externals, ExternalsPresets, ExternalsType, Filename, GeneratorOptionsByModuleType, GlobalObject, HashDigest, HashDigestLength, HashFunction, HashSalt, HotUpdateChunkFilename, HotUpdateGlobal, HotUpdateMainFilename, Iife, ImportFunctionName, ImportMetaName, Incremental, InfrastructureLogging, LazyCompilationOptions, LibraryOptions, Loader, Mode, Name, Node, NoParseOption, Optimization, OutputModule, ParserOptionsByModuleType, Path, Performance, Plugins, Profile, PublicPath, Resolve, RspackFutureOptions, RspackOptions, RuleSetRules, ScriptType, SnapshotOptions, SourceMapFilename, StatsValue, StrictModuleErrorHandling, Target, TrustedTypes, UniqueName, WasmLoading, Watch, WatchOptions, WebassemblyModuleFilename, WorkerPublicPath } from "./types";
export declare const getNormalizedRspackOptions: (config: RspackOptions) => RspackOptionsNormalized;
export type EntryDynamicNormalized = () => Promise<EntryStaticNormalized>;
export type EntryNormalized = EntryDynamicNormalized | EntryStaticNormalized;
export interface EntryStaticNormalized {
    [k: string]: EntryDescriptionNormalized;
}
export type EntryDescriptionNormalized = Pick<EntryDescription, "runtime" | "chunkLoading" | "asyncChunks" | "publicPath" | "baseUri" | "filename" | "library" | "layer"> & {
    import?: string[];
    dependOn?: string[];
};
export interface OutputNormalized {
    path?: Path;
    pathinfo?: boolean | "verbose";
    clean?: Clean;
    publicPath?: PublicPath;
    filename?: Filename;
    chunkFilename?: ChunkFilename;
    crossOriginLoading?: CrossOriginLoading;
    cssFilename?: CssFilename;
    cssChunkFilename?: CssChunkFilename;
    hotUpdateMainFilename?: HotUpdateMainFilename;
    hotUpdateChunkFilename?: HotUpdateChunkFilename;
    hotUpdateGlobal?: HotUpdateGlobal;
    assetModuleFilename?: AssetModuleFilename;
    uniqueName?: UniqueName;
    chunkLoadingGlobal?: ChunkLoadingGlobal;
    enabledLibraryTypes?: EnabledLibraryTypes;
    library?: LibraryOptions;
    module?: OutputModule;
    strictModuleErrorHandling?: StrictModuleErrorHandling;
    globalObject?: GlobalObject;
    importFunctionName?: ImportFunctionName;
    importMetaName?: ImportMetaName;
    iife?: Iife;
    wasmLoading?: WasmLoading;
    enabledWasmLoadingTypes?: EnabledWasmLoadingTypes;
    webassemblyModuleFilename?: WebassemblyModuleFilename;
    chunkFormat?: string | false;
    chunkLoading?: string | false;
    enabledChunkLoadingTypes?: string[];
    trustedTypes?: TrustedTypes;
    sourceMapFilename?: SourceMapFilename;
    hashDigest?: HashDigest;
    hashDigestLength?: HashDigestLength;
    hashFunction?: HashFunction;
    hashSalt?: HashSalt;
    asyncChunks?: boolean;
    workerChunkLoading?: ChunkLoading;
    workerWasmLoading?: WasmLoading;
    workerPublicPath?: WorkerPublicPath;
    scriptType?: ScriptType;
    devtoolNamespace?: DevtoolNamespace;
    devtoolModuleFilenameTemplate?: DevtoolModuleFilenameTemplate;
    devtoolFallbackModuleFilenameTemplate?: DevtoolFallbackModuleFilenameTemplate;
    environment?: Environment;
    charset?: boolean;
    chunkLoadTimeout?: number;
    compareBeforeEmit?: boolean;
}
export interface ModuleOptionsNormalized {
    defaultRules?: RuleSetRules;
    rules: RuleSetRules;
    parser: ParserOptionsByModuleType;
    generator: GeneratorOptionsByModuleType;
    noParse?: NoParseOption;
    unsafeCache?: boolean | RegExp;
}
export type ExperimentCacheNormalized = boolean | {
    type: "memory";
} | {
    type: "persistent";
    buildDependencies: string[];
    version: string;
    snapshot: {
        immutablePaths: (string | RegExp)[];
        unmanagedPaths: (string | RegExp)[];
        managedPaths: (string | RegExp)[];
    };
    storage: {
        type: "filesystem";
        directory: string;
    };
};
export interface ExperimentsNormalized {
    cache?: ExperimentCacheNormalized;
    /**
     * @deprecated This option is deprecated and will be removed in future versions.
     *
     * Please use the Configuration top-level `lazyCompilation` option instead.
     */
    lazyCompilation?: false | LazyCompilationOptions;
    asyncWebAssembly?: boolean;
    outputModule?: boolean;
    topLevelAwait?: boolean;
    css?: boolean;
    /**
     * @deprecated This option is deprecated, layers is enabled since v1.6.0
     */
    layers?: boolean;
    incremental?: false | Incremental;
    /**
     * @deprecated This option is deprecated, as it has a huge regression in some edge cases where the chunk graph has lots of cycles. We will improve performance of build_chunk_graph.
     */
    parallelCodeSplitting?: boolean;
    futureDefaults?: boolean;
    rspackFuture?: RspackFutureOptions;
    buildHttp?: HttpUriPluginOptions;
    parallelLoader?: boolean;
    useInputFileSystem?: false | RegExp[];
    inlineConst?: boolean;
    inlineEnum?: boolean;
    typeReexportsPresence?: boolean;
    lazyBarrel?: boolean;
    nativeWatcher?: boolean;
    deferImport?: boolean;
}
export type IgnoreWarningsNormalized = ((warning: WebpackError, compilation: Compilation) => boolean)[];
export type OptimizationRuntimeChunkNormalized = false | {
    name: string | ((entrypoint: {
        name: string;
    }) => string);
};
export interface RspackOptionsNormalized {
    name?: Name;
    dependencies?: Dependencies;
    context?: Context;
    mode?: Mode;
    entry: EntryNormalized;
    output: OutputNormalized;
    resolve: Resolve;
    resolveLoader: Resolve;
    module: ModuleOptionsNormalized;
    target?: Target;
    externals?: Externals;
    externalsType?: ExternalsType;
    externalsPresets: ExternalsPresets;
    infrastructureLogging: InfrastructureLogging;
    devtool?: DevTool;
    node: Node;
    loader: Loader;
    snapshot: SnapshotOptions;
    cache?: CacheOptions;
    stats: StatsValue;
    optimization: Optimization;
    plugins: Plugins;
    experiments: ExperimentsNormalized;
    lazyCompilation?: false | LazyCompilationOptions;
    watch?: Watch;
    watchOptions: WatchOptions;
    devServer?: DevServer;
    ignoreWarnings?: IgnoreWarningsNormalized;
    performance?: Performance;
    profile?: Profile;
    amd?: Amd;
    bail?: Bail;
}
