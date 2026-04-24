export type Callback<T, K> = (...args: ArgsType<T>) => K;
export type ArgsType<T> = T extends Array<any> ? T : Array<any>;
export declare class SyncHook<T, K> {
    type: string;
    listeners: Set<Callback<T, K>>;
    constructor(type?: string);
    on(fn: Callback<T, K>): void;
    once(fn: Callback<T, K>): void;
    emit(...data: ArgsType<T>): void | K | Promise<any>;
    remove(fn: Callback<T, K>): void;
    removeAll(): void;
}
