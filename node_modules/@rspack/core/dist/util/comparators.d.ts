/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/tree/4b4ca3bb53f36a5b8fc6bc1bd976ed7af161bd80/lib/util
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
export type Comparator = <T>(arg0: T, arg1: T) => -1 | 0 | 1;
type Selector<A, B> = (input: A) => B;
export declare const concatComparators: (...comps: Comparator[]) => Comparator;
export declare const compareIds: <T = string | number>(a: T, b: T) => -1 | 0 | 1;
export declare const compareSelect: <T, R>(getter: Selector<T, R>, comparator: Comparator) => Comparator;
export declare const compareNumbers: (a: number, b: number) => 0 | 1 | -1;
export {};
