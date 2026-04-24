import { RemoteEntryInfo, ModuleInfo } from './types';
declare const parseEntry: (str: string, devVerOrUrl?: string, separator?: string) => RemoteEntryInfo;
declare global {
    var FEDERATION_DEBUG: string | undefined;
}
declare const composeKeyWithSeparator: (...args: (string | undefined)[]) => string;
declare const encodeName: (name: string, prefix?: string, withExt?: boolean) => string;
declare const decodeName: (name: string, prefix?: string, withExt?: boolean) => string;
declare const generateExposeFilename: (exposeName: string, withExt: boolean) => string;
declare const generateShareFilename: (pkgName: string, withExt: boolean) => string;
declare const getResourceUrl: (module: ModuleInfo, sourceUrl: string) => string;
declare const assert: (condition: any, msg: string) => asserts condition;
declare const error: (msg: string | Error | unknown) => never;
declare const warn: (msg: Parameters<typeof console.warn>[0]) => void;
declare function safeToString(info: any): string;
declare function isRequiredVersion(str: string): boolean;
export { parseEntry, decodeName, encodeName, composeKeyWithSeparator, generateExposeFilename, generateShareFilename, getResourceUrl, assert, error, warn, safeToString, isRequiredVersion, };
