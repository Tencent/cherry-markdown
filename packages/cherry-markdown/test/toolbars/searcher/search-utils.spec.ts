/**
 * Searcher 插件搜索工具函数测试
 */
import { describe, it, expect } from 'vitest';
import { buildSearchRegex, findMatches, findNearestMatchIndex } from '@/toolbars/searcher/search-utils';

describe('searcher/search-utils', () => {
  it('findMatches: 应找到所有匹配项', () => {
    const text = 'hello world, hello cherry';
    const matches = findMatches(text, 'hello', false, false);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toEqual({ from: 0, to: 5 });
    expect(matches[1]).toEqual({ from: 13, to: 18 });
  });

  it('findMatches: 全字匹配应过滤部分匹配', () => {
    const text = 'cat category';
    const matches = findMatches(text, 'cat', false, true);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ from: 0, to: 3 });
  });

  it('findNearestMatchIndex: 应返回光标后的第一个匹配', () => {
    const matches = [
      { from: 0, to: 3 },
      { from: 10, to: 13 },
      { from: 20, to: 23 },
    ];
    expect(findNearestMatchIndex(matches, 5)).toBe(1);
    expect(findNearestMatchIndex(matches, 25)).toBe(0);
  });

  it('findNearestMatchIndex: 光标在匹配项内部时应选中该项', () => {
    const matches = [
      { from: 0, to: 5 },
      { from: 10, to: 15 },
    ];
    expect(findNearestMatchIndex(matches, 2)).toBe(0);
    expect(findNearestMatchIndex(matches, 12)).toBe(1);
  });

  it('findNearestMatchIndex: 光标在匹配末尾时不应跳到下一项', () => {
    const matches = [
      { from: 0, to: 5 },
      { from: 13, to: 18 },
    ];
    expect(findNearestMatchIndex(matches, 5)).toBe(0);
    expect(findNearestMatchIndex(matches, 18)).toBe(1);
  });

  it('buildSearchRegex: 空查询返回 null', () => {
    expect(buildSearchRegex('', false, false)).toBeNull();
  });

  it('buildSearchRegex: 无效正则返回 null', () => {
    expect(buildSearchRegex('[', false, false, true)).toBeNull();
  });
});
