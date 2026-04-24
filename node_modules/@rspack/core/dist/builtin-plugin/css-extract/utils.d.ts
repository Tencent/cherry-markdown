import type { LoaderContext } from "../..";
export declare function isAbsolutePath(str: string): boolean;
export declare const PLUGIN_NAME = "css-extract-rspack-plugin";
export declare function isRelativePath(str: string): boolean;
export declare function stringifyRequest(loaderContext: LoaderContext, request: string): string;
export declare function stringifyLocal(value: any): any;
