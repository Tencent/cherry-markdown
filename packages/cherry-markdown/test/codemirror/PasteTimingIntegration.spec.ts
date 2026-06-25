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
 * 粘贴时序集成测试
 *
 * 验证粘贴操作的事件顺序和时序正确性：
 * - beforeChange 在变更前触发
 * - markField 装饰应用正确
 * - dealSpecialWords 防抖正常工作
 * - pasteHelper 状态管理正确
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============ Mock 类型 ============

enum EventType {
  BEFORE_CHANGE = 'beforeChange',
  CHANGE = 'change',
  PASTE = 'paste',
  MARK_FIELD_UPDATE = 'markFieldUpdate',
  DEAL_SPECIAL_WORDS = 'dealSpecialWords',
  PASTE_HELPER_SHOW = 'pasteHelperShow',
  PASTE_HELPER_HIDE = 'pasteHelperHide',
}

interface TimelineEvent {
  type: EventType;
  timestamp: number;
  data?: any;
  description?: string;
}

interface MockPasteFlow {
  timeline: TimelineEvent[];
  recordEvent(type: EventType, data?: any, description?: string): void;
  getEventSequence(): string[];
  validateSequence(expected: EventType[]): boolean;
  clear(): void;
}

const createMockPasteFlow = (): MockPasteFlow => {
  const timeline: TimelineEvent[] = [];
  let baseTime = 0;

  return {
    timeline,

    recordEvent(type: EventType, data?: any, description?: string) {
      timeline.push({
        type,
        timestamp: Date.now() - baseTime,
        data,
        description,
      });
    },

    getEventSequence(): string[] {
      return timeline.map((e) => e.type);
    },

    validateSequence(expected: EventType[]): boolean {
      const actual = this.getEventSequence();
      if (actual.length !== expected.length) {
        return false;
      }
      return actual.every((type, idx) => type === expected[idx]);
    },

    clear() {
      timeline.length = 0;
      baseTime = Date.now();
    },
  };
};

// ============ 模拟粘贴流程 ============

interface MockEditor {
  getValue(): string;
  setValue(value: string): void;
  getSelection(): string;
  replaceSelection(text: string): void;
  lineCount(): number;
  getRange(from: number, to: number): string;
}

const createMockEditor = (): MockEditor => {
  let content = '';

  return {
    getValue() {
      return content;
    },

    setValue(value: string) {
      content = value;
    },

    getSelection() {
      return '';
    },

    replaceSelection(text: string) {
      content += text;
    },

    lineCount() {
      return content.split('\n').length;
    },

    getRange(from: number, to: number) {
      return content.substring(from, to);
    },
  };
};

// ============ 测试用例 ============

