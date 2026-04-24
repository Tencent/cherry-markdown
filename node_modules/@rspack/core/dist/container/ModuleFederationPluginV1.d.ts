import type { Compiler } from "../Compiler";
import type { EntryRuntime, ExternalsType, LibraryOptions } from "../config";
import { type Shared } from "../sharing/SharePlugin";
import { type Exposes } from "./ContainerPlugin";
import { type Remotes } from "./ContainerReferencePlugin";
export interface ModuleFederationPluginV1Options {
    exposes?: Exposes;
    filename?: string;
    library?: LibraryOptions;
    name: string;
    remoteType?: ExternalsType;
    remotes?: Remotes;
    runtime?: EntryRuntime;
    shareScope?: string;
    shared?: Shared;
    enhanced?: boolean;
}
export declare class ModuleFederationPluginV1 {
    private _options;
    constructor(_options: ModuleFederationPluginV1Options);
    apply(compiler: Compiler): void;
}
