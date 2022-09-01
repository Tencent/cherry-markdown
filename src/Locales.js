import locales from '@/locales';

/**
 * translate by key
 * @param {string} key
 * @param {string} [lang='zh_CN']
 * @returns
 */
export function t(key, lang = 'zh_CN') {
  return locales[lang]?.[key] ?? key;
}
