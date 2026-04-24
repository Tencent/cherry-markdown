import type { JsAfterEmitData, JsAfterTemplateExecutionData, JsAlterAssetTagGroupsData, JsAlterAssetTagsData, JsBeforeAssetTagGenerationData, JsBeforeEmitData } from "@rspack/binding";
import * as liteTapable from "@rspack/lite-tapable";
import { type Compilation } from "../../Compilation";
import type { HtmlRspackPluginOptions } from "./options";
type ExtraPluginHookData = {
    plugin: {
        options: HtmlRspackPluginOptions;
    };
};
export type HtmlRspackPluginHooks = {
    beforeAssetTagGeneration: liteTapable.AsyncSeriesWaterfallHook<[
        JsBeforeAssetTagGenerationData & ExtraPluginHookData
    ]>;
    alterAssetTags: liteTapable.AsyncSeriesWaterfallHook<[
        JsAlterAssetTagsData & ExtraPluginHookData
    ]>;
    alterAssetTagGroups: liteTapable.AsyncSeriesWaterfallHook<[
        JsAlterAssetTagGroupsData & ExtraPluginHookData
    ]>;
    afterTemplateExecution: liteTapable.AsyncSeriesWaterfallHook<[
        JsAfterTemplateExecutionData & ExtraPluginHookData
    ]>;
    beforeEmit: liteTapable.AsyncSeriesWaterfallHook<[
        JsBeforeEmitData & ExtraPluginHookData
    ]>;
    afterEmit: liteTapable.AsyncSeriesWaterfallHook<[
        JsAfterEmitData & ExtraPluginHookData
    ]>;
};
export declare const getPluginHooks: (compilation: Compilation) => HtmlRspackPluginHooks;
export declare const cleanPluginHooks: (compilation: Compilation) => void;
export {};
