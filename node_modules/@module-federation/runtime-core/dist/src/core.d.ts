import type { CreateScriptHookReturn, ModuleInfo } from '@module-federation/sdk';
import { Options, PreloadRemoteArgs, RemoteEntryExports, Remote, Shared, ShareInfos, UserOptions, RemoteInfo, ShareScopeMap, InitScope, RemoteEntryInitOptions, CallFrom } from './type';
import { getRemoteEntry } from './utils';
import { Module } from './module';
import { AsyncHook, AsyncWaterfallHook, PluginSystem, SyncHook, SyncWaterfallHook } from './utils/hooks';
import { SnapshotHandler } from './plugins/snapshot/SnapshotHandler';
import { SharedHandler } from './shared';
import { RemoteHandler } from './remote';
export declare class ModuleFederation {
    options: Options;
    hooks: PluginSystem<{
        beforeInit: SyncWaterfallHook<{
            userOptions: UserOptions;
            options: Options;
            origin: ModuleFederation;
            shareInfo: ShareInfos;
        }>;
        init: SyncHook<[{
            options: Options;
            origin: ModuleFederation;
        }], void>;
        beforeInitContainer: AsyncWaterfallHook<{
            shareScope: ShareScopeMap[string];
            initScope: InitScope;
            remoteEntryInitOptions: RemoteEntryInitOptions;
            remoteInfo: RemoteInfo;
            origin: ModuleFederation;
        }>;
        initContainer: AsyncWaterfallHook<{
            shareScope: ShareScopeMap[string];
            initScope: InitScope;
            remoteEntryInitOptions: RemoteEntryInitOptions;
            remoteInfo: RemoteInfo;
            remoteEntryExports: RemoteEntryExports;
            origin: ModuleFederation;
            id: string;
            remoteSnapshot?: ModuleInfo;
        }>;
    }>;
    version: string;
    name: string;
    moduleCache: Map<string, Module>;
    snapshotHandler: SnapshotHandler;
    sharedHandler: SharedHandler;
    remoteHandler: RemoteHandler;
    shareScopeMap: ShareScopeMap;
    loaderHook: PluginSystem<{
        getModuleInfo: SyncHook<[{
            target: Record<string, any>;
            key: any;
        }], void | {
            value: any | undefined;
            key: string;
        }>;
        createScript: SyncHook<[{
            url: string;
            attrs?: Record<string, any>;
        }], CreateScriptHookReturn>;
        createLink: SyncHook<[{
            url: string;
            attrs?: Record<string, any>;
        }], void | HTMLLinkElement>;
        fetch: AsyncHook<[string, RequestInit], false | void | Promise<Response>>;
        loadEntryError: AsyncHook<[{
            getRemoteEntry: typeof getRemoteEntry;
            origin: ModuleFederation;
            remoteInfo: RemoteInfo;
            remoteEntryExports?: RemoteEntryExports | undefined;
            globalLoading: Record<string, Promise<void | RemoteEntryExports> | undefined>;
            uniqueKey: string;
        }], Promise<Promise<RemoteEntryExports | undefined> | undefined>>;
        getModuleFactory: AsyncHook<[{
            remoteEntryExports: RemoteEntryExports;
            expose: string;
            moduleInfo: RemoteInfo;
        }], Promise<(() => Promise<Module>) | undefined>>;
    }>;
    bridgeHook: PluginSystem<{
        beforeBridgeRender: SyncHook<[Record<string, any>], void | Record<string, any>>;
        afterBridgeRender: SyncHook<[Record<string, any>], void | Record<string, any>>;
        beforeBridgeDestroy: SyncHook<[Record<string, any>], void | Record<string, any>>;
        afterBridgeDestroy: SyncHook<[Record<string, any>], void | Record<string, any>>;
    }>;
    constructor(userOptions: UserOptions);
    initOptions(userOptions: UserOptions): Options;
    loadShare<T>(pkgName: string, extraOptions?: {
        customShareInfo?: Partial<Shared>;
        resolver?: (sharedOptions: ShareInfos[string]) => Shared;
    }): Promise<false | (() => T | undefined)>;
    loadShareSync<T>(pkgName: string, extraOptions?: {
        customShareInfo?: Partial<Shared>;
        from?: 'build' | 'runtime';
        resolver?: (sharedOptions: ShareInfos[string]) => Shared;
    }): () => T | never;
    initializeSharing(shareScopeName?: string, extraOptions?: {
        initScope?: InitScope;
        from?: CallFrom;
        strategy?: Shared['strategy'];
    }): Array<Promise<void>>;
    initRawContainer(name: string, url: string, container: RemoteEntryExports): Module;
    loadRemote<T>(id: string, options?: {
        loadFactory?: boolean;
        from: CallFrom;
    }): Promise<T | null>;
    preloadRemote(preloadOptions: Array<PreloadRemoteArgs>): Promise<void>;
    initShareScopeMap(scopeName: string, shareScope: ShareScopeMap[string], extraOptions?: {
        hostShareScopeMap?: ShareScopeMap;
    }): void;
    formatOptions(globalOptions: Options, userOptions: UserOptions): Options;
    registerPlugins(plugins: UserOptions['plugins']): void;
    registerRemotes(remotes: Remote[], options?: {
        force?: boolean;
    }): void;
    registerShared(shared: UserOptions['shared']): void;
}
