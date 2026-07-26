/**
 * 搜索/替换面板
 *
 * 搜索行：输入框、匹配选项、计数与导航。
 * 替换行：可折叠，由 `enableReplace` 控制；只读时禁用替换操作。
 */
export default class SearcherPanel {
    /**
     * 创建搜索面板并挂载到编辑区
     *
     * @param {SearcherPanelParams} params 构造参数
     */
    constructor(params: SearcherPanelParams);
    /** @type {SearcherEditorAdapter} 编辑器适配器 */
    editorAdapter: SearcherEditorAdapter;
    /** @type {Record<string, string>} 面板文案，字段见 locale.js 的 SEARCHER_LOCALE_KEYS */
    locale: Record<string, string>;
    /** @type {HTMLElement} 面板根节点，类名 `cherry-searcher` */
    dom: HTMLElement;
    /** @type {HTMLInputElement} */
    input: HTMLInputElement;
    /** @type {HTMLButtonElement | null} */
    expandButton: HTMLButtonElement | null;
    /** @type {HTMLButtonElement} */
    clearButton: HTMLButtonElement;
    /** @type {HTMLButtonElement} */
    caseToggle: HTMLButtonElement;
    /** @type {HTMLButtonElement} */
    wholeWordToggle: HTMLButtonElement;
    /** @type {HTMLButtonElement} */
    regexToggle: HTMLButtonElement;
    /** @type {HTMLElement} */
    counter: HTMLElement;
    /** @type {HTMLButtonElement} */
    prevButton: HTMLButtonElement;
    /** @type {HTMLButtonElement} */
    nextButton: HTMLButtonElement;
    /** @type {HTMLElement | null} */
    replaceRow: HTMLElement | null;
    /** @type {HTMLInputElement | null} */
    replaceInput: HTMLInputElement | null;
    /** @type {HTMLButtonElement | null} */
    replaceClearButton: HTMLButtonElement | null;
    /** @type {HTMLButtonElement | null} */
    replaceButton: HTMLButtonElement | null;
    /** @type {HTMLButtonElement | null} */
    replaceAllButton: HTMLButtonElement | null;
    /** @type {HTMLButtonElement | null} */
    selectAllMatchesButton: HTMLButtonElement | null;
    enableReplace: boolean;
    onVisibilityChange: (visible: boolean) => void;
    replaceExpanded: boolean;
    /** @type {SearcherPanelState} 搜索匹配与高亮状态 */
    state: SearcherPanelState;
    /** @type {ReturnType<typeof setTimeout> | null} */
    searchTimer: ReturnType<typeof setTimeout> | null;
    /** @type {boolean} */
    pendingKeepActiveIndex: boolean;
    /** @type {boolean} */
    pendingScrollToMatch: boolean;
    /**
     * 面板内拦截 Mod+F / Mod+H，避免唤起浏览器查找并支持再次 Mod+F 关闭
     * @param {KeyboardEvent} event
     */
    handlePanelShortcutKey(event: KeyboardEvent): void;
    /**
     * 面板是否可见
     * @returns {boolean}
     */
    isVisible(): boolean;
    /**
     * 显示搜索面板
     *
     * @param {string} [selection=''] 预填搜索词；有值时立即执行搜索
     * @param {SearcherShowOptions} [showOptions] 显示选项，`expandReplace` 为 true 时展开替换行
     */
    show(selection?: string, showOptions?: SearcherShowOptions): void;
    /**
     * 隐藏搜索面板，清除编辑器高亮并将焦点交还编辑器
     */
    hide(): void;
    /**
     * 聚焦搜索或替换输入框
     * @param {{ selectAll?: boolean; replace?: boolean }} [options]
     */
    focusPanelInput(options?: {
        selectAll?: boolean;
        replace?: boolean;
    }): void;
    /**
     * Esc：先清空当前输入框内容，再次 Esc 关闭面板
     * @param {HTMLInputElement} inputEl
     */
    handleEscapeKey(inputEl: HTMLInputElement): void;
    /**
     * 销毁面板：取消定时器、清除高亮、移除 DOM
     */
    destroy(): void;
    /**
     * 构建面板 DOM 结构（搜索行 + 可折叠替换行）
     *
     * @returns {HTMLElement} 面板根元素
     */
    createDOM(): HTMLElement;
    /** 缓存模板中的输入框、按钮等交互元素引用 */
    cacheElements(): void;
    /** 绑定替换区事件（仅 enableReplace 为 true 时在构造阶段调用一次） */
    bindReplaceEvents(): void;
    /** 绑定输入、键盘、导航、替换等交互事件 */
    bindEvents(): void;
    /**
     * 设置搜索词并触发搜索
     *
     * @param {string} query 搜索关键词
     * @param {boolean} [keepCurrentIndex=false] 为 true 时尽量保持当前匹配序号（文档变更刷新用）
     * @param {boolean} [immediate=true] 为 false 时对输入防抖，减少连续键入时的计算
     */
    setQuery(query: string, keepCurrentIndex?: boolean, immediate?: boolean): void;
    /** 清空搜索词并重新聚焦搜索输入框 */
    clearQuery(): void;
    /** 清空替换为输入框 */
    clearReplaceText(): void;
    /** 同步替换输入框清空按钮可见性 */
    updateReplaceClearVisibility(): void;
    /**
     * 防抖调度搜索（输入或文档变更时使用）
     * @param {boolean} [keepActiveIndex=false]
     */
    scheduleSearch(keepActiveIndex?: boolean, scrollToMatch?: boolean): void;
    /** 取消待执行的防抖搜索 */
    cancelScheduledSearch(): void;
    /**
     * 立即执行待定的防抖搜索
     * @param {boolean} [keepActiveIndex=true]
     */
    flushScheduledSearch(keepActiveIndex?: boolean, scrollToMatch?: boolean): void;
    /**
     * 同步匹配结果；面板隐藏时仅更新 state，不写入编辑器高亮
     *
     * @param {boolean} [keepActiveIndex=false]
     * @param {boolean} [applyToEditor=true]
     */
    syncMatches(keepActiveIndex?: boolean, applyToEditor?: boolean, scrollToMatch?: boolean): void;
    /**
     * 执行搜索：收集匹配、定位最近项、高亮并更新计数器
     *
     * @param {boolean} [keepActiveIndex=false] 为 true 且当前序号仍有效时，不根据光标重新定位匹配项
     */
    runSearch(keepActiveIndex?: boolean, scrollToMatch?: boolean): void;
    /**
     * 将当前搜索词同步到编辑器搜索高亮层
     *
     * @param {RegExp | null} [regex] 已构建的正则，省略时根据 state 重新构建
     */
    applyHighlight(regex?: RegExp | null): void;
    /** 清除编辑器中的搜索高亮 */
    clearHighlight(): void;
    /** 将编辑器选区移动到当前激活的匹配项并滚动到可见区域 */
    focusCurrentMatch(): void;
    /**
     * 在上/下一个匹配项之间循环导航
     *
     * @param {'prev' | 'next'} direction 导航方向
     */
    navigate(direction: "prev" | "next"): void;
    /**
     * 展开或收起替换行
     * @param {boolean} expanded
     */
    setReplaceExpanded(expanded: boolean): void;
    /**
     * 编辑器是否只读
     * @returns {boolean}
     */
    isReadOnly(): boolean;
    /**
     * 获取替换文本
     * @returns {string}
     */
    getReplacementText(): string;
    /**
     * 「替换为」输入框是否有有效内容
     * @returns {boolean}
     */
    hasReplacementText(): boolean;
    /**
     * 是否满足执行替换的前置条件
     * @returns {boolean}
     */
    canPerformReplace(): boolean;
    /**
     * 替换完成后收回面板焦点，便于继续输入
     */
    refocusPanelInput(): void;
    /**
     * 替换当前匹配项
     * @param {boolean} [keepIndex=false] - 为 true 时替换后仍停留在同序号匹配项
     * @returns {boolean} 是否成功替换
     */
    replaceCurrent(keepIndex?: boolean): boolean;
    /**
     * 选中所有匹配项（多光标 / 多选区），随后关闭面板并清除搜索高亮
     */
    selectAllMatches(): void;
    /**
     * 批量替换所有匹配项（从后向前替换，避免区间偏移）
     */
    replaceAll(): void;
    /**
     * 更新匹配计数器 `当前/总数`，并同步导航与替换按钮的禁用状态
     */
    updateCounter(): void;
    /**
     * 同步替换按钮状态（与 toggle 一致：默认可用 / hover / 不可操作 / 禁止）
     */
    updateReplaceButtonState(): void;
    /**
     * 根据 Cherry 全局 locale 刷新面板 placeholder、按钮 title 等文案
     *
     * @param {Record<string, string | undefined>} [hostLocale] Cherry.locale；传入时重新 pick，省略则使用已有 this.locale
     */
    updateLocaleStrings(hostLocale?: Record<string, string | undefined>): void;
}
/**
 * 面板构造参数
 */
