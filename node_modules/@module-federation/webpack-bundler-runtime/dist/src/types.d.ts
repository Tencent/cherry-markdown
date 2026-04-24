import * as runtime from '@module-federation/runtime';
import type { Remote, RemoteEntryInitOptions, SharedConfig, SharedGetter } from '@module-federation/runtime/types';
import { initializeSharing } from './initializeSharing';
import { attachShareScopeMap } from './attachShareScopeMap';
import { initContainerEntry } from './initContainerEntry';
import type { moduleFederationPlugin } from '@module-federation/sdk';
type ExcludeUndefined<T> = T extends undefined ? never : T;
type Shared = InitOptions['shared'];
type NonUndefined<T = Shared> = ExcludeUndefined<T>;
type InitOptions = Omit<Parameters<typeof runtime.init>[0], 'remotes'> & {
    remotes: Array<Remote & {
        externalType: moduleFederationPlugin.ExternalsType;
    }>;
};
type ModuleCache = runtime.ModuleFederation['moduleCache'];
type InferModule<T> = T extends Map<string, infer U> ? U : never;
type InferredModule = InferModule<ModuleCache>;
export type ShareScopeMap = runtime.ModuleFederation['shareScopeMap'];
type InitToken = Record<string, Record<string, any>>;
export interface InitializeSharingOptions {
    shareScopeName: string | string[];
    webpackRequire: WebpackRequire;
    initPromises: Record<string, Promise<boolean> | boolean>;
    initTokens: InitToken;
    initScope: InitToken[];
}
export type RemoteEntryExports = NonUndefined<InferredModule['remoteEntryExports']>;
type ExtractInitParameters<T> = T extends {
    init: (shareScope: infer U, ...args: any[]) => void;
} ? U : never;
type InferredShareScope = ExtractInitParameters<RemoteEntryExports>;
type InferredGlobalShareScope = {
    [scope: string]: InferredShareScope;
};
type IdToExternalAndNameMappingItem = [string, string, string | number];
interface IdToExternalAndNameMappingItemWithPromise extends IdToExternalAndNameMappingItem {
    p?: Promise<any> | number;
}
export type IdToExternalAndNameMapping = Record<string, IdToExternalAndNameMappingItemWithPromise>;
export type ModuleId = string | number;
export type RemoteDataItem = {
    shareScope: string;
    name: string;
    externalModuleId: ModuleId;
    remoteName: string;
};
export type ModuleIdToRemoteDataMapping = Record<ModuleId, RemoteDataItem>;
type ModuleIdToConsumeDataMapping = {
    fallback: () => Promise<any>;
    shareKey: string;
    shareScope: string | string[];
} & SharedConfig;
type WithStatus<T> = T & {
    _updated: number;
};
export type ConsumesLoadingData = WithStatus<{
    chunkMapping?: Record<string, Array<string | number>>;
    moduleIdToConsumeDataMapping?: Record<string, ModuleIdToConsumeDataMapping>;
    initialConsumes?: Array<ModuleId>;
}>;
export type RemotesLoadingData = WithStatus<{
    chunkMapping?: Record<string, Array<ModuleId>>;
    moduleIdToRemoteDataMapping?: ModuleIdToRemoteDataMapping;
}>;
export type InitializeSharingData = WithStatus<{
    scopeToSharingDataMapping: {
        [shareScope: string]: Array<{
            name: string;
            version: string;
            factory: SharedGetter;
            eager?: boolean;
            singleton?: boolean;
            requiredVersion?: string;
            strictVersion?: boolean;
        }>;
    };
    uniqueName: string;
}>;
export interface WebpackRequire {
    (moduleId: string | number): any;
    o: (obj: Record<string, any>, key: string | number) => boolean;
    R: Array<string | number>;
    m: Record<string, (mod: any) => any>;
    c: Record<string, any>;
    I: (scopeName: string | string[], initScope?: InitializeSharingOptions['initScope']) => ReturnType<typeof initializeSharing>;
    S?: InferredGlobalShareScope;
    federation: Federation;
    consumesLoadingData?: ConsumesLoadingData;
    remotesLoadingData?: RemotesLoadingData;
    initializeSharingData?: InitializeSharingData;
}
interface ShareInfo {
    shareConfig: SharedConfig;
    scope: Array<string>;
}
interface ModuleToHandlerMappingItem {
    getter: () => Promise<any>;
    shareInfo: ShareInfo;
    shareKey: string;
}
export interface IdToRemoteMapItem {
    externalType: string;
    name: string;
}
export type IdToRemoteMap = Record<string, IdToRemoteMapItem[]>;
export type RemoteInfos = Record<string, Array<IdToRemoteMapItem & {
    alias: string;
    entry?: string;
    shareScope: string;
}>>;
export type RemoteChunkMapping = Record<string, Array<ModuleId>>;
export type CoreRemotesOptions = {
    idToRemoteMap: IdToRemoteMap;
    chunkMapping: RemoteChunkMapping;
    idToExternalAndNameMapping: IdToExternalAndNameMapping;
};
export type RemotesOptions = {
    chunkId: string | number;
    promises: Promise<any>[];
    webpackRequire: WebpackRequire;
} & CoreRemotesOptions;
export interface HandleInitialConsumesOptions {
    moduleId: string | number;
    moduleToHandlerMapping: Record<string, ModuleToHandlerMappingItem>;
    webpackRequire: WebpackRequire;
}
export interface InstallInitialConsumesOptions {
    moduleToHandlerMapping: Record<string, ModuleToHandlerMappingItem>;
    webpackRequire: WebpackRequire;
    installedModules: Record<string, Promise<any> | 0>;
    initialConsumes: Array<string | number>;
}
export interface ConsumesOptions {
    chunkId: string | number;
    promises: Promise<any>[];
    chunkMapping: Record<string, Array<string | number>>;
    installedModules: Record<string, Promise<any> | 0>;
    moduleToHandlerMapping: Record<string, ModuleToHandlerMappingItem>;
    webpackRequire: WebpackRequire;
}
export interface InitContainerEntryOptions {
    shareScope: ShareScopeMap[string];
    shareScopeKey: string | string[];
    webpackRequire: WebpackRequire;
    remoteEntryInitOptions?: RemoteEntryInitOptions;
    initScope?: InitializeSharingOptions['initScope'];
}
export interface Federation {
    runtime?: typeof runtime;
    instance?: runtime.ModuleFederation;
    initOptions?: InitOptions;
    installInitialConsumes?: (options: InstallInitialConsumesOptions) => any;
    bundlerRuntime?: {
        remotes: (options: RemotesOptions) => void;
        consumes: (options: ConsumesOptions) => void;
        I: typeof initializeSharing;
        S: InferredGlobalShareScope;
        installInitialConsumes: (options: InstallInitialConsumesOptions) => any;
        initContainerEntry: typeof initContainerEntry;
    };
    bundlerRuntimeOptions: {
        remotes?: Exclude<RemotesOptions, 'chunkId' | 'promises'> & {
            remoteInfos?: RemoteInfos;
        };
    };
    attachShareScopeMap?: typeof attachShareScopeMap;
    hasAttachShareScopeMap?: boolean;
    prefetch?: () => void;
}
export {};
