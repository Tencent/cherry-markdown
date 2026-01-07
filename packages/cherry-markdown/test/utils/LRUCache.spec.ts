import { describe, expect, it, beforeEach } from 'vitest';
import LRUCache from '../../src/utils/LRUCache';

describe('utils/LRUCache', () => {
  let cache: LRUCache;

  beforeEach(() => {
    cache = new LRUCache(3);
  });

  describe('constructor', () => {
    it('should initialize with given capacity', () => {
      const newCache = new LRUCache(5);
      expect(newCache.capacity).toBe(5);
      expect(newCache.size).toBe(0);
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should return value for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should update position on get (LRU behavior)', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.get('key1'); // key1 should be most recent

      cache.set('key4', 'value4'); // Since capacity is 3, it will delete 100 items (which is all 3) before adding key4
      // After deletion: cache is empty
      // After adding key4: cache has key4 only
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('set', () => {
    it('should set a new key-value pair', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.size).toBe(1);
    });

    it('should update existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
      expect(cache.size).toBe(1);
    });

    it('should evict old entries when capacity is reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // should delete all 3 before adding key4

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
      expect(cache.get('key4')).toBe('value4');
      expect(cache.size).toBe(1);
    });

    it('should update position when setting existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key1', 'value1-updated'); // key1 should be most recent

      cache.set('key4', 'value4'); // will delete all before adding
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
      expect(cache.get('key4')).toBe('value4');
    });

    it('should delete all entries when adding at capacity', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      expect(cache.size).toBe(3);

      cache.set('key4', 'value4');
      expect(cache.size).toBe(1);
      expect(cache.get('key4')).toBe('value4');
    });

    it('should handle case when cache becomes empty during deletion', () => {
      const smallCache = new LRUCache(1);
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2'); // deletes key1 and adds key2
      expect(smallCache.size).toBe(1);
      expect(smallCache.get('key2')).toBe('value2');
    });

    it('should handle large capacity with many entries', () => {
      const largeCache = new LRUCache(150);
      // Add 150 entries
      for (let i = 0; i < 150; i++) {
        largeCache.set(`key${i}`, `value${i}`);
      }
      expect(largeCache.size).toBe(150);

      // Adding 151st should delete first 100
      largeCache.set('key150', 'value150');
      expect(largeCache.size).toBe(51);
      expect(largeCache.get('key0')).toBeUndefined();
      expect(largeCache.get('key50')).toBeUndefined();
      expect(largeCache.get('key99')).toBeUndefined();
      expect(largeCache.get('key100')).toBeDefined();
    });
  });

  describe('has', () => {
    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });
  });

  describe('delete', () => {
    it('should return false for non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should return true and delete existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.size).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });
  });

  describe('keys', () => {
    it('should return empty array for empty cache', () => {
      expect(cache.keys()).toEqual([]);
    });

    it('should return all keys in insertion order', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.keys()).toEqual(['key1', 'key2', 'key3']);
    });

    it('should reflect LRU order', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.get('key1'); // key1 becomes most recent

      expect(cache.keys()).toEqual(['key2', 'key3', 'key1']);
    });
  });

  describe('values', () => {
    it('should return empty array for empty cache', () => {
      expect(cache.values()).toEqual([]);
    });

    it('should return all values in insertion order', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.values()).toEqual(['value1', 'value2', 'value3']);
    });
  });

  describe('entries', () => {
    it('should return empty array for empty cache', () => {
      expect(cache.entries()).toEqual([]);
    });

    it('should return all entries as key-value pairs', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.entries()).toEqual([
        ['key1', 'value1'],
        ['key2', 'value2'],
        ['key3', 'value3'],
      ]);
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size).toBe(0);
    });

    it('should return the number of entries', () => {
      expect(cache.size).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
      cache.set('key3', 'value3');
      expect(cache.size).toBe(3);
    });

    it('should update size on delete', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.delete('key1');
      expect(cache.size).toBe(1);
    });
  });
});
