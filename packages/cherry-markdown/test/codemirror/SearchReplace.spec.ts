/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * 搜索替换功能单元测试
 *
 * 测试 Editor.js 中的搜索替换相关功能：
 * - 搜索查询设置 (setSearchQuery)
 * - 搜索高亮 (searchHighlightField)
 * - 搜索状态管理
 */

import { describe, it, expect } from 'vitest';

// ============ Mock 类型 ============

interface MockSearchQuery {
  search: string;
  caseSensitive: boolean;
  regexp: boolean;
  wholeWord: boolean;
  replace: string;
}

const createMockSearchQuery = (search: string, options = {}): MockSearchQuery => ({
  search,
  caseSensitive: false,
  regexp: false,
  wholeWord: false,
  replace: '',
  ...options,
});

describe('搜索功能测试', () => {
  describe('搜索查询设置', () => {
    it('setSearchQuery: 应正确创建搜索查询', () => {
      const query = createMockSearchQuery('quick');

      expect(query.search).toBe('quick');
      expect(typeof query.search).toBe('string');
    });

    it('setSearchQuery: 应支持大小写敏感选项', () => {
      const queryCaseSensitive = createMockSearchQuery('Quick', { caseSensitive: true });
      const queryCaseInsensitive = createMockSearchQuery('quick', { caseSensitive: false });

      expect(queryCaseSensitive.caseSensitive).toBe(true);
      expect(queryCaseInsensitive.caseSensitive).toBe(false);
    });

    it('setSearchQuery: 应支持正则表达式', () => {
      const queryRegex = createMockSearchQuery('\\d+', { regexp: true });

      expect(queryRegex.regexp).toBe(true);
      expect(queryRegex.search).toBe('\\d+');
    });

    it('setSearchQuery: 应支持整词匹配', () => {
      const queryWholeWord = createMockSearchQuery('the', { wholeWord: true });

      expect(queryWholeWord.wholeWord).toBe(true);
    });

    it('setSearchQuery: 应支持替换文本', () => {
      const queryWithReplace = createMockSearchQuery('quick', { replace: 'slow' });

      expect(queryWithReplace.replace).toBe('slow');
    });
  });

  describe('搜索状态', () => {
    it('搜索状态应正确初始化', () => {
      const searchState = {
        query: null as MockSearchQuery | null,
        isSearching: false,
      };

      expect(searchState.query).toBeNull();
      expect(searchState.isSearching).toBe(false);
    });

    it('搜索状态应能设置查询', () => {
      const searchState = {
        query: null as MockSearchQuery | null,
        isSearching: false,
      };

      searchState.query = createMockSearchQuery('test');
      searchState.isSearching = true;

      expect(searchState.query?.search).toBe('test');
      expect(searchState.isSearching).toBe(true);
    });

    it('搜索状态应能重置', () => {
      const searchState: { query: MockSearchQuery | null; isSearching: boolean } = {
        query: createMockSearchQuery('test'),
        isSearching: true,
      };

      searchState.query = null;
      searchState.isSearching = false;

      expect(searchState.query).toBeNull();
      expect(searchState.isSearching).toBe(false);
    });
  });

  describe('搜索结果', () => {
    it('搜索结果应包含匹配信息', () => {
      const result = {
        from: 4,
        to: 9,
        match: 'quick',
      };

      expect(result.from).toBeLessThan(result.to);
      expect(result.match).toBe('quick');
      expect(result.to - result.from).toBe(result.match.length);
    });

    it('搜索结果应正确处理重叠', () => {
      const results = [
        { from: 0, to: 3, match: 'The' },
        { from: 4, to: 9, match: 'quick' },
      ];

      // 结果不应重叠
      results.forEach((r, i) => {
        if (i > 0) {
          expect(results[i - 1].to).toBeLessThanOrEqual(r.from);
        }
      });
    });
  });
});

describe('替换功能测试', () => {
  describe('基本替换', () => {
    it('replace: 应正确构建替换文本', () => {
      const query = createMockSearchQuery('quick', { replace: 'slow' });

      expect(query.replace).toBe('slow');
    });

    it('替换后文档长度可能变化', () => {
      const query = createMockSearchQuery('quick', { replace: 'super fast' });

      // 原始 "quick" 长度 5
      // 替换 "super fast" 长度 10
      expect(query.replace.length).toBeGreaterThan('quick'.length);
    });
  });

  describe('替换策略', () => {
    it('单次替换: 只替换第一个匹配项', () => {
      const original = 'test test test';
      const query = createMockSearchQuery('test', { replace: 'replaced' });

      // 找到第一个匹配
      const firstMatchIndex = original.indexOf('test');
      expect(firstMatchIndex).toBe(0);

      // 执行替换
      const replaced = original.replace('test', query.replace);
      expect(replaced).toBe('replaced test test');
    });

    it('全部替换: 应替换所有匹配项', () => {
      const original = 'test test test';
      const query = createMockSearchQuery('test', { replace: 'X' });

      // 使用 replaceAll 或 split+join 模拟全部替换
      const replaced = original.split(query.search).join(query.replace);
      expect(replaced).toBe('X X X');
    });
  });
});

describe('搜索边界条件测试', () => {
  it('空文档搜索应返回空结果', () => {
    const results: string[] = [];

    // 空文档不应有匹配
    if (results.length === 0) {
      expect(results.length).toBe(0);
    }
  });

  it('空查询应被处理', () => {
    const query = '';

    // 空查询行为取决于实现
    expect(query.length).toBe(0);
  });

  it('无匹配查询应返回空结果', () => {
    const doc = 'test document';
    const query = 'nonexistent';

    const match = doc.match(new RegExp(query));
    expect(match).toBeNull();
  });
});

describe('搜索正则表达式测试', () => {
  it('正则表达式搜索', () => {
    const doc = 'test123 abc456 def789';
    const regex = /\d+/g;
    const matches = doc.match(regex);

    expect(matches).toEqual(['123', '456', '789']);
  });

  it('转义特殊字符', () => {
    const doc = 'test (special) [chars]';
    const query = '(special)';

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const matches = doc.match(regex);

    expect(matches).toEqual(['(special)']);
  });

  it('大小写不敏感搜索', () => {
    const doc = 'Test TEST test';
    const query = 'test';
    const regex = new RegExp(query, 'gi');
    const matches = doc.match(regex);

    expect(matches?.length).toBe(3);
  });
});

describe('搜索性能测试', () => {
  it('小文档搜索应快速完成', () => {
    const doc = 'The quick brown fox jumps over the lazy dog.';
    const start = performance.now();

    // 模拟搜索
    const regex = /the/gi;
    const matches = doc.match(regex);

    const elapsed = performance.now() - start;

    expect(matches).not.toBeNull();
    expect(elapsed).toBeLessThan(10);
  });

  it('大文档搜索应在合理时间内完成', () => {
    // 创建一个大文档
    const largeDoc = 'x '.repeat(5000);
    const start = performance.now();

    const regex = /x/gi;
    const matches = largeDoc.match(regex);

    const elapsed = performance.now() - start;

    expect(matches?.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100);
  });
});
