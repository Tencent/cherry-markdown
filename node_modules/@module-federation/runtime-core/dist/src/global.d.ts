import { ModuleFederation } from './core';
import { RemoteEntryExports, GlobalShareScopeMap, Remote, Optional } from './type';
import { GlobalModuleInfo, ModuleInfo } from '@module-federation/sdk';
import { ModuleFederationRuntimePlugin } from './type/plugin';
export interface Federation {
    __GLOBAL_PLUGIN__: Array<ModuleFederationRuntimePlugin>;
    __DEBUG_CONSTRUCTOR_VERSION__?: string;
    moduleInfo: GlobalModuleInfo;
    __DEBUG_CONSTRUCTOR__?: typeof ModuleFederation;
    __INSTANCES__: Array<ModuleFederation>;
    __SHARE__: GlobalShareScopeMap;
    __MANIFEST_LOADING__: Record<string, Promise<ModuleInfo>>;
    __PRELOADED_MAP__: Map<string, boolean>;
}
export declare const CurrentGlobal: typeof globalThis;
export declare const nativeGlobal: typeof global;
export declare const Global: typeof globalThis;
declare global {
    var __FEDERATION__: Federation, __VMOK__: Federation, __GLOBAL_LOADING_REMOTE_ENTRY__: Record<string, undefined | Promise<RemoteEntryExports | void>>;
}
export declare const globalLoading: Record<string, Promise<void | RemoteEntryExports> | undefined>;
export declare function resetFederationGlobalInfo(): void;
export declare function setGlobalFederationInstance(FederationInstance: ModuleFederation): void;
export declare function getGlobalFederationConstructor(): typeof ModuleFederation | undefined;
export declare function setGlobalFederationConstructor(FederationConstructor: typeof ModuleFederation | undefined, isDebug?: boolean): void;
export declare function getInfoWithoutType<T extends object>(target: T, key: keyof T): {
    value: T[keyof T] | undefined;
    key: string;
};
export declare const getGlobalSnapshot: () => GlobalModuleInfo;
export declare const getTargetSnapshotInfoByModuleInfo: (moduleInfo: Optional<Remote, "alias">, snapshot: GlobalModuleInfo) => GlobalModuleInfo[string] | undefined;
export declare const getGlobalSnapshotInfoByModuleInfo: (moduleInfo: Optional<Remote, "alias">) => GlobalModuleInfo[string] | undefined;
export declare const setGlobalSnapshotInfoByModuleInfo: (remoteInfo: Remote, moduleDetailInfo: GlobalModuleInfo[string]) => GlobalModuleInfo;
export declare const addGlobalSnapshot: (moduleInfos: GlobalModuleInfo) => (() => void);
export declare const getRemoteEntryExports: (name: string, globalName: string | undefined) => {
    remoteEntryKey: string;
    entryExports: RemoteEntryExports | undefined;
};
export declare const registerGlobalPlugins: (plugins: Array<ModuleFederationRuntimePlugin>) => void;
export declare const getGlobalHostPlugins: () => Array<ModuleFederationRuntimePlugin>;
export declare const getPreloaded: (id: string) => boolean | undefined;
export declare const setPreloaded: (id: string) => Map<string, boolean>;
