/**
 * TEditor 风格的搜索面板（ES Module + class 语法）
 *
 * 单行搜索框：图标 + 输入 + 清空 + 大小写 + 全字匹配 + 计数导航
 * 可选展开替换行：替换输入 + 替换 + 全部替换
 */
import { buildSearchRegex, collectMatches, findMatches, findNearestMatchIndex } from './search-utils.js';
import { resolveLocale } from './locale.js';

/** 输入搜索防抖间隔（毫秒） */
const SEARCH_DEBOUNCE_MS = 150;

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

const CASE_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.854 11.702h-1l-.816-2.159H3.772l-.768 2.16H2L5.084 4h.9l2.87 7.702Zm-2.015-2.93L5.564 5.234l-.065-.258-.05.186-1.3 3.61h2.69ZM13.27 11.852c-.69 0-1.208-.203-1.556-.608-.345-.406-.518-.98-.518-1.72 0-.728.183-1.319.547-1.773.367-.454.858-.681 1.474-.681.577 0 1.014.177 1.31.53.3.35.449.845.449 1.484v.424h-3.023c.01.482.12.855.33 1.12.212.26.532.39.963.39.322 0 .607-.04.856-.119.252-.08.523-.2.815-.36v.738c-.257.145-.517.25-.78.318a3.76 3.76 0 0 1-.867.097v.16Zm-.187-4.113c-.323 0-.584.114-.78.344-.193.228-.308.546-.343.953h2.136c-.005-.41-.097-.727-.275-.952-.175-.23-.418-.345-.738-.345Z" fill="currentColor"/></svg>`;

const WHOLE_WORD_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4h1.014l1.527 5.264.073.32.065.342.064-.342.076-.32L7.02 4h.96l1.697 5.264.076.32.065.342.065-.342.072-.32L11.486 4H12.5L10.28 12H9.207L7.5 6.678 5.793 12H4.72L2.5 4Z" fill="currentColor"/><path d="M1 13h14v1H1v-1Z" fill="currentColor"/></svg>`;

