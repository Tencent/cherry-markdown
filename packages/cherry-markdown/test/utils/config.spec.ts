import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  customizer,
  testKeyInLocal,
  saveIsClassicBrToLocal,
  getIsClassicBrFromLocal,
  testHasLocal,
  getThemeFromLocal,
  changeTheme,
  getCodeThemeFromLocal,
  changeCodeTheme,
  getCodeWrapFromLocal,
  saveCodeWrapToLocal,
} from '../../src/utils/config';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('utils/config', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('customizer', () => {
    it('数组返回srcValue', () => {
      const obj = { arr: [1, 2, 3] };
      const src = { arr: [4, 5, 6] };
      expect(customizer(obj.arr, src.arr)).toBe(src.arr);
    });

    it('非数组返回undefined', () => {
      const cases = [
        ['test', 'test2'],
        [1, 2],
        [{}, {}],
      ];
      cases.forEach(([a, b]) => {
        expect(customizer(a as any, b as any)).toBeUndefined();
      });
    });
  });

  describe('testKeyInLocal', () => {
    it('key不存在返回false', () => {
      expect(testKeyInLocal('nonexistent')).toBe(false);
    });

    it('key存在返回true', () => {
      localStorage.setItem('cherry-testkey', 'value');
      expect(testKeyInLocal('testkey')).toBe(true);
    });
  });

  describe('saveIsClassicBrToLocal and getIsClassicBrFromLocal', () => {
    it('保存和获取classic br设置', () => {
      const cases = [true, false];
      cases.forEach((value) => {
        saveIsClassicBrToLocal(value);
        expect(getIsClassicBrFromLocal()).toBe(value);
      });
    });

    it('默认返回false', () => {
      expect(getIsClassicBrFromLocal()).toBe(false);
    });
  });

  describe('testHasLocal', () => {
    it('key不存在返回false', () => {
      expect(testHasLocal('cherry', 'nonexistent')).toBe(false);
    });

    it('key存在返回true', () => {
      localStorage.setItem('cherry-testkey', 'value');
      expect(testHasLocal('cherry', 'testkey')).toBe(true);
    });
  });

  describe('getThemeFromLocal', () => {
    it('未设置时返回默认主题', () => {
      expect(getThemeFromLocal()).toBe('default');
    });

    it('返回存储的主题', () => {
      const cases = ['dark', 'light', 'custom'];
      cases.forEach((theme) => {
        localStorage.setItem('cherry-theme', theme);
        expect(getThemeFromLocal()).toBe(theme);
      });
    });

    it('fullClass为true时返回完整class名', () => {
      const cases = [
        ['dark', 'theme__dark'],
        ['light', 'theme__light'],
      ];
      cases.forEach(([theme, expected]) => {
        localStorage.setItem('cherry-theme', theme);
        expect(getThemeFromLocal(true)).toBe(expected);
      });
    });

    it('处理自定义命名空间', () => {
      localStorage.setItem('custom-theme', 'light');
      expect(getThemeFromLocal(false, 'custom')).toBe('light');
    });
  });

  describe('changeTheme', () => {
    it('更新主题并保存到localStorage', () => {
      const mockCherry = {
        nameSpace: 'cherry',
        wrapperDom: {
          className: 'cherry-wrapper',
        },
        previewer: {
          getDomContainer: vi.fn(() => ({
            className: 'cherry-preview',
          })),
        },
      } as any;

      changeTheme(mockCherry, 'dark');
      expect(mockCherry.wrapperDom.className).toContain('theme__dark');
      expect(localStorage.getItem('cherry-theme')).toBe('dark');
    });

    it('未提供主题时从localStorage读取', () => {
      localStorage.setItem('cherry-theme', 'light');
      const mockCherry = {
        nameSpace: 'cherry',
        wrapperDom: {
          className: 'cherry-wrapper',
        },
        previewer: {
          getDomContainer: () => ({
            className: 'cherry-preview',
          }),
        },
      } as any;

      changeTheme(mockCherry);
      expect(mockCherry.wrapperDom.className).toContain('theme__light');
    });
  });

  describe('getCodeThemeFromLocal', () => {
    it('未设置时返回默认代码主题', () => {
      expect(getCodeThemeFromLocal()).toBe('default');
    });

    it('返回存储的代码主题', () => {
      const cases = ['monokai', 'dracula', 'github'];
      cases.forEach((theme) => {
        localStorage.setItem('cherry-codeTheme', theme);
        expect(getCodeThemeFromLocal()).toBe(theme);
      });
    });

    it('处理自定义命名空间', () => {
      localStorage.setItem('custom-codeTheme', 'dracula');
      expect(getCodeThemeFromLocal('custom')).toBe('dracula');
    });
  });

  describe('changeCodeTheme', () => {
    it('更新代码主题并保存到localStorage', () => {
      const mockCherry = {
        nameSpace: 'cherry',
        wrapperDom: {
          setAttribute: vi.fn(),
        },
      } as any;

      changeCodeTheme(mockCherry, 'monokai');
      expect(mockCherry.wrapperDom.setAttribute).toHaveBeenCalledWith('data-code-block-theme', 'monokai');
      expect(localStorage.getItem('cherry-codeTheme')).toBe('monokai');
    });

    it('未提供主题时从localStorage读取', () => {
      localStorage.setItem('cherry-codeTheme', 'dracula');
      const mockCherry = {
        nameSpace: 'cherry',
        wrapperDom: {
          setAttribute: vi.fn(),
        },
      } as any;

      changeCodeTheme(mockCherry);
      expect(mockCherry.wrapperDom.setAttribute).toHaveBeenCalledWith('data-code-block-theme', 'dracula');
    });
  });

  describe('getCodeWrapFromLocal', () => {
    it('未设置时返回默认wrap设置', () => {
      expect(getCodeWrapFromLocal()).toBe('wrap');
      expect(getCodeWrapFromLocal('cherry', false)).toBe('nowrap');
    });

    it('返回存储的wrap设置', () => {
      localStorage.setItem('cherry-codeWrap', 'nowrap');
      expect(getCodeWrapFromLocal()).toBe('nowrap');
    });

    it('处理自定义命名空间', () => {
      localStorage.setItem('custom-codeWrap', 'wrap');
      expect(getCodeWrapFromLocal('custom')).toBe('wrap');
    });
  });

  describe('saveCodeWrapToLocal', () => {
    it('保存wrap设置', () => {
      const cases = ['wrap', 'nowrap'];
      cases.forEach((value) => {
        saveCodeWrapToLocal('cherry', value);
        expect(localStorage.getItem('cherry-codeWrap')).toBe(value);
      });
    });
  });
});
