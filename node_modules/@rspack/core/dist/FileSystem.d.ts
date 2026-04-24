import type { NodeFsStats, ThreadsafeNodeFS } from "@rspack/binding";
import { type InputFileSystem, type IntermediateFileSystem, type OutputFileSystem } from "./util/fs";
declare class ThreadsafeInputNodeFS implements ThreadsafeNodeFS {
    writeFile: (name: string, content: Buffer) => Promise<void>;
    removeFile: (name: string) => Promise<void>;
    mkdir: (name: string) => Promise<void>;
    mkdirp: (name: string) => Promise<string | void>;
    removeDirAll: (name: string) => Promise<string | void>;
    readDir: (name: string) => Promise<string[] | void>;
    readFile: (name: string) => Promise<Buffer | string | void>;
    stat: (name: string) => Promise<NodeFsStats | void>;
    lstat: (name: string) => Promise<NodeFsStats | void>;
    chmod?: (name: string, mode: number) => Promise<void>;
    realpath: (name: string) => Promise<string | void>;
    open: (name: string, flags: string) => Promise<number | void>;
    rename: (from: string, to: string) => Promise<void>;
    close: (fd: number) => Promise<void>;
    write: (fd: number, content: Buffer, position: number) => Promise<number | void>;
    writeAll: (fd: number, content: Buffer) => Promise<number | void>;
    read: (fd: number, length: number, position: number) => Promise<Buffer | void>;
    readUntil: (fd: number, code: number, position: number) => Promise<Buffer | void>;
    readToEnd: (fd: number, position: number) => Promise<Buffer | void>;
    constructor(fs?: InputFileSystem);
    static __to_binding(fs?: InputFileSystem): ThreadsafeInputNodeFS;
    static needsBinding(ifs?: false | RegExp[]): boolean;
}
declare class ThreadsafeOutputNodeFS implements ThreadsafeNodeFS {
    writeFile: (name: string, content: Buffer) => Promise<void>;
    removeFile: (name: string) => Promise<void>;
    mkdir: (name: string) => Promise<void>;
    mkdirp: (name: string) => Promise<string | void>;
    removeDirAll: (name: string) => Promise<string | void>;
    readDir: (name: string) => Promise<string[] | void>;
    readFile: (name: string) => Promise<Buffer | string | void>;
    stat: (name: string) => Promise<NodeFsStats | void>;
    lstat: (name: string) => Promise<NodeFsStats | void>;
    chmod?: (name: string, mode: number) => Promise<void>;
    realpath: (name: string) => Promise<string | void>;
    open: (name: string, flags: string) => Promise<number | void>;
    rename: (from: string, to: string) => Promise<void>;
    close: (fd: number) => Promise<void>;
    write: (fd: number, content: Buffer, position: number) => Promise<number | void>;
    writeAll: (fd: number, content: Buffer) => Promise<number | void>;
    read: (fd: number, length: number, position: number) => Promise<Buffer | void>;
    readUntil: (fd: number, code: number, position: number) => Promise<Buffer | void>;
    readToEnd: (fd: number, position: number) => Promise<Buffer | void>;
    constructor(fs?: OutputFileSystem);
    static __to_binding(fs?: OutputFileSystem): ThreadsafeOutputNodeFS;
}
declare class ThreadsafeIntermediateNodeFS extends ThreadsafeOutputNodeFS {
    constructor(fs?: IntermediateFileSystem);
    static __to_binding(fs?: IntermediateFileSystem): ThreadsafeIntermediateNodeFS;
}
export { ThreadsafeInputNodeFS, ThreadsafeOutputNodeFS, ThreadsafeIntermediateNodeFS };
