/**
 * Cherry 内置搜索/替换面板
 *
 * 挂载在编辑区右上角，提供查找、高亮、导航与替换能力。
 * 由 {@link SearcherBridge} 创建，不对外单独暴露；文案来自 Cherry 全局 `locale`。
 *
 * @module toolbars/searcher/SearcherPanel
 */
import { buildSearchRegex, collectMatches, findMatches, findNearestMatchIndex } from './search-utils.js';
import { pickSearcherLocale } from './config.js';
import { applyReplaceExpandedDomState, buildSearcherPanelHtml } from './panel-dom.js';

/** 输入防抖间隔（毫秒） */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * 面板构造参数
 * @typedef {object} SearcherPanelParams
 * @property {SearcherEditorAdapter} editorAdapter 编辑器读写适配器
 * @property {Record<string, string | undefined>} [locale] Cherry 全局 locale，面板通过 pickSearcherLocale 提取文案
 * @property {boolean} [enableReplace=true] 是否展示替换行
 * @property {ParentNode | null} [mountTarget] 面板挂载节点，通常为 `.cherry-editor`
 * @property {(visible: boolean) => void} [onVisibilityChange] 面板显隐回调，用于同步工具栏按钮激活态
 */

/** @typedef {import('./bridge-utils').SearcherEditorAdapter} SearcherEditorAdapter */

/**
 * 面板显示选项
 * @typedef {object} SearcherShowOptions
 * @property {boolean} [expandReplace] 为 true 时打开面板同时展开替换行（Mod+H）
 * @property {boolean} [selectAll] 为 true 时聚焦输入框并全选内容（首次带选中文本打开）
 */

/**
 * 搜索运行时状态
 * @typedef {object} SearcherPanelState
 * @property {string} query 当前搜索关键词
 * @property {boolean} caseSensitive 是否区分大小写
 * @property {boolean} wholeWord 是否全字匹配
 * @property {boolean} useRegex 是否按正则表达式解析搜索词
 * @property {Array<{ from: number; to: number }>} matches 文档中全部匹配区间
 * @property {number} activeMatchIndex 当前高亮匹配项在 matches 中的下标，无匹配时为 -1
 */

/**
 * 查询必需的 DOM 节点并断言类型
 * @template {Element} T
 * @param {ParentNode} root
 * @param {string} selector
 * @returns {T}
 */
function queryRequired(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`SearcherPanel: missing element "${selector}"`);
  }
  return /** @type {T} */ (element);
}

/**
 * 查询可选 DOM 节点
 * @template {Element} T
 * @param {ParentNode} root
 * @param {string} selector
 * @returns {T | null}
 */
function queryOptional(root, selector) {
  return /** @type {T | null} */ (root.querySelector(selector));
}

/**
 * 搜索/替换面板
 *
 * 搜索行：输入框、匹配选项、计数与导航。
 * 替换行：可折叠，由 `enableReplace` 控制；只读时禁用替换操作。
 */
export default class SearcherPanel {
  /** @type {SearcherEditorAdapter} 编辑器适配器 */
  editorAdapter;

  /** @type {Record<string, string>} 面板文案，字段见 locale.js 的 SEARCHER_LOCALE_KEYS */
  locale;

  /** @type {HTMLElement} 面板根节点，类名 `cherry-searcher` */
  dom;

  /** @type {HTMLInputElement} */
  input;

  /** @type {HTMLButtonElement | null} */
  expandButton;

  /** @type {HTMLButtonElement} */
  clearButton;

  /** @type {HTMLButtonElement} */
  caseToggle;

  /** @type {HTMLButtonElement} */
  wholeWordToggle;

  /** @type {HTMLButtonElement} */
  regexToggle;

  /** @type {HTMLElement} */
  counter;

  /** @type {HTMLButtonElement} */
  prevButton;

  /** @type {HTMLButtonElement} */
  nextButton;

  /** @type {HTMLElement | null} */
  replaceRow;

  /** @type {HTMLInputElement | null} */
  replaceInput;

  /** @type {HTMLButtonElement | null} */
  replaceClearButton;

  /** @type {HTMLButtonElement | null} */
  replaceButton;

  /** @type {HTMLButtonElement | null} */
  replaceAllButton;

