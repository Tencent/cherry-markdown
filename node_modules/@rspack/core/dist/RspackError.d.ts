import type binding from "@rspack/binding";
export type { RspackError } from "@rspack/binding";
export type RspackSeverity = binding.JsRspackSeverity;
export declare class NonErrorEmittedError extends Error {
    constructor(error: Error);
}
export declare class DeadlockRiskError extends Error {
    constructor(message: string);
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
