/**
 * shortcutKey.js 单元测试
 * 测试快捷键相关功能
 *
 * 这些测试记录了快捷键处理的行为，对于升级 CodeMirror 6 时保持快捷键一致性很重要
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getAllowedShortcutKey,
  keyStackIsModifierkeys,
  keyStack2UniqueString,
  shortcutCode2Key,
  keyStack2UnPlatformUniqueString,
  getKeyCode,
  setDisableShortcutKey,
  isEnableShortcutKey,
  clearStorageKeyMap,
  storageKeyMap,
  getStorageKeyMap,
  SHIFT_KEY,
  ALT_KEY,
  CONTROL_KEY,
  META_KEY,
} from '../../../src/utils/shortcutKey';
import { createKeyboardEventMock } from '../../__mocks__/codemirror.mock';

// Mock codemirror/src/util/browser
vi.mock('codemirror/src/util/browser', () => ({
  mac: false,
}));

describe('shortcutKey.js - getAllowedShortcutKey', () => {
  describe('禁止的快捷键', () => {
    it('应该过滤掉编辑类快捷键 (Backspace)', () => {
      const event = createKeyboardEventMock({ key: 'Backspace', code: 'Backspace' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([]);
    });

    it('应该过滤掉导航类快捷键 (ArrowDown)', () => {
      const event = createKeyboardEventMock({ key: 'ArrowDown', code: 'ArrowDown' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([]);
    });

    it('应该过滤掉空白类快捷键 (Enter)', () => {
      const event = createKeyboardEventMock({ key: 'Enter', code: 'Enter' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([]);
    });

    it('应该过滤掉空白类快捷键 (Tab)', () => {
      const event = createKeyboardEventMock({ key: 'Tab', code: 'Tab' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([]);
    });

    it('应该过滤掉空白类快捷键 (Space)', () => {
      const event = createKeyboardEventMock({ key: ' ', code: 'Space' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([]);
    });

    it('应该支持自定义禁止的快捷键', () => {
      const event = createKeyboardEventMock({ key: 'a', code: 'KeyA' });
      const result = getAllowedShortcutKey(event, ['a']);
      expect(result).toEqual([]);
    });
  });

  describe('修饰键组合', () => {
    it('Ctrl+A 应该返回 [Control, KeyA]', () => {
      const event = createKeyboardEventMock({
        key: 'a',
        code: 'KeyA',
        ctrlKey: true,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([CONTROL_KEY, 'KeyA']);
    });

    it('Ctrl+Shift+A 应该返回 [Control, Shift, KeyA]', () => {
      const event = createKeyboardEventMock({
        key: 'A',
        code: 'KeyA',
        ctrlKey: true,
        shiftKey: true,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([CONTROL_KEY, SHIFT_KEY, 'KeyA']);
    });

    it('Meta+Alt+Ctrl+Shift+A 应该按正确顺序排列修饰键', () => {
      const event = createKeyboardEventMock({
        key: 'a',
        code: 'KeyA',
        metaKey: true,
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
      });
      const result = getAllowedShortcutKey(event);
      // 顺序应该是 Meta > Control > Alt > Shift
      expect(result).toEqual([META_KEY, CONTROL_KEY, ALT_KEY, SHIFT_KEY, 'KeyA']);
    });

    it('Alt+数字键应该正确处理', () => {
      const event = createKeyboardEventMock({
        key: '1',
        code: 'Digit1',
        altKey: true,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([ALT_KEY, 'Digit1']);
    });
  });

  describe('普通按键', () => {
    it('单独按下字母键应该返回对应的 code', () => {
      const event = createKeyboardEventMock({ key: 'a', code: 'KeyA' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual(['KeyA']);
    });

    it('单独按下数字键应该返回对应的 code', () => {
      const event = createKeyboardEventMock({ key: '5', code: 'Digit5' });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual(['Digit5']);
    });
  });

  describe('重复按键', () => {
    it('重复按下的键应该正确处理', () => {
      const event = createKeyboardEventMock({
        key: 'a',
        code: 'KeyA',
        ctrlKey: true,
        repeat: true,
      });
      const result = getAllowedShortcutKey(event);
      expect(result).toEqual([CONTROL_KEY, 'KeyA']);
    });
  });
});

describe('shortcutKey.js - keyStackIsModifierkeys', () => {
  it('Shift+A 应该返回 true (修饰键+输入键)', () => {
    const result = keyStackIsModifierkeys([SHIFT_KEY, 'KeyA']);
    expect(result).toBe(true);
  });

  it('Alt+A 应该返回 true (修饰键+输入键)', () => {
    const result = keyStackIsModifierkeys([ALT_KEY, 'KeyA']);
    expect(result).toBe(true);
  });

  it('Ctrl+A 应该返回 false (包含 Control)', () => {
    const result = keyStackIsModifierkeys([CONTROL_KEY, 'KeyA']);
    expect(result).toBe(false);
  });

  it('Meta+A 应该返回 false (包含 Meta)', () => {
    const result = keyStackIsModifierkeys([META_KEY, 'KeyA']);
    expect(result).toBe(false);
  });

  it('Shift+Alt 应该返回 false (只有修饰键)', () => {
    const result = keyStackIsModifierkeys([SHIFT_KEY, ALT_KEY]);
    expect(result).toBe(false);
  });

  it('单个键应该返回 false', () => {
    const result = keyStackIsModifierkeys(['KeyA']);
    expect(result).toBe(false);
  });

  it('三个键应该返回 false', () => {
    const result = keyStackIsModifierkeys([SHIFT_KEY, ALT_KEY, 'KeyA']);
    expect(result).toBe(false);
  });

  it('非数组应该返回 false', () => {
    const result = keyStackIsModifierkeys('not an array' as any);
    expect(result).toBe(false);
  });
});

describe('shortcutKey.js - keyStack2UniqueString', () => {
  it('应该用连字符连接快捷键栈', () => {
    const result = keyStack2UniqueString([CONTROL_KEY, SHIFT_KEY, 'KeyA']);
    expect(result).toBe('Control-Shift-KeyA');
  });

  it('单个键应该直接返回', () => {
    const result = keyStack2UniqueString(['KeyA']);
    expect(result).toBe('KeyA');
  });

  it('空数组应该返回空字符串', () => {
    const result = keyStack2UniqueString([]);
    expect(result).toBe('');
  });

  it('非数组应该抛出错误', () => {
    expect(() => keyStack2UniqueString('not an array' as any)).toThrow('keyStack must be a array');
  });
});

describe('shortcutKey.js - shortcutCode2Key', () => {
  describe('Mac 平台', () => {
    it('Shift 应该显示为 ⇧', () => {
      const result = shortcutCode2Key(SHIFT_KEY, true);
      expect(result.text).toBe('⇧');
      expect(result.tip).toBe('Shift');
    });

    it('Control 应该显示为 ⌃', () => {
      const result = shortcutCode2Key(CONTROL_KEY, true);
      expect(result.text).toBe('⌃');
      expect(result.tip).toBe('Control');
    });

    it('Alt 应该显示为 ⌥', () => {
      const result = shortcutCode2Key(ALT_KEY, true);
      expect(result.text).toBe('⌥');
      expect(result.tip).toBe('Option');
    });

    it('Meta 应该显示为 ⌘', () => {
      const result = shortcutCode2Key(META_KEY, true);
      expect(result.text).toBe('⌘');
      expect(result.tip).toBe('Command');
    });
  });

  describe('Windows 平台', () => {
    it('Shift 应该显示为 ⇧', () => {
      const result = shortcutCode2Key(SHIFT_KEY, false);
      expect(result.text).toBe('⇧');
    });

    it('Control 应该显示为 Ctrl', () => {
      const result = shortcutCode2Key(CONTROL_KEY, false);
      expect(result.text).toBe('Ctrl');
    });

    it('Alt 应该显示为 Alt', () => {
      const result = shortcutCode2Key(ALT_KEY, false);
      expect(result.text).toBe('Alt');
    });

    it('Meta 应该显示为 ⊞', () => {
      const result = shortcutCode2Key(META_KEY, false);
      expect(result.text).toBe('⊞');
      expect(result.tip).toBe('Windows');
    });
  });

  describe('普通按键', () => {
    it('KeyA 应该转换为 A', () => {
      const result = shortcutCode2Key('KeyA', false);
      expect(result.text).toBe('A');
    });

    it('Digit5 应该转换为 5', () => {
      const result = shortcutCode2Key('Digit5', false);
      expect(result.text).toBe('5');
    });
  });
});

describe('shortcutKey.js - keyStack2UnPlatformUniqueString', () => {
  it('Mac 平台应该使用符号', () => {
    const result = keyStack2UnPlatformUniqueString([META_KEY, SHIFT_KEY, 'KeyA'], true);
    expect(result).toBe('⌘-⇧-A');
  });

  it('Windows 平台应该使用文字', () => {
    const result = keyStack2UnPlatformUniqueString([CONTROL_KEY, SHIFT_KEY, 'KeyA'], false);
    expect(result).toBe('Ctrl-⇧-A');
  });

  it('非数组应该抛出错误', () => {
    expect(() => keyStack2UnPlatformUniqueString('not an array' as any, false)).toThrow('keyStack must be a array');
  });
});

describe('shortcutKey.js - getKeyCode', () => {
  it('数字应该返回 Digit 前缀', () => {
    expect(getKeyCode(5)).toBe('Digit5');
    expect(getKeyCode(0)).toBe('Digit0');
  });

  it('字符串数字应该返回 Digit 前缀', () => {
    expect(getKeyCode('5')).toBe('Digit5');
  });

  it('字母应该返回 Key 前缀并大写', () => {
    expect(getKeyCode('a')).toBe('KeyA');
    expect(getKeyCode('A')).toBe('KeyA');
    expect(getKeyCode('z')).toBe('KeyZ');
  });

  it('多字符应该抛出错误', () => {
    expect(() => getKeyCode('ab')).toThrow('key length must be 1');
  });

  it('非字符串非数字应该抛出错误', () => {
    expect(() => getKeyCode({} as any)).toThrow('key must be a string or number');
  });
});

describe('shortcutKey.js - localStorage 相关', () => {
  const namespace = 'test-cherry';

  describe('setDisableShortcutKey / isEnableShortcutKey', () => {
    it('默认应该启用快捷键', () => {
      expect(isEnableShortcutKey(namespace)).toBe(true);
    });

    it('禁用后应该返回 false', () => {
      setDisableShortcutKey(namespace, 'disable');
      expect(isEnableShortcutKey(namespace)).toBe(false);
    });

    it('非 disable 值应该启用快捷键', () => {
      setDisableShortcutKey(namespace, 'enable');
      expect(isEnableShortcutKey(namespace)).toBe(true);
    });
  });

  describe('storageKeyMap / getStorageKeyMap / clearStorageKeyMap', () => {
    it('应该能存储和获取快捷键映射', () => {
      const keyMap = { bold: ['Control', 'KeyB'] };
      storageKeyMap(namespace, keyMap as any);
      const result = getStorageKeyMap(namespace);
      expect(result).toEqual(keyMap);
    });

    it('清空后应该返回 null', () => {
      const keyMap = { bold: ['Control', 'KeyB'] };
      storageKeyMap(namespace, keyMap as any);
      clearStorageKeyMap(namespace);
      expect(getStorageKeyMap(namespace)).toBe(null);
    });

    it('非对象应该抛出错误', () => {
      expect(() => storageKeyMap(namespace, null as any)).toThrow('keyMap must be a object');
      expect(() => storageKeyMap(namespace, 'string' as any)).toThrow('keyMap must be a object');
    });

    it('无存储时应该返回 null', () => {
      clearStorageKeyMap(namespace);
      expect(getStorageKeyMap(namespace)).toBe(null);
    });
  });
});
