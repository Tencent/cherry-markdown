/**
 * @typedef {Object} SearcherTagItem
 * @property {string} value - 标签值
 * @property {string} [label] - 展示文本
 */
/**
 * @typedef {Object} SearcherPluginOptions
 * @property {string} [placeholder] - 搜索输入框占位文本
 * @property {string} [recentTitle] - 最近文本区域标题
 * @property {SearcherTagItem[]} [recentTexts] - 历史记录/推荐标签
 * @property {number} [maxRecentCount=10] - 最大历史记录数量
 * @property {string} [storageKey] - localStorage 存储键名
 * @property {(value: string) => boolean | void} [onTagDelete] - 标签删除回调，返回 false 阻止删除
 */
export default class SearcherPlugin {
    /**
     * 安装插件，合并搜索面板配置到 toolbars.config.searcher
     * @param {Record<string, unknown>} cherryOptions
     * @param {SearcherPluginOptions} [options]
     */
    static install(cherryOptions: Record<string, unknown>, options?: SearcherPluginOptions): void;
}
export { default as SearcherMenu } from "./SearcherMenu.js";
export { default as SearcherPanel } from "./SearcherPanel.js";
export * from "./search-utils.js";
export type SearcherTagItem = {
    /**
     * - 标签值
     */
    value: string;
    /**
     * - 展示文本
     */
    label?: string;
};
export type SearcherPluginOptions = {
    /**
     * - 搜索输入框占位文本
     */
    placeholder?: string;
    /**
     * - 最近文本区域标题
     */
    recentTitle?: string;
    /**
     * - 历史记录/推荐标签
     */
    recentTexts?: SearcherTagItem[];
    /**
     * - 最大历史记录数量
     */
    maxRecentCount?: number;
    /**
     * - localStorage 存储键名
     */
    storageKey?: string;
    /**
     * - 标签删除回调，返回 false 阻止删除
     */
    onTagDelete?: (value: string) => boolean | void;
};
