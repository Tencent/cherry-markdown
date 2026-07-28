import { describe, expect, it } from 'vite-plus/test';
import { pickSearcherLocale } from '@/toolbars/searcher/config';
import locales from '@/locales/index';

describe('pickSearcherLocale', () => {
  it('从 Cherry 全局 locales 提取 Searcher 文案', () => {
    expect(pickSearcherLocale(locales.zh_CN)).toMatchObject({
      searchFor: '查找',
      searchClear: '清空',
    });
    expect(pickSearcherLocale(locales.en_US).searchFor).toBe('Search for');
    expect(pickSearcherLocale(locales.ru_RU).searchFor).toBe('Найти');
  });

  it('仅提取 Searcher 面板使用的字段', () => {
    expect(pickSearcherLocale(locales.zh_CN)).toMatchObject({
      searchFor: locales.zh_CN.searchFor,
      caseSensitiveSearch: locales.zh_CN.caseSensitiveSearch,
    });
    expect(pickSearcherLocale(locales.zh_CN)).not.toHaveProperty('bold');
  });
});
