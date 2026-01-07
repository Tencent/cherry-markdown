import { describe, it, expect, beforeEach } from 'vitest';
import MyersDiff from '../../src/utils/myersDiff';

describe('myersDiff 工具函数', () => {
  beforeEach(() => {
    // @ts-ignore
    global.BUILD_ENV = 'test';
  });
  describe('MyersDiff', () => {
    it('比较相同的数组', () => {
      const diff = new MyersDiff([1, 2, 3], [1, 2, 3]);
      const result = diff.doDiff();
      expect(result).toEqual([]);
    });

    it('检测添加的元素', () => {
      const diff = new MyersDiff([1, 2, 3, 4], [1, 2, 3]);
      const result = diff.doDiff();
      expect(result).toContainEqual({ type: 'insert', oldIndex: 3, newIndex: 3 });
    });

    it('检测删除的元素', () => {
      const diff = new MyersDiff([1, 2], [1, 2, 3]);
      const result = diff.doDiff();
      expect(result).toContainEqual({ type: 'delete', oldIndex: 2, newIndex: 0 });
    });

    it('检测更新的元素', () => {
      const diff = new MyersDiff([1, 'new', 3], [1, 'old', 3]);
      const result = diff.doDiff();
      expect(result).toContainEqual({ type: 'update', oldIndex: 1, newIndex: 1 });
    });

    it('比较相同的字符串', () => {
      const diff = new MyersDiff('hello', 'hello');
      const result = diff.doDiff();
      expect(result).toEqual([]);
    });

    it('字符串添加字符', () => {
      const diff = new MyersDiff('hello!', 'hello');
      const result = diff.doDiff();
      expect(result).toContainEqual({ type: 'insert', oldIndex: 5, newIndex: 5 });
    });

    it('字符串删除字符', () => {
      const diff = new MyersDiff('hello', 'hello!');
      const result = diff.doDiff();
      expect(result).toContainEqual({ type: 'delete', oldIndex: 5, newIndex: 0 });
    });

    it('字符串更新字符', () => {
      const diff = new MyersDiff('hallo', 'hello');
      const result = diff.doDiff();
      expect(result).toContainEqual({ type: 'update', oldIndex: 1, newIndex: 1 });
    });

    it('使用自定义比较函数', () => {
      const getElement = (obj: { id: number }[], index: number) => obj[index].id;
      const diff = new MyersDiff(
        [{ id: 1 }, { id: 2 }, { id: 3 }],
        [{ id: 1 }, { id: 2 }, { id: 3 }],
        getElement
      );
      const result = diff.doDiff();
      expect(result).toEqual([]);
    });

    it('空数组比较', () => {
      const diff = new MyersDiff([], []);
      const result = diff.doDiff();
      expect(result).toEqual([]);
    });

    it('从空数组添加元素', () => {
      const diff = new MyersDiff([1, 2], []);
      const result = diff.doDiff();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatchObject({ type: 'insert' });
    });

    it('删除所有元素', () => {
      const diff = new MyersDiff([], [1, 2, 3]);
      const result = diff.doDiff();
      expect(result).toContainEqual({ type: 'delete', oldIndex: 0, newIndex: 0 });
    });
  });
});
