export interface RemoteWithEntry {
    name: string;
    entry: string;
}
export interface RemoteWithVersion {
    name: string;
    version: string;
}
export type RemoteEntryInfo = RemoteWithEntry | RemoteWithVersion;
export type Module = any;
