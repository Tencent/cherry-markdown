type RawStyleConfig = {
    styleLibraryDirectory?: string;
    custom?: string;
    css?: string;
    bool?: boolean;
};
type RawPluginImportConfig = {
    libraryName: string;
    libraryDirectory?: string;
    customName?: string;
    customStyleName?: string;
    style?: RawStyleConfig;
    camelToDashComponentName?: boolean;
    transformToDefaultImport?: boolean;
    ignoreEsComponent?: string[];
    ignoreStyleComponent?: string[];
};
type PluginImportConfig = {
    libraryName: string;
    libraryDirectory?: string;
    customName?: string;
    customStyleName?: string;
    style?: string | boolean;
    styleLibraryDirectory?: string;
    camelToDashComponentName?: boolean;
    transformToDefaultImport?: boolean;
    ignoreEsComponent?: string[];
    ignoreStyleComponent?: string[];
};
type PluginImportOptions = PluginImportConfig[];
declare function resolvePluginImport(pluginImport: PluginImportOptions): RawPluginImportConfig[] | undefined;
export { resolvePluginImport };
export type { PluginImportOptions };
