import { StatsMetaData, StatsAssets, StatsExpose, BasicStatsMetaData } from './stats';
import { RemoteWithEntry, RemoteWithVersion } from './common';
export interface ManifestShared {
    id: string;
    name: string;
    version: string;
    singleton: boolean;
    requiredVersion: string;
    hash: string;
    assets: StatsAssets;
}
export interface ManifestRemoteCommonInfo {
    federationContainerName: string;
    moduleName: string;
    alias: string;
}
export type ManifestRemote<T = ManifestRemoteCommonInfo> = (Omit<RemoteWithEntry, 'name'> & T) | (Omit<RemoteWithVersion, 'name'> & T);
export type ManifestExpose = Pick<StatsExpose, 'assets' | 'id' | 'name' | 'path'>;
export interface Manifest<T = BasicStatsMetaData, K = ManifestRemoteCommonInfo> {
    id: string;
    name: string;
    metaData: StatsMetaData<T>;
    shared: ManifestShared[];
    remotes: ManifestRemote<K>[];
    exposes: ManifestExpose[];
}
