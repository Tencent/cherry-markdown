export type AnyFunction = (...args: any[]) => any;
/** Returns whether the payload is a function (regular or async) */
export declare function isFunction(payload: unknown): payload is AnyFunction;
