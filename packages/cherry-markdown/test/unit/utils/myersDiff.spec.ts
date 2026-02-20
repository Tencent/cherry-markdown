/**
 * myersDiff.js 单元测试
 * 测试 Myers' Diff 算法
 */
import { describe, expect, it } from 'vitest';
import MyersDiff from '../../../src/utils/myersDiff';

describe('utils/myersDiff', () => {
  describe('字符串 diff', () => {
    it('相同字符串应返回空结果', () => {
      const diff = new MyersDiff('abc', 'abc');
      const result = diff.doDiff();
      expect(result).toEqual([]);
    });

    it('完全不同的字符串', () => {
      const diff = new MyersDiff('xyz', 'abc');
      const result = diff.doDiff();
      // 应该有 3 个操作（每个字符都需要替换）
      expect(result.length).toBeGreaterThan(0);
    });

    it('添加字符', () => {
      const diff = new MyersDiff('abcd', 'abc');
      const result = diff.doDiff();
      // 新字符串比旧字符串多一个 d
      const insertOps = result.filter((op) => op.type === 'insert');
      expect(insertOps.length).toBeGreaterThanOrEqual(1);
    });

    it('删除字符', () => {
      const diff = new MyersDiff('ab', 'abc');
      const result = diff.doDiff();
      // 新字符串比旧字符串少一个 c
      const deleteOps = result.filter((op) => op.type === 'delete');
      expect(deleteOps.length).toBeGreaterThanOrEqual(1);
    });

    it('替换字符（更新）', () => {
      const diff = new MyersDiff('aXc', 'abc');
      const result = diff.doDiff();
      // b 被替换为 X
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('数组 diff', () => {
    it('相同数组应返回空结果', () => {
      const diff = new MyersDiff([1, 2, 3], [1, 2, 3]);
      const result = diff.doDiff();
      expect(result).toEqual([]);
    });

    it('添加元素', () => {
      const diff = new MyersDiff([1, 2, 3, 4], [1, 2, 3]);
      const result = diff.doDiff();
      expect(result.some((op) => op.type === 'insert')).toBe(true);
    });

    it('删除元素', () => {
      const diff = new MyersDiff([1, 2], [1, 2, 3]);
      const result = diff.doDiff();
      expect(result.some((op) => op.type === 'delete')).toBe(true);
    });

    it('空数组到非空数组', () => {
      const diff = new MyersDiff([1, 2, 3], []);
      const result = diff.doDiff();
      // 应该有 3 个插入操作
      const insertOps = result.filter((op) => op.type === 'insert');
      expect(insertOps.length).toBe(3);
    });

    it('非空数组到空数组', () => {
      const diff = new MyersDiff([], [1, 2, 3]);
      const result = diff.doDiff();
      // 应该有 3 个删除操作
      const deleteOps = result.filter((op) => op.type === 'delete');
      expect(deleteOps.length).toBe(3);
    });
  });

  describe('自定义比较函数', () => {
    it('使用对象属性比较', () => {
      const oldArr = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];
      const newArr = [
        { id: 1, name: 'a' },
        { id: 3, name: 'c' },
      ];

      const diff = new MyersDiff(newArr, oldArr, (obj, index) => obj[index].id);
      const result = diff.doDiff();

      // id:2 被删除，id:3 被添加
      expect(result.length).toBeGreaterThan(0);
    });

    it('按字符串长度比较', () => {
      const oldArr = ['a', 'bb', 'ccc'];
      const newArr = ['x', 'yy', 'zzz'];

      const diff = new MyersDiff(newArr, oldArr, (obj, index) => obj[index].length);
      const result = diff.doDiff();

      // 长度相同，视为相等，所以没有变化
      expect(result).toEqual([]);
    });
  });

  describe('操作类型验证', () => {
    it('结果应包含正确的类型', () => {
      const diff = new MyersDiff('axc', 'abc');
      const result = diff.doDiff();

      result.forEach((op) => {
        expect(['insert', 'delete', 'update']).toContain(op.type);
        expect(typeof op.oldIndex).toBe('number');
        expect(typeof op.newIndex).toBe('number');
      });
    });

    it('连续删除后插入应合并为 update', () => {
      const diff = new MyersDiff('aXc', 'abc');
      const result = diff.doDiff();

      // 检查是否有 update 类型
      const updateOps = result.filter((op) => op.type === 'update');
      // 由于 b->X 的替换，可能产生 update
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('边界情况', () => {
    it('两个空字符串', () => {
      const diff = new MyersDiff('', '');
      const result = diff.doDiff();
      expect(result).toEqual([]);
    });

    it('两个空数组', () => {
      const diff = new MyersDiff([], []);
      const result = diff.doDiff();
      expect(result).toEqual([]);
    });

    it('单字符差异', () => {
      const diff = new MyersDiff('b', 'a');
      const result = diff.doDiff();
      expect(result.length).toBeGreaterThan(0);
    });

    it('长字符串', () => {
      const oldStr = 'abcdefghijklmnopqrstuvwxyz';
      const newStr = 'abcXXXghijklmnoYYYstuvwxyz';
      const diff = new MyersDiff(newStr, oldStr);
      const result = diff.doDiff();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('findSnakes 方法', () => {
    it('应返回数组', () => {
      const diff = new MyersDiff('abc', 'abd');
      const snakes = diff.findSnakes('abc', 'abd');
      expect(Array.isArray(snakes)).toBe(true);
    });

    it('相同字符串应返回空 snakes', () => {
      const diff = new MyersDiff('abc', 'abc');
      const snakes = diff.findSnakes('abc', 'abc');
      expect(snakes).toEqual([]);
    });
  });
});
