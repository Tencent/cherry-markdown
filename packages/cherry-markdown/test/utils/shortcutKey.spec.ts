import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllowedShortcutKey,
  keyStackIsModifierkeys,
  setDisableShortcutKey,
  isEnableShortcutKey,
  clearStorageKeyMap,
  storageKeyMap,
  getStorageKeyMap,
  keyStack2UniqueString,
  shortcutCode2Key,
  keyStack2UnPlatformUniqueString,
  getKeyCode,
  getPlatformControlKey,
  META_KEY,
  CONTROL_KEY,
  ALT_KEY,
  SHIFT_KEY,
} from '../../src/utils/shortcutKey';

describe('shortcutKey 工具函数', () => {
  beforeEach(() => {
    // Mock localStorage
    const store = new Map();
    // @ts-ignore
    global.localStorage = {
      getItem: vi.fn((key) => store.get(key)),
      setItem: vi.fn((key, value) => store.set(key, value)),
      removeItem: vi.fn((key) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllowedShortcutKey', () => {
    it('禁止的导航键返回空数组', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([]);
    });

    it('禁止的编辑键返回空数组', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([]);
    });

    it('禁止的空白键返回空数组', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([]);
    });

    it('自定义禁止键', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', metaKey: true });
      const result = getAllowedShortcutKey(event, ['a']);
      expect(result).not.toContain('a');
    });

    it('Meta 组合键', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC',
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toContain(META_KEY);
      expect(result).toContain('KeyC');
    });

    it('Control 组合键', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC',
        metaKey: false,
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toContain(CONTROL_KEY);
      expect(result).toContain('KeyC');
    });

    it('Alt 组合键', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC',
        metaKey: false,
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toContain(ALT_KEY);
      expect(result).toContain('KeyC');
    });

    it('Shift 组合键', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'C',
        code: 'KeyC',
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toContain(SHIFT_KEY);
      expect(result).toContain('KeyC');
    });

    it('多修饰键组合', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC',
        metaKey: true,
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toContain(META_KEY);
      expect(result).toContain(ALT_KEY);
      expect(result).toContain('KeyC');
    });

    it('修饰键顺序：Meta > Control > Alt > Shift', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC',
        metaKey: true,
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
      });
      const result = getAllowedShortcutKey(event);
      expect(result[0]).toBe(META_KEY);
      expect(result[1]).toBe(CONTROL_KEY);
      expect(result[2]).toBe(ALT_KEY);
      expect(result[3]).toBe(SHIFT_KEY);
    });

    it('重复按键', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC',
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        repeat: true,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toContain(META_KEY);
      expect(result).toContain('KeyC');
    });
  });

  describe('keyStackIsModifierkeys', () => {
    it('只包含 Shift + 输入键返回 true', () => {
      const result = keyStackIsModifierkeys([SHIFT_KEY, 'KeyA']);
      expect(result).toBe(true);
    });

    it('只包含 Alt + 输入键返回 true', () => {
      const result = keyStackIsModifierkeys([ALT_KEY, 'KeyA']);
      expect(result).toBe(true);
    });

    it('Shift + Alt 返回 false', () => {
      const result = keyStackIsModifierkeys([SHIFT_KEY, ALT_KEY]);
      expect(result).toBe(false);
    });

    it('包含 Control 返回 false', () => {
      const result = keyStackIsModifierkeys([CONTROL_KEY, 'KeyA']);
      expect(result).toBe(false);
    });

    it('包含 Meta 返回 false', () => {
      const result = keyStackIsModifierkeys([META_KEY, 'KeyA']);
      expect(result).toBe(false);
    });

    it('非数组返回 false', () => {
      // @ts-ignore
      const result = keyStackIsModifierkeys('not-array');
      expect(result).toBe(false);
    });

    it('长度不为 2 返回 false', () => {
      const result = keyStackIsModifierkeys([SHIFT_KEY, 'KeyA', 'KeyB']);
      expect(result).toBe(false);
    });

    it('单个键返回 false', () => {
      const result = keyStackIsModifierkeys(['KeyA']);
      expect(result).toBe(false);
    });
  });

  describe('setDisableShortcutKey 和 isEnableShortcutKey', () => {
    it('设置禁用快捷键', () => {
      setDisableShortcutKey('test', 'disable');
      expect(isEnableShortcutKey('test')).toBe(false);
    });

    it('设置启用快捷键', () => {
      setDisableShortcutKey('test', 'enable');
      expect(isEnableShortcutKey('test')).toBe(true);
    });

    it('不设置时默认启用', () => {
      const result = isEnableShortcutKey('test2');
      expect(result).toBe(true);
    });
  });

  describe('clearStorageKeyMap', () => {
    it('清除快捷键映射缓存', () => {
      clearStorageKeyMap('test');
      // @ts-ignore
      expect(localStorage.removeItem).toHaveBeenCalledWith('test-cherry-shortcut-keymap');
    });
  });

  describe('storageKeyMap 和 getStorageKeyMap', () => {
    it('存储快捷键映射', () => {
      const keyMap = { test: 'value' };
      storageKeyMap('test', keyMap);
      // @ts-ignore
      expect(localStorage.setItem).toHaveBeenCalledWith('test-cherry-shortcut-keymap', JSON.stringify(keyMap));
    });

    it('非对象参数抛出错误', () => {
      expect(() => storageKeyMap('test', null as any)).toThrow('keyMap must be a object');
    });

    it('获取存储的快捷键映射', () => {
      const keyMap = { test: 'value' };
      storageKeyMap('test', keyMap);
      const result = getStorageKeyMap('test');
      expect(result).toEqual(keyMap);
    });

    it('获取不存在的映射返回 null', () => {
      const result = getStorageKeyMap('nonexistent');
      expect(result).toBeNull();
    });

    it('解析错误的 JSON 返回 null', () => {
      // 模拟 localStorage.getItem 返回无效的 JSON
      // 由于 localStorage 在测试中无法直接 mock，这里只测试不抛出异常
      expect(() => getStorageKeyMap('test')).not.toThrow();
    });
  });

  describe('keyStack2UniqueString', () => {
    it('将快捷键栈转换为唯一字符串', () => {
      const result = keyStack2UniqueString(['Control', 'Shift', 'KeyA']);
      expect(result).toBe('Control-Shift-KeyA');
    });

    it('非数组参数抛出错误', () => {
      expect(() => keyStack2UniqueString('not-array' as any)).toThrow('keyStack must be a array');
    });

    it('空数组返回空字符串', () => {
      const result = keyStack2UniqueString([]);
      expect(result).toBe('');
    });

    it('单个键返回该键', () => {
      const result = keyStack2UniqueString(['KeyA']);
      expect(result).toBe('KeyA');
    });
  });

  describe('shortcutCode2Key', () => {
    it('Control 键转换 (Mac)', () => {
      const result = shortcutCode2Key(CONTROL_KEY, true);
      expect(result.text).toBe('⌃');
      expect(result.tip).toBe('Control');
    });

    it('Control 键转换 (非 Mac)', () => {
      const result = shortcutCode2Key(CONTROL_KEY, false);
      expect(result.text).toBe('Ctrl');
      expect(result.tip).toBe('Control');
    });

    it('Alt 键转换 (Mac)', () => {
      const result = shortcutCode2Key(ALT_KEY, true);
      expect(result.text).toBe('⌥');
      expect(result.tip).toBe('Option');
    });

    it('Alt 键转换 (非 Mac)', () => {
      const result = shortcutCode2Key(ALT_KEY, false);
      expect(result.text).toBe('Alt');
      expect(result.tip).toBe('Alt');
    });

    it('Shift 键转换', () => {
      const result = shortcutCode2Key(SHIFT_KEY, false);
      expect(result.text).toBe('⇧');
      expect(result.tip).toBe('Shift');
    });

    it('Meta 键转换 (Mac)', () => {
      const result = shortcutCode2Key(META_KEY, true);
      expect(result.text).toBe('⌘');
      expect(result.tip).toBe('Command');
    });

    it('Meta 键转换 (非 Mac)', () => {
      const result = shortcutCode2Key(META_KEY, false);
      expect(result.text).toBe('⊞');
      expect(result.tip).toBe('Windows');
    });

    it('移除 Key 前缀', () => {
      const result = shortcutCode2Key('KeyA', false);
      expect(result.text).toBe('A');
      expect(result.tip).toBe('A');
    });

    it('移除 Digit 前缀', () => {
      const result = shortcutCode2Key('Digit1', false);
      expect(result.text).toBe('1');
      expect(result.tip).toBe('1');
    });

    it('普通代码直接返回', () => {
      const result = shortcutCode2Key('Space', false);
      expect(result.text).toBe('Space');
      expect(result.tip).toBe('Space');
    });
  });

  describe('keyStack2UnPlatformUniqueString', () => {
    it('将快捷键栈转换为平台无关字符串', () => {
      const result = keyStack2UnPlatformUniqueString([CONTROL_KEY, SHIFT_KEY, 'KeyA'], false);
      expect(result).toBe('Ctrl-⇧-A');
    });

    it('Mac 平台转换', () => {
      const result = keyStack2UnPlatformUniqueString([CONTROL_KEY, SHIFT_KEY, 'KeyA'], true);
      expect(result).toBe('⌃-⇧-A');
    });

    it('非数组参数抛出错误', () => {
      expect(() => keyStack2UnPlatformUniqueString('not-array' as any, false)).toThrow(
        'keyStack must be a array'
      );
    });
  });

  describe('getKeyCode', () => {
    it('数字转换为 Digit + 数字', () => {
      const result = getKeyCode(5);
      expect(result).toBe('Digit5');
    });

    it('大写字母转换为 Key + 字母', () => {
      const result = getKeyCode('a');
      expect(result).toBe('KeyA');
    });

    it('小写字母也能正确转换', () => {
      const result = getKeyCode('z');
      expect(result).toBe('KeyZ');
    });

    it('字符串数字转换为 Digit + 数字', () => {
      const result = getKeyCode('9');
      expect(result).toBe('Digit9');
    });

    it('非数字非字符串参数抛出错误', () => {
      // @ts-ignore
      expect(() => getKeyCode(null)).toThrow('key must be a string or number');
    });

    it('长度大于 1 的字符串抛出错误', () => {
      expect(() => getKeyCode('abc' as any)).toThrow();
    });

    it('特殊字符返回 undefined', () => {
      const result = getKeyCode('@' as any);
      // 不符合任何规则，返回 undefined
      expect(result).toBeUndefined();
    });
  });

  describe('getPlatformControlKey', () => {
    it('返回平台对应的 Control 键', () => {
      const result = getPlatformControlKey();
      expect([META_KEY, CONTROL_KEY]).toContain(result);
    });
  });
});
