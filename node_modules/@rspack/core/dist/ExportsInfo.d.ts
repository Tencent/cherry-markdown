import type { JsExportsInfo } from "@rspack/binding";
import type { RuntimeSpec } from "./util/runtime";
/**
 * Unused: 0
 * OnlyPropertiesUsed: 1
 * NoInfo: 2
 * Unknown: 3
 * Used: 4
 */
type UsageStateType = 0 | 1 | 2 | 3 | 4;
export declare class ExportsInfo {
    #private;
    static __from_binding(binding: JsExportsInfo): ExportsInfo;
    private constructor();
    isUsed(runtime: RuntimeSpec): boolean;
    isModuleUsed(runtime: RuntimeSpec): boolean;
    setUsedInUnknownWay(runtime: RuntimeSpec): boolean;
    getUsed(name: string | string[], runtime: RuntimeSpec): UsageStateType;
}
export {};
