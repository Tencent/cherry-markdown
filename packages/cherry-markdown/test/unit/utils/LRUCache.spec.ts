/**
 * LRUCache.js 单元测试
 * 测试 LRU 缓存类
 */
import { describe, expect, it, beforeEach } from 'vitest';
import LRUCache from '../../../src/utils/LRUCache';

describe('utils/LRUCache', () => {
  let cache: LRUCache;

  beforeEach(() => {
    cache = new LRUCache(5);
  });

  describe('基本操作', () => {
    it('应该正确设置和获取值', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    it('获取不存在的键应返回 undefined', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('应该正确检测键是否存在', () => {
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('应该正确删除键', () => {
      cache.set('a', 1);
      expect(cache.delete('a')).toBe(true);
      expect(cache.has('a')).toBe(false);
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('应该正确清空缓存', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.has('a')).toBe(false);
    });
  });

  describe('LRU 行为', () => {
    it('获取值应更新访问顺序', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // 访问 a，使其变为最新
      cache.get('a');

      const keys = cache.keys();
      // a 应该在最后（最新）
      expect(keys[keys.length - 1]).toBe('a');
    });

    it('设置已存在的键应更新位置', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // 重新设置 a
      cache.set('a', 10);

      const keys = cache.keys();
      expect(keys[keys.length - 1]).toBe('a');
      expect(cache.get('a')).toBe(10);
    });
  });

  describe('容量限制', () => {
    it('超过容量时应删除旧项', () => {
      const smallCache = new LRUCache(3);
      smallCache.set('a', 1);
      smallCache.set('b', 2);
      smallCache.set('c', 3);
      smallCache.set('d', 4); // 触发清理

      // 容量为 3，添加第 4 个后会触发清理
      expect(smallCache.size).toBeLessThanOrEqual(3);
    });

    it('批量删除测试（容量 >= 100）', () => {
      const largeCache = new LRUCache(100);

      // 添加 100 个项
      for (let i = 0; i < 100; i++) {
        largeCache.set(`key${i}`, i);
      }

      expect(largeCache.size).toBe(100);

      // 再添加一个，触发批量删除
      largeCache.set('overflow', 999);

      // 应该删除了一些旧项
      expect(largeCache.size).toBeLessThan(100);
      expect(largeCache.has('overflow')).toBe(true);
    });
  });

  describe('迭代方法', () => {
    beforeEach(() => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
    });

    it('keys() 应返回所有键', () => {
      const keys = cache.keys();
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
      expect(keys.length).toBe(3);
    });

    it('values() 应返回所有值', () => {
      const values = cache.values();
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(values).toContain(3);
      expect(values.length).toBe(3);
    });

    it('entries() 应返回所有键值对', () => {
      const entries = cache.entries();
      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
      expect(entries).toContainEqual(['c', 3]);
      expect(entries.length).toBe(3);
    });
  });

  describe('size 属性', () => {
    it('初始大小应为 0', () => {
      const newCache = new LRUCache(10);
      expect(newCache.size).toBe(0);
    });

    it('添加后大小应增加', () => {
      cache.set('a', 1);
      expect(cache.size).toBe(1);
      cache.set('b', 2);
      expect(cache.size).toBe(2);
    });

    it('删除后大小应减少', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.delete('a');
      expect(cache.size).toBe(1);
    });

    it('重复设置同一键不增加大小', () => {
      cache.set('a', 1);
      cache.set('a', 2);
      cache.set('a', 3);
      expect(cache.size).toBe(1);
    });
  });

  describe('边界情况', () => {
    it('容量为 1 的缓存', () => {
      const tinyCache = new LRUCache(1);
      tinyCache.set('a', 1);
      expect(tinyCache.get('a')).toBe(1);

      tinyCache.set('b', 2);
      expect(tinyCache.has('b')).toBe(true);
      // a 可能已被删除
    });

    it('各种类型的值', () => {
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('object', { foo: 'bar' });
      cache.set('array', [1, 2, 3]);
      cache.set('null', null);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('object')).toEqual({ foo: 'bar' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
      expect(cache.get('null')).toBeNull();
    });

    it('空字符串作为键', () => {
      cache.set('', 'empty key');
      expect(cache.get('')).toBe('empty key');
      expect(cache.has('')).toBe(true);
    });
  });
});
