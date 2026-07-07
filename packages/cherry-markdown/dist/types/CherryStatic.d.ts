/**
 * @typedef {object} CherryPluginClass
 * @property {boolean} [$cherry$mounted]
 * @property {function(object, ...any[]): void} install
 */
export class CherryStatic {
    static createSyntaxHook: typeof createSyntaxHook;
    static createMenuHook: typeof createMenuHook;
    static constants: {
        HOOKS_TYPE_LIST: import("./core/SyntaxBase").HookTypesList;
    };
    static plugins: {
        TapdTablePlugin: typeof TapdTablePlugin;
        TapdHtmlTagPlugin: typeof TapdHtmlTagPlugin;
        TapdCheckListPlugin: typeof TapdCheckListPlugin;
        EChartsCodeBlockEngine: typeof EChartsCodeBlockEngine;
    };
    static VERSION: string;
    /**
     * @this {typeof import('./Cherry').default | typeof CherryStatic}
     * @param {CherryPluginClass} PluginClass 插件 Class
     * @param  {...any} args 初始化插件的参数
     * @returns {void}
     */
    static usePlugin(this: typeof CherryStatic | typeof import("./Cherry").default, PluginClass: CherryPluginClass, ...args: any[]): void;
    constructor(...args: any[]);
}
export type CherryPluginClass = {
    $cherry$mounted?: boolean;
    install: (arg0: object, ...args: any[][]) => void;
};
import { createSyntaxHook } from './Factory';
import { createMenuHook } from './Factory';
import TapdTablePlugin from './addons/advance/cherry-tapd-table-plugin';
import TapdHtmlTagPlugin from './addons/advance/cherry-tapd-html-tag-plugin';
import TapdCheckListPlugin from './addons/advance/cherry-tapd-checklist-plugin';
import EChartsCodeBlockEngine from './addons/advance/cherry-codeblock-echarts-plugin';
