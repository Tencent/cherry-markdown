import { describe, it, expect } from 'vitest';
import getPosBydiffs from '../../src/utils/recount-pos';

describe('recount-pos 工具函数', () => {
  describe('getPosBydiffs', () => {
    it('内容未改变时返回原位置', () => {
      const result = getPosBydiffs(5, 'hello world', 'hello world');
      expect(result).toBe(5);
    });

    it('删除光标后的内容', () => {
      const result = getPosBydiffs(3, 'hello world', 'hello');
      expect(result).toBe(3);
    });

    it('删除光标前的内容', () => {
      const result = getPosBydiffs(8, 'hello world', 'world');
      expect(result).toBe(2);
    });

    it('删除包含光标的内容', () => {
      const result = getPosBydiffs(5, 'hello world', 'helloworld');
      expect(result).toBe(5);
    });

    it('空字符串处理', () => {
      const result = getPosBydiffs(0, '', '');
      expect(result).toBe(0);
    });

    it('全部替换内容', () => {
      const result = getPosBydiffs(3, 'old', 'new');
      expect(result).toBe(3);
    });

    it('光标在开头时替换内容', () => {
      const result = getPosBydiffs(0, 'world', 'hello');
      expect(result).toBe(0);
    });

    it('光标在末尾时替换内容', () => {
      const result = getPosBydiffs(5, 'hello', 'world');
      expect(result).toBe(2);
    });

    it('部分内容删除', () => {
      const result = getPosBydiffs(5, 'hello world test', 'hello test');
      expect(result).toBe(5);
    });

    it('单字符删除', () => {
      const result = getPosBydiffs(2, 'abc', 'ac');
      expect(result).toBe(2);
    });

    it('光标在删除区域外', () => {
      const result = getPosBydiffs(10, 'hello world', 'hello');
      expect(result).toBe(9);
    });
  });
});
