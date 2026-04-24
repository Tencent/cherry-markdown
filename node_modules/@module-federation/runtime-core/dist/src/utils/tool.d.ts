import { RemoteWithEntry, ModuleInfo, RemoteEntryType } from '@module-federation/sdk';
import { Remote, RemoteInfoOptionalVersion } from '../type';
export declare function addUniqueItem(arr: Array<string>, item: string): Array<string>;
export declare function getFMId(remoteInfo: RemoteInfoOptionalVersion | RemoteWithEntry): string;
export declare function isRemoteInfoWithEntry(remote: Remote): remote is RemoteWithEntry;
export declare function isPureRemoteEntry(remote: RemoteWithEntry): boolean;
export declare function safeWrapper<T extends (...args: Array<any>) => any>(callback: T, disableWarn?: boolean): Promise<ReturnType<T> | undefined>;
export declare function isObject(val: any): boolean;
export declare const objectToString: () => string;
export declare function isPlainObject(val: any): val is object;
export declare function isStaticResourcesEqual(url1: string, url2: string): boolean;
export declare function arrayOptions<T>(options: T | Array<T>): Array<T>;
export declare function getRemoteEntryInfoFromSnapshot(snapshot: ModuleInfo): {
    url: string;
    type: RemoteEntryType;
    globalName: string;
};
export declare const processModuleAlias: (name: string, subPath: string) => string;
