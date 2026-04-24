import { Federation } from '../global';
import { GlobalShareScopeMap, Shared, ShareArgs, ShareInfos, ShareScopeMap, LoadShareExtraOptions, UserOptions, Options, ShareStrategy } from '../type';
import { SyncWaterfallHook } from './hooks';
export declare function formatShare(shareArgs: ShareArgs, from: string, name: string, shareStrategy?: ShareStrategy): Shared;
export declare function formatShareConfigs(globalOptions: Options, userOptions: UserOptions): {
    shared: {
        [pkgName: string]: Shared[];
    };
    shareInfos: ShareInfos;
};
export declare function versionLt(a: string, b: string): boolean;
export declare const findVersion: (shareVersionMap: ShareScopeMap[string][string], cb?: (prev: string, cur: string) => boolean) => string;
export declare const isLoaded: (shared: Shared) => boolean;
export declare function getRegisteredShare(localShareScopeMap: ShareScopeMap, pkgName: string, shareInfo: Shared, resolveShare: SyncWaterfallHook<{
    shareScopeMap: ShareScopeMap;
    scope: string;
    pkgName: string;
    version: string;
    GlobalFederation: Federation;
    resolver: () => Shared | undefined;
}>): Shared | void;
export declare function getGlobalShareScope(): GlobalShareScopeMap;
export declare function getTargetSharedOptions(options: {
    pkgName: string;
    extraOptions?: LoadShareExtraOptions;
    shareInfos: ShareInfos;
}): Shared & Partial<Shared>;
