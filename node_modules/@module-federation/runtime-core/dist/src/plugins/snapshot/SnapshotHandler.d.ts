import { GlobalModuleInfo, Manifest, ModuleInfo } from '@module-federation/sdk';
import { Options, Remote } from '../../type';
import { getGlobalSnapshot } from '../../global';
import { PluginSystem, AsyncHook, AsyncWaterfallHook } from '../../utils/hooks';
import { ModuleFederation } from '../../core';
export declare function getGlobalRemoteInfo(moduleInfo: Remote, origin: ModuleFederation): {
    hostGlobalSnapshot: ModuleInfo | undefined;
    globalSnapshot: ReturnType<typeof getGlobalSnapshot>;
    remoteSnapshot: GlobalModuleInfo[string] | undefined;
};
export declare class SnapshotHandler {
    loadingHostSnapshot: Promise<GlobalModuleInfo | void> | null;
    HostInstance: ModuleFederation;
    manifestCache: Map<string, Manifest>;
    hooks: PluginSystem<{
        beforeLoadRemoteSnapshot: AsyncHook<[{
            options: Options;
            moduleInfo: Remote;
        }], void>;
        loadSnapshot: AsyncWaterfallHook<{
            options: Options;
            moduleInfo: Remote;
            hostGlobalSnapshot: GlobalModuleInfo[string] | undefined;
            globalSnapshot: ReturnType<typeof getGlobalSnapshot>;
            remoteSnapshot?: GlobalModuleInfo[string] | undefined;
        }>;
        loadRemoteSnapshot: AsyncWaterfallHook<{
            options: Options;
            moduleInfo: Remote;
            manifestJson?: Manifest;
            manifestUrl?: string;
            remoteSnapshot: ModuleInfo;
            from: "global" | "manifest";
        }>;
        afterLoadSnapshot: AsyncWaterfallHook<{
            id?: string;
            host: ModuleFederation;
            options: Options;
            moduleInfo: Remote;
            remoteSnapshot: ModuleInfo;
        }>;
    }>;
    loaderHook: ModuleFederation['loaderHook'];
    manifestLoading: Record<string, Promise<ModuleInfo>>;
    constructor(HostInstance: ModuleFederation);
    loadRemoteSnapshotInfo({ moduleInfo, id, expose, }: {
        moduleInfo: Remote;
        id?: string;
        expose?: string;
    }): Promise<{
        remoteSnapshot: ModuleInfo;
        globalSnapshot: GlobalModuleInfo;
    }> | never;
    getGlobalRemoteInfo(moduleInfo: Remote): {
        hostGlobalSnapshot: ModuleInfo | undefined;
        globalSnapshot: ReturnType<typeof getGlobalSnapshot>;
        remoteSnapshot: GlobalModuleInfo[string] | undefined;
    };
    private getManifestJson;
}
