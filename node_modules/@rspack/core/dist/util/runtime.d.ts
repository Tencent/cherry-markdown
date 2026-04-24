export type RuntimeSpec = string | Set<string> | undefined;
export declare function toJsRuntimeSpec(runtime: RuntimeSpec): string | string[] | undefined;
