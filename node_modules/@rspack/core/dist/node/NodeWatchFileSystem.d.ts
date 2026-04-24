/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/node/NodeWatchFileSystem.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type Watchpack from "../../compiled/watchpack";
import type { FileSystemInfoEntry, InputFileSystem, Watcher, WatchFileSystem } from "../util/fs";
export default class NodeWatchFileSystem implements WatchFileSystem {
    inputFileSystem: InputFileSystem;
    watcherOptions: Watchpack.WatchOptions;
    watcher?: Watchpack;
    constructor(inputFileSystem: InputFileSystem);
    watch(files: Iterable<string>, directories: Iterable<string>, missing: Iterable<string>, startTime: number, options: Watchpack.WatchOptions, callback: (error: Error | null, fileTimeInfoEntries: Map<string, FileSystemInfoEntry | "ignore">, contextTimeInfoEntries: Map<string, FileSystemInfoEntry | "ignore">, changedFiles: Set<string>, removedFiles: Set<string>) => void, callbackUndelayed: (fileName: string, changeTime: number) => void): Watcher;
}
