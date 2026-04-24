import { type BuiltinPlugin, BuiltinPluginName, type RawHttpUriPluginOptions } from "@rspack/binding";
import type { Compiler } from "../Compiler";
import { RspackBuiltinPlugin } from "./base";
export type HttpUriPluginOptionsAllowedUris = (string | RegExp)[];
export type HttpUriPluginOptions = {
    /**
     * A list of allowed URIs
     */
    allowedUris: HttpUriPluginOptionsAllowedUris;
    /**
     * Define the location to store the lockfile
     */
    lockfileLocation?: string;
    /**
     * Define the location for caching remote resources
     */
    cacheLocation?: string | false;
    /**
     * Detect changes to remote resources and upgrade them automatically
     */
    upgrade?: boolean;
    /**
     * Custom http client
     */
    httpClient?: RawHttpUriPluginOptions["httpClient"];
};
/**
 * Plugin that allows loading modules from HTTP URLs
 */
export declare class HttpUriPlugin extends RspackBuiltinPlugin {
    private options;
    name: BuiltinPluginName;
    affectedHooks: "compilation";
    constructor(options: HttpUriPluginOptions);
    raw(compiler: Compiler): BuiltinPlugin | undefined;
}
