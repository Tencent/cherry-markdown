import { ModuleInfo } from '@module-federation/sdk';
import { ModuleFederationRuntimePlugin } from '../../type/plugin';
import { RemoteInfo } from '../../type';
export declare function assignRemoteInfo(remoteInfo: RemoteInfo, remoteSnapshot: ModuleInfo): void;
export declare function snapshotPlugin(): ModuleFederationRuntimePlugin;
