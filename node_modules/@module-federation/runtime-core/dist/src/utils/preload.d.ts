import { PreloadAssets, PreloadConfig, PreloadOptions, PreloadRemoteArgs, Remote, RemoteInfo, depsPreloadArg } from '../type';
import { ModuleFederation } from '../core';
export declare function defaultPreloadArgs(preloadConfig: PreloadRemoteArgs | depsPreloadArg): PreloadConfig;
export declare function formatPreloadArgs(remotes: Array<Remote>, preloadArgs: Array<PreloadRemoteArgs>): PreloadOptions;
export declare function normalizePreloadExposes(exposes?: string[]): string[];
export declare function preloadAssets(remoteInfo: RemoteInfo, host: ModuleFederation, assets: PreloadAssets, useLinkPreload?: boolean): void;
