/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/tree/4b4ca3bb53f36a5b8fc6bc1bd976ed7af161bd80/lib/util
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
type GroupOptions = {
    groupChildren?: boolean | undefined;
    force?: boolean | undefined;
    targetGroupCount?: number | undefined;
};
export type GroupConfig<T, R = T> = {
    getKeys: (arg0: any) => string[] | undefined;
    createGroup: (key: string, arg1: (T | R)[], arg2: T[]) => R;
    getOptions?: ((key: string, arg1: T[]) => GroupOptions) | undefined;
};
export declare const smartGrouping: <T, R>(items: T[], groupConfigs: GroupConfig<T, R>[]) => (T | R)[];
export {};
