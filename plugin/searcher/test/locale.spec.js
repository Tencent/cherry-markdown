import { describe, expect, it } from 'vitest';
import { resolveLocale, SEARCHER_LOCALES } from '../src/locale.js';

describe('resolveLocale', () => {
  it('内置中英两套语言包', () => {
    expect(SEARCHER_LOCALES.zh_CN.searchFor).toBe('查找');
    expect(SEARCHER_LOCALES.en_US.searchFor).toBe('Search for');
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
