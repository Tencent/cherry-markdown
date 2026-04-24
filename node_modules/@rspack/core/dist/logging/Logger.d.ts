/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/logging/Logger.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
export declare const LogType: Readonly<{
    error: "error";
    warn: "warn";
    info: "info";
    log: "log";
    debug: "debug";
    trace: "trace";
    group: "group";
    groupCollapsed: "groupCollapsed";
    groupEnd: "groupEnd";
    profile: "profile";
    profileEnd: "profileEnd";
    time: "time";
    clear: "clear";
    status: "status";
    cache: "cache";
}>;
export declare function getLogTypeBitFlag(type: LogTypeEnum): number;
export declare function getLogTypesBitFlag(types: LogTypeEnum[]): number;
export type LogTypeEnum = (typeof LogType)[keyof typeof LogType];
declare const LOG_SYMBOL: unique symbol;
declare const TIMERS_SYMBOL: unique symbol;
declare const TIMERS_AGGREGATES_SYMBOL: unique symbol;
export type LogFunction = (type: LogTypeEnum, args: any[]) => void;
export type GetChildLogger = (name: string | (() => string)) => Logger;
export declare class Logger {
    getChildLogger: GetChildLogger;
    [LOG_SYMBOL]: any;
    [TIMERS_SYMBOL]: any;
    [TIMERS_AGGREGATES_SYMBOL]: any;
    constructor(log: LogFunction, getChildLogger: GetChildLogger);
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    log(...args: any[]): void;
    debug(...args: string[]): void;
    assert(assertion: any, ...args: any[]): void;
    trace(): void;
    clear(): void;
    status(...args: any[]): void;
    group(...args: any[]): void;
    groupCollapsed(...args: any[]): void;
    groupEnd(...args: any[]): void;
    profile(label: any): void;
    profileEnd(label: any): void;
    time(label: any): void;
    timeLog(label: any): void;
    timeEnd(label: any): void;
    timeAggregate(label: any): void;
    timeAggregateEnd(label: any): void;
}
export {};
