import { SyncHook } from './syncHook';
type CallbackReturnType<T> = T | Promise<T>;
export declare class AsyncWaterfallHook<T extends Record<string, any>> extends SyncHook<[
    T
], CallbackReturnType<T>> {
    onerror: (errMsg: string | Error | unknown) => void;
    constructor(type: string);
    emit(data: T): Promise<T>;
}
export {};
