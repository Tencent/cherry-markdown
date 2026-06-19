/**
 * Searcher 面板文案
 */
import zhCN from './locales/zh_CN.js';
import enUS from './locales/en_US.js';

/** @typedef {import('../types/searcher.types.js').SearcherLocale} SearcherLocale */
/** @typedef {import('../types/searcher.types.js').SearcherOptions} SearcherOptions */

/** 插件内置语言包 */
export const SEARCHER_LOCALES = {
  zh_CN: zhCN,
  en_US: enUS,
};

/** 缺省语言（独立使用时 fallback） */
export const DEFAULT_LOCALE_ID = 'en_US';

export const LOCALE_ZH_CN = zhCN;
export const LOCALE_EN_US = enUS;

/**
 * 解析语言 ID
 * @param {Partial<SearcherOptions>} [options]
 * @returns {'zh_CN' | 'en_US'}
 */
function resolveLocaleId(options = {}) {
  if (options.localeId === 'zh_CN' || options.localeId === 'en_US') {
    return options.localeId;
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    const normalized = navigator.language.replace('-', '_');
    if (normalized === 'zh_CN' || normalized === 'en_US') {
      return normalized;
    }
    if (normalized.startsWith('zh')) {
      return 'zh_CN';
    }
    if (normalized.startsWith('en')) {
      return 'en_US';
    }
  }

  return DEFAULT_LOCALE_ID;
}

/**
 * 合并文案：内置语言包 + options.locale
 * @param {Partial<SearcherOptions>} [options]
 * @returns {SearcherLocale & typeof enUS}
 */
export function resolveLocale(options = {}) {
  const localeId = resolveLocaleId(options);
  const baseLocale = SEARCHER_LOCALES[localeId] || SEARCHER_LOCALES[DEFAULT_LOCALE_ID];

  return {
    ...baseLocale,
    ...(options.locale || {}),
  };
}
