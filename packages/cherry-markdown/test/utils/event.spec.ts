import { describe, expect, it, vi, beforeEach } from 'vitest';
import { addEvent, removeEvent } from '../../src/utils/event';

describe('utils/event', () => {
  let element: HTMLElement;
  let handler: () => void;

  beforeEach(() => {
    element = document.createElement('div');
    handler = vi.fn();
  });

  describe('addEvent', () => {
    it('添加事件监听', () => {
      const cases = [
        ['click', handler, false],
        ['click', handler, true],
      ];
      cases.forEach(([event, h, useCapture], index) => {
        const testElement = document.createElement('div');
        const testHandler = vi.fn();
        expect(addEvent(testElement, event as string, testHandler as any, useCapture as boolean)).toBe(true);
        testElement.click();
        expect(testHandler).toHaveBeenCalledTimes(1);
      });
    });

    it('添加多个事件监听', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      addEvent(element, 'click', handler1);
      addEvent(element, 'click', handler2);

      element.click();
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('处理不同类型的事件', () => {
      addEvent(element, 'mouseover', handler);
      addEvent(element, 'mouseout', handler);
      addEvent(element, 'keydown', handler);

      element.dispatchEvent(new MouseEvent('mouseover'));
      element.dispatchEvent(new MouseEvent('mouseout'));
      element.dispatchEvent(new KeyboardEvent('keydown'));

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('removeEvent', () => {
    it('移除事件监听', () => {
      const cases = [
        [handler, false],
        [handler, true],
      ];
      cases.forEach(([h, useCapture]) => {
        addEvent(element, 'click', h as any, useCapture as boolean);
        removeEvent(element, 'click', h as any, useCapture as boolean);

        element.click();
        expect(h).not.toHaveBeenCalled();
      });
    });

    it('仅移除指定的处理函数', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      addEvent(element, 'click', handler1);
      addEvent(element, 'click', handler2);
      removeEvent(element, 'click', handler1);

      element.click();
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('优雅处理不存在的处理函数', () => {
      expect(() => {
        removeEvent(element, 'click', handler);
      }).not.toThrow();
    });
  });

  describe('add和remove组合使用', () => {
    it('正确添加和移除事件', () => {
      addEvent(element, 'click', handler);

      element.click();
      expect(handler).toHaveBeenCalledTimes(1);

      removeEvent(element, 'click', handler);

      element.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('处理多个添加/移除周期', () => {
      addEvent(element, 'click', handler);
      element.click();
      expect(handler).toHaveBeenCalledTimes(1);

      removeEvent(element, 'click', handler);
      element.click();
      expect(handler).toHaveBeenCalledTimes(1);

      addEvent(element, 'click', handler);
      element.click();
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });
});
