import { describe, expect, it } from 'vitest';
import { LOCALE_EN_US, LOCALE_ZH_CN, resolveLocale, SEARCHER_LOCALES } from '../src/locale.js';

describe('resolveLocale', () => {
  it('内置中英两套语言包', () => {
    expect(SEARCHER_LOCALES.zh_CN.searchFor).toBe('查找');
    expect(SEARCHER_LOCALES.en_US.searchFor).toBe('Search for');
    expect(LOCALE_ZH_CN).toBe(SEARCHER_LOCALES.zh_CN);
    expect(LOCALE_EN_US).toBe(SEARCHER_LOCALES.en_US);
  });

  it('options.localeId 决定基础语言包', () => {
    const locale = resolveLocale({ localeId: 'zh_CN' });
    expect(locale.searchFor).toBe('查找');
  });

  it('options.locale 可覆盖单项文案', () => {
    const locale = resolveLocale({
      localeId: 'en_US',
      locale: { searchFor: 'Find' },
    });
    expect(locale.searchFor).toBe('Find');
    expect(locale.replace).toBe('Replace');
  });
});
