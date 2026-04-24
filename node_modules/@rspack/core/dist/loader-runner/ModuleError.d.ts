import WebpackError from "../lib/WebpackError";
export declare class ModuleError extends WebpackError {
    error?: Error;
    constructor(err: Error, { from }?: {
        from?: string;
    });
}
export declare class ModuleWarning extends WebpackError {
    error?: Error;
    constructor(err: Error, { from }?: {
        from?: string;
    });
}
