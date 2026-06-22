/**
 * Cherry Markdown 搜索插件（usePlugin 集成；工具栏按钮见 toolbars/hooks/Searcher.js）
 */
import SearcherPanel, { mergeOptions } from '@cherry-markdown/plugin-searcher';
import {
  getSearcherBridge,
  registerSearcherBridge,
  triggerSearcher,
  unregisterSearcherBridge,
} from './searcher-runtime.js';

export { getSearcherBridge, triggerSearcher };

/**
 * Searcher 插件初始化后的 Cherry 宿主形态
 * @typedef {Object} SearcherCherryHost
 * @property {Record<string, string | undefined>} [locale] Cherry 文案
 * @property {{ locale?: string, toolbars?: import('../../types/cherry').CherryToolbarsOptions }} [options] Cherry 配置
 * @property {Object} [editor] 编辑器包装
 * @property {HTMLElement} [wrapperDom] 外层容器
 * @property {Object} [$event] Cherry 事件总线
 * @property {{ name?: string, icon?: string }} [$currentMenuOptions] 工具栏 hook 构造用（单测）
 */

/**
 * 将 Cherry.locale 映射为 Searcher 文案
 * @param {SearcherCherryHost} cherry
 * @returns {import('@cherry-markdown/plugin-searcher').SearcherLocale}
 */
function mapCherryLocale(cherry) {
  const host = cherry.locale || {};
  /** @type {Record<string, string | undefined>} */
  const mapped = {
    searchFor: host.searchFor,
    close: host.close,
    caseSensitiveSearch: host.caseSensitiveSearch,
    wholeWordSearch: host.wholeWordSearch,
    previousMatch: host.previousMatch,
    nextMatch: host.nextMatch,
    replace: host.replace,
    replaceWith: host.replaceWith,
    replaceAll: host.replaceAll,
    toggleReplace: host.toggleReplace,
  };

  return Object.fromEntries(Object.entries(mapped).filter(([, value]) => value !== undefined));
}

/**
 * 合并 usePlugin 参数与实例 toolbars.config.searcher（后者优先）
 * @param {SearcherCherryHost} cherry
 * @param {import('@cherry-markdown/plugin-searcher').SearcherOptions} [initOptions]
 * @returns {import('@cherry-markdown/plugin-searcher').SearcherOptions}
 */
function resolvePluginUserOptions(cherry, initOptions = {}) {
  return mergeOptions({
    ...initOptions,
    ...cherry.options?.toolbars?.config?.searcher,
  });
}

/**
 * 合并 Cherry 宿主语言与 Searcher 配置
 * @param {SearcherCherryHost} cherry
 * @param {import('@cherry-markdown/plugin-searcher').SearcherOptions} userOptions
 */
function buildSearcherOptions(cherry, userOptions) {
  const cherryLocaleId = cherry.options?.locale;
  const localeId =
    userOptions.localeId ?? (cherryLocaleId === 'zh_CN' || cherryLocaleId === 'en_US' ? cherryLocaleId : undefined);

  return mergeOptions({
    ...userOptions,
    ...(localeId ? { localeId } : {}),
    locale: {
      ...mapCherryLocale(cherry),
      ...userOptions.locale,
    },
  });
}

/**
 * @param {SearcherCherryHost} cherry
 * @returns {import('@cherry-markdown/plugin-searcher').EditorAdapter}
 */
function createCherryEditorAdapter(cherry) {
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
 * Cherry 与 SearcherPanel 之间的桥接：挂载面板、同步配置与 Cherry 事件
 * @internal 仅插件内部使用，不挂到 Cherry 实例上
 */
class SearcherCherryBridge {
  /**
   * @param {SearcherCherryHost} cherry
   * @param {import('@cherry-markdown/plugin-searcher').SearcherOptions} userOptions
   */
  constructor(cherry, userOptions) {
    this.cherry = cherry;
    this.options = buildSearcherOptions(cherry, userOptions);

    this.handleLocaleChange = this.handleLocaleChange.bind(this);
    this.handleToolbarHide = this.handleToolbarHide.bind(this);
    this.handleDocumentChange = this.handleDocumentChange.bind(this);
    this.handlePreviewHidden = this.handlePreviewHidden.bind(this);

    const editorDom = cherry.editor?.options?.editorDom;
    const mountTarget = editorDom || cherry.editor?.options?.wrapperDom || cherry.wrapperDom || document.body;

    this.panel = new SearcherPanel({
      editorAdapter: createCherryEditorAdapter(cherry),
      options: this.options,
      mountTarget,
    });

    this.bindEvents();
  }

  /** 是否处于可编辑模式 */
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
   * 响应工具栏点击或快捷键（统一入口）
   * @param {string} [selection] 工具栏传入的选中文本
   * @param {string} [aliasName] 快捷键别名，`searcher-replace` 表示展开替换
   */
  handleTrigger(selection = '', aliasName = '') {
    if (!this.isEditableMode()) {
      return;
    }

    const expandReplace = aliasName === 'searcher-replace';

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
    this.panel.show(undefined, selectedText, {
      expandReplace: expandReplace || this.options.expandReplaceOnOpen === true,
    });
  }

  /** 预览区隐藏、侧边栏露出时右移搜索框，避免被遮挡 */
  handlePreviewHidden(state) {
    this.panel.dom.classList.toggle('is-preview-sidebar-offset', Boolean(state));
  }

  /** 文档变更且面板可见时，防抖刷新匹配结果与高亮 */
  handleDocumentChange() {
    if (!this.panel.isVisible() || !this.panel.state.query) {
      return;
    }

    this.panel.scheduleSearch(true);
  }

  /** Cherry 切换语言后同步面板文案 */
  handleLocaleChange() {
    this.options = buildSearcherOptions(this.cherry, resolvePluginUserOptions(this.cherry));
    this.panel.options = this.options;
    this.panel.updateLocaleStrings();
  }

  /** 工具栏收起时关闭搜索面板 */
  handleToolbarHide() {
    this.panel.hide();
  }

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

export default class SearcherCherryPlugin {
  /**
   * @param {{ toolbars?: import('../../types/cherry').CherryToolbarsOptions }} cherryDefaults
   * @param {import('@cherry-markdown/plugin-searcher').SearcherOptions} [userOptions]
   */
  static install(cherryDefaults, userOptions = {}) {
    const mergedOptions = mergeOptions(userOptions);

    cherryDefaults.toolbars = cherryDefaults.toolbars || {};
    cherryDefaults.toolbars.config = {
      ...(cherryDefaults.toolbars.config || {}),
      searcher: mergedOptions,
    };
  }

  /**
   * @param {SearcherCherryHost} cherry
   * @param {import('@cherry-markdown/plugin-searcher').SearcherOptions} [userOptions]
   */
  static onCherryInit(cherry, userOptions = {}) {
    registerSearcherBridge(cherry, new SearcherCherryBridge(cherry, resolvePluginUserOptions(cherry, userOptions)));
  }

  /**
   * @param {SearcherCherryHost} cherry
   */
  static onCherryDestroy(cherry) {
    getSearcherBridge(cherry)?.destroy();
    unregisterSearcherBridge(cherry);
  }
}
