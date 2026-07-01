import { describe, expect, it } from 'vitest';
import escapeRegExp from '@/utils/toolkit/escapeRegExp';

describe('utils/toolkit/escapeRegExp', () => {
  it('转义正则特殊字符', () => {
    expect(escapeRegExp('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('普通字符串保持不变', () => {
    expect(escapeRegExp('hello')).toBe('hello');
    expect(escapeRegExp('abc123')).toBe('abc123');
  });

  it('非字符串入参会转为字符串', () => {
    expect(escapeRegExp(42)).toBe('42');
  });

  it('转义后可安全用于 RegExp', () => {
    const keyword = 'a+b';
    const re = new RegExp(escapeRegExp(keyword));
    expect('x a+b y'.match(re)?.[0]).toBe('a+b');
    expect('x abb y'.match(re)).toBeNull();
  });
});
