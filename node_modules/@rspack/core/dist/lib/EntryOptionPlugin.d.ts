/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/EntryOptionPlugin.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Compiler, EntryDescriptionNormalized, EntryNormalized } from "..";
import type { EntryOptions } from "../builtin-plugin";
export declare class EntryOptionPlugin {
    /**
     * @param compiler the compiler instance one is tapping into
     * @returns
     */
    apply(compiler: Compiler): void;
    /**
     * @param compiler the compiler
     * @param context context directory
     * @param entry request
     * @returns
     */
    static applyEntryOption(compiler: Compiler, context: string, entry: EntryNormalized): void;
    /**
     * @param compiler the compiler
     * @param name entry name
     * @param desc entry description
     * @returns options for the entry
     */
    static entryDescriptionToOptions(compiler: Compiler, name: string, desc: EntryDescriptionNormalized): EntryOptions;
}
export default EntryOptionPlugin;
