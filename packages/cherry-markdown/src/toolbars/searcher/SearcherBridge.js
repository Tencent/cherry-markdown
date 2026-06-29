/**
 * Cherry 内置搜索：桥接层
 *
 * 配置在 Cherry 初始化时生效（`toolbars.config.searcher`），见 {@link resolveSearcherConfig}。
 * 任一 toolbars 列表含 `'search'` 时，在 `afterInit` 调用 {@link initSearcherBridge}。
 *
 * @module toolbars/searcher/SearcherBridge
 */
import SearcherPanel from './SearcherPanel';
import { getSearcherToolbarConfig, pickSearcherLocale, resolveSearcherConfig } from './config';
import { createEditorAdapter, getSearchHook, isSearcherToolbarEnabled } from './bridge-utils';

export {
  getSearcherToolbarConfig,
  isSearcherReplaceEnabled,
  pickSearcherLocale,
  resolveSearcherConfig,
} from './config';

/** @typedef {import('./bridge-utils').SearcherCherryHost} SearcherCherryHost */
/** @typedef {import('./config').SearcherConfig} SearcherConfig */

/** @type {WeakMap<SearcherCherryHost, SearcherBridge>} */
const bridges = new WeakMap();

export default class SearcherBridge {
  /**
   * @param {SearcherCherryHost} cherry
   */
  constructor(cherry) {
    this.cherry = cherry;
    /** @type {SearcherConfig} 初始化时解析，运行期不随 options 变更 */
    this.config = resolveSearcherConfig(getSearcherToolbarConfig(cherry));

    this.handleLocaleChange = this.handleLocaleChange.bind(this);
    this.handleToolbarHide = this.handleToolbarHide.bind(this);
    this.handleDocumentChange = this.handleDocumentChange.bind(this);
    this.handlePreviewHidden = this.handlePreviewHidden.bind(this);

    const editorDom = cherry.editor?.options?.editorDom;
    const mountTarget = editorDom || cherry.editor?.options?.wrapperDom || cherry.wrapperDom;

    this.panel = new SearcherPanel({
      editorAdapter: createEditorAdapter(cherry),
      locale: pickSearcherLocale(cherry.locale),
      enableReplace: this.config.enableReplace,
      mountTarget,
      onVisibilityChange: (visible) => this.syncToolbarActive(visible),
    });

    this.bindEvents();
  }

  /** 编辑区可见时允许搜索（只读模式仍可使用查找） */
  isSearchAvailable() {
    const editorDom = this.cherry.editor?.options?.editorDom;
    const editor = this.cherry.editor?.editor;
    if (!editorDom || !editor) {
      return false;
    }
    return !editorDom.classList.contains('cherry-editor--hidden');
  }

  syncToolbarActive(active) {
    getSearchHook(this.cherry)?.setToolbarActive?.(active);
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
   * Mod+F / 搜索按钮：打开或关闭；Mod+H：打开并展开替换行（需 enableReplace）
   *
   * @param {string} [selection='']
   * @param {string} [aliasName=''] `'replace'` 为替换模式
   */
  handleTrigger(selection = '', aliasName = '') {
    if (!this.isSearchAvailable()) {
      return;
    }

    const { enableReplace, expandReplaceOnOpen } = this.config;
    const expandReplace = aliasName === 'replace' && enableReplace;

    if (this.panel.isVisible()) {
      if (expandReplace) {
        this.panel.setReplaceExpanded(true);
        this.panel.focusPanelInput({ selectAll: true, replace: true });
      } else {
        this.panel.hide();
      }
      return;
    }

    const selectedText = selection || this.panel.editorAdapter.getSelectedText();
    const shouldExpandReplace = (expandReplace || expandReplaceOnOpen) && enableReplace;

    this.panel.show(selectedText, {
      expandReplace: shouldExpandReplace,
      selectAll: Boolean(selectedText),
    });
  }

  handlePreviewHidden(state) {
    this.panel.dom.classList.toggle('is-preview-sidebar-offset', Boolean(state));
  }

  handleDocumentChange() {
    if (!this.panel.state.query) {
      return;
    }

    if (this.panel.isVisible()) {
      this.panel.scheduleSearch(true);
      return;
    }

    this.panel.syncMatches(true, false);
  }

  handleLocaleChange() {
    this.panel.updateLocaleStrings(this.cherry.locale);
    getSearchHook(this.cherry)?.syncToolbarLabel?.();
  }

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

/** @param {SearcherCherryHost} cherry */
export function getSearcherBridge(cherry) {
  return bridges.get(cherry);
}

/** @param {SearcherCherryHost} cherry */
export function closeSearcherPanel(cherry) {
  bridges.get(cherry)?.panel?.hide();
}

/** @param {SearcherCherryHost} cherry @param {string} [selection] @param {string} [aliasName] */
export function triggerSearcher(cherry, selection = '', aliasName = '') {
  bridges.get(cherry)?.handleTrigger(selection, aliasName);
}

/** @param {SearcherCherryHost} cherry */
export function initSearcherBridge(cherry) {
  if (!isSearcherToolbarEnabled(cherry.options?.toolbars) || bridges.has(cherry)) {
    return;
  }

  bridges.set(cherry, new SearcherBridge(cherry));
}

/** @param {SearcherCherryHost} cherry */
export function destroySearcherBridge(cherry) {
  bridges.get(cherry)?.destroy();
  bridges.delete(cherry);
}
