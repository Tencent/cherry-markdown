import { describe, it, expect } from 'vitest';
import getPosBydiffs from '../../src/utils/recount-pos';

describe('recount-pos 工具函数', () => {
  describe('getPosBydiffs', () => {
    it('计算光标位置', () => {
      const cases = [
        [5, 'hello world', 'hello world', 5],
        [3, 'hello world', 'hello', 3],
        [8, 'hello world', 'world', 2],
        [5, 'hello world', 'helloworld', 5],
        [0, '', '', 0],
        [3, 'old', 'new', 3],
        [0, 'world', 'hello', 0],
        [5, 'hello', 'world', 2],
        [5, 'hello world test', 'hello test', 5],
        [2, 'abc', 'ac', 2],
        [10, 'hello world', 'hello', 9],
      ];
      cases.forEach(([pos, oldStr, newStr, expected]) => {
        const result = getPosBydiffs(pos as number, oldStr as string, newStr as string);
        expect(result).toBe(expected);
      });
    });
  });
});
