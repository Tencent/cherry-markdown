/** @param {SearcherCherryHost} cherry */
export function getSearcherBridge(cherry: SearcherCherryHost): SearcherBridge;
/** @param {SearcherCherryHost} cherry */
export function closeSearcherPanel(cherry: SearcherCherryHost): void;
/** @param {SearcherCherryHost} cherry @param {string} [selection] @param {string} [aliasName] */
export function triggerSearcher(cherry: SearcherCherryHost, selection?: string, aliasName?: string): void;
/** @param {SearcherCherryHost} cherry */
export function initSearcherBridge(cherry: SearcherCherryHost): void;
/** @param {SearcherCherryHost} cherry */
export function destroySearcherBridge(cherry: SearcherCherryHost): void;
export default class SearcherBridge {
    /**
     * @param {SearcherCherryHost} cherry
     */
    constructor(cherry: SearcherCherryHost);
    cherry: import("./bridge-utils").SearcherCherryHost;
    /** @type {SearcherConfig} 初始化时解析，运行期不随 options 变更 */
    config: SearcherConfig;
    handleLocaleChange(): void;
    handleToolbarHide(): void;
    handleDocumentChange(): void;
    handlePreviewHidden(state: any): void;
    panel: SearcherPanel;
    /** 编辑区可见时允许搜索（只读模式仍可使用查找） */
    isSearchAvailable(): boolean;
    syncToolbarActive(active: any): void;
    bindEvents(): void;
    /**
     * Mod+F / 搜索按钮：打开或关闭；Mod+H：打开并展开替换行（需 enableReplace）
     *
     * @param {string} [selection='']
     * @param {string} [aliasName=''] `'replace'` 为替换模式
     */
    handleTrigger(selection?: string, aliasName?: string): void;
    destroy(): void;
}
export type SearcherCherryHost = import("./bridge-utils").SearcherCherryHost;
export type SearcherConfig = import("./config").SearcherConfig;
import SearcherPanel from './SearcherPanel';
export { getSearcherToolbarConfig, isSearcherReplaceEnabled, pickSearcherLocale, resolveSearcherConfig } from "./config";