const PREV_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 10L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const NEXT_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const EXPAND_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export default class SearcherPanel {
  /** @type {import('../types/searcher.types.js').EditorAdapter} */
  editorAdapter;

  /** @type {import('../types/searcher.types.js').SearcherOptions} */
  options;

  /** @type {HTMLElement} */
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
   * @param {import('../types/searcher.types.js').SearcherPanelParams} params
   */
  constructor(params) {
    const {
      editorAdapter,
      options = {},
      mountTarget = typeof document !== 'undefined' ? document.body : null,
    } = params;

    this.editorAdapter = editorAdapter;
    this.options = options;
    this.enableReplace = options.enableReplace !== false;
    /** @type {boolean} */
    this.replaceExpanded = options.expandReplaceOnOpen === true;

    /** @type {import('../types/searcher.types.js').SearcherSearchState} */
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
   * 是否挂载在 Cherry 编辑区容器内（使用 CSS 右上角定位，与旧版 ace_search 一致）
   * @returns {boolean}
   */
  isMountedInEditor() {
    return Boolean(this.dom.parentElement?.classList?.contains('cherry-editor'));
  }

  /**
   * 显示搜索面板
   * @param {{ left: number; top: number; width: number; height: number }} [anchorRect] 独立使用时按视口锚点定位；Cherry 编辑区内可省略
   * @param {string} [selection='']
   * @param {import('../types/searcher.types.js').SearcherShowOptions} [showOptions={}]
   */
  show(anchorRect, selection = '', showOptions = {}) {
    this.dom.style.display = '';
    if (anchorRect) {
      this.positionPanel(anchorRect);
    } else if (this.isMountedInEditor()) {
      this.dom.style.left = '';
      this.dom.style.top = '';
    }

    if (showOptions.expandReplace && this.enableReplace) {
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
   * 隐藏搜索面板
   */
  hide() {
    this.unbindCloseOnOutside();
    this.clearHighlight();
    this.dom.style.display = 'none';
    this.editorAdapter.focus();
  }

  /**
   * 销毁面板
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
    if (this._outsideCloseBound || this.options.closeOnClickOutside === false) {
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
    if (this.options.closeOnClickOutside === false || !this.isVisible()) {
      return;
    }

    const target = /** @type {Node} */ (event.target);
    if (this.dom.contains(target)) {
      return;
    }

    this.hide();
  }

  /**
   * 根据锚点矩形定位面板（独立使用 fixed 模式）；Cherry 编辑区内由 CSS 定位
   * @param {{ left: number; top: number; width: number; height: number }} anchorRect
   */
  positionPanel(anchorRect) {
    if (this.isMountedInEditor()) {
      this.dom.style.left = '';
      this.dom.style.top = '';
      return;
    }

    const panelWidth = this.dom.offsetWidth || 420;
    const panelHeight = this.dom.offsetHeight || 52;
    const pageWidth = document.documentElement.clientWidth;
    const pageHeight = document.documentElement.clientHeight;
    const margin = 8;
    let left = anchorRect.left + anchorRect.width - panelWidth - margin;

    // 编辑区较窄时，避免面板超出左边界
    if (left < anchorRect.left + margin) {
      left = anchorRect.left + margin;
    }

    if (left + panelWidth > pageWidth - margin) {
      left = Math.max(margin, pageWidth - panelWidth - margin);
    }

    // 旧版 cm-search-replace：top: spacing-lg，贴在编辑区顶部（fixed 模式用视口坐标）
    let top = anchorRect.top + margin;
    if (top + panelHeight > pageHeight - margin) {
      top = Math.max(margin, pageHeight - panelHeight - margin);
    }

    this.dom.style.left = `${left}px`;
    this.dom.style.top = `${top}px`;
  }

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
   * @param {string} query
   * @param {boolean} [keepCurrentIndex=false]
   * @param {boolean} [immediate=true] - 为 false 时对输入做防抖
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
    this.emitSearch();
  }

  /** 触发 onSearch 回调 */
  emitSearch() {
    const { query, caseSensitive, wholeWord, matches, activeMatchIndex } = this.state;
    if (!query || !this.options.onSearch) {
      return;
    }

    this.options.onSearch({
      query,
      caseSensitive,
      wholeWord,
      matches: matches.map((match) => ({ ...match })),
      activeMatchIndex,
    });
  }

  /**
   * @param {RegExp | null} [regex]
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

  clearHighlight() {
    this.editorAdapter?.clearSearchQuery();
  }

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
   * @param {'prev' | 'next'} direction
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
    const docBefore = this.editorAdapter.getDocString();
    const fromText = docBefore.slice(match.from, match.to);
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
    this.emitReplace({
      mode: 'single',
      query,
      from: fromText,
      to: replacement,
      count: 1,
      range: { from: match.from, to: match.to },
    });
    this.emitSearch();
    this.refocusPanelInput();
    return true;
  }

  /**
   * 替换全部匹配项
   */
  replaceAll() {
    if (!this.editorAdapter || !this.canPerformReplace()) {
      return;
    }

    const { matches, query } = this.state;

    const replacement = this.getReplacementText();
    const docBefore = this.editorAdapter.getDocString();
    const fromText = docBefore.slice(matches[0].from, matches[0].to);
    const replacedCount = matches.length;
    for (let i = matches.length - 1; i >= 0; i -= 1) {
      const { from, to } = matches[i];
      this.editorAdapter.replaceRange(replacement, from, to);
    }

    this.runSearch(true);
    this.emitReplace({
      mode: 'all',
      query,
      from: fromText,
      to: replacement,
      count: replacedCount,
    });
    this.refocusPanelInput();
  }

  /**
   * 触发 onReplace 回调
   * @param {import('../types/searcher.types.js').SearcherReplaceEvent} event
   */
  emitReplace(event) {
    this.options.onReplace?.(event);
  }

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

  updateLocaleStrings() {
    const locale = resolveLocale(this.options);
    this.input.placeholder = locale.searchFor;
    this.clearButton.title = locale.close;
    this.caseToggle.title = locale.caseSensitiveSearch;
    this.wholeWordToggle.title = locale.wholeWordSearch;
    this.prevButton.title = locale.previousMatch;
    this.nextButton.title = locale.nextMatch;

    if (this.expandButton) {
      this.expandButton.title = locale.toggleReplace || locale.replace;
    }
    if (this.replaceInput) {
      this.replaceInput.placeholder = locale.replaceWith;
    }
    if (this.replaceClearButton) {
      this.replaceClearButton.title = locale.close;
    }
    if (this.replaceButton) {
      this.replaceButton.textContent = locale.replace;
      this.replaceButton.title = locale.replace;
    }
    if (this.replaceAllButton) {
      this.replaceAllButton.textContent = locale.replaceAll;
      this.replaceAllButton.title = locale.replaceAll;
    }
  }
}
