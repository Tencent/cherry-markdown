/**
 * Cherry 内置搜索：面板桥接与实例运行时
 *
 * 将工具栏 `search` hook、快捷键与 {@link SearcherPanel} 连接到 Cherry 编辑器。
 * 用户需在 `toolbars.toolbar` / `hiddenToolbar` / `bubble` / `float` 等列表中配置 `'search'`
 * 后，Cherry 初始化完成时才会调用 {@link initSearcherBridge}。
 *
 * @module toolbars/searcher/SearcherBridge
 */
import SearcherPanel from './SearcherPanel';
import { pickSearcherLocale } from './locale';

/**
 * 工具栏 hook 名称，与 `toolbars.*` 配置项及 {@link HookCenter} 中的 `search` 一致
 * @type {'search'}
 */
const SEARCH_HOOK_NAME = 'search';

/** Cherry 实例与桥接层的弱引用映射，避免内存泄漏 */
/** @type {WeakMap<SearcherCherryHost, SearcherBridge>} */
const bridges = new WeakMap();

/**
 * 搜索桥接层所需的宿主最小形态（兼容 Cherry、CherryStream、MenuBase.$cherry）
 * @typedef {object} SearcherCherryHost
 * @property {Record<string, string | undefined>} [locale] 界面文案
 * @property {{ toolbars?: import('~types/cherry').CherryToolbarsOptions }} [options] Cherry 配置
 * @property {object} [editor] 编辑器模块，含 CM6 实例与挂载 DOM
 * @property {HTMLElement} [wrapperDom] 外层容器
 * @property {import('@/Event').default} [$event] 事件总线
 */

/**
 * 编辑器适配器：屏蔽 CM6 细节，供 SearcherPanel 读写文档与搜索高亮
 * @typedef {object} SearcherEditorAdapter
 * @property {() => string} getDocString 获取当前文档全文
 * @property {() => { from: number; to: number }} getSelection 获取主选区范围
 * @property {() => string} getSelectedText 获取选中文本，无选区时返回空字符串
 * @property {() => number} getCursorHead 获取光标 head 位置，用于定位最近匹配项
 * @property {(from: number, to: number, options?: object) => void} setSelection 设置选区并可选滚动到视口
 * @property {(text: string, from: number, to: number) => void} replaceRange 替换指定区间文本
 * @property {(pattern: string, caseSensitive: boolean, asRegex: boolean) => void} setSearchQuery 设置搜索高亮
 * @property {() => void} clearSearchQuery 清除搜索高亮
 * @property {() => void} focus 将焦点交还编辑器
 * @property {() => boolean} isReadOnly 是否只读，只读时禁止替换
 */

/**
 * 基于 Cherry 实例创建编辑器适配器
 * @param {SearcherCherryHost} cherry Cherry / CherryStream 实例
 * @returns {SearcherEditorAdapter}
 */
