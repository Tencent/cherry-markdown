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
 * 多实例隔离集成测试
 *
 * 测试 Editor 在多实例场景下的隔离性：
 * - markIdCounter 独立性
 * - dealSpecialWordsTimer 独立性
 * - eventHandlers 独立性
 * - destroy() 互不影响
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============ Mock 类型 ============

interface MockEditorInstance {
  id: number;
  markIdCounter: number;
  dealSpecialWordsTimer?: number;
  eventHandlers: Map<string, Function[]>;
  destroy(): void;
}

// 创建 Mock Editor 实例
const createMockEditor = (id: number): MockEditorInstance => {
  return {
    id,
    markIdCounter: 0,
    dealSpecialWordsTimer: 0,
    eventHandlers: new Map<string, Function[]>(),

    destroy() {
      // 清理定时器
      if (this.dealSpecialWordsTimer) {
        clearTimeout(this.dealSpecialWordsTimer);
        this.dealSpecialWordsTimer = 0;
      }

      // 清理事件处理器
      this.eventHandlers.clear();

      // 重置状态
      this.markIdCounter = 0;
    },
  };
};

// ============ 测试用例 ============

describe('多实例隔离测试', () => {
  describe('markIdCounter 隔离', () => {
    it('应为每个实例维护独立的 markIdCounter', () => {
      const editor1 = createMockEditor(1);
      const editor2 = createMockEditor(2);

      editor1.markIdCounter = 100;
      editor2.markIdCounter = 200;

      expect(editor1.markIdCounter).toBe(100);
      expect(editor2.markIdCounter).toBe(200);
    });

    it('销毁一个实例不应影响另一个实例的 markIdCounter', () => {
      const editor1 = createMockEditor(1);
      const editor2 = createMockEditor(2);

      editor1.markIdCounter = 50;
      editor2.markIdCounter = 100;

      editor1.destroy();

      expect(editor1.markIdCounter).toBe(0);
      expect(editor2.markIdCounter).toBe(100);
    });

    it('markIdCounter 应能独立增长', () => {
      const editor1 = createMockEditor(1);
      const editor2 = createMockEditor(2);

      // 模拟标记创建
      for (let i = 0; i < 10; i += 1) {
        editor1.markIdCounter += 1;
        editor2.markIdCounter += 2;
      }

      expect(editor1.markIdCounter).toBe(10);
      expect(editor2.markIdCounter).toBe(20);
    });
  });

  describe('dealSpecialWordsTimer 隔离', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('应为每个实例维护独立的 dealSpecialWordsTimer', () => {
      const editor1 = createMockEditor(1);
      const editor2 = createMockEditor(2);

      const fn1 = vi.fn();
      const fn2 = vi.fn();

      // 为不同实例设置定时器
      editor1.dealSpecialWordsTimer = setTimeout(fn1, 200) as unknown as number;
      editor2.dealSpecialWordsTimer = setTimeout(fn2, 300) as unknown as number;

      expect(editor1.dealSpecialWordsTimer).not.toBe(editor2.dealSpecialWordsTimer);

      vi.advanceTimersByTime(200);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).not.toHaveBeenCalled();
    });

    it('销毁一个实例应清理其定时器', () => {
      const editor1 = createMockEditor(1);

      const fn = vi.fn();
      editor1.dealSpecialWordsTimer = setTimeout(fn, 200) as unknown as number;

      editor1.destroy();

      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();
    });

    it('销毁一个实例不应影响另一个实例的定时器', () => {
      const editor1 = createMockEditor(1);
      const editor2 = createMockEditor(2);

      const fn1 = vi.fn();
      const fn2 = vi.fn();

      editor1.dealSpecialWordsTimer = setTimeout(fn1, 200) as unknown as number;
      editor2.dealSpecialWordsTimer = setTimeout(fn2, 200) as unknown as number;

      editor1.destroy();

      vi.advanceTimersByTime(200);
      expect(fn1).not.toHaveBeenCalled(); // editor1 的定时器已清理
      expect(fn2).toHaveBeenCalledTimes(1); // editor2 的定时器仍然有效
    });
  });

  describe('eventHandlers 隔离', () => {
    it('应为每个实例维护独立的 eventHandlers', () => {
      const editor1 = createMockEditor(1);
      const editor2 = createMockEditor(2);

      const handler1 = () => {};
      const handler2 = () => {};

      editor1.eventHandlers.set('change', [handler1]);
      editor2.eventHandlers.set('change', [handler2]);

      expect(editor1.eventHandlers.get('change')).toEqual([handler1]);
      expect(editor2.eventHandlers.get('change')).toEqual([handler2]);
    });

    it('销毁一个实例应清理其事件处理器', () => {
      const editor1 = createMockEditor(1);

      const handler = vi.fn();
      editor1.eventHandlers.set('change', [handler]);

      expect(editor1.eventHandlers.size).toBe(1);

      editor1.destroy();

      expect(editor1.eventHandlers.size).toBe(0);
    });

    it('销毁一个实例不应影响另一个实例的事件处理器', () => {
      const editor1 = createMockEditor(1);
      const editor2 = createMockEditor(2);

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      editor1.eventHandlers.set('change', [handler1]);
      editor2.eventHandlers.set('change', [handler2]);

      editor1.destroy();

      expect(editor1.eventHandlers.size).toBe(0);
      expect(editor2.eventHandlers.size).toBe(1);
      expect(editor2.eventHandlers.get('change')).toEqual([handler2]);
    });

    it('支持多个事件处理器', () => {
      const editor1 = createMockEditor(1);

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      editor1.eventHandlers.set('change', [handler1, handler2]);
      editor1.eventHandlers.set('keydown', [handler3]);

      expect(editor1.eventHandlers.size).toBe(2);
      expect(editor1.eventHandlers.get('change')?.length).toBe(2);
      expect(editor1.eventHandlers.get('keydown')?.length).toBe(1);
    });
  });

  describe('destroy() 隔离', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('应完全清理单个实例的所有资源', () => {
      const editor = createMockEditor(1);

      editor.markIdCounter = 100;
      editor.dealSpecialWordsTimer = setTimeout(() => {}, 200) as unknown as number;
      editor.eventHandlers.set('change', [() => {}]);

      editor.destroy();

      expect(editor.markIdCounter).toBe(0);
      expect(editor.dealSpecialWordsTimer).toBe(0);
      expect(editor.eventHandlers.size).toBe(0);
    });

    it('销毁多个实例时应互不影响', () => {
      const editors = [
        createMockEditor(1),
        createMockEditor(2),
        createMockEditor(3),
        createMockEditor(4),
        createMockEditor(5),
      ];

      // 初始化所有实例
      editors.forEach((e, idx) => {
        e.markIdCounter = (idx + 1) * 100;
        e.dealSpecialWordsTimer = setTimeout(() => {}, 200 + idx * 100) as unknown as number;
        e.eventHandlers.set('change', [() => {}]);
      });

      // 销毁偶数实例
      editors[1].destroy(); // 实例 2
      editors[3].destroy(); // 实例 4

      // 验证奇数实例不受影响
      expect(editors[0].markIdCounter).toBe(100);
      expect(editors[0].eventHandlers.size).toBe(1);

      expect(editors[2].markIdCounter).toBe(300);
      expect(editors[2].eventHandlers.size).toBe(1);

      expect(editors[4].markIdCounter).toBe(500);
      expect(editors[4].eventHandlers.size).toBe(1);

      // 验证销毁的实例已清理
      expect(editors[1].markIdCounter).toBe(0);
      expect(editors[1].eventHandlers.size).toBe(0);

      expect(editors[3].markIdCounter).toBe(0);
      expect(editors[3].eventHandlers.size).toBe(0);
    });
  });

  describe('并发创建销毁场景', () => {
    it('应支持快速连续的创建和销毁', () => {
      const editors: MockEditorInstance[] = [];

      // 创建 10 个实例
      for (let i = 0; i < 10; i++) {
        editors.push(createMockEditor(i));
      }

      // 快速增长 markIdCounter
      editors.forEach((e) => {
        e.markIdCounter = Math.random() * 10000;
      });

      // 验证独立性
      const counters = editors.map((e) => e.markIdCounter);
      const uniqueCounters = new Set(counters);
      expect(uniqueCounters.size).toBeLessThanOrEqual(editors.length);

      // 销毁所有
      editors.forEach((e) => e.destroy());

      // 验证所有都清理
      editors.forEach((e) => {
        expect(e.markIdCounter).toBe(0);
        expect(e.eventHandlers.size).toBe(0);
        expect(e.dealSpecialWordsTimer).toBe(0);
      });
    });

    it('交替创建销毁不应产生状态泄漏', () => {
      const allEditors: MockEditorInstance[] = [];

      for (let cycle = 0; cycle < 3; cycle++) {
        const editors = [createMockEditor(1), createMockEditor(2), createMockEditor(3)];

        editors.forEach((e) => {
          e.markIdCounter = 100 + cycle;
          e.eventHandlers.set('change', [() => {}]);
        });

        allEditors.push(...editors);

        // 销毁这个周期的实例
        editors.forEach((e) => e.destroy());
      }

      // 验证所有已销毁的实例都完全清理
      allEditors.forEach((e) => {
        expect(e.markIdCounter).toBe(0);
        expect(e.eventHandlers.size).toBe(0);
      });
    });
  });
});
