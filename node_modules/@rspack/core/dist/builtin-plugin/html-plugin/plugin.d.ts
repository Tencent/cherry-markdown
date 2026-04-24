import { type JsHtmlPluginTag } from "@rspack/binding";
import type { Compilation } from "../../Compilation";
import type { Compiler } from "../../Compiler";
import { type HtmlRspackPluginHooks } from "./hooks";
import { type HtmlRspackPluginOptions } from "./options";
declare const HtmlRspackPluginImpl: {
    new (c?: HtmlRspackPluginOptions | undefined): {
        name: string;
        _args: [c?: HtmlRspackPluginOptions | undefined];
        affectedHooks: keyof import("../../Compiler").CompilerHooks | undefined;
        raw(compiler: Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: Compiler): void;
    };
};
declare const HtmlRspackPlugin: typeof HtmlRspackPluginImpl & {
    /**
     * @deprecated Use `getCompilationHooks` instead.
     */
    getHooks: (compilation: Compilation) => HtmlRspackPluginHooks;
    getCompilationHooks: (compilation: Compilation) => HtmlRspackPluginHooks;
    createHtmlTagObject: (tagName: string, attributes?: Record<string, string | boolean>, innerHTML?: string) => JsHtmlPluginTag;
    version: number;
};
export { HtmlRspackPlugin };
