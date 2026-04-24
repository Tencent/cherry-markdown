declare const rspackVersion: string;
declare const version: string;
export { rspackVersion, version };
export type { Asset, AssetInfo, Assets, ChunkPathData, CompilationParams, LogEntry, PathData } from "./Compilation";
export { Compilation } from "./Compilation";
export { Compiler, type CompilerHooks } from "./Compiler";
export type { MultiCompilerOptions, MultiRspackOptions } from "./MultiCompiler";
export { MultiCompiler } from "./MultiCompiler";
import { RspackOptionsApply } from "./rspackOptionsApply";
export { RspackOptionsApply, RspackOptionsApply as WebpackOptionsApply };
export type { ChunkGroup } from "@rspack/binding";
export { AsyncDependenciesBlock, Dependency, EntryDependency } from "@rspack/binding";
export type { Chunk } from "./Chunk";
export { ConcatenatedModule } from "./ConcatenatedModule";
export { ContextModule } from "./ContextModule";
export { ExternalModule } from "./ExternalModule";
export type { ResolveData, ResourceDataWithData } from "./Module";
export { Module } from "./Module";
export type { default as ModuleGraph } from "./ModuleGraph";
export { MultiStats } from "./MultiStats";
export { NormalModule } from "./NormalModule";
export type { NormalModuleFactory } from "./NormalModuleFactory";
export { type RspackError, type RspackSeverity, ValidationError } from "./RspackError";
export { RuntimeGlobals } from "./RuntimeGlobals";
export { RuntimeModule } from "./RuntimeModule";
export type { StatsAsset, StatsChunk, StatsCompilation, StatsError, StatsModule } from "./Stats";
export { Stats } from "./Stats";
export { StatsErrorCode } from "./stats/statsFactoryUtils";
import * as ModuleFilenameHelpers from "./lib/ModuleFilenameHelpers";
export { ModuleFilenameHelpers };
export { Template } from "./Template";
export declare const WebpackError: ErrorConstructor;
export type { Watching } from "./Watching";
import sources = require("../compiled/webpack-sources");
export { sources };
import { applyRspackOptionsDefaults, getNormalizedRspackOptions } from "./config";
type Config = {
    getNormalizedRspackOptions: typeof getNormalizedRspackOptions;
    applyRspackOptionsDefaults: typeof applyRspackOptionsDefaults;
    getNormalizedWebpackOptions: typeof getNormalizedRspackOptions;
    applyWebpackOptionsDefaults: typeof applyRspackOptionsDefaults;
};
export declare const config: Config;
export type * from "./config";
export declare const util: {
    createHash: (algorithm: "debug" | "xxhash64" | "md4" | "native-md4" | (string & {}) | (new () => import("./util/hash").default)) => import("./util/hash").default;
    cleverMerge: <First, Second>(first: First, second: Second) => First | Second | (First & Second);
};
export type { BannerPluginArgument, DefinePluginOptions, EntryOptions, ProgressPluginArgument, ProvidePluginOptions } from "./builtin-plugin";
export { BannerPlugin, DefinePlugin, DynamicEntryPlugin, EntryPlugin, ExternalsPlugin, HotModuleReplacementPlugin, IgnorePlugin, type IgnorePluginOptions, NoEmitOnErrorsPlugin, ProgressPlugin, ProvidePlugin, RuntimePlugin, WarnCaseSensitiveModulesPlugin } from "./builtin-plugin";
export { DllPlugin, type DllPluginOptions } from "./lib/DllPlugin";
export { DllReferencePlugin, type DllReferencePluginOptions, type DllReferencePluginOptionsContent, type DllReferencePluginOptionsManifest, type DllReferencePluginOptionsSourceType } from "./lib/DllReferencePlugin";
export { default as EntryOptionPlugin } from "./lib/EntryOptionPlugin";
export { EnvironmentPlugin } from "./lib/EnvironmentPlugin";
export { LoaderOptionsPlugin } from "./lib/LoaderOptionsPlugin";
export { LoaderTargetPlugin } from "./lib/LoaderTargetPlugin";
export type { OutputFileSystem, WatchFileSystem } from "./util/fs";
import { EsmLibraryPlugin, FetchCompileAsyncWasmPlugin, lazyCompilationMiddleware, SubresourceIntegrityPlugin } from "./builtin-plugin";
interface Web {
    FetchCompileAsyncWasmPlugin: typeof FetchCompileAsyncWasmPlugin;
}
export declare const web: Web;
import { NodeTargetPlugin } from "./builtin-plugin";
import NodeEnvironmentPlugin from "./node/NodeEnvironmentPlugin";
import NodeTemplatePlugin from "./node/NodeTemplatePlugin";
interface Node {
    NodeTargetPlugin: typeof NodeTargetPlugin;
    NodeTemplatePlugin: typeof NodeTemplatePlugin;
    NodeEnvironmentPlugin: typeof NodeEnvironmentPlugin;
}
export declare const node: Node;
import { ElectronTargetPlugin } from "./builtin-plugin";
interface Electron {
    ElectronTargetPlugin: typeof ElectronTargetPlugin;
}
export declare const electron: Electron;
import { EnableLibraryPlugin } from "./builtin-plugin";
interface Library {
    EnableLibraryPlugin: typeof EnableLibraryPlugin;
}
export declare const library: Library;
import { EnableWasmLoadingPlugin } from "./builtin-plugin";
interface Wasm {
    EnableWasmLoadingPlugin: typeof EnableWasmLoadingPlugin;
}
export declare const wasm: Wasm;
import { EnableChunkLoadingPlugin, JavascriptModulesPlugin } from "./builtin-plugin";
interface JavaScript {
    EnableChunkLoadingPlugin: typeof EnableChunkLoadingPlugin;
    JavascriptModulesPlugin: typeof JavascriptModulesPlugin;
}
export declare const javascript: JavaScript;
import { WebWorkerTemplatePlugin } from "./builtin-plugin";
interface Webworker {
    WebWorkerTemplatePlugin: typeof WebWorkerTemplatePlugin;
}
export declare const webworker: Webworker;
import { CssChunkingPlugin, LimitChunkCountPlugin, RemoveDuplicateModulesPlugin, RsdoctorPlugin, RslibPlugin, RstestPlugin, RuntimeChunkPlugin, SplitChunksPlugin } from "./builtin-plugin";
interface Optimize {
    LimitChunkCountPlugin: typeof LimitChunkCountPlugin;
    RuntimeChunkPlugin: typeof RuntimeChunkPlugin;
    SplitChunksPlugin: typeof SplitChunksPlugin;
}
export declare const optimize: Optimize;
import { ModuleFederationPlugin } from "./container/ModuleFederationPlugin";
export type { ModuleFederationPluginOptions } from "./container/ModuleFederationPlugin";
import { ModuleFederationPluginV1 } from "./container/ModuleFederationPluginV1";
export type { ModuleFederationPluginV1Options } from "./container/ModuleFederationPluginV1";
import { ContainerPlugin } from "./container/ContainerPlugin";
import { ContainerReferencePlugin } from "./container/ContainerReferencePlugin";
export type { ContainerPluginOptions, Exposes, ExposesConfig, ExposesItem, ExposesItems, ExposesObject } from "./container/ContainerPlugin";
export type { ContainerReferencePluginOptions, Remotes, RemotesConfig, RemotesItem, RemotesItems, RemotesObject } from "./container/ContainerReferencePlugin";
export declare const container: {
    ContainerPlugin: typeof ContainerPlugin;
    ContainerReferencePlugin: typeof ContainerReferencePlugin;
    ModuleFederationPlugin: typeof ModuleFederationPlugin;
    ModuleFederationPluginV1: typeof ModuleFederationPluginV1;
};
import { ConsumeSharedPlugin } from "./sharing/ConsumeSharedPlugin";
import { ProvideSharedPlugin } from "./sharing/ProvideSharedPlugin";
import { SharePlugin } from "./sharing/SharePlugin";
export type { ConsumeSharedPluginOptions, Consumes, ConsumesConfig, ConsumesItem, ConsumesObject } from "./sharing/ConsumeSharedPlugin";
export type { ProvideSharedPluginOptions, Provides, ProvidesConfig, ProvidesItem, ProvidesObject } from "./sharing/ProvideSharedPlugin";
export type { Shared, SharedConfig, SharedItem, SharedObject, SharePluginOptions } from "./sharing/SharePlugin";
export declare const sharing: {
    ProvideSharedPlugin: typeof ProvideSharedPlugin;
    ConsumeSharedPlugin: typeof ConsumeSharedPlugin;
    SharePlugin: typeof SharePlugin;
};
export type { FeatureOptions as LightningcssFeatureOptions, LoaderOptions as LightningcssLoaderOptions } from "./builtin-loader/lightningcss/index";
export type { SwcLoaderEnvConfig, SwcLoaderEsParserConfig, SwcLoaderJscConfig, SwcLoaderModuleConfig, SwcLoaderOptions, SwcLoaderParserConfig, SwcLoaderTransformConfig, SwcLoaderTsParserConfig } from "./builtin-loader/swc/index";
export type { CircularDependencyRspackPluginOptions, CopyRspackPluginOptions, CssExtractRspackLoaderOptions, CssExtractRspackPluginOptions, EvalDevToolModulePluginOptions, HtmlRspackPluginOptions, LightningCssMinimizerRspackPluginOptions, RsdoctorPluginData, RsdoctorPluginHooks, SourceMapDevToolPluginOptions, SubresourceIntegrityPluginOptions, SwcJsMinimizerRspackPluginOptions } from "./builtin-plugin";
export { CircularDependencyRspackPlugin, ContextReplacementPlugin, CopyRspackPlugin, CssExtractRspackPlugin, EvalDevToolModulePlugin, EvalSourceMapDevToolPlugin, HtmlRspackPlugin, LightningCssMinimizerRspackPlugin, NormalModuleReplacementPlugin, SourceMapDevToolPlugin, SwcJsMinimizerRspackPlugin } from "./builtin-plugin";
import { EnforceExtension, ResolverFactory, async as resolveAsync, sync as resolveSync } from "@rspack/binding";
import { createNativePlugin } from "./builtin-plugin";
import { minify, minifySync, transform, transformSync } from "./swc";
import { VirtualModulesPlugin } from "./VirtualModulesPlugin";
interface Experiments {
    globalTrace: {
        register: (filter: string, layer: "logger" | "perfetto", output: string) => Promise<void>;
        cleanup: () => Promise<void>;
    };
    RemoveDuplicateModulesPlugin: typeof RemoveDuplicateModulesPlugin;
    EsmLibraryPlugin: typeof EsmLibraryPlugin;
    RsdoctorPlugin: typeof RsdoctorPlugin;
    RstestPlugin: typeof RstestPlugin;
    RslibPlugin: typeof RslibPlugin;
    SubresourceIntegrityPlugin: typeof SubresourceIntegrityPlugin;
    lazyCompilationMiddleware: typeof lazyCompilationMiddleware;
    swc: {
        transform: typeof transform;
        minify: typeof minify;
        transformSync: typeof transformSync;
        minifySync: typeof minifySync;
    };
    resolver: {
        ResolverFactory: typeof ResolverFactory;
        EnforceExtension: typeof EnforceExtension;
        async: typeof resolveAsync;
        sync: typeof resolveSync;
    };
    CssChunkingPlugin: typeof CssChunkingPlugin;
    createNativePlugin: typeof createNativePlugin;
    VirtualModulesPlugin: typeof VirtualModulesPlugin;
}
export declare const experiments: Experiments;
