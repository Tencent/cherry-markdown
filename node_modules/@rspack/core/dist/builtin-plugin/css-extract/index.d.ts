import { type RawCssExtractPluginOption } from "@rspack/binding";
import type { Compiler, LiteralUnion } from "../..";
export * from "./loader";
export type { CssExtractRspackLoaderOptions } from "./loader";
export interface CssExtractRspackPluginOptions {
    filename?: RawCssExtractPluginOption["filename"];
    chunkFilename?: RawCssExtractPluginOption["chunkFilename"];
    ignoreOrder?: boolean;
    insert?: string | ((linkTag: HTMLLinkElement) => void);
    attributes?: Record<string, string>;
    linkType?: LiteralUnion<"text/css", string> | false;
    runtime?: boolean;
    pathinfo?: boolean;
    enforceRelative?: boolean;
}
export declare class CssExtractRspackPlugin {
    static pluginName: string;
    static loader: string;
    options: CssExtractRspackPluginOptions;
    constructor(options?: CssExtractRspackPluginOptions);
    apply(compiler: Compiler): void;
    normalizeOptions(options: CssExtractRspackPluginOptions): RawCssExtractPluginOption;
}
export default CssExtractRspackPlugin;
