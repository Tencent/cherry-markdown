/**
 * SearcherBridge 辅助：宿主探测、编辑器适配、工具栏 hook 查找
 *
 * @module toolbars/searcher/bridge-utils
 */

/** 与 HookCenter、toolbars.* 配置项一致的 hook 名称 */
export const SEARCH_HOOK_NAME = 'search';

/**
 * @typedef {object} SearcherCherryHost
 * @property {Record<string, string | undefined>} [locale]
 * @property {{ toolbars?: import('~types/cherry').CherryToolbarsOptions }} [options]
 * @property {object} [editor]
 * @property {HTMLElement} [wrapperDom]
 * @property {import('@/toolbars/Toolbar').default} [toolbar]
 * @property {import('@/toolbars/ToolbarRight').default} [toolbarRight]
 * @property {import('@/toolbars/Sidebar').default} [sidebar]
 * @property {import('@/toolbars/HiddenToolbar').default} [hiddenToolbar]
 * @property {import('@/toolbars/Bubble').default} [bubble]
 * @property {import('@/toolbars/FloatMenu').default} [floatMenu]
 * @property {import('@/Event').default} [$event]
 */

/**
 * @typedef {object} SearcherEditorAdapter
 * @property {() => string} getDocString
 * @property {() => { from: number; to: number }} getSelection
 * @property {() => string} getSelectedText
 * @property {() => number} getCursorHead
 * @property {(from: number, to: number, options?: object) => void} setSelection
 * @property {(text: string, from: number, to: number) => void} replaceRange
 * @property {(pattern: string, caseSensitive: boolean, asRegex: boolean) => void} setSearchQuery
 * @property {() => void} clearSearchQuery
 * @property {() => void} focus
 * @property {() => boolean} isReadOnly
 */

/**
 * Cherry 实例上已挂载的工具栏（与 isSearcherToolbarEnabled 检测范围对应）
 * @param {SearcherCherryHost | undefined} cherry
 * @returns {Array<{ menus?: { hooks?: Record<string, unknown> } }>}
 */
function getToolbarMenuInstances(cherry) {
  return [
    cherry?.toolbar,
    cherry?.toolbarRight,
    cherry?.sidebar,
    cherry?.hiddenToolbar,
    cherry?.bubble,
    cherry?.floatMenu,
  ].filter(Boolean);
}

/**
 * @param {import('~types/cherry').CherryToolbarsOptions | undefined} toolbars
 * @returns {boolean}
 */
export function isSearcherToolbarEnabled(toolbars) {
  if (!toolbars) {
    return false;
  }

  const lists = [
    toolbars.toolbar,
    toolbars.toolbarRight,
    toolbars.hiddenToolbar,
    toolbars.bubble,
    toolbars.float,
    toolbars.sidebar,
  ].filter(Array.isArray);

  return lists.some((list) => list.includes(SEARCH_HOOK_NAME));
}

/**
 * 获取 Search hook（任一已挂载工具栏均可；按钮态通过 DOM 选择器统一更新）
 * @param {SearcherCherryHost | undefined} cherry
 * @returns {import('@/toolbars/hooks/Search').default | undefined}
 */
export function getSearchHook(cherry) {
  for (const bar of getToolbarMenuInstances(cherry)) {
    const hook = /** @type {import('@/toolbars/hooks/Search').default | undefined} */ (bar.menus?.hooks?.search);
    if (hook) {
      return hook;
    }
  }
  return undefined;
}

/**
 * @param {SearcherCherryHost} cherry
 * @returns {SearcherEditorAdapter}
 */
export function createEditorAdapter(cherry) {
  const editor = cherry.editor?.editor;

  return {
    getDocString() {
      return editor?.view?.state?.doc?.toString() ?? '';
    },
    getSelection() {
      const selection = editor?.view?.state?.selection?.main;
      if (!selection) {
        return { from: 0, to: 0 };
      }
      return { from: selection.from, to: selection.to };
    },
    getSelectedText() {
      const { from, to } = this.getSelection();
      if (from === to || !editor) {
        return '';
      }
      return editor.view.state.doc.sliceString(from, to);
    },
    getCursorHead() {
      return editor?.view?.state?.selection?.main?.head ?? 0;
    },
    setSelection(from, to, options) {
      editor?.setSelection(from, to, options);
    },
    replaceRange(text, from, to) {
      editor?.replaceRange(text, from, to);
    },
    setSearchQuery(pattern, caseSensitive, asRegex) {
      editor?.setSearchQuery(pattern, caseSensitive, asRegex);
    },
    clearSearchQuery() {
      editor?.clearSearchQuery();
    },
    focus() {
      editor?.view?.focus();
    },
    isReadOnly() {
      return Boolean(editor?.getOption?.('readOnly'));
    },
  };
}
