import type { LoaderContext, LoaderDefinition } from "../..";
export declare const BASE_URI = "rspack-css-extract://";
export declare const MODULE_TYPE = "css/mini-extract";
export declare const AUTO_PUBLIC_PATH = "__css_extract_public_path_auto__";
export declare const ABSOLUTE_PUBLIC_PATH = "rspack-css-extract:///css-extract-plugin/";
export declare const SINGLE_DOT_PATH_SEGMENT = "__css_extract_single_dot_path_segment__";
export interface CssExtractRspackLoaderOptions {
    publicPath?: string | ((resourcePath: string, context: string) => string);
    emit?: boolean;
    esModule?: boolean;
    layer?: string;
    defaultExport?: boolean;
}
export declare function hotLoader(content: string, context: {
    loaderContext: LoaderContext;
    options?: CssExtractRspackLoaderOptions;
    locals?: Record<string, string>;
}): string;
declare const loader: LoaderDefinition;
export declare const pitch: LoaderDefinition["pitch"];
export default loader;
