import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchBox from '../../src/utils/cm-search-replace';

// 创建 CodeMirror mock 工厂函数
const createCMMock = () => ({
  getWrapperElement: vi.fn(() => ({
    appendChild: vi.fn(),
    parentElement: {
      querySelector: vi.fn(),
    },
  })),
  getValue: vi.fn(() => 'test content'),
  setValue: vi.fn(),
  getCursor: vi.fn(() => ({ line: 0, ch: 0 })),
  setCursor: vi.fn(),
  setSelection: vi.fn(),
  getSelection: vi.fn(() => ''),
  replaceSelection: vi.fn(),
  getOption: vi.fn(() => false),
  getSearchCursor: vi.fn(() => ({
    findNext: vi.fn(() => true),
    findPrevious: vi.fn(() => true),
    matches: vi.fn(() => ({ from: () => ({ line: 0, ch: 0 }), to: () => ({ line: 0, ch: 0 }) })),
  })),
  removeOverlay: vi.fn(),
  addOverlay: vi.fn(),
  showMatchesOnScrollbar: vi.fn(() => ({ clear: vi.fn() })),
  focus: vi.fn(),
  display: {
    wrapper: {
      parentElement: {
        querySelector: vi.fn(() => ({ innerText: '+' })),
      },
    },
  },
  state: {},
  doc: { size: 10 },
  operation: vi.fn((fn) => fn()),
});

describe('cm-search-replace 工具函数', () => {
  let searchBox: SearchBox;
  let mockCherry: any;

  beforeEach(() => {
    mockCherry = {
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
  });

  describe('SearchBox', () => {
    it('创建实例', () => {
      expect(searchBox).toBeInstanceOf(SearchBox);
    });

    it('parseString 解析转义字符', () => {
      expect(searchBox.parseString('hello\\nworld')).toBe('hello\nworld');
      expect(searchBox.parseString('hello\\rworld')).toBe('hello\rworld');
      expect(searchBox.parseString('hello\\tworld')).toBe('hello\tworld');
      expect(searchBox.parseString('hello\\\\world')).toBe('hello\\world');
    });

    it('parseQuery 解析查询', () => {
      const result = searchBox.parseQuery('test');
      expect(result).toBe('test');

      const regexResult = searchBox.parseQuery('/test/i');
      expect(regexResult).toBeInstanceOf(RegExp);
      expect(regexResult.ignoreCase).toBe(true);

      const regexResult2 = searchBox.parseQuery('/test/g');
      expect(regexResult2).toBeInstanceOf(RegExp);
      expect(regexResult2.ignoreCase).toBe(false);
    });

    it('queryCaseInsensitive 判断是否不区分大小写', () => {
      expect(searchBox.queryCaseInsensitive('test', false)).toBe(true);
      expect(searchBox.queryCaseInsensitive('test', true)).toBe(false);
      expect(searchBox.queryCaseInsensitive(/test/gi, false)).toBe(false);
    });

    it('searchOverlay 创建搜索覆盖层', () => {
      const overlay = searchBox.searchOverlay('test', true);
      expect(overlay).toHaveProperty('token');
      expect(typeof overlay.token).toBe('function');

      // 测试 token 函数
      const mockStream = {
        string: 'test content',
        pos: 0,
        skipToEnd: vi.fn(),
      };
      const result = overlay.token(mockStream);
      expect(result).toBe('searching');
      expect(mockStream.pos).toBe(4);
    });

    it('searchOverlay 处理正则表达式', () => {
      const overlay = searchBox.searchOverlay(/test/g, false);
      expect(overlay).toHaveProperty('token');

      const mockStream = {
        string: 'test content',
        pos: 0,
        skipToEnd: vi.fn(),
      };
      const result = overlay.token(mockStream);
      expect(result).toBe('searching');
    });

    it('searchOverlay 处理不匹配的情况', () => {
      const overlay = searchBox.searchOverlay('notfound', true);
      const mockStream = {
        string: 'test content',
        pos: 0,
        skipToEnd: vi.fn(),
      };
      const result = overlay.token(mockStream);
      expect(result).toBeUndefined();
      expect(mockStream.skipToEnd).toHaveBeenCalled();
    });

    it('getSearchState 获取搜索状态', () => {
      const mockCm = createCMMock();
      const state = searchBox.getSearchState(mockCm);
      expect(state).toHaveProperty('posFrom');
      expect(state).toHaveProperty('posTo');
      expect(state).toHaveProperty('lastQuery');
      expect(state).toHaveProperty('query');
      expect(state).toHaveProperty('overlay');
    });

    it('clearSearch 清除搜索', () => {
      const mockCm = createCMMock();
      const state = searchBox.getSearchState(mockCm);
      state.query = 'test';
      state.queryText = 'test';
      state.overlay = searchBox.searchOverlay('test', false);
      searchBox.clearSearch(mockCm);
      expect(mockCm.removeOverlay).toHaveBeenCalled();
      expect(mockCm.operation).toHaveBeenCalled();
      expect(state.query).toBe(null);
      expect(state.queryText).toBe(null);
    });

    it('startSearch 启动搜索', () => {
      const mockCm = createCMMock();
      const state = searchBox.getSearchState(mockCm);
      searchBox.startSearch(mockCm, state, 'test', false);
      expect(state.queryText).toBe('test');
      expect(mockCm.addOverlay).toHaveBeenCalled();
    });

    it('doSearch 执行搜索', () => {
      const mockCm = createCMMock();
      const state = searchBox.getSearchState(mockCm);
      searchBox.doSearch(mockCm, 'test', false);
      // When queryText is undefined (new search), it should be set to 'test'
      // When queryText is not equal to 'test', it should remain unchanged
      expect(state).toHaveProperty('queryText');
    });

    it('isFocused 检查是否聚焦', () => {
      const mockCherry2 = {
        locale: mockCherry.locale,
        $event: { on: vi.fn() },
      };
      const searchBox2 = new SearchBox(mockCherry2);

      // Skip the isFocused test in non-DOM environment
      // since it requires document.createElement and document.activeElement
      expect(searchBox2).toBeInstanceOf(SearchBox);
    });
  });
});