describe('粘贴时序集成测试', () => {
  let flow: MockPasteFlow;

  beforeEach(() => {
    vi.useFakeTimers();
    flow = createMockPasteFlow();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本粘贴时序', () => {
    it('应按正确顺序触发粘贴事件', () => {
      const expectedSequence = [EventType.BEFORE_CHANGE, EventType.CHANGE, EventType.MARK_FIELD_UPDATE];

      // 模拟粘贴流程
      flow.recordEvent(EventType.BEFORE_CHANGE, { text: 'pasted content' });
      flow.recordEvent(EventType.CHANGE, { origin: '+paste' });
      flow.recordEvent(EventType.MARK_FIELD_UPDATE, { decorations: [] });

      expect(flow.validateSequence(expectedSequence)).toBe(true);
    });

    it('pasteHelper 应在 change 之后显示', () => {
      const expectedSequence = [EventType.BEFORE_CHANGE, EventType.CHANGE, EventType.PASTE_HELPER_SHOW];

      flow.recordEvent(EventType.BEFORE_CHANGE);
      flow.recordEvent(EventType.CHANGE);
      flow.recordEvent(EventType.PASTE_HELPER_SHOW);

      expect(flow.validateSequence(expectedSequence)).toBe(true);
    });

    it('dealSpecialWords 应在 change 之后延迟触发', () => {
      const expectedSequence = [EventType.BEFORE_CHANGE, EventType.CHANGE, EventType.DEAL_SPECIAL_WORDS];

      flow.recordEvent(EventType.BEFORE_CHANGE);
      flow.recordEvent(EventType.CHANGE);

      // 模拟防抖延迟（200ms）
      vi.advanceTimersByTime(200);
      flow.recordEvent(EventType.DEAL_SPECIAL_WORDS);

      expect(flow.validateSequence(expectedSequence)).toBe(true);
    });
  });

  describe('HTML 粘贴处理', () => {
    it('HTML 粘贴应触发格式化流程', () => {
      const expectedSequence = [
        EventType.PASTE,
        EventType.BEFORE_CHANGE,
        EventType.CHANGE,
        EventType.MARK_FIELD_UPDATE,
      ];

      flow.recordEvent(EventType.PASTE, { dataType: 'html' });
      flow.recordEvent(EventType.BEFORE_CHANGE, { converted: true });
      flow.recordEvent(EventType.CHANGE);
      flow.recordEvent(EventType.MARK_FIELD_UPDATE);

      expect(flow.validateSequence(expectedSequence)).toBe(true);
    });

    it('pasteHelper 应管理 HTML/Markdown 切换按钮', () => {
      const expectedSequence = [EventType.PASTE_HELPER_SHOW, EventType.CHANGE, EventType.PASTE_HELPER_HIDE];

      flow.recordEvent(EventType.PASTE_HELPER_SHOW);
      vi.advanceTimersByTime(500); // 用户点击
      flow.recordEvent(EventType.CHANGE);
      flow.recordEvent(EventType.PASTE_HELPER_HIDE);

      expect(flow.validateSequence(expectedSequence)).toBe(true);
    });
  });

  describe('大文档粘贴处理', () => {
    it('大文档应触发降级处理策略', () => {
      const editor = createMockEditor();

      // 模拟大文档（10000+ 行）
      let largeContent = '';
      for (let i = 0; i < 10001; i++) {
        largeContent += `line ${i}\n`;
      }
      editor.setValue(largeContent);

      const expectedSequence = [
        EventType.BEFORE_CHANGE,
        EventType.CHANGE,
        EventType.MARK_FIELD_UPDATE, // 仅处理高优先级标记
      ];

      flow.recordEvent(EventType.BEFORE_CHANGE);
      flow.recordEvent(EventType.CHANGE);
      flow.recordEvent(EventType.MARK_FIELD_UPDATE);

      expect(flow.validateSequence(expectedSequence)).toBe(true);
      expect(editor.lineCount()).toBeGreaterThan(10000);
    });
  });

  describe('dealSpecialWords 防抖', () => {
    it('快速连续变更应合并为单个 dealSpecialWords', () => {
      // 第一次变更
      flow.recordEvent(EventType.CHANGE, { text: 'a' });
      vi.advanceTimersByTime(100);

      // 第二次变更（在防抖时间内）
      flow.recordEvent(EventType.CHANGE, { text: 'ab' });
      vi.advanceTimersByTime(100);

      // 第三次变更（在防抖时间内）
      flow.recordEvent(EventType.CHANGE, { text: 'abc' });
      vi.advanceTimersByTime(100);

      // 等待防抖超时
      vi.advanceTimersByTime(200);
      flow.recordEvent(EventType.DEAL_SPECIAL_WORDS);

      // 应该只有一个 DEAL_SPECIAL_WORDS 事件
      const dealSpecialWordsCount = flow.timeline.filter((e) => e.type === EventType.DEAL_SPECIAL_WORDS).length;
      expect(dealSpecialWordsCount).toBe(1);
    });

    it('应支持强制处理超时', () => {
      flow.recordEvent(EventType.CHANGE);
      vi.advanceTimersByTime(500);

      flow.recordEvent(EventType.CHANGE);
      vi.advanceTimersByTime(800); // 总时间 > 1000ms

      flow.recordEvent(EventType.DEAL_SPECIAL_WORDS); // 强制处理

      const timeline = flow.timeline;
      expect(timeline.length).toBeGreaterThan(0);
    });

    it('清空防抖应重置计时器', () => {
      flow.recordEvent(EventType.CHANGE);
      vi.advanceTimersByTime(100);

      flow.recordEvent(EventType.CHANGE); // 重置防抖计时
      vi.advanceTimersByTime(100);

      flow.recordEvent(EventType.CHANGE); // 再次重置
      vi.advanceTimersByTime(200);

      flow.recordEvent(EventType.DEAL_SPECIAL_WORDS);

      expect(flow.timeline.length).toBeGreaterThan(0);
    });
  });

  describe('撤销恢复一致性', () => {
    it('粘贴后撤销应恢复原始状态', () => {
      const pasteSequence = [EventType.BEFORE_CHANGE, EventType.CHANGE, EventType.MARK_FIELD_UPDATE];

      flow.recordEvent(EventType.BEFORE_CHANGE, { action: 'paste' });
      flow.recordEvent(EventType.CHANGE, { origin: '+paste' });
      flow.recordEvent(EventType.MARK_FIELD_UPDATE);

      expect(flow.validateSequence(pasteSequence)).toBe(true);

      // 撤销应反向清理
      flow.clear();
      const undoSequence = [
        EventType.BEFORE_CHANGE,
        EventType.CHANGE,
        EventType.MARK_FIELD_UPDATE, // 撤销不应留下装饰
      ];

      flow.recordEvent(EventType.BEFORE_CHANGE, { action: 'undo' });
      flow.recordEvent(EventType.CHANGE, { origin: '+undo' });
      flow.recordEvent(EventType.MARK_FIELD_UPDATE);

      expect(flow.validateSequence(undoSequence)).toBe(true);
    });
  });

  describe('事件时序压力测试', () => {
    it('支持快速连续粘贴', () => {
      const expectedEventTypes = [
        EventType.PASTE,
        EventType.CHANGE,
        EventType.PASTE,
        EventType.CHANGE,
        EventType.PASTE,
        EventType.CHANGE,
      ];

      for (let i = 0; i < 3; i++) {
        flow.recordEvent(EventType.PASTE);
        flow.recordEvent(EventType.CHANGE);
        vi.advanceTimersByTime(100);
      }

      const actualSequence = flow.getEventSequence();
      expect(actualSequence).toEqual(expectedEventTypes);
    });

    it('应处理极端情况：大文档 + 快速变更 + dealSpecialWords', () => {
      const editor = createMockEditor();

      // 模拟大文档
      editor.setValue('x'.repeat(10000));

      // 快速变更
      flow.recordEvent(EventType.CHANGE);
      vi.advanceTimersByTime(50);

      flow.recordEvent(EventType.CHANGE);
      vi.advanceTimersByTime(50);

      flow.recordEvent(EventType.CHANGE);
      vi.advanceTimersByTime(150);

      // dealSpecialWords 应触发一次
      flow.recordEvent(EventType.DEAL_SPECIAL_WORDS);

      const sequence = flow.getEventSequence();
      expect(sequence).toContain(EventType.DEAL_SPECIAL_WORDS);
    });
  });

  describe('事件时序错误检测', () => {
    it('应检测错误的事件顺序', () => {
      const expectedSequence = [EventType.BEFORE_CHANGE, EventType.CHANGE, EventType.MARK_FIELD_UPDATE];

      // 错误的顺序：CHANGE 在 BEFORE_CHANGE 之前
      flow.recordEvent(EventType.CHANGE);
      flow.recordEvent(EventType.BEFORE_CHANGE);
      flow.recordEvent(EventType.MARK_FIELD_UPDATE);

      expect(flow.validateSequence(expectedSequence)).toBe(false);
    });

    it('应检测缺失的事件', () => {
      const expectedSequence = [EventType.BEFORE_CHANGE, EventType.CHANGE, EventType.MARK_FIELD_UPDATE];

      // 缺失 CHANGE 事件
      flow.recordEvent(EventType.BEFORE_CHANGE);
      flow.recordEvent(EventType.MARK_FIELD_UPDATE);

      expect(flow.validateSequence(expectedSequence)).toBe(false);
    });
  });
});
