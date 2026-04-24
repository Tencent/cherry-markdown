import { ModuleFederation } from '../core';
import { Remote, RemoteEntryExports, RemoteInfo } from '../type';
export declare function getRemoteEntryUniqueKey(remoteInfo: RemoteInfo): string;
export declare function getRemoteEntry(params: {
    origin: ModuleFederation;
    remoteInfo: RemoteInfo;
    remoteEntryExports?: RemoteEntryExports | undefined;
    getEntryUrl?: (url: string) => string;
    _inErrorHandling?: boolean;
}): Promise<RemoteEntryExports | false | void>;
export declare function getRemoteInfo(remote: Remote): RemoteInfo;
