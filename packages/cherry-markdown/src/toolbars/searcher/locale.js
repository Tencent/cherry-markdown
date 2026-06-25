/**
 * 从 Cherry 全局 locales 提取 Searcher 面板文案
 */
/** Searcher 面板使用的全局 locale 字段 */
export const SEARCHER_LOCALE_KEYS = [
  'searchFor',
  'searchClear',
  'caseSensitiveSearch',
  'wholeWordSearch',
  'previousMatch',
  'nextMatch',
  'replace',
  'replaceWith',
  'replaceAll',
  'toggleReplace',
];

/**
 * @param {Record<string, string | undefined>} [hostLocale]
 * @returns {Record<string, string>}
 */
export function pickSearcherLocale(hostLocale = {}) {
  /** @type {Record<string, string>} */
  const picked = {};

  SEARCHER_LOCALE_KEYS.forEach((key) => {
    const value = hostLocale[key];
    if (value !== undefined) {
      picked[key] = value;
    }
  });

  return picked;
}
