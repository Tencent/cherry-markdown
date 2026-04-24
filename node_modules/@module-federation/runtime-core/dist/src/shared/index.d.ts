import { Federation } from '../global';
import { Options, ShareScopeMap, ShareInfos, Shared, UserOptions, ShareStrategy, InitScope, InitTokens, CallFrom } from '../type';
import { ModuleFederation } from '../core';
import { PluginSystem, AsyncHook, AsyncWaterfallHook, SyncWaterfallHook } from '../utils/hooks';
import { LoadRemoteMatch } from '../remote';
export declare class SharedHandler {
    host: ModuleFederation;
    shareScopeMap: ShareScopeMap;
    hooks: PluginSystem<{
        afterResolve: AsyncWaterfallHook<LoadRemoteMatch>;
        beforeLoadShare: AsyncWaterfallHook<{
            pkgName: string;
            shareInfo?: Shared;
            shared: Options["shared"];
            origin: ModuleFederation;
        }>;
        loadShare: AsyncHook<[ModuleFederation, string, ShareInfos], false | void | Promise<false | void>>;
        resolveShare: SyncWaterfallHook<{
            shareScopeMap: ShareScopeMap;
            scope: string;
            pkgName: string;
            version: string;
            GlobalFederation: Federation;
            resolver: () => Shared | undefined;
        }>;
        initContainerShareScopeMap: SyncWaterfallHook<{
            shareScope: ShareScopeMap[string];
            options: Options;
            origin: ModuleFederation;
            scopeName: string;
            hostShareScopeMap?: ShareScopeMap;
        }>;
    }>;
    initTokens: InitTokens;
    constructor(host: ModuleFederation);
    registerShared(globalOptions: Options, userOptions: UserOptions): {
        shareInfos: ShareInfos;
        shared: {
            [pkgName: string]: Shared[];
        };
    };
    loadShare<T>(pkgName: string, extraOptions?: {
        customShareInfo?: Partial<Shared>;
        resolver?: (sharedOptions: ShareInfos[string]) => Shared;
    }): Promise<false | (() => T | undefined)>;
    /**
     * This function initializes the sharing sequence (executed only once per share scope).
     * It accepts one argument, the name of the share scope.
     * If the share scope does not exist, it creates one.
     */
    initializeSharing(shareScopeName?: string, extraOptions?: {
        initScope?: InitScope;
        from?: CallFrom;
        strategy?: ShareStrategy;
    }): Array<Promise<void>>;
    loadShareSync<T>(pkgName: string, extraOptions?: {
        from?: 'build' | 'runtime';
        customShareInfo?: Partial<Shared>;
        resolver?: (sharedOptions: ShareInfos[string]) => Shared;
    }): () => T | never;
    initShareScopeMap(scopeName: string, shareScope: ShareScopeMap[string], extraOptions?: {
        hostShareScopeMap?: ShareScopeMap;
    }): void;
    private setShared;
    private _setGlobalShareScopeMap;
}
