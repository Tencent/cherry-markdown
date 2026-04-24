import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import { RspackBuiltinPlugin } from "../builtin-plugin/base";
import type { Compiler } from "../Compiler";
export type ConsumeSharedPluginOptions = {
    consumes: Consumes;
    shareScope?: string;
    enhanced?: boolean;
};
export type Consumes = (ConsumesItem | ConsumesObject)[] | ConsumesObject;
export type ConsumesItem = string;
export type ConsumesObject = {
    [k: string]: ConsumesConfig | ConsumesItem;
};
export type ConsumesConfig = {
    eager?: boolean;
    import?: false | ConsumesItem;
    packageName?: string;
    requiredVersion?: false | string;
    shareKey?: string;
    shareScope?: string;
    singleton?: boolean;
    strictVersion?: boolean;
};
export declare class ConsumeSharedPlugin extends RspackBuiltinPlugin {
    name: BuiltinPluginName;
    _options: {
        consumes: [string, {
            import: string | undefined;
            shareScope: string;
            shareKey: string;
            requiredVersion: string | false | undefined;
            strictVersion: boolean;
            packageName: string | undefined;
            singleton: boolean;
            eager: boolean;
        }][];
        enhanced: boolean;
    };
    constructor(options: ConsumeSharedPluginOptions);
    raw(compiler: Compiler): BuiltinPlugin;
}
