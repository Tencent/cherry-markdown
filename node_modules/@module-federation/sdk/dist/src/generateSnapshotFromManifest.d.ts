import { Manifest, ProviderModuleInfo, ModuleInfo, ManifestProvider, moduleFederationPlugin } from './types';
interface IOptions {
    remotes?: Record<string, string>;
    overrides?: Record<string, string>;
    version?: string;
}
export declare const simpleJoinRemoteEntry: (rPath: string, rName: string) => string;
export declare function inferAutoPublicPath(url: string): string;
export declare function generateSnapshotFromManifest(manifest: Manifest, options?: IOptions): ProviderModuleInfo;
export declare function isManifestProvider(moduleInfo: ModuleInfo | ManifestProvider): moduleInfo is ManifestProvider;
export declare function getManifestFileName(manifestOptions?: moduleFederationPlugin.ModuleFederationPluginOptions['manifest']): {
    statsFileName: string;
    manifestFileName: string;
};
export {};
