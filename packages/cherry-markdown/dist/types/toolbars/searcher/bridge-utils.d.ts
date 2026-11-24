/**
 * @param {import('../../../../types/cherry').CherryToolbarsOptions | undefined} toolbars
 * @returns {boolean}
 */
export function isSearcherToolbarEnabled(toolbars: import("../../../../types/cherry.js").CherryToolbarsOptions | undefined): boolean;
/**
 * 获取 Search hook（任一已挂载工具栏均可；按钮态通过 DOM 选择器统一更新）
 * @param {SearcherCherryHost | undefined} cherry
 * @returns {import('../../toolbars/hooks/Search').default | undefined}
 */
export function getSearchHook(cherry: SearcherCherryHost | undefined): import("../hooks/Search.js").default | undefined;
/**
 * @param {SearcherCherryHost} cherry
 * @returns {SearcherEditorAdapter}
 */
export function createEditorAdapter(cherry: SearcherCherryHost): SearcherEditorAdapter;
/** 与 HookCenter、toolbars.* 配置项一致的 hook 名称 */
export const SEARCH_HOOK_NAME: "search";
export type SearcherCherryHost = {
    locale?: Record<string, string | undefined>;
    options?: {
        toolbars?: import("../../../../types/cherry.js").CherryToolbarsOptions;
    };
    editor?: object;
    wrapperDom?: HTMLElement;
    toolbar?: import("../Toolbar.js").default;
    toolbarRight?: import("../ToolbarRight.js").default;
    sidebar?: import("../Sidebar.js").default;
    hiddenToolbar?: import("../HiddenToolbar.js").default;
    bubble?: import("../Bubble.js").default;
    floatMenu?: import("../FloatMenu.js").default;
    $event?: import("../../Event.js").default;
};
export type SearcherEditorAdapter = {
    getDocString: () => string;
    getSelection: () => {
        from: number;
        to: number;
    };
    getSelectedText: () => string;
    getCursorHead: () => number;
    setSelection: (from: number, to: number, options?: object) => void;
    setSelections: (ranges: Array<{
        from: number;
        to: number;
    }>, options?: object) => void;
    replaceRange: (text: string, from: number, to: number) => void;
    setSearchQuery: (pattern: string, caseSensitive: boolean, asRegex: boolean) => void;
    clearSearchQuery: () => void;
    focus: () => void;
    isReadOnly: () => boolean;
};
