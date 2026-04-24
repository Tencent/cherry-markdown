import { Remote, RemoteInfo } from './config';
export type depsPreloadArg = Omit<PreloadRemoteArgs, 'depsRemote'>;
export interface PreloadRemoteArgs {
    nameOrAlias: string;
    exposes?: Array<string>;
    resourceCategory?: 'all' | 'sync';
    share?: boolean;
    depsRemote?: boolean | Array<depsPreloadArg>;
    filter?: (assetUrl: string) => boolean;
    prefetchInterface?: boolean;
}
export type PreloadConfig = PreloadRemoteArgs;
export type PreloadOptions = Array<{
    remote: Remote;
    preloadConfig: PreloadConfig;
}>;
export type EntryAssets = {
    name: string;
    url: string;
    moduleInfo: RemoteInfo;
};
export interface PreloadAssets {
    cssAssets: Array<string>;
    jsAssetsWithoutEntry: Array<string>;
    entryAssets: Array<EntryAssets>;
}
