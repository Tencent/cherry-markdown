/**
 * 搜索面板 DOM 模板（图标 + 完整 HTML 结构）
 *
 * @module toolbars/searcher/panel-dom
 */

const SEARCH_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CLEAR_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const CASE_ICON = `<svg class="cherry-searcher__toggle-icon" viewBox="0 0 16 16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><text x="8" y="11.75" text-anchor="middle">Aa</text></svg>`;

const WHOLE_WORD_ICON = `<svg class="cherry-searcher__toggle-icon" viewBox="0 0 16 16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><text x="8" y="10.75" text-anchor="middle">ab</text><path d="M2.5 12.75H13.5"/></svg>`;

const REGEX_ICON = `<svg class="cherry-searcher__toggle-icon" viewBox="0 0 16 16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><text x="8" y="11.75" text-anchor="middle">.*</text></svg>`;

const PREV_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 10L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const NEXT_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const EXPAND_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * 构建替换行 HTML
 * @param {boolean} [hidden=true]
 * @returns {string}
 */
function buildReplaceRowHtml(hidden = true) {
  const hiddenClass = hidden ? ' is-hidden' : '';

  return [
    `    <div class="cherry-searcher__row cherry-searcher__replace-row${hiddenClass}">`,
    '      <div class="cherry-searcher__input-wrapper cherry-searcher__replace-wrapper">',
    '        <span class="cherry-searcher__expand-spacer" aria-hidden="true"></span>',
    '        <input class="cherry-searcher__replace-input" type="text" spellcheck="false" />',
    `        <button type="button" class="cherry-searcher__clear cherry-searcher__replace-clear" aria-label="clear">${CLEAR_ICON}</button>`,
    '        <span class="cherry-searcher__divider"></span>',
    '        <div class="cherry-searcher__replace-actions">',
    '          <button type="button" class="cherry-searcher__replace-btn is-unavailable" data-action="replace" disabled></button>',
    '          <button type="button" class="cherry-searcher__replace-btn cherry-searcher__replace-btn--all is-unavailable" data-action="replaceAll" disabled></button>',
    '          <button type="button" class="cherry-searcher__replace-btn cherry-searcher__replace-btn--select-all is-unavailable" data-action="selectAllMatches" disabled></button>',
    '        </div>',
    '      </div>',
    '    </div>',
  ].join('\n');
}

/**
 * 构建搜索面板 innerHTML（不含根节点 `.cherry-searcher`）
 * @param {boolean} enableReplace 是否包含替换行与展开按钮
 * @returns {string}
 */
export function buildSearcherPanelHtml(enableReplace) {
  const expandBtnHtml = enableReplace
    ? `<button type="button" class="cherry-searcher__expand-btn" aria-expanded="false">${EXPAND_ICON}</button>`
    : '';
  const replaceRowHtml = enableReplace ? buildReplaceRowHtml(true) : '';

  return [
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
    `          <button type="button" class="cherry-searcher__toggle" data-type="useRegex" aria-pressed="false" title="">${REGEX_ICON}</button>`,
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
}

/**
 * 应用替换行初始展开态
 * @param {HTMLElement} root 面板根节点
 * @param {boolean} replaceExpanded
 */
export function applyReplaceExpandedDomState(root, replaceExpanded) {
  if (!replaceExpanded) {
    return;
  }

  root.classList.add('is-replace-expanded');
  root.querySelector('.cherry-searcher__replace-row')?.classList.remove('is-hidden');
  root.querySelector('.cherry-searcher__expand-btn')?.setAttribute('aria-expanded', 'true');
}
