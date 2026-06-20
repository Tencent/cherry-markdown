/**
 * Cherry Markdown 搜索插件（usePlugin 集成，无 toolbar）
 */
import SearcherPanel, { mergeOptions } from '@cherry-markdown/plugin-searcher';
import { getAllowedShortcutKey, getKeyCode, getPlatformControlKey, keyStack2UniqueString } from '@/utils/shortcutKey';

/**
 * 将 Cherry.locale 映射为 Searcher 文案（Cherry 适配层）
 * @param {import('../../types/addons/cherry-searcher-plugin').SearcherCherryHost} cherry
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
 * 合并 Cherry 宿主语言与 usePlugin 配置
 * @param {import('../../types/addons/cherry-searcher-plugin').SearcherCherryHost} cherry
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
 * @param {import('../../types/addons/cherry-searcher-plugin').SearcherCherryHost} cherry
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

class SearcherCherryBridge {
  /**
   * @param {import('../../types/addons/cherry-searcher-plugin').SearcherCherryHost} cherry
   * @param {import('@cherry-markdown/plugin-searcher').SearcherOptions} userOptions
   */
  constructor(cherry, userOptions) {
    this.cherry = cherry;
    this.userOptions = userOptions;
    this.options = buildSearcherOptions(cherry, userOptions);
    this.shortcutKeys = {
      toggle: `${getPlatformControlKey()}-${getKeyCode('f')}`,
      openReplace: `${getPlatformControlKey()}-${getKeyCode('h')}`,
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleLocaleChange = this.handleLocaleChange.bind(this);
    this.handleToolbarHide = this.handleToolbarHide.bind(this);
    this.handleDocumentChange = this.handleDocumentChange.bind(this);

    const mountTarget = cherry.editor?.options?.wrapperDom || cherry.wrapperDom || document.body;

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

  /** 获取面板锚点矩形（键盘触发时用编辑区范围，供右上角定位） */
  getAnchorRect() {
    const editorDom = this.cherry.editor?.options?.editorDom;
    if (editorDom) {
      return editorDom.getBoundingClientRect();
    }
    return { left: 16, top: 16, width: 0, height: 0 };
  }

  bindEvents() {
    const editorDom = this.cherry.editor?.options?.editorDom;
    if (editorDom) {
      editorDom.addEventListener('keydown', this.handleKeyDown);
    }

    if (this.cherry.$event) {
      const { Events } = this.cherry.$event;
      this.cherry.$event.on(Events.afterChangeLocale, this.handleLocaleChange);
      this.cherry.$event.on(Events.afterChange, this.handleDocumentChange);
      this.cherry.$event.on('toolbarHide', this.handleToolbarHide);
    }
  }

  /** 文档变更且面板可见时，保持匹配结果与高亮同步 */
  handleDocumentChange() {
    if (!this.panel.isVisible() || !this.panel.state.query) {
      return;
    }

    this.panel.runSearch(true);
  }

  handleLocaleChange() {
    this.options = buildSearcherOptions(this.cherry, this.userOptions);
    this.panel.options = this.options;
    this.panel.updateLocaleStrings();
  }

  handleToolbarHide() {
    this.panel.hide();
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    if (!this.isEditableMode()) {
      return;
    }

    const shortcutKey = keyStack2UniqueString(getAllowedShortcutKey(event));

    if (shortcutKey === this.shortcutKeys.toggle) {
      event.preventDefault();
      this.togglePanel();
      return;
    }

    if (this.options.enableReplace !== false && shortcutKey === this.shortcutKeys.openReplace) {
      event.preventDefault();
      this.openReplacePanel();
    }
  }

  togglePanel() {
    if (this.panel.isVisible()) {
      this.panel.hide();
      return;
    }

    const selection = this.panel.editorAdapter.getSelectedText();
    this.panel.show(this.getAnchorRect(), selection, {
      expandReplace: this.options.expandReplaceOnOpen === true,
    });
  }

  openReplacePanel() {
    if (this.panel.isVisible()) {
      this.panel.setReplaceExpanded(true);
      this.panel.replaceInput?.focus();
      this.panel.replaceInput?.select();
      return;
    }

    const selection = this.panel.editorAdapter.getSelectedText();
    this.panel.show(this.getAnchorRect(), selection, { expandReplace: true });
  }

  destroy() {
    const editorDom = this.cherry.editor?.options?.editorDom;
    editorDom?.removeEventListener('keydown', this.handleKeyDown);

    if (this.cherry.$event) {
      const { Events } = this.cherry.$event;
      this.cherry.$event.off(Events.afterChangeLocale, this.handleLocaleChange);
      this.cherry.$event.off(Events.afterChange, this.handleDocumentChange);
      this.cherry.$event.off('toolbarHide', this.handleToolbarHide);
    }

    this.panel.destroy();
  }
}

export default class SearcherCherryPlugin {
  /** @type {import('@cherry-markdown/plugin-searcher').SearcherOptions} */
  static mergedOptions = {};

  /**
   * @param {Record<string, unknown>} _cherryDefaults
   * @param {import('@cherry-markdown/plugin-searcher').SearcherOptions} [userOptions]
   */
  static install(_cherryDefaults, userOptions = {}) {
    SearcherCherryPlugin.mergedOptions = mergeOptions(userOptions);
  }

  /**
   * @param {import('../../types/addons/cherry-searcher-plugin').SearcherCherryHost} cherry
   */
  static onCherryInit(cherry) {
    cherry.searcherBridge = new SearcherCherryBridge(cherry, SearcherCherryPlugin.mergedOptions);
  }

  /**
   * @param {import('../../types/addons/cherry-searcher-plugin').SearcherCherryHost} cherry
   */
  static onCherryDestroy(cherry) {
    cherry.searcherBridge?.destroy();
    delete cherry.searcherBridge;
  }
}
