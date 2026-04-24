import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import type { Externals } from "..";
import { RspackBuiltinPlugin } from "./base";
export declare class ExternalsPlugin extends RspackBuiltinPlugin {
    #private;
    private type;
    private externals;
    private placeInInitial?;
    name: BuiltinPluginName;
    constructor(type: string, externals: Externals, placeInInitial?: boolean | undefined);
    raw(): BuiltinPlugin | undefined;
}
