/**
 * 搜索/替换：配置解析与文案提取
 *
 * 配置路径：`toolbars.config.searcher`，仅在 `new Cherry()` 时合并生效。
 * 实现位于 `toolbars/searcher/`，在 toolbars 中配置 `'search'` 即可启用。
 *
 * @module toolbars/searcher/config
 */

/** 面板从 Cherry 全局 locale 提取的字段 */
export const SEARCHER_LOCALE_KEYS = [
  'searchFor',
  'searchClear',
  'caseSensitiveSearch',
  'wholeWordSearch',
  'regExpSearch',
  'previousMatch',
  'nextMatch',
  'replace',
  'replaceWith',
  'replaceAll',
  'selectAllMatches',
  'toggleReplace',
];

/**
 * @typedef {object} SearcherConfig
 * @property {boolean} enableReplace 是否启用替换能力（默认 true）
 * @property {boolean} expandReplaceOnOpen 打开面板时是否默认展开替换行（默认 false）
 */

/**
 * 解析 `toolbars.config.searcher`
 * @param {import('~types/cherry').CherrySearcherToolbarOption | undefined} config
 * @returns {SearcherConfig}
 */
export function resolveSearcherConfig(config) {
  return {
    enableReplace: config?.enableReplace !== false,
    expandReplaceOnOpen: config?.expandReplaceOnOpen === true,
  };
}

/**
 * @param {{ options?: { toolbars?: { config?: { searcher?: import('~types/cherry').CherrySearcherToolbarOption } } } } | undefined} cherry
 * @returns {import('~types/cherry').CherrySearcherToolbarOption | undefined}
 */
export function getSearcherToolbarConfig(cherry) {
  const config = cherry?.options?.toolbars?.config?.searcher;
  if (!config || typeof config !== 'object') {
    return undefined;
  }
  return config;
}

/**
 * @param {{ options?: { toolbars?: { config?: { searcher?: import('~types/cherry').CherrySearcherToolbarOption } } } } | undefined} cherry
 * @returns {boolean}
 */
export function isSearcherReplaceEnabled(cherry) {
  return resolveSearcherConfig(getSearcherToolbarConfig(cherry)).enableReplace;
}

/**
 * 从 Cherry 全局 locale 提取 Searcher 面板文案
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