  /**
   * 创建搜索面板并挂载到编辑区
   *
   * @param {SearcherPanelParams} params 构造参数
   */
  constructor(params) {
    const {
      editorAdapter,
      locale = {},
      enableReplace = true,
      mountTarget = typeof document !== 'undefined' ? document.body : null,
      onVisibilityChange,
    } = params;

    this.editorAdapter = editorAdapter;
    this.locale = pickSearcherLocale(locale);
    this.enableReplace = enableReplace;
    this.onVisibilityChange = onVisibilityChange;
    this.replaceExpanded = false;

    /** @type {SearcherPanelState} 搜索匹配与高亮状态 */
    this.state = {
      query: '',
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
      matches: [],
      activeMatchIndex: -1,
    };

    /** @type {ReturnType<typeof setTimeout> | null} */
    this.searchTimer = null;
    /** @type {boolean} */
    this.pendingKeepActiveIndex = false;

    this.handlePanelShortcutKey = this.handlePanelShortcutKey.bind(this);

    this.dom = this.createDOM();
    this.cacheElements();
    this.bindEvents();
    this.updateLocaleStrings();
    this.updateReplaceButtonState();
    this.dom.style.display = 'none';

    if (mountTarget) {
      mountTarget.appendChild(this.dom);
    }
  }

  /**
   * 面板是否可见
   * @returns {boolean}
   */
  isVisible() {
    return this.dom.style.display !== 'none';
  }

  /**
   * 显示搜索面板
   *
   * @param {string} [selection=''] 预填搜索词；有值时立即执行搜索
   * @param {SearcherShowOptions} [showOptions] 显示选项，`expandReplace` 为 true 时展开替换行
   */
  show(selection = '', showOptions = {}) {
    const { expandReplace = false, selectAll = Boolean(selection) } = showOptions;

    this.dom.style.display = '';

    if (expandReplace) {
      this.setReplaceExpanded(true);
    }

    if (selection) {
      this.setQuery(selection, false);
    } else if (this.state.query) {
      this.syncMatches(true, true);
    }

    this.focusPanelInput({ selectAll, replace: this.replaceExpanded });
    this.updateReplaceButtonState();
    this.onVisibilityChange?.(true);
  }

  /**
   * 隐藏搜索面板，清除编辑器高亮并将焦点交还编辑器
   */
  hide() {
    this.clearHighlight();
    this.dom.style.display = 'none';
    this.editorAdapter.focus();
    this.onVisibilityChange?.(false);
  }

  /**
   * 聚焦搜索或替换输入框
   * @param {{ selectAll?: boolean; replace?: boolean }} [options]
   */
  focusPanelInput(options = {}) {
    const { selectAll = false, replace = false } = options;
    const input = replace && this.replaceInput ? this.replaceInput : this.input;

    input.focus();
    if (selectAll) {
      input.select();
      return;
    }

    const end = input.value.length;
    input.setSelectionRange(end, end);
  }

  /**
   * Esc：先清空当前输入框内容，再次 Esc 关闭面板
   * @param {HTMLInputElement} inputEl
   */
  handleEscapeKey(inputEl) {
    if (inputEl === this.replaceInput && this.replaceInput?.value) {
      this.clearReplaceText();
      return;
    }

    if (this.state.query) {
      this.clearQuery();
      this.input.focus();
      return;
    }

    this.hide();
  }

  /**
   * 销毁面板：取消定时器、清除高亮、移除 DOM
   */
  destroy() {
    this.cancelScheduledSearch();
    this.clearHighlight();
    if (this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
  }

  /**
   * 面板内拦截 Mod+F / Mod+H，避免唤起浏览器查找并支持再次 Mod+F 关闭
   * @param {KeyboardEvent} event
   */
  handlePanelShortcutKey(event) {
    if (!this.isVisible()) {
      return;
    }

    const mod = event.ctrlKey || event.metaKey;
    if (!mod) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'f') {
      event.preventDefault();
      event.stopPropagation();
      this.hide();
      return;
    }

    if (key === 'h' && this.enableReplace) {
      event.preventDefault();
      event.stopPropagation();
      this.setReplaceExpanded(true);
      this.replaceInput?.focus();
      this.replaceInput?.select();
    }
  }

  /**
   * 构建面板 DOM 结构（搜索行 + 可折叠替换行）
   *
   * @returns {HTMLElement} 面板根元素
   */
  createDOM() {
    const container = document.createElement('div');
    container.className = 'cherry-searcher';
    container.innerHTML = buildSearcherPanelHtml(this.enableReplace);
    applyReplaceExpandedDomState(container, this.replaceExpanded);
    return container;
  }