function createEditorAdapter(cherry) {
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

/**
 * 判断当前 Cherry 配置是否启用了搜索能力
 *
 * 仅当 `toolbar` / `toolbarRight` / `hiddenToolbar` / `bubble` / `float`
 * 任一数组包含 `'search'` 时返回 true。放在 `hiddenToolbar` 可只启用快捷键而不显示按钮。
 *
 * @param {import('~types/cherry').CherryToolbarsOptions | undefined} toolbars Cherry 工具栏配置
 * @returns {boolean}
 */
function isSearcherToolbarEnabled(toolbars) {
  if (!toolbars) {
    return false;
  }

  const lists = [toolbars.toolbar, toolbars.toolbarRight, toolbars.hiddenToolbar, toolbars.bubble, toolbars.float]
    .filter(Array.isArray);

  return lists.some((list) => list.includes(SEARCH_HOOK_NAME));
}

/**
 * 搜索桥接层：管理面板生命周期，响应 Cherry 事件与工具栏触发
 */
export default class SearcherBridge {
  /**
   * @param {SearcherCherryHost} cherry Cherry / CherryStream 实例
   */
  constructor(cherry) {
    /** @type {SearcherCherryHost} 宿主实例 */
    this.cherry = cherry;

    this.handleLocaleChange = this.handleLocaleChange.bind(this);
    this.handleToolbarHide = this.handleToolbarHide.bind(this);
    this.handleDocumentChange = this.handleDocumentChange.bind(this);
    this.handlePreviewHidden = this.handlePreviewHidden.bind(this);

    const editorDom = cherry.editor?.options?.editorDom;
    const mountTarget = editorDom || cherry.editor?.options?.wrapperDom || cherry.wrapperDom;

    /** @type {SearcherPanel} 搜索/替换面板实例，挂载在编辑区右上角 */
    this.panel = new SearcherPanel({
      editorAdapter: createEditorAdapter(cherry),
      locale: pickSearcherLocale(cherry.locale),
      mountTarget,
    });

    this.bindEvents();
  }

  /**
   * 当前是否处于可编辑模式（编辑区可见且非只读）
   *
   * 预览模式、只读模式下不响应搜索触发。
   *
   * @returns {boolean}
   */
  isEditableMode() {
    const editorDom = this.cherry.editor?.options?.editorDom;
    const editor = this.cherry.editor?.editor;

    if (!editorDom || !editor) {
      return false;
    }

    if (editorDom.classList.contains('cherry-editor--hidden')) {
      return false;
    }

    return !editor.getOption('readOnly');
  }

  /**
   * 订阅 Cherry 全局事件：语言切换、文档变更、工具栏隐藏、预览侧栏折叠
   */
  bindEvents() {
    if (!this.cherry.$event) {
      return;
    }

    const { Events } = this.cherry.$event;
    this.cherry.$event.on(Events.afterChangeLocale, this.handleLocaleChange);
    this.cherry.$event.on(Events.afterChange, this.handleDocumentChange);
    this.cherry.$event.on('toolbarHide', this.handleToolbarHide);
    this.cherry.$event.on('togglePreviewHidden', this.handlePreviewHidden);
  }

  /**
   * 打开/关闭搜索面板（由工具栏按钮或快捷键调用）
   *
   * - `aliasName` 为空或 `'search'`：Mod+F，打开搜索；面板已打开时再次触发则关闭
   * - `aliasName` 为 `'replace'`：Mod+H，打开并展开替换行；面板已打开时仅展开替换
   *
   * @param {string} [selection=''] 预填搜索词，通常传编辑器选中文本
   * @param {string} [aliasName=''] 快捷键别名，`'replace'` 表示替换模式
   */
  handleTrigger(selection = '', aliasName = '') {
    if (!this.isEditableMode()) {
      return;
    }

    const expandReplace = aliasName === 'replace';

    if (this.panel.isVisible()) {
      if (expandReplace) {
        this.panel.setReplaceExpanded(true);
        this.panel.replaceInput?.focus();
        this.panel.replaceInput?.select();
      } else {
        this.panel.hide();
      }
      return;
    }

    const selectedText = selection || this.panel.editorAdapter.getSelectedText();
    this.panel.show(selectedText, { expandReplace });
  }

  /**
   * 预览侧栏隐藏时，为搜索面板增加右侧偏移，避免被遮挡
   * @param {boolean} state 预览侧栏是否隐藏
   */
  handlePreviewHidden(state) {
    this.panel.dom.classList.toggle('is-preview-sidebar-offset', Boolean(state));
  }

  /**
   * 文档内容变更后，若面板打开且有搜索词，则防抖刷新匹配结果
   */
  handleDocumentChange() {
    if (!this.panel.isVisible() || !this.panel.state.query) {
      return;
    }

    this.panel.scheduleSearch(true);
  }

  /**
   * 切换界面语言后，同步面板 placeholder / title 等文案
   */
  handleLocaleChange() {
    this.panel.updateLocaleStrings(this.cherry.locale);
  }

  /**
   * 顶部工具栏收起时关闭搜索面板
   */
  handleToolbarHide() {
    this.panel.hide();
  }

  /**
   * 销毁桥接层：解绑事件并移除面板 DOM
   */
  destroy() {
    if (this.cherry.$event) {
      const { Events } = this.cherry.$event;
      this.cherry.$event.off(Events.afterChangeLocale, this.handleLocaleChange);
      this.cherry.$event.off(Events.afterChange, this.handleDocumentChange);
      this.cherry.$event.off('toolbarHide', this.handleToolbarHide);
      this.cherry.$event.off('togglePreviewHidden', this.handlePreviewHidden);
    }

    this.panel.destroy();
  }
}

/**
 * 获取已注册的搜索桥接层
 * @param {SearcherCherryHost} cherry Cherry / CherryStream 实例
 * @returns {SearcherBridge | undefined}
 */
export function getSearcherBridge(cherry) {
  return bridges.get(cherry);
}

/**
 * 触发搜索面板（供 `Search` hook 的 onClick / 快捷键调用）
 *
 * @param {SearcherCherryHost} cherry Cherry / CherryStream 实例
 * @param {string} [selection=''] 预填搜索词
 * @param {string} [aliasName=''] 快捷键别名，`'replace'` 展开替换行
 */
export function triggerSearcher(cherry, selection = '', aliasName = '') {
  bridges.get(cherry)?.handleTrigger(selection, aliasName);
}

/**
 * 初始化搜索桥接层
 *
 * 在 Cherry `afterInit` 中调用。若 toolbars 未配置 `'search'` 或已初始化则跳过。
 *
 * @param {SearcherCherryHost} cherry Cherry / CherryStream 实例
 */
export function initSearcherBridge(cherry) {
  if (!isSearcherToolbarEnabled(cherry.options?.toolbars) || bridges.has(cherry)) {
    return;
  }

  bridges.set(cherry, new SearcherBridge(cherry));
}

/**
 * 销毁搜索桥接层
 *
 * 在 Cherry `destroy` 时调用，释放事件监听与面板 DOM。
 *
 * @param {SearcherCherryHost} cherry Cherry / CherryStream 实例
 */
export function destroySearcherBridge(cherry) {
  bridges.get(cherry)?.destroy();
  bridges.delete(cherry);
}
