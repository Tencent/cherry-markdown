export default class SearcherPanel {
    /**
     * @param {import('@cherry/Cherry.js').default} $cherry
     * @param {import('./index.js').SearcherPluginOptions} [options]
     */
    constructor($cherry: any, options?: import("./index.js").SearcherPluginOptions);
    $cherry: any;
    options: import("./index.js").SearcherPluginOptions;
    storageKey: string;
    maxRecentCount: number;
    recentTexts: any[];
    cm: any;
    state: {
        query: string;
        caseSensitive: boolean;
        wholeWord: boolean;
        matches: any[];
        currentIndex: number;
    };
    dom: any;
    /**
     * 绑定 CodeMirror 编辑器实例
     * @param {import('@cherry/Editor.js').default} cm
     */
    init(cm: any): void;
    /**
     * 面板是否可见
     * @returns {boolean}
     */
    isVisible(): boolean;
    /**
     * 显示搜索面板
     * @param {{ left: number; top: number; width: number; height: number }} anchorRect
     * @param {string} [selection='']
     */
    show(anchorRect: {
        left: number;
        top: number;
        width: number;
        height: number;
    }, selection?: string): void;
    /**
     * 隐藏搜索面板
     */
    hide(): void;
    /**
     * 销毁面板
     */
    destroy(): void;
    /**
     * @param {{ left: number; top: number; width: number; height: number }} anchorRect
     */
    positionPanel(anchorRect: {
        left: number;
        top: number;
        width: number;
        height: number;
    }): void;
    createDOM(): any;
    cacheElements(): void;
    input: any;
    clearButton: any;
    caseToggle: any;
    wholeWordToggle: any;
    counter: any;
    recentSection: any;
    prevButton: any;
    nextButton: any;
    bindEvents(): void;
    /**
     * @param {string} query
     * @param {boolean} [keepCurrentIndex=false]
     */
    setQuery(query: string, keepCurrentIndex?: boolean): void;
    clearQuery(): void;
    runSearch(keepCurrentIndex?: boolean): void;
    applyHighlight(): void;
    clearHighlight(): void;
    focusCurrentMatch(): void;
    /**
     * @param {'prev' | 'next'} direction
     */
    navigate(direction: "prev" | "next"): void;
    updateCounter(): void;
    updateLocaleStrings(): void;
    renderRecentSection(): void;
    /**
     * @param {string} value
     */
    saveRecentText(value: string): void;
    /**
     * @param {string} value
     */
    removeRecentText(value: string): void;
    loadRecentTexts(): any[];
    persistRecentTexts(): void;
}
