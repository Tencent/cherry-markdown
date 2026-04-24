import { SyncHook } from './syncHook';
export declare function checkReturnData(originalData: any, returnedData: any): boolean;
export declare class SyncWaterfallHook<T extends Record<string, any>> extends SyncHook<[
    T
], T> {
    onerror: (errMsg: string | Error | unknown) => void;
    constructor(type: string);
    emit(data: T): T;
}
