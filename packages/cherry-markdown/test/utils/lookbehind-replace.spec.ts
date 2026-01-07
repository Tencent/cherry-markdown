import { describe, it, expect } from 'vitest';
import { replaceLookbehind } from '../../src/utils/lookbehind-replace';

describe('lookbehind-replace 工具函数', () => {
  describe('replaceLookbehind', () => {
    it('正则为空时返回原字符串', () => {
      const result = replaceLookbehind('hello world', null as any, () => '');
      expect(result).toBe('hello world');
    });

    it('简单替换', () => {
      const regex = /hello/g;
      const result = replaceLookbehind('hello world', regex, () => 'hi');
      expect(result).toBe('hi world');
    });

    it('使用匹配内容的替换', () => {
      const regex = /\d+/g;
      const result = replaceLookbehind('test 123 abc 456', regex, (match) => `[${match}]`);
      expect(result).toBe('test [123] abc [456]');
    });

    it('无匹配时返回原字符串', () => {
      const regex = /xyz/g;
      const result = replaceLookbehind('hello world', regex, () => 'hi');
      expect(result).toBe('hello world');
    });

    it('使用捕获组', () => {
      const regex = /(\d+)-(\d+)/g;
      const result = replaceLookbehind('10-20 30-40', regex, (match, p1, p2) => `${p2}-${p1}`);
      expect(result).toBe('20-10 40-30');
    });
  });
});
