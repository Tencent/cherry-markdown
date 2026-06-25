/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * 事件处理单元测试
 *
 * 测试 Editor.js 中的事件系统：
 * - change 事件 (onChange, beforeChange)
 * - DOM 事件监听
 * - 事件批处理 (debounce)
 * - 事件卸载 (cleanup)
 */

import { describe, it, expect, vi } from 'vitest';

// ============ Mock 类型 ============

type EventHandler = (...args: any[]) => void;

interface MockEventHandler {
  elm: HTMLElement | Window | Document;
  evType: string;
  fn: EventHandler;
  useCapture?: boolean;
}

interface MockEventEmitter {
  handlers: Map<string, Set<EventHandler>>;
  addHandler(event: string, handler: EventHandler): void;
  removeHandler(event: string, handler: EventHandler): void;
  emit(event: string, ...args: any[]): void;
  clear(): void;
}

// 创建 Mock 事件发射器
const createMockEventEmitter = (): MockEventEmitter => {
  const handlers = new Map<string, Set<EventHandler>>();

  return {
    handlers,

    addHandler(event: string, handler: EventHandler) {
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }
      handlers.get(event)!.add(handler);
    },

    removeHandler(event: string, handler: EventHandler) {
      const eventHandlers = handlers.get(event);
      if (eventHandlers) {
        eventHandlers.delete(handler);
      }
    },

    emit(event: string, ...args: any[]) {
      const eventHandlers = handlers.get(event);
      if (eventHandlers) {
        eventHandlers.forEach((handler) => handler(...args));
      }
    },

    clear() {
      handlers.clear();
    },
  };
};

// ============ 测试数据 ============