export type SearcherPanelParams = {
    /**
     * 编辑器读写适配器
     */
    editorAdapter: SearcherEditorAdapter;
    /**
     * Cherry 全局 locale，面板通过 pickSearcherLocale 提取文案
     */
    locale?: Record<string, string | undefined>;
    /**
     * 是否展示替换行
     */
    enableReplace?: boolean;
    /**
     * 面板挂载节点，通常为 `.cherry-editor`
     */
    mountTarget?: ParentNode | null;
    /**
     * 面板显隐回调，用于同步工具栏按钮激活态
     */
    onVisibilityChange?: (visible: boolean) => void;
};
export type SearcherEditorAdapter = import("./bridge-utils").SearcherEditorAdapter;
/**
 * 面板显示选项
 */
export type SearcherShowOptions = {
    /**
     * 为 true 时打开面板同时展开替换行（Mod+H）
     */
    expandReplace?: boolean;
    /**
     * 为 true 时聚焦输入框并全选内容（首次带选中文本打开）
     */
    selectAll?: boolean;
};
/**
 * 搜索运行时状态
 */
export type SearcherPanelState = {
    /**
     * 当前搜索关键词
     */
    query: string;
    /**
     * 是否区分大小写
     */
    caseSensitive: boolean;
    /**
     * 是否全字匹配
     */
    wholeWord: boolean;
    /**
     * 是否按正则表达式解析搜索词
     */
    useRegex: boolean;
    /**
     * 文档中全部匹配区间
     */
    matches: Array<{
        from: number;
        to: number;
    }>;
    /**
     * 当前高亮匹配项在 matches 中的下标，无匹配时为 -1
     */
    activeMatchIndex: number;
};
