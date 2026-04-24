import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import { RspackBuiltinPlugin } from "../builtin-plugin/base";
import type { Compiler } from "../Compiler";
import type { ExternalsType } from "../config";
export type ContainerReferencePluginOptions = {
    remoteType: ExternalsType;
    remotes: Remotes;
    shareScope?: string;
    enhanced?: boolean;
};
export type Remotes = (RemotesItem | RemotesObject)[] | RemotesObject;
export type RemotesItem = string;
export type RemotesItems = RemotesItem[];
export type RemotesObject = {
    [k: string]: RemotesConfig | RemotesItem | RemotesItems;
};
export type RemotesConfig = {
    external: RemotesItem | RemotesItems;
    shareScope?: string;
};
export declare class ContainerReferencePlugin extends RspackBuiltinPlugin {
    name: BuiltinPluginName;
    _options: {
        remoteType: ExternalsType;
        remotes: [string, {
            external: string[];
            shareScope: string;
        }][];
        enhanced: boolean;
    };
    constructor(options: ContainerReferencePluginOptions);
    raw(compiler: Compiler): BuiltinPlugin;
}
