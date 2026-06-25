/**
 * Cherry 内置搜索/替换面板
 *
 * 挂载在编辑区右上角，提供查找、高亮、导航与替换能力。
 * 由 {@link SearcherBridge} 创建，不对外单独暴露；文案来自 Cherry 全局 `locale`。
 *
 * @module toolbars/searcher/SearcherPanel
 */
import { buildSearchRegex, collectMatches, findMatches, findNearestMatchIndex } from './search-utils.js';
import { pickSearcherLocale } from './locale.js';

/** 输入搜索防抖间隔（毫秒），减少连续输入时的匹配计算次数 */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * 面板构造参数
 * @typedef {object} SearcherPanelParams
 * @property {SearcherEditorAdapter} editorAdapter 编辑器读写适配器
 * @property {Record<string, string | undefined>} [locale] Cherry 全局 locale，面板通过 pickSearcherLocale 提取文案
 * @property {ParentNode | null} [mountTarget] 面板挂载节点，通常为 `.cherry-editor`
 */

/**
 * 编辑器适配器（与 SearcherBridge.createEditorAdapter 返回值一致）
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
 * 面板显示选项
 * @typedef {object} SearcherShowOptions
 * @property {boolean} [expandReplace] 为 true 时打开面板同时展开替换行（Mod+H）
 */

