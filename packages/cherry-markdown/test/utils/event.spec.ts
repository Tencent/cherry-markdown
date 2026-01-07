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
    it('使用addEventListener添加事件监听', () => {
      const result = addEvent(element, 'click', handler);
      expect(result).toBe(true);

      element.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('带useCapture标志添加事件监听', () => {
      const result = addEvent(element, 'click', handler, true);
      expect(result).toBe(true);

      element.click();
      expect(handler).toHaveBeenCalledTimes(1);
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

      const mouseoverEvent = new MouseEvent('mouseover');
      element.dispatchEvent(mouseoverEvent);

      const mouseoutEvent = new MouseEvent('mouseout');
      element.dispatchEvent(mouseoutEvent);

      const keydownEvent = new KeyboardEvent('keydown');
      element.dispatchEvent(keydownEvent);

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('removeEvent', () => {
    it('使用removeEventListener移除事件监听', () => {
      addEvent(element, 'click', handler);
      removeEvent(element, 'click', handler);

      element.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it('带useCapture标志移除事件监听', () => {
      addEvent(element, 'click', handler, true);
      removeEvent(element, 'click', handler, true);

      element.click();
      expect(handler).not.toHaveBeenCalled();
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
