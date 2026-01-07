import { describe, it, expect, vi } from 'vitest';
import SearchBox from '../../src/utils/cm-search-replace';

describe('cm-search-replace 工具函数', () => {
  describe('SearchBox', () => {
    let searchBox: SearchBox;

    it('创建实例', () => {
      const mockCherry = {
        locale: {
          close: '关闭',
          searchFor: '搜索',
          replaceWith: '替换',
          nextMatch: '下一个',
          previousMatch: '上一个',
          replace: '替换',
          replaceAll: '全部替换',
          toggleReplace: '切换替换',
          regExpSearch: '正则表达式搜索',
          caseSensitiveSearch: '区分大小写',
          wholeWordSearch: '全字匹配',
          matchesFoundText: '个匹配',
        },
        $event: { on: vi.fn() },
      };
      searchBox = new SearchBox(mockCherry);
      expect(searchBox).toBeInstanceOf(SearchBox);
    });

    it('parseString 解析转义字符', () => {
      const mockCherry = {
        locale: {
          close: '关闭',
          searchFor: '搜索',
          replaceWith: '替换',
          nextMatch: '下一个',
          previousMatch: '上一个',
          replace: '替换',
          replaceAll: '全部替换',
          toggleReplace: '切换替换',
          regExpSearch: '正则表达式搜索',
          caseSensitiveSearch: '区分大小写',
          wholeWordSearch: '全字匹配',
          matchesFoundText: '个匹配',
        },
        $event: { on: vi.fn() },
      };
      searchBox = new SearchBox(mockCherry);
      expect(searchBox.parseString('hello\\nworld')).toBe('hello\nworld');
      expect(searchBox.parseString('hello\\rworld')).toBe('hello\rworld');
      expect(searchBox.parseString('hello\\tworld')).toBe('hello\tworld');
      expect(searchBox.parseString('hello\\\\world')).toBe('hello\\world');
    });

    it('parseQuery 解析查询', () => {
      const mockCherry = {
        locale: {
          close: '关闭',
          searchFor: '搜索',
          replaceWith: '替换',
          nextMatch: '下一个',
          previousMatch: '上一个',
          replace: '替换',
          replaceAll: '全部替换',
          toggleReplace: '切换替换',
          regExpSearch: '正则表达式搜索',
          caseSensitiveSearch: '区分大小写',
          wholeWordSearch: '全字匹配',
          matchesFoundText: '个匹配',
        },
        $event: { on: vi.fn() },
      };
      searchBox = new SearchBox(mockCherry);
      const result = searchBox.parseQuery('test');
      expect(result).toBe('test');

      const regexResult = searchBox.parseQuery('/test/i');
      expect(regexResult).toBeInstanceOf(RegExp);
    });

    it('queryCaseInsensitive 判断是否不区分大小写', () => {
      const mockCherry = {
        locale: {
          close: '关闭',
          searchFor: '搜索',
          replaceWith: '替换',
          nextMatch: '下一个',
          previousMatch: '上一个',
          replace: '替换',
          replaceAll: '全部替换',
          toggleReplace: '切换替换',
          regExpSearch: '正则表达式搜索',
          caseSensitiveSearch: '区分大小写',
          wholeWordSearch: '全字匹配',
          matchesFoundText: '个匹配',
        },
        $event: { on: vi.fn() },
      };
      searchBox = new SearchBox(mockCherry);
      expect(searchBox.queryCaseInsensitive('test', false)).toBe(true);
      expect(searchBox.queryCaseInsensitive('test', true)).toBe(false);
      expect(searchBox.queryCaseInsensitive(/test/gi, false)).toBe(false);
    });

    it('searchOverlay 创建搜索覆盖层', () => {
      const mockCherry = {
        locale: {
          close: '关闭',
          searchFor: '搜索',
          replaceWith: '替换',
          nextMatch: '下一个',
          previousMatch: '上一个',
          replace: '替换',
          replaceAll: '全部替换',
          toggleReplace: '切换替换',
          regExpSearch: '正则表达式搜索',
          caseSensitiveSearch: '区分大小写',
          wholeWordSearch: '全字匹配',
          matchesFoundText: '个匹配',
        },
        $event: { on: vi.fn() },
      };
      searchBox = new SearchBox(mockCherry);
      const overlay = searchBox.searchOverlay('test', true);
      expect(overlay).toHaveProperty('token');
      expect(typeof overlay.token).toBe('function');
    });
  });
});
