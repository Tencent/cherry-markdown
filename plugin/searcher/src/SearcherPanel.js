// @ts-nocheck
/**
 * TEditor 风格的搜索面板
 *
 * 单行搜索框：图标 + 输入 + 清空 + 大小写 + 全字匹配 + 计数导航
 * 可选展开替换行：替换输入 + 替换 + 全部替换
 * 下方可选展示最近搜索标签
 */
import { createElement } from '@cherry/utils/dom.js';
import { buildSearchRegex, findMatches, findNearestMatchIndex } from './search-utils.js';

const SEARCH_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CLEAR_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const CASE_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.854 11.702h-1l-.816-2.159H3.772l-.768 2.16H2L5.084 4h.9l2.87 7.702Zm-2.015-2.93L5.564 5.234l-.065-.258-.05.186-1.3 3.61h2.69ZM13.27 11.852c-.69 0-1.208-.203-1.556-.608-.345-.406-.518-.98-.518-1.72 0-.728.183-1.319.547-1.773.367-.454.858-.681 1.474-.681.577 0 1.014.177 1.31.53.3.35.449.845.449 1.484v.424h-3.023c.01.482.12.855.33 1.12.212.26.532.39.963.39.322 0 .607-.04.856-.119.252-.08.523-.2.815-.36v.738c-.257.145-.517.25-.78.318a3.76 3.76 0 0 1-.867.097v.16Zm-.187-4.113c-.323 0-.584.114-.78.344-.193.228-.308.546-.343.953h2.136c-.005-.41-.097-.727-.275-.952-.175-.23-.418-.345-.738-.345Z" fill="currentColor"/></svg>`;

const WHOLE_WORD_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4h1.014l1.527 5.264.073.32.065.342.064-.342.076-.32L7.02 4h.96l1.697 5.264.076.32.065.342.065-.342.072-.32L11.486 4H12.5L10.28 12H9.207L7.5 6.678 5.793 12H4.72L2.5 4Z" fill="currentColor"/><path d="M1 13h14v1H1v-1Z" fill="currentColor"/></svg>`;

const PREV_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 10L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const NEXT_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const EXPAND_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const DEFAULT_STORAGE_KEY = 'cherry-searcher-recent-texts';
const DEFAULT_MAX_RECENT = 10;

export default class SearcherPanel {
  /**
   * @param {import('@cherry/Cherry.js').default} $cherry
   * @param {import('./index.js').SearcherPluginOptions} [options]
   */
  constructor($cherry, options = {}) {
    this.$cherry = $cherry;
    this.options = options;
    this.enableReplace = options.enableReplace !== false;
    this.storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    this.maxRecentCount = options.maxRecentCount || DEFAULT_MAX_RECENT;
    this.recentTexts = options.recentTexts ? [...options.recentTexts] : this.loadRecentTexts();
    this.cm = null;
    /** @type {'search' | 'replace'} */
    this.activeInput = 'search';
    /** @type {boolean} */
    this.replaceExpanded = options.defaultExpandReplace === true;

    this.state = {
      query: '',
      caseSensitive: false,
      wholeWord: false,
      matches: [],
      currentIndex: -1,
    };

    this.dom = this.createDOM();
    this.cacheElements();
    this.bindEvents();
    this.updateLocaleStrings();
    this.dom.style.display = 'none';
  }

