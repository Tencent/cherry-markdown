import binding from "@rspack/binding";
import type { Source } from "../compiled/webpack-sources";
declare const $assets: unique symbol;
declare module "@rspack/binding" {
    interface Assets {
        [$assets]: Record<string, Source>;
    }
    interface KnownBuildInfo {
        assets: Record<string, Source>;
        fileDependencies: Set<string>;
        contextDependencies: Set<string>;
        missingDependencies: Set<string>;
        buildDependencies: Set<string>;
    }
}
export type { BuildInfo } from "@rspack/binding";
export declare const commitCustomFieldsToRust: (buildInfo: binding.BuildInfo) => void;