  /** 缓存模板中的输入框、按钮等交互元素引用 */
  cacheElements() {
    this.expandButton = /** @type {HTMLButtonElement | null} */ (
      queryOptional(this.dom, '.cherry-searcher__expand-btn')
    );
    this.input = /** @type {HTMLInputElement} */ (queryRequired(this.dom, '.cherry-searcher__input'));
    this.clearButton = /** @type {HTMLButtonElement} */ (queryRequired(this.dom, '.cherry-searcher__clear'));
    this.caseToggle = /** @type {HTMLButtonElement} */ (queryRequired(this.dom, '[data-type="caseSensitive"]'));
    this.wholeWordToggle = /** @type {HTMLButtonElement} */ (queryRequired(this.dom, '[data-type="wholeWord"]'));
    this.regexToggle = /** @type {HTMLButtonElement} */ (queryRequired(this.dom, '[data-type="useRegex"]'));
    this.counter = queryRequired(this.dom, '.cherry-searcher__counter');
    this.prevButton = /** @type {HTMLButtonElement} */ (queryRequired(this.dom, '[data-direction="prev"]'));
    this.nextButton = /** @type {HTMLButtonElement} */ (queryRequired(this.dom, '[data-direction="next"]'));
    this.replaceRow = queryOptional(this.dom, '.cherry-searcher__replace-row');
    this.replaceInput = /** @type {HTMLInputElement | null} */ (
      queryOptional(this.dom, '.cherry-searcher__replace-input')
    );
    this.replaceClearButton = /** @type {HTMLButtonElement | null} */ (
      queryOptional(this.dom, '.cherry-searcher__replace-clear')
    );
    this.replaceButton = /** @type {HTMLButtonElement | null} */ (queryOptional(this.dom, '[data-action="replace"]'));
    this.replaceAllButton = /** @type {HTMLButtonElement | null} */ (
      queryOptional(this.dom, '[data-action="replaceAll"]')
    );
  }