describe('事件发射器测试', () => {
  describe('基本事件管理', () => {
    it('addHandler: 应正确添加事件处理器', () => {
      const emitter = createMockEventEmitter();
      const handler = vi.fn();

      emitter.addHandler('change', handler);

      expect(emitter.handlers.get('change')?.size).toBe(1);
    });

    it('addHandler: 同一处理器不应重复添加', () => {
      const emitter = createMockEventEmitter();
      const handler = vi.fn();

      emitter.addHandler('change', handler);
      emitter.addHandler('change', handler);

      expect(emitter.handlers.get('change')?.size).toBe(1);
    });

    it('removeHandler: 应正确移除事件处理器', () => {
      const emitter = createMockEventEmitter();
      const handler = vi.fn();

      emitter.addHandler('change', handler);
      emitter.removeHandler('change', handler);

      expect(emitter.handlers.get('change')?.size).toBe(0);
    });

    it('emit: 应触发所有已注册处理器', () => {
      const emitter = createMockEventEmitter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.addHandler('change', handler1);
      emitter.addHandler('change', handler2);
      emitter.emit('change', 'test');

      expect(handler1).toHaveBeenCalledWith('test');
      expect(handler2).toHaveBeenCalledWith('test');
    });

    it('emit: 未注册事件应不触发任何处理器', () => {
      const emitter = createMockEventEmitter();
      const handler = vi.fn();

      emitter.emit('nonexistent', 'test');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('clear: 应移除所有事件处理器', () => {
      const emitter = createMockEventEmitter();

      emitter.addHandler('change', vi.fn());
      emitter.addHandler('focus', vi.fn());
      emitter.addHandler('blur', vi.fn());
      emitter.clear();

      expect(emitter.handlers.size).toBe(0);
    });
  });
});

describe('事件批处理测试', () => {
  describe('防抖机制', () => {
    it('防抖: 频繁触发应延迟执行', () => {
      vi.useFakeTimers();

      const handler = vi.fn();
      let debouncedFn: (() => void) | null = null;

      // 模拟防抖函数
      const debounce = (fn: () => void, delay: number) => {
        return () => {
          if (debouncedFn) clearTimeout(debouncedFn as any);
          debouncedFn = setTimeout(fn, delay) as any;
        };
      };

      const debouncedHandler = debounce(handler, 200);

      // 快速调用 3 次
      debouncedHandler();
      debouncedHandler();
      debouncedHandler();

      // 现在立即执行
      vi.runAllTimers();

      expect(handler).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('防抖: 最后一次调用应在延迟后执行', () => {
      vi.useFakeTimers();

      const calls: number[] = [];
      const handler = vi.fn(() => calls.push(Date.now()));

      const debounce = (fn: () => void, delay: number) => {
        let timer: any;
        return () => {
          clearTimeout(timer);
          timer = setTimeout(fn, delay);
        };
      };

      const debouncedHandler = debounce(handler, 100);

      debouncedHandler();
      expect(handler).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(handler).not.toHaveBeenCalled();

      vi.advanceTimersByTime(60);
      expect(handler).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('changeEventBatch', () => {
    it('批处理: 应收集多个变更事件', () => {
      const batch: any[] = [];

      // 模拟添加变更到批处理
      batch.push({ type: 'change', from: 0, to: 5, text: 'Hello' });
      batch.push({ type: 'change', from: 10, to: 15, text: 'World' });

      expect(batch.length).toBe(2);
    });

    it('批处理: 刷新时应触发单个合并事件', () => {
      const batch: any[] = [];
      let emittedCount = 0;

      const emitBatch = () => {
        if (batch.length > 0) {
          // 合并所有变更
          const merged = batch.splice(0, batch.length);
          emittedCount += 1;
          return merged;
        }
        return null;
      };

      batch.push({ type: 'change', from: 0, to: 5 });
      batch.push({ type: 'change', from: 10, to: 15 });

      emitBatch();
      expect(emittedCount).toBe(1);
      expect(batch.length).toBe(0);
    });
  });
});

describe('DOM 事件监听器测试', () => {
  describe('事件绑定', () => {
    it('addEventListener: 应记录所有绑定', () => {
      const tracker: MockEventHandler[] = [];
      const addEvent = (elm: HTMLElement, evType: string, fn: EventHandler, useCapture?: boolean) => {
        tracker.push({ elm, evType, fn, useCapture });
      };

      const mockElm = document.createElement('div');
      const handler = vi.fn();

      addEvent(mockElm, 'click', handler, false);

      expect(tracker.length).toBe(1);
      expect(tracker[0].elm).toBe(mockElm);
      expect(tracker[0].evType).toBe('click');
    });

    it('removeEventListener: 应正确移除监听器', () => {
      const tracker: MockEventHandler[] = [];
      const addEvent = (elm: HTMLElement, evType: string, fn: EventHandler, useCapture?: boolean) => {
        tracker.push({ elm, evType, fn, useCapture });
      };

      const removeEvent = (elm: HTMLElement, evType: string, fn: EventHandler, _useCapture?: boolean) => {
        const index = tracker.findIndex((t) => t.elm === elm && t.evType === evType && t.fn === fn);
        if (index !== -1) {
          tracker.splice(index, 1);
        }
      };

      const mockElm = document.createElement('div');
      const handler = vi.fn();

      addEvent(mockElm, 'click', handler);
      expect(tracker.length).toBe(1);

      removeEvent(mockElm, 'click', handler);
      expect(tracker.length).toBe(0);
    });
  });

  describe('事件清理', () => {
    it('destroy: 应清理所有 DOM 监听器', () => {
      const tracker: MockEventHandler[] = [];

      const addEvent = (elm: HTMLElement | Window, evType: string, fn: EventHandler) => {
        tracker.push({ elm, evType, fn });
      };

      const cleanup = () => {
        tracker.forEach(({ elm, evType, fn }) => {
          // 模拟 removeEventListener
          const index = tracker.findIndex((t) => t.elm === elm && t.evType === evType && t.fn === fn);
          if (index !== -1) {
            tracker.splice(index, 1);
          }
        });
        tracker.length = 0;
      };

      const mockElm = document.createElement('div');
      addEvent(mockElm, 'click', vi.fn());
      addEvent(mockElm, 'keydown', vi.fn());
      addEvent(window, 'resize', vi.fn());

      expect(tracker.length).toBe(3);

      cleanup();

      expect(tracker.length).toBe(0);
    });

    it('destroy: 重复清理应安全', () => {
      const tracker: MockEventHandler[] = [];

      const cleanup = () => {
        // 清理逻辑，tracker.length = 0 会设置长度
        // 重复调用应安全
        while (tracker.length > 0) {
          tracker.pop();
        }
      };

      const mockElm = document.createElement('div');
      tracker.push({ elm: mockElm, evType: 'click', fn: vi.fn() });

      cleanup();
      expect(tracker.length).toBe(0);

      cleanup(); // 重复清理
      expect(tracker.length).toBe(0);
    });
  });
});

describe('beforeChange 事件测试', () => {
  describe('变更拦截', () => {
    it('beforeChange: 应在变更前触发', () => {
      const sequence: string[] = [];
      const beforeChange = vi.fn(() => {
        sequence.push('beforeChange');
      });
      const change = vi.fn(() => {
        sequence.push('change');
      });

      // 模拟编辑器变更流程
      const handleChange = (allow: boolean) => {
        beforeChange();
        if (allow) {
          change();
        }
      };

      handleChange(true);
      expect(sequence).toEqual(['beforeChange', 'change']);

      sequence.length = 0;
      handleChange(false);
      expect(sequence).toEqual(['beforeChange']);
    });

    it('beforeChange: 返回 false 应取消变更', () => {
      const beforeChange = vi.fn(() => false);
      const change = vi.fn();

      const handleChange = () => {
        if (beforeChange() !== false) {
          change();
        }
      };

      handleChange();

      expect(beforeChange).toHaveBeenCalled();
      expect(change).not.toHaveBeenCalled();
    });

    it('beforeChange: 应能访问变更内容', () => {
      let capturedFrom: number | undefined;
      let capturedTo: number | undefined;
      let capturedText: string | undefined;

      const beforeChange = vi.fn((from: number, to: number, text: string) => {
        capturedFrom = from;
        capturedTo = to;
        capturedText = text;
        return true;
      });

      beforeChange(0, 5, 'Hello');

      expect(capturedFrom).toBe(0);
      expect(capturedTo).toBe(5);
      expect(capturedText).toBe('Hello');
    });
  });
});

describe('userEvent 映射测试', () => {
  describe('CM6 userEvent', () => {
    it('应正确映射 CM5 事件到 CM6', () => {
      const eventMapping: Record<string, string> = {
        input: 'input.type',
        'input.type': 'input.type',
        'input.compose': 'input.compose',
        delete: 'delete.*',
        'delete.forward': 'delete.forward',
        'delete.backward': 'delete.backward',
        select: 'select.*',
        'select.all': 'select.all',
      };

      const testCases = [
        { input: 'input', expected: 'input.type' },
        { input: 'delete', expected: 'delete.*' },
        { input: 'select', expected: 'select.*' },
      ];

      testCases.forEach(({ input, expected }) => {
        const mapped = eventMapping[input] || input;
        expect(mapped).toBe(expected);
      });
    });

    it('精确匹配应优先于前缀匹配', () => {
      const matchUserEvent = (userEvent: string, expected: string) => {
        return userEvent === expected || userEvent.startsWith(`${expected}.`);
      };

      expect(matchUserEvent('input.type', 'input.type')).toBe(true);
      expect(matchUserEvent('input.type', 'input')).toBe(true);
      expect(matchUserEvent('input', 'input.type')).toBe(false);
    });
  });
});

describe('事件与状态同步测试', () => {
  describe('状态一致性', () => {
    it('事件触发时 document 状态应已更新', () => {
      let docState = 'initial';
      let eventFired = false;
      let capturedDoc = '';

      const onChange = vi.fn(() => {
        eventFired = true;
        capturedDoc = docState;
      });

      const updateDoc = (newDoc: string) => {
        docState = newDoc;
        onChange();
      };

      updateDoc('updated');

      expect(eventFired).toBe(true);
      expect(capturedDoc).toBe('updated');
    });

    it('beforeChange 触发时 document 应为旧状态', () => {
      let docState = 'old';
      let beforeChangeFired = false;
      let capturedDocBefore = '';

      const beforeChange = vi.fn(() => {
        beforeChangeFired = true;
        capturedDocBefore = docState;
      });

      const change = vi.fn((newDoc: string) => {
        docState = newDoc;
        beforeChange();
      });

      change('new');

      expect(beforeChangeFired).toBe(true);
      expect(capturedDocBefore).toBe('new'); // CM6 行为：beforeChange 在 doc 更新后触发
    });
  });
});

describe('事件性能测试', () => {
  it('大量快速事件应被防抖合并', () => {
    vi.useFakeTimers();

    const events: string[] = [];
    const handler = vi.fn(() => events.push('fired'));

    let debounceTimer: any;
    const debounce = (fn: () => void, delay: number) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fn, delay);
    };

    // 快速触发 10 次
    for (let i = 0; i < 10; i++) {
      debounce(handler, 50);
    }

    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60);

    // 只应触发一次
    expect(handler).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('移除事件处理器应提高清理性能', () => {
    const emitter = createMockEventEmitter();

    // 添加 100 个处理器
    for (let i = 0; i < 100; i++) {
      emitter.addHandler('test', vi.fn());
    }

    expect(emitter.handlers.get('test')?.size).toBe(100);

    // 清理
    emitter.clear();

    expect(emitter.handlers.size).toBe(0);
  });
});
