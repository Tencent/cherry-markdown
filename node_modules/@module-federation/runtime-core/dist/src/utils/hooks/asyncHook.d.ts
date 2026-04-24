import { ArgsType, SyncHook } from './syncHook';
type CallbackReturnType = void | false | Promise<void | false>;
export declare class AsyncHook<T, ExternalEmitReturnType = CallbackReturnType> extends SyncHook<T, ExternalEmitReturnType> {
    emit(...data: ArgsType<T>): Promise<void | false | ExternalEmitReturnType>;
}
export {};
