import { ModuleInfo, GlobalModuleInfo } from '@module-federation/sdk';
import { Options, UserOptions, PreloadAssets, PreloadOptions, PreloadRemoteArgs, Remote, RemoteInfo, RemoteEntryExports, CallFrom } from '../type';
import { ModuleFederation } from '../core';
import { PluginSystem, AsyncHook, AsyncWaterfallHook, SyncHook, SyncWaterfallHook } from '../utils/hooks';
import { Module, ModuleOptions } from '../module';
export interface LoadRemoteMatch {
    id: string;
    pkgNameOrAlias: string;
    expose: string;
    remote: Remote;
    options: Options;
    origin: ModuleFederation;
    remoteInfo: RemoteInfo;
    remoteSnapshot?: ModuleInfo;
}
export declare class RemoteHandler {
    host: ModuleFederation;
    idToRemoteMap: Record<string, {
        name: string;
        expose: string;
    }>;
    hooks: PluginSystem<{
        beforeRegisterRemote: SyncWaterfallHook<{
            remote: Remote;
            origin: ModuleFederation;
        }>;
        registerRemote: SyncWaterfallHook<{
            remote: Remote;
            origin: ModuleFederation;
        }>;
        beforeRequest: AsyncWaterfallHook<{
            id: string;
            options: Options;
            origin: ModuleFederation;
        }>;
        onLoad: AsyncHook<[{
            id: string;
            expose: string;
            pkgNameOrAlias: string;
            remote: Remote;
            options: ModuleOptions;
            origin: ModuleFederation;
            exposeModule: any;
            exposeModuleFactory: any;
            moduleInstance: Module;
        }], void>;
        handlePreloadModule: SyncHook<[{
            id: string;
            name: string;
            remote: Remote;
            remoteSnapshot: ModuleInfo;
            preloadConfig: PreloadRemoteArgs;
            origin: ModuleFederation;
        }], void>;
        errorLoadRemote: AsyncHook<[{
            id: string;
            error: unknown;
            options?: any;
            from: CallFrom;
            lifecycle: "beforeRequest" | "beforeLoadShare" | "afterResolve" | "onLoad";
            origin: ModuleFederation;
        }], unknown>;
        beforePreloadRemote: AsyncHook<[{
            preloadOps: Array<PreloadRemoteArgs>;
            options: Options;
            origin: ModuleFederation;
        }], false | void | Promise<false | void>>;
        generatePreloadAssets: AsyncHook<[{
            origin: ModuleFederation;
            preloadOptions: PreloadOptions[number];
            remote: Remote;
            remoteInfo: RemoteInfo;
            remoteSnapshot: ModuleInfo;
            globalSnapshot: GlobalModuleInfo;
        }], Promise<PreloadAssets>>;
        afterPreloadRemote: AsyncHook<{
            preloadOps: Array<PreloadRemoteArgs>;
            options: Options;
            origin: ModuleFederation;
        }, false | void | Promise<false | void>>;
        loadEntry: AsyncHook<[{
            loaderHook: ModuleFederation["loaderHook"];
            remoteInfo: RemoteInfo;
            remoteEntryExports?: RemoteEntryExports;
        }], Promise<RemoteEntryExports>>;
    }>;
    constructor(host: ModuleFederation);
    formatAndRegisterRemote(globalOptions: Options, userOptions: UserOptions): Remote[];
    setIdToRemoteMap(id: string, remoteMatchInfo: LoadRemoteMatch): void;
    loadRemote<T>(id: string, options?: {
        loadFactory?: boolean;
        from: CallFrom;
    }): Promise<T | null>;
    preloadRemote(preloadOptions: Array<PreloadRemoteArgs>): Promise<void>;
    registerRemotes(remotes: Remote[], options?: {
        force?: boolean;
    }): void;
    getRemoteModuleAndOptions(options: {
        id: string;
    }): Promise<{
        module: Module;
        moduleOptions: ModuleOptions;
        remoteMatchInfo: LoadRemoteMatch;
    }>;
    registerRemote(remote: Remote, targetRemotes: Remote[], options?: {
        force?: boolean;
    }): void;
    private removeRemote;
}
