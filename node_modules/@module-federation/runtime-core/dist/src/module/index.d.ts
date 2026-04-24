import { ModuleInfo } from '@module-federation/sdk';
import { ModuleFederation } from '../core';
import { RemoteEntryExports, RemoteInfo } from '../type';
export type ModuleOptions = ConstructorParameters<typeof Module>[0];
declare class Module {
    remoteInfo: RemoteInfo;
    inited: boolean;
    remoteEntryExports?: RemoteEntryExports;
    lib: RemoteEntryExports | undefined;
    host: ModuleFederation;
    constructor({ remoteInfo, host, }: {
        remoteInfo: RemoteInfo;
        host: ModuleFederation;
    });
    getEntry(): Promise<RemoteEntryExports>;
    get(id: string, expose: string, options?: {
        loadFactory?: boolean;
    }, remoteSnapshot?: ModuleInfo): Promise<any>;
    private wraperFactory;
}
export { Module };
