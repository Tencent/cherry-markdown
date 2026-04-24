import type { LoaderContext } from "../config/adapterRuleUse";
import type { Compiler } from "../exports";
import type { LoaderObject } from ".";
export declare function convertArgs(args: any[], raw: boolean): void;
export declare const loadLoader: (loaderObject: LoaderObject, compiler: Compiler) => Promise<void>;
export declare const runSyncOrAsync: (arg1: Function, arg2: LoaderContext<{}>, arg3: any[]) => Promise<any[]>;
export declare function extractLoaderName(loaderPath: string, cwd?: string): string;
