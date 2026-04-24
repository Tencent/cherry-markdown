import { GlobalModuleInfo, ModuleInfo } from '@module-federation/sdk';
import { ModuleFederationRuntimePlugin, PreloadAssets, PreloadOptions, RemoteInfoOptionalVersion } from '../type';
import { ModuleFederation } from '../core';
declare global {
    var __INIT_VMOK_DEPLOY_GLOBAL_DATA__: boolean | undefined;
}
export declare function generatePreloadAssets(origin: ModuleFederation, preloadOptions: PreloadOptions[number], remote: RemoteInfoOptionalVersion, globalSnapshot: GlobalModuleInfo, remoteSnapshot: ModuleInfo): PreloadAssets;
export declare const generatePreloadAssetsPlugin: () => ModuleFederationRuntimePlugin;