  /**
   * 绑定 CodeMirror 编辑器实例
   * @param {import('@cherry/Editor.js').default} cm
   */
  init(cm) {
    this.cm = cm;
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
   * @param {{ left: number; top: number; width: number; height: number }} anchorRect
   * @param {string} [selection='']
   * @param {{ expandReplace?: boolean }} [showOptions={}]
   */
  show(anchorRect, selection = '', showOptions = {}) {
    this.dom.style.display = '';
    this.positionPanel(anchorRect);

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
  }

  /**
   * 隐藏搜索面板
   */
  hide() {
    this.saveRecentText(this.state.query);
    this.clearHighlight();
    this.dom.style.display = 'none';
    this.cm?.view?.focus();
  }

  /**
   * 销毁面板
   */
  destroy() {
    this.clearHighlight();
    if (this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
    this.cm = null;
    this.$cherry = null;
  }

  /**
   * @param {{ left: number; top: number; width: number; height: number }} anchorRect
   */
  positionPanel(anchorRect) {
    const panelWidth = this.dom.offsetWidth || 420;
    const pageWidth = document.documentElement.clientWidth;
    let left = anchorRect.left;

    if (left + panelWidth > pageWidth) {
      left = Math.max(8, pageWidth - panelWidth - 8);
    }

    this.dom.style.left = `${left}px`;
    this.dom.style.top = `${anchorRect.top + anchorRect.height + 4}px`;
  }

  createDOM() {
    const container = createElement('div', 'cherry-searcher');
    const sideSlot = this.enableReplace
      ? [
          '      <div class="cherry-searcher__side">',
          `        <button type="button" class="cherry-searcher__expand-btn" aria-expanded="false" aria-label="toggle replace">${EXPAND_ICON}</button>`,
          '      </div>',
        ].join('\n')
      : '';
    const sideSpacer = this.enableReplace ? '      <div class="cherry-searcher__side cherry-searcher__side--spacer"></div>' : '';
    const replaceRowHtml = this.enableReplace
      ? [
          '    <div class="cherry-searcher__row cherry-searcher__replace-row is-hidden">',
          sideSpacer,
          '      <div class="cherry-searcher__input-wrapper cherry-searcher__replace-wrapper">',
          '        <input class="cherry-searcher__replace-input" type="text" spellcheck="false" />',
          '        <span class="cherry-searcher__divider"></span>',
          '        <div class="cherry-searcher__replace-actions">',
          '          <button type="button" class="cherry-searcher__replace-btn" data-action="replace"></button>',
          '          <button type="button" class="cherry-searcher__replace-btn cherry-searcher__replace-btn--all" data-action="replaceAll"></button>',
          '        </div>',
          '      </div>',
          '    </div>',
        ].join('\n')
      : '';

    container.innerHTML = [
      '<div class="cherry-searcher__container">',
      '  <div class="cherry-searcher__rows">',
      '    <div class="cherry-searcher__row cherry-searcher__search-row">',
      sideSlot,
      '      <div class="cherry-searcher__input-wrapper">',
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
      '  <div class="cherry-searcher__recent"></div>',
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
    this.searchRow = this.dom.querySelector('.cherry-searcher__search-row');
    this.expandButton = this.dom.querySelector('.cherry-searcher__expand-btn');
    this.input = this.dom.querySelector('.cherry-searcher__input');
    this.clearButton = this.dom.querySelector('.cherry-searcher__clear');
    this.caseToggle = this.dom.querySelector('[data-type="caseSensitive"]');
    this.wholeWordToggle = this.dom.querySelector('[data-type="wholeWord"]');
    this.counter = this.dom.querySelector('.cherry-searcher__counter');
    this.recentSection = this.dom.querySelector('.cherry-searcher__recent');
    this.prevButton = this.dom.querySelector('[data-direction="prev"]');
    this.nextButton = this.dom.querySelector('[data-direction="next"]');
    this.replaceRow = this.dom.querySelector('.cherry-searcher__replace-row');
    this.replaceInput = this.dom.querySelector('.cherry-searcher__replace-input');
    this.replaceButton = this.dom.querySelector('[data-action="replace"]');
    this.replaceAllButton = this.dom.querySelector('[data-action="replaceAll"]');
  }

  bindEvents() {
    this.input.addEventListener('input', () => {
      this.setQuery(this.input.value, true);
    });

    this.input.addEventListener('focus', () => {
      this.activeInput = 'search';
    });

    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (this.state.matches.length > 0) {
          this.navigate(event.shiftKey ? 'prev' : 'next');
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (this.state.query) {
          this.clearQuery();
        } else {
          this.hide();
        }
      }
    });

    if (this.replaceInput) {
      this.replaceInput.addEventListener('focus', () => {
        this.activeInput = 'replace';
      });

      this.replaceInput.addEventListener('input', () => {
        this.updateReplaceActionsState();
      });

      this.replaceInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
        if (event.shiftKey) {
          this.replaceCurrent(true);
        } else {
          this.replaceCurrent();
        }
        } else if (event.key === 'Escape') {
          event.preventDefault();
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
   */
  setQuery(query, keepCurrentIndex = false) {
    this.state.query = query;
    this.input.value = query;
    this.clearButton.classList.toggle('is-visible', query.length > 0);
    this.runSearch(keepCurrentIndex);
  }

  clearQuery() {
    this.setQuery('');
    this.input.focus();
  }

  runSearch(keepCurrentIndex = false) {
    if (!this.cm) {
      return;
    }

    const text = this.cm.view.state.doc.toString();
    const { query, caseSensitive, wholeWord } = this.state;
    const matches = findMatches(text, query, caseSensitive, wholeWord);

    this.state.matches = matches;

    if (!query) {
      this.state.currentIndex = -1;
      this.clearHighlight();
      this.updateCounter();
      this.renderRecentSection();
      return;
    }

    if (keepCurrentIndex && this.state.currentIndex >= 0 && this.state.currentIndex < matches.length) {
      // 保持当前索引
    } else {
      const cursorPos = this.cm.view.state.selection.main.head;
      this.state.currentIndex = findNearestMatchIndex(matches, cursorPos);
    }

    this.applyHighlight();
    this.focusCurrentMatch();
    this.updateCounter();
    this.renderRecentSection();
  }

  applyHighlight() {
    if (!this.cm) {
      return;
    }

    const { query, caseSensitive, wholeWord } = this.state;
    if (!query) {
      this.clearHighlight();
      return;
    }

    const regex = buildSearchRegex(query, caseSensitive, wholeWord);
    if (!regex) {
      return;
    }

    this.cm.setSearchQuery(regex.source, caseSensitive, true);
  }

  clearHighlight() {
    this.cm?.clearSearchQuery();
  }

  focusCurrentMatch() {
    const match = this.state.matches[this.state.currentIndex];
    if (!match || !this.cm) {
      return;
    }

    this.cm.setSelection(match.from, match.to, {
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

    const { currentIndex } = this.state;
    if (direction === 'next') {
      this.state.currentIndex = currentIndex >= matches.length - 1 ? 0 : currentIndex + 1;
    } else {
      this.state.currentIndex = currentIndex <= 0 ? matches.length - 1 : currentIndex - 1;
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
    return Boolean(this.cm?.getOption?.('readOnly'));
  }

  /**
   * 获取替换文本
   * @returns {string}
   */
  getReplacementText() {
    return this.replaceInput?.value ?? '';
  }

  /**
   * 替换当前匹配项
   * @param {boolean} [keepIndex=false] - 为 true 时替换后仍停留在同序号匹配项
   * @returns {boolean} 是否成功替换
   */
  replaceCurrent(keepIndex = false) {
    const match = this.state.matches[this.state.currentIndex];
    if (!match || !this.cm || !this.state.query || this.isReadOnly()) {
      return false;
    }

    const indexBefore = this.state.currentIndex;
    const replacement = this.getReplacementText();
    const anchor = match.from + replacement.length;
    this.cm.replaceRange(replacement, match.from, match.to);

    const text = this.cm.view.state.doc.toString();
    const { query, caseSensitive, wholeWord } = this.state;
    const matches = findMatches(text, query, caseSensitive, wholeWord);
    this.state.matches = matches;

    if (keepIndex && matches.length > 0) {
      this.state.currentIndex = Math.min(indexBefore, matches.length - 1);
    } else {
      this.state.currentIndex = findNearestMatchIndex(matches, anchor);
    }

    this.applyHighlight();
    this.focusCurrentMatch();
    this.updateCounter();
    return true;
  }

  /**
   * 替换全部匹配项
   */
  replaceAll() {
    if (!this.cm || !this.state.query || this.isReadOnly()) {
      return;
    }

    const { matches } = this.state;
    if (matches.length === 0) {
      return;
    }

    const replacement = this.getReplacementText();
    for (let i = matches.length - 1; i >= 0; i -= 1) {
      const { from, to } = matches[i];
      this.cm.replaceRange(replacement, from, to);
    }

    this.runSearch(true);
  }

  updateCounter() {
    const { matches, currentIndex } = this.state;
    const canReplace = this.enableReplace && !this.isReadOnly() && matches.length > 0 && this.state.query;

    if (matches.length === 0) {
      this.counter.textContent = '0/0';
      this.prevButton.disabled = true;
      this.nextButton.disabled = true;
      if (this.replaceButton) {
        this.replaceButton.disabled = true;
      }
      if (this.replaceAllButton) {
        this.replaceAllButton.disabled = true;
      }
      this.updateReplaceActionsState();
      return;
    }

    this.counter.textContent = `${currentIndex + 1}/${matches.length}`;
    this.prevButton.disabled = false;
    this.nextButton.disabled = false;
    if (this.replaceButton) {
      this.replaceButton.disabled = !canReplace;
    }
    if (this.replaceAllButton) {
      this.replaceAllButton.disabled = !canReplace;
    }
    this.updateReplaceActionsState();
  }

  /**
   * 替换框有内容且按钮可用时，高亮为 primary 色
   */
  updateReplaceActionsState() {
    const hasReplacement = this.getReplacementText().length > 0;
    [this.replaceButton, this.replaceAllButton].forEach((button) => {
      if (!button) {
        return;
      }
      button.classList.toggle('is-emphasis', hasReplacement && !button.disabled);
    });
  }

  updateLocaleStrings() {
    const locale = this.$cherry.locale;
    this.input.placeholder = this.options.placeholder || locale.searchFor || '搜索...';
    this.clearButton.title = locale.close || '清空';
    this.caseToggle.title = locale.caseSensitiveSearch || '大小写敏感';
    this.wholeWordToggle.title = locale.wholeWordSearch || '全字匹配';
    this.prevButton.title = locale.previousMatch || '上一个匹配';
    this.nextButton.title = locale.nextMatch || '下一个匹配';

    if (this.expandButton) {
      this.expandButton.title = locale.replace || '替换';
    }
    if (this.replaceInput) {
      this.replaceInput.placeholder = locale.replaceWith || '替换为';
    }
    if (this.replaceButton) {
      this.replaceButton.textContent = locale.replace || '替换';
      this.replaceButton.title = locale.replace || '替换';
    }
    if (this.replaceAllButton) {
      this.replaceAllButton.textContent = locale.replaceAll || '全部替换';
      this.replaceAllButton.title = locale.replaceAll || '全部替换';
    }

    this.renderRecentSection();
  }

  renderRecentSection() {
    if (!this.recentTexts.length) {
      this.recentSection.innerHTML = '';
      this.recentSection.style.display = 'none';
      return;
    }

    const locale = this.$cherry.locale;
    const title = this.options.recentTitle || locale.searcherRecentTitle || '最近文本';

    this.recentSection.style.display = '';
    this.recentSection.innerHTML = [
      `<div class="cherry-searcher__recent-title">${title}</div>`,
      '<div class="cherry-searcher__tags"></div>',
    ].join('');

    const tagsContainer = this.recentSection.querySelector('.cherry-searcher__tags');
    this.recentTexts.forEach((item) => {
      const tag = createElement('button', 'cherry-searcher__tag', { type: 'button' });
      tag.textContent = item.label || item.value;

      const deleteBtn = createElement('span', 'cherry-searcher__tag-delete', {
        'aria-label': locale.searcherDelete || '删除',
      });
      deleteBtn.textContent = '×';

      tag.appendChild(deleteBtn);

      tag.addEventListener('click', (event) => {
        if (event.target === deleteBtn) {
          event.stopPropagation();
          this.removeRecentText(item.value);
          return;
        }
        this.setQuery(item.value);
        this.input.focus();
      });

      tagsContainer.appendChild(tag);
    });
  }

  /**
   * @param {string} value
   */
  saveRecentText(value) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    this.recentTexts = this.recentTexts.filter((item) => item.value !== trimmed);
    this.recentTexts.unshift({ value: trimmed, label: trimmed });

    if (this.recentTexts.length > this.maxRecentCount) {
      this.recentTexts = this.recentTexts.slice(0, this.maxRecentCount);
    }

    if (this.options.recentTexts) {
      this.options.recentTexts.splice(0, this.options.recentTexts.length, ...this.recentTexts);
    }

    this.persistRecentTexts();
    this.renderRecentSection();
  }

  /**
   * @param {string} value
   */
  removeRecentText(value) {
    if (this.options.onTagDelete) {
      const result = this.options.onTagDelete(value);
      if (result === false) {
        return;
      }
    }

    this.recentTexts = this.recentTexts.filter((item) => item.value !== value);

    if (this.options.recentTexts) {
      const index = this.options.recentTexts.findIndex((item) => item.value === value);
      if (index !== -1) {
        this.options.recentTexts.splice(index, 1);
      }
    }

    this.persistRecentTexts();
    this.renderRecentSection();
  }

  loadRecentTexts() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  persistRecentTexts() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.recentTexts));
    } catch (error) {
      // 忽略存储失败
    }
  }
}
