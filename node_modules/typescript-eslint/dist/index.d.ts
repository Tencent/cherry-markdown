import type { TSESLint } from '@typescript-eslint/utils';
import type { ConfigWithExtends } from './config-helper';
import { config } from './config-helper';
declare const parser: TSESLint.FlatConfig.Parser;
declare const plugin: TSESLint.FlatConfig.Plugin;
declare const configs: {
    all: TSESLint.FlatConfig.ConfigArray;
    base: TSESLint.FlatConfig.Config;
    disableTypeChecked: TSESLint.FlatConfig.Config;
    eslintRecommended: TSESLint.FlatConfig.Config;
    recommended: TSESLint.FlatConfig.ConfigArray;
    recommendedTypeChecked: TSESLint.FlatConfig.ConfigArray;
    recommendedTypeCheckedOnly: TSESLint.FlatConfig.ConfigArray;
    strict: TSESLint.FlatConfig.ConfigArray;
    strictTypeChecked: TSESLint.FlatConfig.ConfigArray;
    strictTypeCheckedOnly: TSESLint.FlatConfig.ConfigArray;
    stylistic: TSESLint.FlatConfig.ConfigArray;
    stylisticTypeChecked: TSESLint.FlatConfig.ConfigArray;
    stylisticTypeCheckedOnly: TSESLint.FlatConfig.ConfigArray;
};
export type Config = TSESLint.FlatConfig.ConfigFile;
export type { ConfigWithExtends };
declare const _default: {
    config: typeof config;
    configs: {
        all: TSESLint.FlatConfig.ConfigArray;
        base: TSESLint.FlatConfig.Config;
        disableTypeChecked: TSESLint.FlatConfig.Config;
        eslintRecommended: TSESLint.FlatConfig.Config;
        recommended: TSESLint.FlatConfig.ConfigArray;
        recommendedTypeChecked: TSESLint.FlatConfig.ConfigArray;
        recommendedTypeCheckedOnly: TSESLint.FlatConfig.ConfigArray;
        strict: TSESLint.FlatConfig.ConfigArray;
        strictTypeChecked: TSESLint.FlatConfig.ConfigArray;
        strictTypeCheckedOnly: TSESLint.FlatConfig.ConfigArray;
        stylistic: TSESLint.FlatConfig.ConfigArray;
        stylisticTypeChecked: TSESLint.FlatConfig.ConfigArray;
        stylisticTypeCheckedOnly: TSESLint.FlatConfig.ConfigArray;
    };
    parser: {
        meta?: { [K in keyof TSESLint.Parser.ParserMeta]?: TSESLint.Parser.ParserMeta[K] | undefined; };
        parseForESLint(text: string, options?: unknown): { [k in keyof TSESLint.Parser.ParseResult]: unknown; };
    };
    plugin: TSESLint.FlatConfig.Plugin;
};
export default _default;
export { config, configs, parser, plugin };
//# sourceMappingURL=index.d.ts.map