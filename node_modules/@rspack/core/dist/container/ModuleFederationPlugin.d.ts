import type { Compiler } from "../Compiler";
import { type ModuleFederationManifestPluginOptions } from "./ModuleFederationManifestPlugin";
import type { ModuleFederationPluginV1Options } from "./ModuleFederationPluginV1";
export interface ModuleFederationPluginOptions extends Omit<ModuleFederationPluginV1Options, "enhanced"> {
    runtimePlugins?: RuntimePlugins;
    implementation?: string;
    shareStrategy?: "version-first" | "loaded-first";
    manifest?: boolean | Omit<ModuleFederationManifestPluginOptions, "remoteAliasMap" | "globalName" | "name" | "exposes" | "shared">;
}
export type RuntimePlugins = string[] | [string, Record<string, unknown>][];
export declare class ModuleFederationPlugin {
    private _options;
    constructor(_options: ModuleFederationPluginOptions);
    apply(compiler: Compiler): void;
}
