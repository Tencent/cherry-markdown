export declare const memoize: <T>(fn: () => T) => (() => T);
export declare const memoizeFn: <const T extends readonly unknown[], const P>(fn: () => (...args: T) => P) => (...args: T) => P;
