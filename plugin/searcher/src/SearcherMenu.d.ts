export default class SearcherMenu {
    /**
     * @param {import('@cherry/toolbars/MenuBase.js').MenuBaseConstructorParams} $cherry
     * @param {import('./index.js').SearcherPluginOptions} [options]
     */
    constructor($cherry: any, options?: import("./index.js").SearcherPluginOptions);
    pluginOptions: any;
    updateMarkdown: boolean;
    shortcutKeyMap: {
        [x: string]: {
            hookName: any;
            aliasName: any;
        };
    };
    /**
     * 初始化搜索面板 DOM
     */
    ensurePanelMounted(): void;
    /**
     * @param {string} selection
     */
    onClick(selection: string): void;
    /**
     * 获取当前选中文本
     * @returns {string}
     */
    getSelectedText(): string;
}
