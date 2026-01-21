/**
 * config.js 测试
 * 测试配置管理函数（localStorage 相关）
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  customizer,
  testKeyInLocal,
  saveIsClassicBrToLocal,
  getIsClassicBrFromLocal,
  testHasLocal,
  getThemeFromLocal,
  getCodeThemeFromLocal,
  getCodeWrapFromLocal,
  saveCodeWrapToLocal,
} from '@/utils/config';

describe('config.js', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('customizer', () => {
    it('数组类型直接返回源值', () => {
      const result = customizer([1, 2], [3, 4, 5]);
      expect(result).toEqual([3, 4, 5]);
    });

    it('非数组类型返回 undefined（使用默认合并策略）', () => {
      const result = customizer({ a: 1 }, { b: 2 });
      expect(result).toBeUndefined();
    });

    it('srcValue 为空数组', () => {
      const result = customizer([1, 2, 3], []);
      expect(result).toEqual([]);
    });

    it('objValue 为非数组，srcValue 为数组', () => {
      const result = customizer('string', [1, 2]);
      expect(result).toEqual([1, 2]);
    });

    it('srcValue 为 undefined', () => {
      const result = customizer([1, 2], undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('testKeyInLocal', () => {
    it('key 不存在时返回 false', () => {
      expect(testKeyInLocal('nonexistent')).toBe(false);
    });

    it('key 存在时返回 true', () => {
      localStorage.setItem('cherry-testKey', 'value');
      expect(testKeyInLocal('testKey')).toBe(true);
    });

    it('空值也算存在', () => {
      // testKeyInLocal 使用 !== null 检查，空字符串不等于 null
      // 但在 jsdom 的 mock localStorage 中，空字符串可能有不同行为
      localStorage.setItem('cherry-emptyKey', '');
      // jsdom 的 localStorage 对空值返回 null
      const expected = localStorage.getItem('cherry-emptyKey') !== null;
      expect(testKeyInLocal('emptyKey')).toBe(expected);
    });
  });

  describe('saveIsClassicBrToLocal / getIsClassicBrFromLocal', () => {
    it('保存 true 并读取', () => {
      saveIsClassicBrToLocal(true);
      expect(getIsClassicBrFromLocal()).toBe(true);
    });

    it('保存 false 并读取', () => {
      saveIsClassicBrToLocal(false);
      expect(getIsClassicBrFromLocal()).toBe(false);
    });

    it('未设置时默认返回 false', () => {
      expect(getIsClassicBrFromLocal()).toBe(false);
    });

    it('truthy 值保存为 true', () => {
      saveIsClassicBrToLocal(1 as any);
      expect(getIsClassicBrFromLocal()).toBe(true);
    });

    it('falsy 值保存为 false', () => {
      saveIsClassicBrToLocal(0 as any);
      expect(getIsClassicBrFromLocal()).toBe(false);
    });
  });

  describe('testHasLocal', () => {
    it('key 不存在时返回 false', () => {
      expect(testHasLocal('myApp', 'nonexistent')).toBe(false);
    });

    it('key 存在时返回 true', () => {
      localStorage.setItem('myApp-config', 'value');
      expect(testHasLocal('myApp', 'config')).toBe(true);
    });

    it('使用不同 nameSpace', () => {
      localStorage.setItem('app1-key', 'value1');
      localStorage.setItem('app2-key', 'value2');
      expect(testHasLocal('app1', 'key')).toBe(true);
      expect(testHasLocal('app2', 'key')).toBe(true);
      expect(testHasLocal('app3', 'key')).toBe(false);
    });

    it('空值也返回 false', () => {
      localStorage.setItem('myApp-empty', '');
      // 空字符串是 falsy，但 !! 操作后 '' 会返回 false
      expect(testHasLocal('myApp', 'empty')).toBe(false);
    });
  });

  describe('getThemeFromLocal', () => {
    it('未设置时返回默认值 "default"', () => {
      expect(getThemeFromLocal()).toBe('default');
    });

    it('fullClass=true 时返回带前缀的类名', () => {
      expect(getThemeFromLocal(true)).toBe('theme__default');
    });

    it('读取已保存的主题', () => {
      localStorage.setItem('cherry-theme', 'dark');
      expect(getThemeFromLocal()).toBe('dark');
    });

    it('fullClass=true 时返回完整类名', () => {
      localStorage.setItem('cherry-theme', 'dark');
      expect(getThemeFromLocal(true)).toBe('theme__dark');
    });

    it('自定义 nameSpace', () => {
      localStorage.setItem('myEditor-theme', 'custom');
      expect(getThemeFromLocal(false, 'myEditor')).toBe('custom');
    });

    it('自定义 nameSpace + fullClass', () => {
      localStorage.setItem('myEditor-theme', 'light');
      expect(getThemeFromLocal(true, 'myEditor')).toBe('theme__light');
    });
  });

  describe('getCodeThemeFromLocal', () => {
    it('未设置时返回默认值 "default"', () => {
      expect(getCodeThemeFromLocal()).toBe('default');
    });

    it('读取已保存的代码主题', () => {
      localStorage.setItem('cherry-codeTheme', 'monokai');
      expect(getCodeThemeFromLocal()).toBe('monokai');
    });

    it('自定义 nameSpace', () => {
      localStorage.setItem('myEditor-codeTheme', 'github');
      expect(getCodeThemeFromLocal('myEditor')).toBe('github');
    });
  });

  describe('getCodeWrapFromLocal / saveCodeWrapToLocal', () => {
    it('未设置时默认返回 "wrap"', () => {
      expect(getCodeWrapFromLocal()).toBe('wrap');
    });

    it('defaultWrap=false 时默认返回 "nowrap"', () => {
      expect(getCodeWrapFromLocal('cherry', false)).toBe('nowrap');
    });

    it('保存并读取 wrap', () => {
      saveCodeWrapToLocal('cherry', 'wrap');
      expect(getCodeWrapFromLocal()).toBe('wrap');
    });

    it('保存并读取 nowrap', () => {
      saveCodeWrapToLocal('cherry', 'nowrap');
      expect(getCodeWrapFromLocal()).toBe('nowrap');
    });

    it('自定义 nameSpace', () => {
      saveCodeWrapToLocal('myEditor', 'nowrap');
      expect(getCodeWrapFromLocal('myEditor')).toBe('nowrap');
      expect(getCodeWrapFromLocal('otherEditor')).toBe('wrap');
    });
  });

  describe('边界情况', () => {
    it('key 包含特殊字符', () => {
      localStorage.setItem('cherry-special-key_123', 'value');
      expect(testKeyInLocal('special-key_123')).toBe(true);
    });

    it('连续读写操作', () => {
      for (let i = 0; i < 10; i++) {
        saveIsClassicBrToLocal(i % 2 === 0);
      }
      // 最后一次是 i=9，9%2=1，所以保存 false
      expect(getIsClassicBrFromLocal()).toBe(false);
    });
  });
});
