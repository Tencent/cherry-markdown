import { type BuiltinPlugin, BuiltinPluginName } from "@rspack/binding";
import type { Compiler, LibraryType } from "..";
import { RspackBuiltinPlugin } from "./base";
export declare class EnableLibraryPlugin extends RspackBuiltinPlugin {
    private type;
    name: BuiltinPluginName;
    constructor(type: LibraryType);
    static setEnabled(compiler: Compiler, type: LibraryType): void;
    static checkEnabled(compiler: Compiler, type: LibraryType): void;
    raw(compiler: Compiler): BuiltinPlugin | undefined;
}