  /** 绑定替换区事件（仅 enableReplace 为 true 时在构造阶段调用一次） */
  bindReplaceEvents() {
    this.replaceInput?.addEventListener('input', () => {
      this.updateReplaceClearVisibility();
      this.updateReplaceButtonState();
    });

    this.replaceInput?.addEventListener('keydown', (event) => {
      const keyboardEvent = /** @type {KeyboardEvent} */ (event);
      if (keyboardEvent.key === 'Enter') {
        keyboardEvent.preventDefault();
        if (keyboardEvent.shiftKey) {
          this.replaceCurrent(true);
        } else {
          this.replaceCurrent();
        }
      } else if (keyboardEvent.key === 'Escape') {
        keyboardEvent.preventDefault();
        this.handleEscapeKey(this.replaceInput);
      }
    });

    this.expandButton?.addEventListener('click', () => {
      this.setReplaceExpanded(!this.replaceExpanded);
      if (this.replaceExpanded) {
        this.replaceInput?.focus();
      } else {
        this.input.focus();
      }
    });

    this.replaceButton?.addEventListener('click', () => {
      this.replaceCurrent();
    });

    this.replaceAllButton?.addEventListener('click', () => {
      this.replaceAll();
    });

    this.replaceClearButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.clearReplaceText();
    });
  }

  /** 绑定输入、键盘、导航、替换等交互事件 */
  bindEvents() {
    this.input.addEventListener('input', () => {
      this.setQuery(this.input.value, true, false);
    });

    this.input.addEventListener('keydown', (event) => {
      const keyboardEvent = /** @type {KeyboardEvent} */ (event);
      if (keyboardEvent.key === 'Enter') {
        keyboardEvent.preventDefault();
        this.flushScheduledSearch(true);
        if (this.state.matches.length > 0) {
          this.navigate(keyboardEvent.shiftKey ? 'prev' : 'next');
        }
      } else if (keyboardEvent.key === 'Escape') {
        keyboardEvent.preventDefault();
        this.handleEscapeKey(this.input);
      }
    });

    if (this.replaceInput) {
      this.bindReplaceEvents();
    }

    this.clearButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.clearQuery();
    });

    this.caseToggle.addEventListener('click', () => {
      this.state.caseSensitive = !this.state.caseSensitive;
      this.caseToggle.setAttribute('aria-pressed', String(this.state.caseSensitive));
      this.caseToggle.classList.toggle('is-active', this.state.caseSensitive);
      this.runSearch();
    });

    this.wholeWordToggle.addEventListener('click', () => {
      this.state.wholeWord = !this.state.wholeWord;
      this.wholeWordToggle.setAttribute('aria-pressed', String(this.state.wholeWord));
      this.wholeWordToggle.classList.toggle('is-active', this.state.wholeWord);
      this.runSearch();
    });

    this.regexToggle.addEventListener('click', () => {
      this.state.useRegex = !this.state.useRegex;
      this.regexToggle.setAttribute('aria-pressed', String(this.state.useRegex));
      this.regexToggle.classList.toggle('is-active', this.state.useRegex);
      this.runSearch();
    });

    this.prevButton.addEventListener('click', () => {
      this.navigate('prev');
    });

    this.nextButton.addEventListener('click', () => {
      this.navigate('next');
    });

    this.dom.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    this.dom.addEventListener('keydown', this.handlePanelShortcutKey, true);
  }

  /**
   * 设置搜索词并触发搜索
   *
   * @param {string} query 搜索关键词
   * @param {boolean} [keepCurrentIndex=false] 为 true 时尽量保持当前匹配序号（文档变更刷新用）
   * @param {boolean} [immediate=true] 为 false 时对输入防抖，减少连续键入时的计算
   */
  setQuery(query, keepCurrentIndex = false, immediate = true) {
    this.state.query = query;
    this.input.value = query;
    this.clearButton.classList.toggle('is-visible', query.length > 0);

    if (!query || immediate) {
      this.runSearch(keepCurrentIndex);
    } else {
      this.scheduleSearch(keepCurrentIndex);
    }
  }

  /** 清空搜索词并重新聚焦搜索输入框 */
  clearQuery() {
    this.setQuery('');
    this.input.focus();
  }

  /** 清空替换为输入框 */
  clearReplaceText() {
    if (!this.replaceInput) {
      return;
    }

    this.replaceInput.value = '';
    this.updateReplaceClearVisibility();
    this.updateReplaceButtonState();
    this.replaceInput.focus();
  }

  /** 同步替换输入框清空按钮可见性 */
  updateReplaceClearVisibility() {
    if (!this.replaceClearButton || !this.replaceInput) {
      return;
    }

    this.replaceClearButton.classList.toggle('is-visible', this.replaceInput.value.length > 0);
  }

  /**
   * 防抖调度搜索（输入或文档变更时使用）
   * @param {boolean} [keepActiveIndex=false]
   */
  scheduleSearch(keepActiveIndex = false) {
    this.pendingKeepActiveIndex = keepActiveIndex;
    this.cancelScheduledSearch();
    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.runSearch(this.pendingKeepActiveIndex);
    }, SEARCH_DEBOUNCE_MS);
  }

  /** 取消待执行的防抖搜索 */
  cancelScheduledSearch() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  /**
   * 立即执行待定的防抖搜索
   * @param {boolean} [keepActiveIndex=true]
   */
  flushScheduledSearch(keepActiveIndex = true) {
    if (!this.searchTimer) {
      return;
    }

    this.cancelScheduledSearch();
    this.runSearch(keepActiveIndex);
  }

  /**
   * 同步匹配结果；面板隐藏时仅更新 state，不写入编辑器高亮
   *
   * @param {boolean} [keepActiveIndex=false]
   * @param {boolean} [applyToEditor=true]
   */
  syncMatches(keepActiveIndex = false, applyToEditor = true) {
    if (!this.editorAdapter) {
      return;
    }

    this.cancelScheduledSearch();

    const text = this.editorAdapter.getDocString();
    const { query, caseSensitive, wholeWord, useRegex } = this.state;
    const regex = buildSearchRegex(query, caseSensitive, wholeWord, useRegex);
    const matches = regex ? collectMatches(text, regex) : [];

    this.state.matches = matches;

    if (!query) {
      this.state.activeMatchIndex = -1;
      if (applyToEditor) {
        this.clearHighlight();
      }
      this.updateCounter();
      return;
    }

    if (!(keepActiveIndex && this.state.activeMatchIndex >= 0 && this.state.activeMatchIndex < matches.length)) {
      const cursorPos = this.editorAdapter.getCursorHead();
      this.state.activeMatchIndex = findNearestMatchIndex(matches, cursorPos);
    }

    if (applyToEditor) {
      this.applyHighlight(regex);
      this.focusCurrentMatch();
    }

    this.updateCounter();
  }

  /**
   * 执行搜索：收集匹配、定位最近项、高亮并更新计数器
   *
   * @param {boolean} [keepActiveIndex=false] 为 true 且当前序号仍有效时，不根据光标重新定位匹配项
   */
  runSearch(keepActiveIndex = false) {
    this.syncMatches(keepActiveIndex, true);
  }

  /**
   * 将当前搜索词同步到编辑器搜索高亮层
   *
   * @param {RegExp | null} [regex] 已构建的正则，省略时根据 state 重新构建
   */
  applyHighlight(regex) {
    if (!this.editorAdapter) {
      return;
    }

    const { query, caseSensitive, wholeWord, useRegex } = this.state;
    if (!query) {
      this.clearHighlight();
      return;
    }

    const searchRegex = regex ?? buildSearchRegex(query, caseSensitive, wholeWord, useRegex);
    if (!searchRegex) {
      return;
    }

    // pattern 已由 buildSearchRegex 构建，宿主需按正则解析
    this.editorAdapter.setSearchQuery(searchRegex.source, caseSensitive, true);
  }

  /** 清除编辑器中的搜索高亮 */
  clearHighlight() {
    this.editorAdapter?.clearSearchQuery();
  }

  /** 将编辑器选区移动到当前激活的匹配项并滚动到可见区域 */
  focusCurrentMatch() {
    const match = this.state.matches[this.state.activeMatchIndex];
    if (!match || !this.editorAdapter) {
      return;
    }

    this.editorAdapter.setSelection(match.from, match.to, {
      userEvent: 'search.select',
      scrollIntoView: true,
    });
  }

  /**
   * 在上/下一个匹配项之间循环导航
   *
   * @param {'prev' | 'next'} direction 导航方向
   */
  navigate(direction) {
    const { matches } = this.state;
    if (matches.length === 0) {
      return;
    }

    const { activeMatchIndex } = this.state;
    if (direction === 'next') {
      this.state.activeMatchIndex = activeMatchIndex >= matches.length - 1 ? 0 : activeMatchIndex + 1;
    } else {
      this.state.activeMatchIndex = activeMatchIndex <= 0 ? matches.length - 1 : activeMatchIndex - 1;
    }

    this.focusCurrentMatch();
    this.updateCounter();
  }

  /**
   * 展开或收起替换行
   * @param {boolean} expanded
   */
  setReplaceExpanded(expanded) {
    if (!this.enableReplace || !this.replaceRow) {
      return;
    }

    this.replaceExpanded = expanded;
    this.dom.classList.toggle('is-replace-expanded', expanded);
    this.replaceRow.classList.toggle('is-hidden', !expanded);

    if (this.expandButton) {
      this.expandButton.setAttribute('aria-expanded', String(expanded));
    }
  }

  /**
   * 编辑器是否只读
   * @returns {boolean}
   */
  isReadOnly() {
    return Boolean(this.editorAdapter?.isReadOnly());
  }

  /**
   * 获取替换文本
   * @returns {string}
   */
  getReplacementText() {
    return this.replaceInput?.value ?? '';
  }

  /**
   * 「替换为」输入框是否有有效内容
   * @returns {boolean}
   */
  hasReplacementText() {
    return this.getReplacementText().trim().length > 0;
  }

  /**
   * 是否满足执行替换的前置条件
   * @returns {boolean}
   */
  canPerformReplace() {
    if (!this.enableReplace || this.isReadOnly()) {
      return false;
    }

    return this.state.matches.length > 0 && Boolean(this.state.query) && this.hasReplacementText();
  }

  /**
   * 替换完成后收回面板焦点，便于继续输入
   */
  refocusPanelInput() {
    if (this.replaceExpanded && this.replaceInput) {
      this.replaceInput.focus();
      return;
    }

    this.input.focus();
  }

  /**
   * 替换当前匹配项
   * @param {boolean} [keepIndex=false] - 为 true 时替换后仍停留在同序号匹配项
   * @returns {boolean} 是否成功替换
   */
  replaceCurrent(keepIndex = false) {
    const match = this.state.matches[this.state.activeMatchIndex];
    if (!match || !this.editorAdapter || !this.canPerformReplace()) {
      return false;
    }

    const indexBefore = this.state.activeMatchIndex;
    const replacement = this.getReplacementText();
    const anchor = match.from + replacement.length;
    this.editorAdapter.replaceRange(replacement, match.from, match.to);

    const text = this.editorAdapter.getDocString();
    const { query, caseSensitive, wholeWord, useRegex } = this.state;
    const matches = findMatches(text, query, caseSensitive, wholeWord, useRegex);
    this.state.matches = matches;

    if (keepIndex && matches.length > 0) {
      this.state.activeMatchIndex = Math.min(indexBefore, matches.length - 1);
    } else {
      this.state.activeMatchIndex = findNearestMatchIndex(matches, anchor);
    }

    this.applyHighlight();
    this.focusCurrentMatch();
    this.updateCounter();
    this.refocusPanelInput();
    return true;
  }

  /**
   * 批量替换所有匹配项（从后向前替换，避免区间偏移）
   */
  replaceAll() {
    if (!this.editorAdapter || !this.canPerformReplace()) {
      return;
    }

    const { matches } = this.state;

    const replacement = this.getReplacementText();
    for (let i = matches.length - 1; i >= 0; i -= 1) {
      const { from, to } = matches[i];
      this.editorAdapter.replaceRange(replacement, from, to);
    }

    this.runSearch(true);
    this.refocusPanelInput();
  }

  /**
   * 更新匹配计数器 `当前/总数`，并同步导航与替换按钮的禁用状态
   */
  updateCounter() {
    const { matches, activeMatchIndex } = this.state;

    if (matches.length === 0) {
      this.counter.textContent = '0/0';
      this.counter.classList.remove('is-active');
      this.prevButton.disabled = true;
      this.nextButton.disabled = true;
      this.updateReplaceButtonState();
      return;
    }

    this.counter.textContent = `${activeMatchIndex + 1}/${matches.length}`;
    this.counter.classList.add('is-active');
    this.prevButton.disabled = false;
    this.nextButton.disabled = false;
    this.updateReplaceButtonState();
  }

  /**
   * 同步替换按钮状态（与 toggle 一致：默认可用 / hover / 不可操作 / 禁止）
   */
  updateReplaceButtonState() {
    const readOnly = this.isReadOnly();
    const canReplace = this.canPerformReplace();

    /** @type {(HTMLButtonElement | null)[]} */
    const replaceButtons = [this.replaceButton, this.replaceAllButton];
    replaceButtons.forEach((button) => {
      if (!button) {
        return;
      }

      button.disabled = !canReplace;
      button.classList.remove('is-forbidden', 'is-unavailable');

      if (canReplace) {
        return;
      }

      button.classList.add(readOnly ? 'is-forbidden' : 'is-unavailable');
    });
  }

  /**
   * 根据 Cherry 全局 locale 刷新面板 placeholder、按钮 title 等文案
   *
   * @param {Record<string, string | undefined>} [hostLocale] Cherry.locale；传入时重新 pick，省略则使用已有 this.locale
   */
  updateLocaleStrings(hostLocale) {
    if (hostLocale) {
      this.locale = pickSearcherLocale(hostLocale);
    }

    const strings = this.locale;
    this.input.placeholder = strings.searchFor ?? '';
    this.clearButton.title = strings.searchClear ?? '';
    this.caseToggle.title = strings.caseSensitiveSearch ?? '';
    this.wholeWordToggle.title = strings.wholeWordSearch ?? '';
    this.regexToggle.title = strings.regExpSearch ?? '';
    this.prevButton.title = strings.previousMatch ?? '';
    this.nextButton.title = strings.nextMatch ?? '';

    if (this.expandButton) {
      this.expandButton.title = strings.toggleReplace || strings.replace || '';
      this.expandButton.setAttribute('aria-label', strings.toggleReplace || strings.replace || '');
    }
    if (this.replaceInput) {
      this.replaceInput.placeholder = strings.replaceWith ?? '';
    }
    if (this.replaceClearButton) {
      this.replaceClearButton.title = strings.searchClear ?? '';
    }
    if (this.replaceButton) {
      this.replaceButton.textContent = strings.replace ?? '';
      this.replaceButton.title = strings.replace ?? '';
    }
    if (this.replaceAllButton) {
      this.replaceAllButton.textContent = strings.replaceAll ?? '';
      this.replaceAllButton.title = strings.replaceAll ?? '';
    }
  }
}
