/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3bb53f36a5b8fc6bc1bd976ed7af161bd80/lib/Compiler.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type binding from "@rspack/binding";
import * as liteTapable from "@rspack/lite-tapable";
import type Watchpack from "../compiled/watchpack";
import type { Source } from "../compiled/webpack-sources";
import type { Chunk } from "./Chunk";
import type { CompilationParams } from "./Compilation";
import { Compilation } from "./Compilation";
import { ContextModuleFactory } from "./ContextModuleFactory";
import type { EntryNormalized, OutputNormalized, RspackOptionsNormalized, RspackPluginInstance } from "./config";
import type { FileSystemInfoEntry } from "./FileSystemInfo";
import { rspack } from "./index";
import Cache from "./lib/Cache";
import CacheFacade from "./lib/CacheFacade";
import { Logger } from "./logging/Logger";
import { NormalModuleFactory } from "./NormalModuleFactory";
import { ResolverFactory } from "./ResolverFactory";
import { RuleSetCompiler } from "./RuleSetCompiler";
import { Stats } from "./Stats";
import type { InputFileSystem, IntermediateFileSystem, OutputFileSystem, WatchFileSystem } from "./util/fs";
import { Watching } from "./Watching";
export interface AssetEmittedInfo {
    content: Buffer;
    source: Source;
    outputPath: string;
    targetPath: string;
    compilation: Compilation;
}
export type CompilerHooks = {
    done: liteTapable.AsyncSeriesHook<Stats>;
    afterDone: liteTapable.SyncHook<Stats>;
    thisCompilation: liteTapable.SyncHook<[Compilation, CompilationParams]>;
    compilation: liteTapable.SyncHook<[Compilation, CompilationParams]>;
    invalid: liteTapable.SyncHook<[string | null, number]>;
    compile: liteTapable.SyncHook<[CompilationParams]>;
    normalModuleFactory: liteTapable.SyncHook<NormalModuleFactory>;
    contextModuleFactory: liteTapable.SyncHook<ContextModuleFactory>;
    initialize: liteTapable.SyncHook<[]>;
    shouldEmit: liteTapable.SyncBailHook<[Compilation], boolean>;
    /**
     * Called when infrastructure logging is triggered, allowing plugins to intercept, modify, or handle log messages.
     * If the hook returns `true`, the default infrastructure logging will be prevented.
     * If it returns `undefined`, the default logging will proceed.
     * @param name - The name of the logger
     * @param type - The log type (e.g., 'log', 'warn', 'error', ...)
     * @param args - An array of arguments passed to the logging method
     */
    infrastructureLog: liteTapable.SyncBailHook<[
        string,
        string,
        any[]
    ], true | void>;
    beforeRun: liteTapable.AsyncSeriesHook<[Compiler]>;
    run: liteTapable.AsyncSeriesHook<[Compiler]>;
    emit: liteTapable.AsyncSeriesHook<[Compilation]>;
    assetEmitted: liteTapable.AsyncSeriesHook<[string, AssetEmittedInfo]>;
    afterEmit: liteTapable.AsyncSeriesHook<[Compilation]>;
    failed: liteTapable.SyncHook<[Error]>;
    shutdown: liteTapable.AsyncSeriesHook<[]>;
    watchRun: liteTapable.AsyncSeriesHook<[Compiler]>;
    watchClose: liteTapable.SyncHook<[]>;
    environment: liteTapable.SyncHook<[]>;
    afterEnvironment: liteTapable.SyncHook<[]>;
    afterPlugins: liteTapable.SyncHook<[Compiler]>;
    afterResolvers: liteTapable.SyncHook<[Compiler]>;
    make: liteTapable.AsyncParallelHook<[Compilation]>;
    beforeCompile: liteTapable.AsyncSeriesHook<[CompilationParams]>;
    afterCompile: liteTapable.AsyncSeriesHook<[Compilation]>;
    finishMake: liteTapable.AsyncSeriesHook<[Compilation]>;
    entryOption: liteTapable.SyncBailHook<[string, EntryNormalized], any>;
    additionalPass: liteTapable.AsyncSeriesHook<[]>;
};
declare class Compiler {
    #private;
    hooks: CompilerHooks;
    webpack: typeof rspack;
    rspack: typeof rspack;
    name?: string;
    parentCompilation?: Compilation;
    root: Compiler;
    outputPath: string;
    running: boolean;
    idle: boolean;
    resolverFactory: ResolverFactory;
    infrastructureLogger: any;
    watching?: Watching;
    inputFileSystem: InputFileSystem | null;
    intermediateFileSystem: IntermediateFileSystem | null;
    outputFileSystem: OutputFileSystem | null;
    watchFileSystem: WatchFileSystem | null;
    records: Record<string, any[]>;
    modifiedFiles?: ReadonlySet<string>;
    removedFiles?: ReadonlySet<string>;
    fileTimestamps?: ReadonlyMap<string, FileSystemInfoEntry | "ignore" | null>;
    contextTimestamps?: ReadonlyMap<string, FileSystemInfoEntry | "ignore" | null>;
    fsStartTime?: number;
    watchMode: boolean;
    context: string;
    cache: Cache;
    compilerPath: string;
    options: RspackOptionsNormalized;
    /**
     * Whether to skip dropping Rust compiler instance to improve performance.
     * This is an internal option api and could be removed or changed at any time.
     * @internal
     * true: Skip dropping Rust compiler instance.
     * false: Drop Rust compiler instance when Compiler is garbage collected.
     */
    unsafeFastDrop: boolean;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    __internal_browser_require: (id: string) => unknown;
    constructor(context: string, options: RspackOptionsNormalized);
    get recordsInputPath(): never;
    get recordsOutputPath(): never;
    get managedPaths(): never;
    get immutablePaths(): never;
    get _lastCompilation(): Compilation | undefined;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    get __internal__builtinPlugins(): binding.BuiltinPlugin[];
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    get __internal__ruleSet(): RuleSetCompiler;
    /**
     * @param name - cache name
     * @returns the cache facade instance
     */
    getCache(name: string): CacheFacade;
    /**
     * @param name - name of the logger, or function called once to get the logger name
     * @returns a logger with that name
     */
    getInfrastructureLogger(name: string | (() => string)): Logger;
    /**
     * @param watchOptions - the watcher's options
     * @param handler - signals when the call finishes
     * @returns a compiler watcher
     */
    watch(watchOptions: Watchpack.WatchOptions, handler: liteTapable.Callback<Error, Stats>): Watching;
    /**
     * @param callback - signals when the call finishes
     * @param options - additional data like modifiedFiles, removedFiles
     */
    run(callback: liteTapable.Callback<Error, Stats>, options?: {
        modifiedFiles?: ReadonlySet<string>;
        removedFiles?: ReadonlySet<string>;
    }): void;
    runAsChild(callback: (err?: null | Error, entries?: Chunk[], compilation?: Compilation) => any): void;
    purgeInputFileSystem(): void;
    /**
     * @param compilation - the compilation
     * @param compilerName - the compiler's name
     * @param compilerIndex - the compiler's index
     * @param outputOptions - the output options
     * @param plugins - the plugins to apply
     * @returns a child compiler
     */
    createChildCompiler(compilation: Compilation, compilerName: string, compilerIndex: number, outputOptions: OutputNormalized, plugins: RspackPluginInstance[]): Compiler;
    isChild(): boolean;
    /**
     * Create a compilation and run it, which is the basic method that `compiler.run` and `compiler.watch` depend on.
     * TODO: make this method private in the next major release
     * @private this method is only used in Rspack core
     */
    compile(callback: liteTapable.Callback<Error, Compilation>): void;
    close(callback: (error?: Error | null) => void): void;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    __internal__rebuild(modifiedFiles?: ReadonlySet<string>, removedFiles?: ReadonlySet<string>, callback?: (error: Error | null) => void): void;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    __internal__create_compilation(native: binding.JsCompilation): Compilation;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    __internal__get_virtual_file_store(): binding.VirtualFileStore | null | undefined;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    __internal__registerBuiltinPlugin(plugin: binding.BuiltinPlugin): void;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    __internal__takeModuleExecutionResult(id: number): any;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    __internal__get_compilation(): Compilation | undefined;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    __internal__get_compilation_params(): CompilationParams | undefined;
    /**
     * Note: This is not a webpack public API, maybe removed in future.
     * @internal
     */
    __internal__get_module_execution_results_map(): Map<number, any>;
}
export { Compiler };
