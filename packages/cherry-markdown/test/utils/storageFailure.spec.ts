import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { readStorage, removeStorage, writeStorage } from '../../src/utils/storage';
import { resolveClassicBr } from '../../src/utils/config';
import {
  isEnableShortcutKey,
  setDisableShortcutKey,
  getStorageKeyMap,
  storageKeyMap,
} from '../../src/utils/shortcutKey';
import Br from '../../src/core/hooks/Br';
import ParagraphBase from '../../src/core/ParagraphBase';
import CherryEngine from '../../src/index.engine.core';

const denied = () => {
  throw new DOMException('denied', 'SecurityError');
};

describe('storage failures', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('treats an inaccessible storage getter as unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: denied });
    expect(readStorage('key')).toBeNull();
    expect(writeStorage('key', 'value')).toBe(false);
    expect(removeStorage('key')).toBe(false);
    expect(resolveClassicBr(true)).toBe(true);
    expect(resolveClassicBr(false)).toBe(false);
  });

  it('handles operation failures independently and respects the configured line break', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(denied);
    expect(readStorage('key')).toBeNull();
    expect(writeStorage('key', 'value')).toBe(false);
    expect(removeStorage('key')).toBe(false);
    for (const configured of [true, false]) {
      const br = new Br({ globalConfig: { classicBr: configured } } as never);
      const paragraph = new ParagraphBase({ needCache: false } as never);
      paragraph.initBrReg(configured);
      expect(br.classicBr).toBe(configured);
      expect(paragraph.classicBr).toBe(configured);
      expect(() => new CherryEngine({ engine: { global: { classicBr: configured } } } as never)).not.toThrow();
    }
  });

  it('retains stored line break precedence when storage works', () => {
    localStorage.setItem('cherry-classicBr', 'true');
    expect(resolveClassicBr(false)).toBe(true);
    localStorage.setItem('cherry-classicBr', 'false');
    expect(resolveClassicBr(true)).toBe(false);
    localStorage.removeItem('cherry-classicBr');
    expect(resolveClassicBr(true)).toBe(true);
  });

  it('keeps the shortcut toggle usable in this instance when writes fail', () => {
    localStorage.setItem('docs-disable-cherry-shortcut-key', 'enable');
    const cherry = {};
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied);
    setDisableShortcutKey('docs', 'disable', cherry);
    expect(isEnableShortcutKey('docs', cherry)).toBe(false);
    setDisableShortcutKey('docs', 'enable', cherry);
    expect(isEnableShortcutKey('docs', cherry)).toBe(true);
    expect(getStorageKeyMap('docs')).toBeNull();
    expect(() => storageKeyMap('docs', {})).not.toThrow();
  });
  it('keeps toggling when storage accepts writes but rejects reads', () => {
    const cherry = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied);
    setDisableShortcutKey('docs', 'disable', cherry);
    expect(isEnableShortcutKey('docs', cherry)).toBe(false);
    setDisableShortcutKey('docs', 'enable', cherry);
    expect(isEnableShortcutKey('docs', cherry)).toBe(true);
  });
});
