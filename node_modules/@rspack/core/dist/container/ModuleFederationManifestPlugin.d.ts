import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import { RspackBuiltinPlugin } from "../builtin-plugin/base";
import type { Compiler } from "../Compiler";
export type RemoteAliasMap = Record<string, {
    name: string;
    entry?: string;
}>;
export type ManifestExposeOption = {
    path: string;
    name: string;
};
export type ManifestSharedOption = {
    name: string;
    version?: string;
    requiredVersion?: string;
    singleton?: boolean;
};
export type ModuleFederationManifestPluginOptions = {
    name?: string;
    globalName?: string;
    filePath?: string;
    disableAssetsAnalyze?: boolean;
    fileName?: string;
    remoteAliasMap?: RemoteAliasMap;
    exposes?: ManifestExposeOption[];
    shared?: ManifestSharedOption[];
};
/**
 * JS-side post-processing plugin: reads mf-manifest.json and mf-stats.json, executes additionalData callback and merges/overwrites manifest.
 * To avoid cross-NAPI callback complexity, this plugin runs at the afterProcessAssets stage to ensure Rust-side MfManifestPlugin has already output its artifacts.
 */
export declare class ModuleFederationManifestPlugin extends RspackBuiltinPlugin {
    name: BuiltinPluginName;
    private opts;
    constructor(opts: ModuleFederationManifestPluginOptions);
    raw(compiler: Compiler): BuiltinPlugin;
}
