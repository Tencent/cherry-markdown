import { describe, it, expect, beforeEach } from 'vitest';
import MyersDiff from '../../src/utils/myersDiff';

describe('myersDiff 工具函数', () => {
  beforeEach(() => {
    // @ts-ignore
    global.BUILD_ENV = 'test';
  });
  describe('MyersDiff', () => {
    it('比较数组差异', () => {
      const cases = [
        [[1, 2, 3], [1, 2, 3], []],
        [[1, 2, 3, 4], [1, 2, 3], [{ type: 'insert', oldIndex: 3, newIndex: 3 }]],
        [[1, 2], [1, 2, 3], [{ type: 'delete', oldIndex: 2, newIndex: 0 }]],
        [[1, 'new', 3], [1, 'old', 3], [{ type: 'update', oldIndex: 1, newIndex: 1 }]],
        [[], [], []],
        [[1, 2], [], [{ type: 'insert' }]],
        [[], [1, 2, 3], [{ type: 'delete', oldIndex: 0, newIndex: 0 }]],
      ];
      cases.forEach(([oldArr, newArr, expected]) => {
        const diff = new MyersDiff(oldArr as any, newArr as any);
        const result = diff.doDiff();
        if (expected.length === 0) {
          expect(result).toEqual([]);
        } else if (expected[0].type === 'insert' && !expected[0].oldIndex) {
          expect(result.length).toBeGreaterThan(0);
          expect(result[0]).toMatchObject({ type: 'insert' });
        } else {
          expect(result).toContainEqual(expected[0]);
        }
      });
    });

    it('比较字符串差异', () => {
      const cases = [
        ['hello', 'hello', []],
        ['hello!', 'hello', [{ type: 'insert', oldIndex: 5, newIndex: 5 }]],
        ['hello', 'hello!', [{ type: 'delete', oldIndex: 5, newIndex: 0 }]],
        ['hallo', 'hello', [{ type: 'update', oldIndex: 1, newIndex: 1 }]],
      ];
      cases.forEach(([oldStr, newStr, expected]) => {
        const diff = new MyersDiff(oldStr as string, newStr as string);
        const result = diff.doDiff();
        if (expected.length === 0) {
          expect(result).toEqual([]);
        } else {
          expect(result).toContainEqual(expected[0]);
        }
      });
    });

    it('使用自定义比较函数', () => {
      const getElement = (obj: { id: number }[], index: number) => obj[index].id;
      const diff = new MyersDiff([{ id: 1 }, { id: 2 }, { id: 3 }], [{ id: 1 }, { id: 2 }, { id: 3 }], getElement);
      const result = diff.doDiff();
      expect(result).toEqual([]);
    });
  });
});
