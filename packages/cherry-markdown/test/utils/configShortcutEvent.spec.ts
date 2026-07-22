import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  changeCodeTheme,
  changeTheme,
  customizer,
  getCodeThemeFromLocal,
  getCodeWrapFromLocal,
  getIsClassicBrFromLocal,
  getThemeFromLocal,
  saveCodeWrapToLocal,
  saveIsClassicBrToLocal,
  testHasLocal,
  testKeyInLocal,
} from '../../src/utils/config';
import { addEvent, removeEvent } from '../../src/utils/event';
import {
  ALT_KEY,
  CONTROL_KEY,
  META_KEY,
  SHIFT_KEY,
  clearStorageKeyMap,
  getAllowedShortcutKey,
  getStorageKeyMap,
  isEnableShortcutKey,
  keyStack2UniqueString,
  keyStack2UnPlatformUniqueString,
  keyStackIsModifierkeys,
  setDisableShortcutKey,
  shortcutCode2Key,
  storageKeyMap,
} from '../../src/utils/shortcutKey';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('utils/config', () => {
  it('replaces arrays in merge customizers and leaves other values untouched', () => {
    expect(customizer(['old'], ['new'])).toEqual(['new']);
    expect(customizer({ old: true }, { next: true })).toBeUndefined();
  });

  it('stores and reads line break, theme, code theme, and wrapping preferences', () => {
    expect(getIsClassicBrFromLocal()).toBe(false);
    expect(testKeyInLocal('classicBr')).toBe(false);
    saveIsClassicBrToLocal(false);
    expect(getIsClassicBrFromLocal()).toBe(false);
    saveIsClassicBrToLocal(true);
    expect(getIsClassicBrFromLocal()).toBe(true);
    expect(testKeyInLocal('classicBr')).toBe(true);

    expect(getThemeFromLocal()).toBe('default');
    localStorage.setItem('docs-theme', 'dark');
    expect(getThemeFromLocal(false, 'docs')).toBe('dark');
    expect(getThemeFromLocal(true, 'docs')).toBe('theme__dark');
    expect(testHasLocal('docs', 'theme')).toBe(true);
    expect(testHasLocal('docs', 'missing')).toBe(false);

    expect(getCodeThemeFromLocal('docs')).toBe('default');
    expect(getCodeWrapFromLocal('docs')).toBe('wrap');
    expect(getCodeWrapFromLocal('docs', false)).toBe('nowrap');
    saveCodeWrapToLocal('docs', 'nowrap');
    expect(getCodeWrapFromLocal('docs')).toBe('nowrap');
  });

  it('returns defaults and skips persistence when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(testKeyInLocal('classicBr')).toBe(false);
    expect(getIsClassicBrFromLocal()).toBe(false);
    expect(testHasLocal('docs', 'theme')).toBe(false);
    expect(getThemeFromLocal(false, 'docs')).toBe('default');
    expect(getCodeThemeFromLocal('docs')).toBe('default');
    expect(getCodeWrapFromLocal('docs')).toBe('wrap');
    expect(() => saveIsClassicBrToLocal(true)).not.toThrow();
    expect(() => saveCodeWrapToLocal('docs', 'nowrap')).not.toThrow();
  });

  it('updates editor theme classes and persists normalized theme names', () => {
    const previewDom = document.createElement('div');
    previewDom.className = 'preview theme__light extra';
    const cherry = {
      nameSpace: 'docs',
      wrapperDom: document.createElement('div'),
      previewer: { getDomContainer: () => previewDom },
    };
    cherry.wrapperDom.className = 'editor theme__light extra';

    changeTheme(cherry, 'prefix-theme__dark');

    expect(cherry.wrapperDom.className).toContain('theme__dark');
    expect(cherry.wrapperDom.className).not.toContain('theme__light');
    expect(previewDom.className).toContain('theme__dark');
    expect(localStorage.getItem('docs-theme')).toBe('dark');
  });

  it('uses stored themes when no explicit theme is supplied', () => {
    localStorage.setItem('docs-theme', 'dark');
    localStorage.setItem('docs-codeTheme', 'twilight');
    const previewDom = document.createElement('div');
    const wrapperDom = document.createElement('div');
    const cherry = {
      nameSpace: 'docs',
      wrapperDom,
      previewer: { getDomContainer: () => previewDom },
    };

    changeTheme(cherry);
    changeCodeTheme(cherry, '');

    expect(wrapperDom.className).toContain('theme__dark');
    expect(wrapperDom.getAttribute('data-code-block-theme')).toBe('twilight');

    changeCodeTheme(cherry, 'monokai');
    expect(wrapperDom.getAttribute('data-code-block-theme')).toBe('monokai');
  });
});

