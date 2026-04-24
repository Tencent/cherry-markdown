import * as tsTypes from "typescript";
import { RollupContext } from "./context";
import { IDiagnostics } from "./diagnostics";
export interface ICode {
    code: string;
    map?: string;
    dts?: tsTypes.OutputFile;
    dtsmap?: tsTypes.OutputFile;
    references?: string[];
}
export declare function convertEmitOutput(output: tsTypes.EmitOutput, references?: string[]): ICode;
export declare function getAllReferences(importer: string, snapshot: tsTypes.IScriptSnapshot | undefined, options: tsTypes.CompilerOptions): string[];
export declare class TsCache {
    private noCache;
    private host;
    private cacheRoot;
    private options;
    private rollupConfig;
    private context;
    private cacheVersion;
    private cachePrefix;
    private dependencyTree;
    private ambientTypes;
    private ambientTypesDirty;
    private cacheDir;
    private codeCache;
    private typesCache;
    private semanticDiagnosticsCache;
    private syntacticDiagnosticsCache;
    private hashOptions;
    constructor(noCache: boolean, runClean: boolean, hashIgnoreUnknown: boolean, host: tsTypes.LanguageServiceHost, cacheRoot: string, options: tsTypes.CompilerOptions, rollupConfig: any, rootFilenames: string[], context: RollupContext);
    private clean;
    setDependency(importee: string, importer: string): void;
    walkTree(cb: (id: string) => void | false): void;
    done(): void;
    getCompiled(id: string, snapshot: tsTypes.IScriptSnapshot, transform: () => ICode | undefined): ICode | undefined;
    getSyntacticDiagnostics(id: string, snapshot: tsTypes.IScriptSnapshot, check: () => tsTypes.Diagnostic[]): IDiagnostics[];
    getSemanticDiagnostics(id: string, snapshot: tsTypes.IScriptSnapshot, check: () => tsTypes.Diagnostic[]): IDiagnostics[];
    private checkAmbientTypes;
    private getDiagnostics;
    private getCached;
    private init;
    private markAsDirty;
    /** @returns true if node, any of its imports, or any ambient types changed */
    private isDirty;
    /** @returns an FS-safe hash string for use as a path to the cached content */
    private createHash;
}
//# sourceMappingURL=tscache.d.ts.map