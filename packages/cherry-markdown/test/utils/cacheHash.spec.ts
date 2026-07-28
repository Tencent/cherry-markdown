import { describe, expect, it } from 'vite-plus/test';
import LRUCache from '../../src/utils/LRUCache';
import hashHex from '../../src/utils/hash';

describe('utils/LRUCache', () => {
  it('stores, enumerates, deletes, and clears entries', () => {
    const cache = new LRUCache(3);
    cache.set('a', 1);
    cache.set('b', 2);

    expect(cache.size).toBe(2);
    expect(cache.has('a')).toBe(true);
    expect(cache.keys()).toEqual(['a', 'b']);
    expect(cache.values()).toEqual([1, 2]);
    expect(cache.entries()).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
    expect(cache.delete('a')).toBe(true);
    expect(cache.get('missing')).toBeUndefined();
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('refreshes recently read and updated entries', () => {
    const cache = new LRUCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    expect(cache.get('a')).toBe(1);
    cache.set('b', 20);

    expect(cache.keys()).toEqual(['c', 'a', 'b']);
    expect(cache.values()).toEqual([3, 1, 20]);
  });

  it('evicts the oldest batch when capacity is reached', () => {
    const cache = new LRUCache(105);
    for (let index = 0; index < 105; index += 1) {
      cache.set(`key-${index}`, index);
    }

    cache.set('newest', 999);

    expect(cache.size).toBe(6);
    expect(cache.has('key-0')).toBe(false);
    expect(cache.keys()).toEqual(['key-100', 'key-101', 'key-102', 'key-103', 'key-104', 'newest']);
  });
});

describe('utils/hash', () => {
  it('returns deterministic 64-bit hexadecimal identifiers', () => {
    expect(hashHex('cherry markdown')).toMatch(/^[0-9a-f]{16}$/);
    expect(hashHex('cherry markdown')).toBe(hashHex('cherry markdown'));
    expect(hashHex('cherry markdown')).not.toBe(hashHex('cherry-markdown'));
  });

  it('covers short, long, unicode, and normalized non-string inputs', () => {
    const values = ['', 'short', '12345678', 'a long value with a tail', '中文文本'];
    expect(new Set(values.map(hashHex)).size).toBe(values.length);
    expect(hashHex(null as never)).toBe(hashHex(''));
    expect(hashHex(undefined as never)).toBe(hashHex(''));
    expect(hashHex(42 as never)).toBe(hashHex('42'));
  });
});
