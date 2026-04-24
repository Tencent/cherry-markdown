import binding, { type AssetInfo } from "@rspack/binding";
import type { Source } from "../compiled/webpack-sources";
import type { ResourceData } from "./Resolver";
import "./BuildInfo";
export type ResourceDataWithData = ResourceData & {
    data?: Record<string, any>;
};
export type CreateData = binding.JsCreateData;
export type ContextInfo = binding.ContextInfo;
export type ResolveData = binding.JsResolveData;
export declare class ContextModuleFactoryBeforeResolveData {
    #private;
    context: string;
    request: string;
    regExp: RegExp | undefined;
    recursive: boolean;
    static __from_binding(binding: binding.JsContextModuleFactoryBeforeResolveData): ContextModuleFactoryBeforeResolveData;
    static __to_binding(data: ContextModuleFactoryBeforeResolveData): binding.JsContextModuleFactoryBeforeResolveData;
    private constructor();
}
export type ContextModuleFactoryBeforeResolveResult = false | ContextModuleFactoryBeforeResolveData;
export declare class ContextModuleFactoryAfterResolveData {
    #private;
    resource: number;
    context: string;
    request: string;
    regExp: RegExp | undefined;
    recursive: boolean;
    readonly dependencies: binding.Dependency[];
    static __from_binding(binding: binding.JsContextModuleFactoryAfterResolveData): ContextModuleFactoryAfterResolveData;
    static __to_binding(data: ContextModuleFactoryAfterResolveData): binding.JsContextModuleFactoryAfterResolveData;
    private constructor();
}
export type ContextModuleFactoryAfterResolveResult = false | ContextModuleFactoryAfterResolveData;
declare module "@rspack/binding" {
    interface Module {
        identifier(): string;
        originalSource(): Source | null;
        emitFile(filename: string, source: Source, assetInfo?: AssetInfo): void;
    }
}
export { Module } from "@rspack/binding";
