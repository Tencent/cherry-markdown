import { type Drafts, type FeatureOptions, type NonStandard, type PseudoClasses } from "../builtin-loader/lightningcss";
import type { AssetConditions } from "../util/assetCondition";
export type LightningCssMinimizerRspackPluginOptions = {
    test?: AssetConditions;
    include?: AssetConditions;
    exclude?: AssetConditions;
    removeUnusedLocalIdents?: boolean;
    minimizerOptions?: {
        errorRecovery?: boolean;
        targets?: string[] | string;
        include?: FeatureOptions;
        exclude?: FeatureOptions;
        /**
         * @deprecated Use `drafts` instead.
         * This will be removed in the next major version.
         */
        draft?: Drafts;
        drafts?: Drafts;
        nonStandard?: NonStandard;
        pseudoClasses?: PseudoClasses;
        unusedSymbols?: string[];
    };
};
export declare const LightningCssMinimizerRspackPlugin: {
    new (options?: LightningCssMinimizerRspackPluginOptions | undefined): {
        name: string;
        _args: [options?: LightningCssMinimizerRspackPluginOptions | undefined];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
