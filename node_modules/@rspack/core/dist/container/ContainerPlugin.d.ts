import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import { RspackBuiltinPlugin } from "../builtin-plugin/base";
import type { Compiler } from "../Compiler";
import type { EntryRuntime, FilenameTemplate, LibraryOptions } from "../config";
export type ContainerPluginOptions = {
    exposes: Exposes;
    filename?: FilenameTemplate;
    library?: LibraryOptions;
    name: string;
    runtime?: EntryRuntime;
    shareScope?: string;
    enhanced?: boolean;
};
export type Exposes = (ExposesItem | ExposesObject)[] | ExposesObject;
export type ExposesItem = string;
export type ExposesItems = ExposesItem[];
export type ExposesObject = {
    [k: string]: ExposesConfig | ExposesItem | ExposesItems;
};
export type ExposesConfig = {
    import: ExposesItem | ExposesItems;
    name?: string;
};
export declare class ContainerPlugin extends RspackBuiltinPlugin {
    name: BuiltinPluginName;
    _options: {
        name: string;
        shareScope: string;
        library: LibraryOptions;
        runtime: EntryRuntime | undefined;
        filename: string | undefined;
        exposes: [string, {
            import: string[];
            name: string | undefined;
        }][];
        enhanced: boolean;
    };
    constructor(options: ContainerPluginOptions);
    raw(compiler: Compiler): BuiltinPlugin;
}