/**
 * 搜索运行时状态
 * @typedef {object} SearcherPanelState
 * @property {string} query 当前搜索关键词
 * @property {boolean} caseSensitive 是否区分大小写
 * @property {boolean} wholeWord 是否全字匹配
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

const SEARCH_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CLEAR_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

// 区分大小写 / 全字匹配：字形由 SCSS 控制字号与主题色
const CASE_ICON = `<svg class="cherry-searcher__toggle-icon" viewBox="0 0 16 16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><text x="8" y="11.75" text-anchor="middle">Aa</text></svg>`;

const WHOLE_WORD_ICON = `<svg class="cherry-searcher__toggle-icon" viewBox="0 0 16 16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><text x="8" y="10.75" text-anchor="middle">ab</text><path d="M2.5 12.75H13.5"/></svg>`;

const PREV_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 10L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const NEXT_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const EXPAND_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * 搜索/替换面板
 *
 * 搜索行：输入框、清空、大小写/全字匹配切换、匹配计数与上/下导航。
 * 替换行：替换为输入、单条替换、全部替换（只读时禁用）。
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
      mountTarget = typeof document !== 'undefined' ? document.body : null,
    } = params;

    this.editorAdapter = editorAdapter;
    this.locale = pickSearcherLocale(locale);
    this.enableReplace = true;
    this.replaceExpanded = false;

    /** @type {SearcherPanelState} 搜索匹配与高亮状态 */
    this.state = {
      query: '',
      caseSensitive: false,
      wholeWord: false,
      matches: [],
      activeMatchIndex: -1,
    };

    /** @type {ReturnType<typeof setTimeout> | null} */
    this._searchTimer = null;
    /** @type {boolean} */
    this._pendingKeepActiveIndex = false;

    this.handleDocumentPointerDown = this.handleDocumentPointerDown.bind(this);
    /** @type {boolean} */
    this._outsideCloseBound = false;

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
    this.dom.style.display = '';

    if (showOptions.expandReplace) {
      this.setReplaceExpanded(true);
    }

    if (selection) {
      this.setQuery(selection, false);
    } else if (this.state.query) {
      this.runSearch();
    }

    if (this.replaceExpanded && this.replaceInput) {
      this.replaceInput.focus();
      this.replaceInput.select();
    } else {
      this.input.focus();
      this.input.select();
    }

    this.updateReplaceButtonState();
    this.bindCloseOnOutside();
  }

  /**
   * 隐藏搜索面板，清除编辑器高亮并将焦点交还编辑器
   */
  hide() {
    this.unbindCloseOnOutside();
    this.clearHighlight();
    this.dom.style.display = 'none';
    this.editorAdapter.focus();
  }

  /**
   * 销毁面板：取消定时器、清除高亮、移除 DOM
   */
  destroy() {
    this.cancelScheduledSearch();
    this.clearHighlight();
    this.unbindCloseOnOutside();
    if (this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
  }

  /** 面板可见时监听文档点击，仅在面板外按下时关闭 */
  bindCloseOnOutside() {
    if (this._outsideCloseBound) {
      return;
    }

    document.addEventListener('mousedown', this.handleDocumentPointerDown);
    this._outsideCloseBound = true;
  }

  /** 移除文档点击监听 */
  unbindCloseOnOutside() {
    if (!this._outsideCloseBound) {
      return;
    }

    document.removeEventListener('mousedown', this.handleDocumentPointerDown);
    this._outsideCloseBound = false;
  }

  /**
   * 点击面板外关闭（面板内任意位置点击均不关闭，由 dom mousedown stopPropagation 保证）
   * @param {MouseEvent} event
   */
  handleDocumentPointerDown(event) {
    if (!this.isVisible()) {
      return;
    }

    const target = /** @type {Node} */ (event.target);
    if (this.dom.contains(target)) {
      return;
    }

    this.hide();
  }

  /**
   * 构建面板 DOM 结构（搜索行 + 可折叠替换行）
   *
   * @returns {HTMLElement} 面板根元素
   */
  createDOM() {
    const container = document.createElement('div');
    container.className = 'cherry-searcher';
    const expandBtnHtml = this.enableReplace
      ? `<button type="button" class="cherry-searcher__expand-btn" aria-expanded="false" aria-label="toggle replace">${EXPAND_ICON}</button>`
      : '';
    const replaceSpacerHtml = this.enableReplace
      ? '<span class="cherry-searcher__expand-spacer" aria-hidden="true"></span>'
      : '';
    const replaceRowHtml = this.enableReplace
      ? [
          '    <div class="cherry-searcher__row cherry-searcher__replace-row is-hidden">',
          '      <div class="cherry-searcher__input-wrapper cherry-searcher__replace-wrapper">',
          replaceSpacerHtml,
          '        <input class="cherry-searcher__replace-input" type="text" spellcheck="false" />',
          `        <button type="button" class="cherry-searcher__clear cherry-searcher__replace-clear" aria-label="clear">${CLEAR_ICON}</button>`,
          '        <span class="cherry-searcher__divider"></span>',
          '        <div class="cherry-searcher__replace-actions">',
          '          <button type="button" class="cherry-searcher__replace-btn is-unavailable" data-action="replace" disabled></button>',
          '          <button type="button" class="cherry-searcher__replace-btn cherry-searcher__replace-btn--all is-unavailable" data-action="replaceAll" disabled></button>',
          '        </div>',
          '      </div>',
          '    </div>',
        ].join('\n')
      : '';

    container.innerHTML = [
      '<div class="cherry-searcher__container">',
      '  <div class="cherry-searcher__rows">',
      '    <div class="cherry-searcher__row cherry-searcher__search-row">',
      '      <div class="cherry-searcher__input-wrapper">',
      expandBtnHtml,
      `        <span class="cherry-searcher__icon cherry-searcher__icon--search">${SEARCH_ICON}</span>`,
      '        <input class="cherry-searcher__input" type="text" spellcheck="false" />',
      `        <button type="button" class="cherry-searcher__clear" aria-label="clear">${CLEAR_ICON}</button>`,
      '        <span class="cherry-searcher__divider"></span>',
      '        <div class="cherry-searcher__toggles">',
      `          <button type="button" class="cherry-searcher__toggle" data-type="caseSensitive" aria-pressed="false" title="">${CASE_ICON}</button>`,
      `          <button type="button" class="cherry-searcher__toggle" data-type="wholeWord" aria-pressed="false" title="">${WHOLE_WORD_ICON}</button>`,
      '        </div>',
      '        <span class="cherry-searcher__divider"></span>',
      '        <div class="cherry-searcher__nav">',
      '          <span class="cherry-searcher__counter">0/0</span>',
      `          <button type="button" class="cherry-searcher__nav-btn" data-direction="prev" aria-label="prev">${PREV_ICON}</button>`,
      `          <button type="button" class="cherry-searcher__nav-btn" data-direction="next" aria-label="next">${NEXT_ICON}</button>`,
      '        </div>',
      '      </div>',
      '    </div>',
      replaceRowHtml,
      '  </div>',
      '</div>',
    ]
      .filter(Boolean)
      .join('\n');

    if (this.replaceExpanded) {
      container.classList.add('is-replace-expanded');
      container.querySelector('.cherry-searcher__replace-row')?.classList.remove('is-hidden');
      container.querySelector('.cherry-searcher__expand-btn')?.setAttribute('aria-expanded', 'true');
    }

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
        if (this.state.query) {
          this.clearQuery();
        } else {
          this.hide();
        }
      }
    });

    if (this.replaceInput) {
      this.replaceInput.addEventListener('input', () => {
        this.updateReplaceClearVisibility();
        this.updateReplaceButtonState();
      });

      this.replaceInput.addEventListener('keydown', (event) => {
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
          this.hide();
        }
      });
    }

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

    this.prevButton.addEventListener('click', () => {
      this.navigate('prev');
    });

    this.nextButton.addEventListener('click', () => {
      this.navigate('next');
    });

    this.dom.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });
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
    this._pendingKeepActiveIndex = keepActiveIndex;
    this.cancelScheduledSearch();
    this._searchTimer = setTimeout(() => {
      this._searchTimer = null;
      this.runSearch(this._pendingKeepActiveIndex);
    }, SEARCH_DEBOUNCE_MS);
  }

  /** 取消待执行的防抖搜索 */
  cancelScheduledSearch() {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer);
      this._searchTimer = null;
    }
  }

  /**
   * 立即执行待定的防抖搜索
   * @param {boolean} [keepActiveIndex=true]
   */
  flushScheduledSearch(keepActiveIndex = true) {
    if (!this._searchTimer) {
      return;
    }

    this.cancelScheduledSearch();
    this.runSearch(keepActiveIndex);
  }

  /**
   * 执行搜索：收集匹配、定位最近项、高亮并更新计数器
   *
   * @param {boolean} [keepActiveIndex=false] 为 true 且当前序号仍有效时，不根据光标重新定位匹配项
   */
  runSearch(keepActiveIndex = false) {
    if (!this.editorAdapter) {
      return;
    }

    this.cancelScheduledSearch();

    const text = this.editorAdapter.getDocString();
    const { query, caseSensitive, wholeWord } = this.state;
    const regex = buildSearchRegex(query, caseSensitive, wholeWord);
    const matches = regex ? collectMatches(text, regex) : [];

    this.state.matches = matches;

    if (!query) {
      this.state.activeMatchIndex = -1;
      this.clearHighlight();
      this.updateCounter();
      return;
    }

    if (!(keepActiveIndex && this.state.activeMatchIndex >= 0 && this.state.activeMatchIndex < matches.length)) {
      const cursorPos = this.editorAdapter.getCursorHead();
      this.state.activeMatchIndex = findNearestMatchIndex(matches, cursorPos);
    }

    this.applyHighlight(regex);
    this.focusCurrentMatch();
    this.updateCounter();
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

    const { query, caseSensitive, wholeWord } = this.state;
    if (!query) {
      this.clearHighlight();
      return;
    }

    const searchRegex = regex ?? buildSearchRegex(query, caseSensitive, wholeWord);
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
    const { query, caseSensitive, wholeWord } = this.state;
    const matches = findMatches(text, query, caseSensitive, wholeWord);
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
    this.prevButton.title = strings.previousMatch ?? '';
    this.nextButton.title = strings.nextMatch ?? '';

    if (this.expandButton) {
      this.expandButton.title = strings.toggleReplace || strings.replace || '';
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