describe('utils/shortcutKey', () => {
  const keyboardEvent = (key: string, code: string, options = {}) =>
    new KeyboardEvent('keydown', { key, code, ...options });

  it('normalizes modifier order and rejects forbidden keys', () => {
    expect(
      getAllowedShortcutKey(keyboardEvent('K', 'KeyK', { metaKey: true, ctrlKey: true, altKey: true, shiftKey: true })),
    ).toEqual([META_KEY, CONTROL_KEY, ALT_KEY, SHIFT_KEY, 'KeyK']);
    expect(getAllowedShortcutKey(keyboardEvent('Enter', 'Enter', { ctrlKey: true }))).toEqual([]);
    expect(getAllowedShortcutKey(keyboardEvent('x', 'KeyX'), ['x'])).toEqual([]);
  });

  it('handles modifier-only and repeated key events', () => {
    expect(getAllowedShortcutKey(keyboardEvent('Shift', 'ShiftLeft', { shiftKey: true }))).toEqual([SHIFT_KEY]);
    expect(getAllowedShortcutKey(keyboardEvent('a', 'KeyA', { repeat: true }))).toEqual(['KeyA']);
  });

  it('detects modifier-plus-input key stacks', () => {
    expect(keyStackIsModifierkeys([SHIFT_KEY, 'KeyA'])).toBe(true);
    expect(keyStackIsModifierkeys([ALT_KEY, 'Digit1'])).toBe(true);
    expect(keyStackIsModifierkeys([SHIFT_KEY, ALT_KEY])).toBe(false);
    expect(keyStackIsModifierkeys([CONTROL_KEY, 'KeyA'])).toBe(false);
    expect(keyStackIsModifierkeys('Shift-KeyA' as never)).toBe(false);
  });

  it('serializes shortcuts and maps codes for each platform', () => {
    expect(keyStack2UniqueString([CONTROL_KEY, 'KeyK'])).toBe('Control-KeyK');
    expect(keyStack2UnPlatformUniqueString([META_KEY, SHIFT_KEY, 'KeyK'], true)).toBe('⌘-⇧-K');
    expect(shortcutCode2Key(META_KEY, false)).toEqual({ text: '⊞', tip: 'Windows' });
    expect(shortcutCode2Key('Digit8', false)).toEqual({ text: '8', tip: '8' });
    expect(() => keyStack2UniqueString(null as never)).toThrow('keyStack must be a array');
    expect(() => keyStack2UnPlatformUniqueString(null as never, false)).toThrow('keyStack must be a array');
  });

  it('persists shortcut settings and tolerates invalid cached JSON', () => {
    expect(isEnableShortcutKey('docs')).toBe(true);
    setDisableShortcutKey('docs');
    expect(isEnableShortcutKey('docs')).toBe(false);
    setDisableShortcutKey('docs', 'enable');
    expect(isEnableShortcutKey('docs')).toBe(true);

    const keyMap = { bold: { shortcutKey: [CONTROL_KEY, 'KeyB'] } };
    storageKeyMap('docs', keyMap as never);
    expect(getStorageKeyMap('docs')).toEqual(keyMap);
    clearStorageKeyMap('docs');
    expect(getStorageKeyMap('docs')).toBeNull();

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('docs-cherry-shortcut-keymap', '{invalid');
    expect(getStorageKeyMap('docs')).toBeNull();
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(() => storageKeyMap('docs', null as never)).toThrow('keyMap must be a object');
  });
});

describe('utils/event', () => {
  it('uses DOM event listeners when available', () => {
    const handler = vi.fn();
    const element = document.createElement('button');
    const addSpy = vi.spyOn(element, 'addEventListener');
    const removeSpy = vi.spyOn(element, 'removeEventListener');

    expect(addEvent(element, 'click', handler, true)).toBe(true);
    removeEvent(element, 'click', handler, true);

    expect(addSpy).toHaveBeenCalledWith('click', handler, true);
    expect(removeSpy).toHaveBeenCalledWith('click', handler, true);
  });

  it('supports attachEvent and detachEvent fallbacks', () => {
    const handler = vi.fn();
    const legacy = {
      attachEvent: vi.fn(() => 'attached'),
      detachEvent: vi.fn(() => 'detached'),
    };

    expect(addEvent(legacy as never, 'click', handler, false)).toBe('attached');
    expect(removeEvent(legacy as never, 'click', handler, false)).toBe('detached');
    expect(legacy.attachEvent).toHaveBeenCalledWith('onclick', handler);
    expect(legacy.detachEvent).toHaveBeenCalledWith('onclick', handler);
  });

  it('falls back to DOM0 event properties', () => {
    const handler = vi.fn();
    const legacy: Record<string, unknown> = {};

    addEvent(legacy as never, 'click', handler, false);
    expect(legacy.onclick).toBe(handler);
    removeEvent(legacy as never, 'click', handler, false);
    expect(legacy.onclick).toBeNull();
  });
});
