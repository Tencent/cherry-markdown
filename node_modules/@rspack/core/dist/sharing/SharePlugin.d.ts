import type { Compiler } from "../Compiler";
export type SharePluginOptions = {
    shareScope?: string;
    shared: Shared;
    enhanced: boolean;
};
export type Shared = (SharedItem | SharedObject)[] | SharedObject;
export type SharedItem = string;
export type SharedObject = {
    [k: string]: SharedConfig | SharedItem;
};
export type SharedConfig = {
    eager?: boolean;
    import?: false | SharedItem;
    packageName?: string;
    requiredVersion?: false | string;
    shareKey?: string;
    shareScope?: string;
    singleton?: boolean;
    strictVersion?: boolean;
    version?: false | string;
};
export declare class SharePlugin {
    _shareScope: string | undefined;
    _consumes: {
        [x: string]: {
            import: string | false | undefined;
            shareKey: string;
            shareScope: string | undefined;
            requiredVersion: string | false | undefined;
            strictVersion: boolean | undefined;
            singleton: boolean | undefined;
            packageName: string | undefined;
            eager: boolean | undefined;
        };
    }[];
    _provides: {
        [x: string]: {
            shareKey: string;
            shareScope: string | undefined;
            version: string | false | undefined;
            eager: boolean | undefined;
            singleton: boolean | undefined;
            requiredVersion: string | false | undefined;
            strictVersion: boolean | undefined;
        };
    }[];
    _enhanced: boolean;
    constructor(options: SharePluginOptions);
    apply(compiler: Compiler): void;
}
