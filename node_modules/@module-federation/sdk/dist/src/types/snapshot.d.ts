import { RemoteEntryType, StatsAssets } from './stats';
interface BasicModuleInfo {
    dev?: {
        version?: string;
        remotes?: {
            [nameWithType: string]: string;
        };
    };
    version: string;
    buildVersion: string;
    remoteTypes: string;
    remoteTypesZip: string;
    remoteTypesAPI?: string;
    remotesInfo: Record<string, {
        matchedVersion: string;
    }>;
    shared: Array<{
        sharedName: string;
        version?: string;
        assets: StatsAssets;
    }>;
}
export interface BasicProviderModuleInfo extends BasicModuleInfo {
    remoteEntry: string;
    remoteEntryType: RemoteEntryType;
    ssrRemoteEntry?: string;
    ssrRemoteEntryType?: RemoteEntryType;
    globalName: string;
    modules: Array<{
        moduleName: string;
        modulePath?: string;
        assets: StatsAssets;
    }>;
    prefetchInterface?: boolean;
    prefetchEntry?: string;
    prefetchEntryType?: RemoteEntryType;
}
interface BasicProviderModuleInfoWithPublicPath extends BasicProviderModuleInfo {
    publicPath: string;
    ssrPublicPath?: string;
}
interface BasicProviderModuleInfoWithGetPublicPath extends BasicProviderModuleInfo {
    getPublicPath: string;
}
export interface ManifestProvider {
    remoteEntry: string;
    ssrRemoteEntry?: string;
    version?: string;
}
export interface PureEntryProvider extends ManifestProvider {
    globalName: string;
}
interface BasicConsumerModuleInfo extends BasicModuleInfo {
    consumerList: Array<string>;
}
export interface ConsumerModuleInfoWithPublicPath extends BasicConsumerModuleInfo, BasicProviderModuleInfo {
    publicPath: string;
    ssrPublicPath?: string;
}
interface ConsumerModuleInfoWithGetPublicPath extends BasicConsumerModuleInfo, BasicProviderModuleInfo {
    getPublicPath: string;
}
export type PureConsumerModuleInfo = Omit<BasicConsumerModuleInfo, 'remoteTypes'>;
export type ConsumerModuleInfo = ConsumerModuleInfoWithPublicPath | ConsumerModuleInfoWithGetPublicPath;
export type ProviderModuleInfo = BasicProviderModuleInfoWithPublicPath | BasicProviderModuleInfoWithGetPublicPath;
export type ModuleInfo = ConsumerModuleInfo | PureConsumerModuleInfo | ProviderModuleInfo;
export type GlobalModuleInfo = {
    [key: string]: ModuleInfo | ManifestProvider | PureEntryProvider | undefined;
};
export {};
