import { describe, it, expect, vi, beforeEach } from 'vitest';
import pasteHelper from '../../src/utils/pasteHelper';

describe('pasteHelper 工具函数', () => {
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

  describe('getTypeFromLocalStorage', () => {
    it('从 localStorage 获取类型', () => {
      // @ts-ignore
      const cases = [
        [null, 'md'],
        ['text', 'text'],
        [undefined, 'md'],
      ];
      cases.forEach(([returnValue, expected]) => {
        // @ts-ignore
        localStorage.getItem.mockReturnValueOnce(returnValue);
        // @ts-ignore
        const result = pasteHelper.getTypeFromLocalStorage();
        expect(result).toBe(expected);
      });
    });

    it('localStorage 不存在时返回 md', () => {
      // @ts-ignore
      global.localStorage = undefined;
      // @ts-ignore
      expect(pasteHelper.getTypeFromLocalStorage()).toBe('md');
    });
  });

  describe('setTypeToLocalStorage', () => {
    it('设置粘贴类型', () => {
      const cases = ['text', 'md'];
      cases.forEach((type) => {
        // @ts-ignore
        pasteHelper.setTypeToLocalStorage(type);
        // @ts-ignore
        expect(localStorage.setItem).toHaveBeenCalledWith('cherry-paste-type', type);
      });
    });

    it('localStorage 不存在时不设置', () => {
      // @ts-ignore
      global.localStorage = undefined;
      // @ts-ignore
      expect(() => pasteHelper.setTypeToLocalStorage('text')).not.toThrow();
    });
  });

  describe('showSwitchBtnAfterPasteHtml', () => {
    it('html 和 md 相同时不显示切换按钮', () => {
      const $cherry = { locale: {} };
      const currentCursor = { line: 0, ch: 0 };
      const editor = {
        getCursor: vi.fn(() => ({ line: 0, ch: 5 })),
        getWrapperElement: vi.fn(() => ({ appendChild: vi.fn() })),
      };
      // @ts-ignore
      const spy = vi.spyOn(pasteHelper, 'init').mockImplementation(() => {});
      pasteHelper.showSwitchBtnAfterPasteHtml($cherry, currentCursor, editor, 'same', 'same');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('toggleBubbleDisplay', () => {
    it('切换气泡显示状态', () => {
      // @ts-ignore
      pasteHelper.bubbleDom = { style: { display: 'none' } };
      pasteHelper.toggleBubbleDisplay();
      // @ts-ignore
      expect(pasteHelper.bubbleDom.style.display).toBe('');

      pasteHelper.toggleBubbleDisplay();
      // @ts-ignore
      expect(pasteHelper.bubbleDom.style.display).toBe('none');
    });
  });

  describe('isHidden', () => {
    it('检查气泡隐藏状态', () => {
      const cases = [
        ['none', true],
        ['block', false],
      ];
      cases.forEach(([display, expected]) => {
        // @ts-ignore
        pasteHelper.bubbleDom = { style: { display } };
        expect(pasteHelper.isHidden()).toBe(expected);
      });
    });
  });

  describe('hideBubble', () => {
    it('隐藏气泡', () => {
      // @ts-ignore
      pasteHelper.bubbleDom = { style: { display: 'block' } };
      // @ts-ignore
      pasteHelper.noHide = false;
      pasteHelper.hideBubble();
      // @ts-ignore
      expect(pasteHelper.bubbleDom.style.display).toBe('none');
    });

    it('noHide 为 true 时不隐藏', () => {
      // @ts-ignore
      pasteHelper.bubbleDom = { style: { display: 'block' } };
      // @ts-ignore
      pasteHelper.noHide = true;
      // @ts-ignore
      const spy = vi.spyOn(pasteHelper, 'toggleBubbleDisplay');
      pasteHelper.hideBubble();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
