import type { Compiler } from "./Compiler";
export declare class VirtualModulesPlugin {
    #private;
    constructor(modules?: Record<string, string>);
    apply(compiler: Compiler): void;
    writeModule(filePath: string, contents: string): void;
    private getVirtualFileStore;
    static __internal__take_virtual_files(compiler: Compiler): {
        path: string;
        content: string;
    }[] | undefined;
}
