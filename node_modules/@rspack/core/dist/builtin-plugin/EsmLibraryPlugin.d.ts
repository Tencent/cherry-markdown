import type { Compiler } from "../Compiler";
export declare class EsmLibraryPlugin {
    static PLUGIN_NAME: string;
    options?: {
        preserveModules?: string;
    };
    constructor(options?: {
        preserveModules?: string;
    });
    apply(compiler: Compiler): void;
}
