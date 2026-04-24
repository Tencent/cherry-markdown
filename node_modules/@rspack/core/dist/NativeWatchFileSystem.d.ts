import binding from "@rspack/binding";
import type Watchpack from "../compiled/watchpack";
import type { FileSystemInfoEntry, InputFileSystem, Watcher, WatchFileSystem } from "./util/fs";
export default class NativeWatchFileSystem implements WatchFileSystem {
    #private;
    constructor(inputFileSystem: InputFileSystem);
    watch(files: Iterable<string> & {
        added?: Iterable<string>;
        removed?: Iterable<string>;
    }, directories: Iterable<string> & {
        added?: Iterable<string>;
        removed?: Iterable<string>;
    }, missing: Iterable<string> & {
        added?: Iterable<string>;
        removed?: Iterable<string>;
    }, startTime: number, options: Watchpack.WatchOptions, callback: (error: Error | null, fileTimeInfoEntries: Map<string, FileSystemInfoEntry | "ignore">, contextTimeInfoEntries: Map<string, FileSystemInfoEntry | "ignore">, changedFiles: Set<string>, removedFiles: Set<string>) => void, callbackUndelayed: (fileName: string, changeTime: number) => void): Watcher;
    getNativeWatcher(options: Watchpack.WatchOptions): binding.NativeWatcher;
    triggerEvent(kind: "change" | "remove" | "create", path: string): void;
    formatWatchDependencies(dependencies: Iterable<string> & {
        added?: Iterable<string>;
        removed?: Iterable<string>;
    }): [string[], string[]];
}
