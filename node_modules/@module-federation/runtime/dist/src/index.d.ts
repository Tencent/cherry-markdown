import { ModuleFederation, type UserOptions } from '@module-federation/runtime-core';
export { loadScript, loadScriptNode, Module, getRemoteEntry, getRemoteInfo, registerGlobalPlugins, type ModuleFederationRuntimePlugin, type Federation, } from '@module-federation/runtime-core';
export { ModuleFederation };
export declare function createInstance(options: UserOptions): ModuleFederation;
/**
 * @deprecated Use createInstance or getInstance instead
 */
export declare function init(options: UserOptions): ModuleFederation;
export declare function loadRemote<T>(...args: Parameters<ModuleFederation['loadRemote']>): Promise<T | null>;
export declare function loadShare<T>(...args: Parameters<ModuleFederation['loadShare']>): Promise<false | (() => T | undefined)>;
export declare function loadShareSync<T>(...args: Parameters<ModuleFederation['loadShareSync']>): () => T | never;
export declare function preloadRemote(...args: Parameters<ModuleFederation['preloadRemote']>): ReturnType<ModuleFederation['preloadRemote']>;
export declare function registerRemotes(...args: Parameters<ModuleFederation['registerRemotes']>): ReturnType<ModuleFederation['registerRemotes']>;
export declare function registerPlugins(...args: Parameters<ModuleFederation['registerPlugins']>): ReturnType<ModuleFederation['registerRemotes']>;
export declare function getInstance(): ModuleFederation | null;
export declare function registerShared(...args: Parameters<ModuleFederation['registerShared']>): ReturnType<ModuleFederation['registerShared']>;
