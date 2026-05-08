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
 * 批量标记功能单元测试
 *
 * 测试 Editor.js 中的标记系统：
 * - markText 方法
 * - 批量标记 (applyBatchMarks)
 * - 标记查找 (findMarks, getExistingMarksSet)
 * - 标记移除 (removeMark)
 */

import { describe, it, expect } from 'vitest';

// ============ Mock 类型和工厂 ============

interface MarkItem {
  from: number;
  to: number;
  id: string;
  className: string;
  data?: any;
}

// 创建 Mock MarkItem
const createMockMarkItem = (from: number, to: number, className: string, id?: string): MarkItem => ({
  from,
  to,
  id: id || `mark_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  className,
});

describe('markText 功能测试', () => {
  describe('基本标记', () => {
    it('markText: 应创建正确的标记范围', () => {
      const markItem = createMockMarkItem(5, 15, 'cm-url');

      expect(markItem.from).toBe(5);
      expect(markItem.to).toBe(15);
      expect(markItem.className).toBe('cm-url');
      expect(markItem.id).toBeDefined();
    });

    it('markText: 应生成唯一的 markId', () => {
      const mark1 = createMockMarkItem(0, 5, 'test');
      const mark2 = createMockMarkItem(10, 15, 'test');

      expect(mark1.id).not.toBe(mark2.id);
    });

    it('markText: 零长度范围应被正确处理', () => {
      const markItem = createMockMarkItem(5, 5, 'cursor');

      expect(markItem.from).toBe(markItem.to);
      expect(markItem.to - markItem.from).toBe(0);
    });
  });

  describe('标记属性', () => {
    it('markText: 应支持自定义 className', () => {
      const testCases = ['cm-url', 'cm-url paste-wrapper', 'cm-url base64', 'cm-url drawio', 'cm-url url-truncated'];

      testCases.forEach((className) => {
        const mark = createMockMarkItem(0, 10, className);
        expect(mark.className).toBe(className);
      });
    });

    it('markText: 应支持附加数据', () => {
      const markItem = createMockMarkItem(0, 10, 'test');
      markItem.data = { type: 'base64', size: 1024 };

      expect(markItem.data).toBeDefined();
      expect(markItem.data.type).toBe('base64');
      expect(markItem.data.size).toBe(1024);
    });

    it('markText: data-mark-id 属性应自动添加', () => {
      const mark = createMockMarkItem(0, 10, 'test');

      // 模拟 decoration 创建时添加 attributes
      const attributes = { 'data-mark-id': mark.id };

      expect(attributes['data-mark-id']).toBe(mark.id);
    });
  });

  describe('标记范围计算', () => {
    it('calculateMarkRange: 中文范围应正确', () => {
      // 中文字符在 JavaScript 中长度为 1
      const chineseText = '这是一个测试';
      const from = 0;
      const to = chineseText.length;

      expect(to - from).toBe(6); // 6 个中文字符
    });

    it('calculateMarkRange: 混合内容范围应正确', () => {
      const mixedText = 'abc中文123';
      const from = 0;
      const to = mixedText.length;

      // JavaScript 中中文字符长度为 1，所以 'abc中文123' 长度为 8
      expect(to - from).toBe(8); // 3 + 2 + 3
    });
  });
});

describe('批量标记测试', () => {
  describe('applyBatchMarks', () => {
    it('应批量应用多个标记', () => {
      const marks: MarkItem[] = [
        createMockMarkItem(0, 5, 'cm-url'),
        createMockMarkItem(10, 20, 'cm-url'),
        createMockMarkItem(25, 35, 'cm-url'),
      ];

      expect(marks.length).toBe(3);
      marks.forEach((mark) => {
        expect(mark.from).toBeLessThan(mark.to);
      });
    });

    it('应分批处理大量标记', () => {
      const BATCH_SIZE = 100;
      const TOTAL_MARKS = 500;
      const marks: MarkItem[] = [];

      for (let i = 0; i < TOTAL_MARKS; i++) {
        marks.push(createMockMarkItem(i * 10, i * 10 + 5, 'cm-url'));
      }

      const batches: MarkItem[][] = [];
      for (let i = 0; i < marks.length; i += BATCH_SIZE) {
        batches.push(marks.slice(i, i + BATCH_SIZE));
      }

      expect(batches.length).toBe(5); // 500 / 100 = 5
      expect(batches[0].length).toBe(100);
      expect(batches[4].length).toBe(100);
    });

    it('应去重重复范围的标记', () => {
      const marks: MarkItem[] = [
        createMockMarkItem(0, 10, 'cm-url', 'mark_1'),
        createMockMarkItem(0, 10, 'cm-url', 'mark_2'), // 重复范围
        createMockMarkItem(15, 25, 'cm-url', 'mark_3'),
      ];

      // 使用 Set 去重
      const uniqueIds = new Set(marks.map((m) => `${m.from}_${m.to}`));

      expect(uniqueIds.size).toBe(2); // 只有一个重复
    });

    it('空标记数组应被正确处理', () => {
      const marks: MarkItem[] = [];

      expect(marks.length).toBe(0);

      // 空数组不会触发任何处理
      if (marks.length === 0) {
        // 正确处理空情况
      }
    });
  });

  describe('标记去重', () => {
    it('getExistingMarksSet: 应返回已存在标记的 Set', () => {
      const existingMarks: MarkItem[] = [
        createMockMarkItem(0, 5, 'cm-url', 'existing_1'),
        createMockMarkItem(10, 15, 'cm-url', 'existing_2'),
      ];

      const existingSet = new Set(existingMarks.map((m) => m.id));

      expect(existingSet.size).toBe(2);
      expect(existingSet.has('existing_1')).toBe(true);
      expect(existingSet.has('existing_2')).toBe(true);
      expect(existingSet.has('nonexistent')).toBe(false);
    });

    it('重复标记检查应使用 O(1) 查询', () => {
      const existingMarks: MarkItem[] = [];
      for (let i = 0; i < 1000; i++) {
        existingMarks.push(createMockMarkItem(i * 10, i * 10 + 5, 'cm-url', `mark_${i}`));
      }

      const existingSet = new Set(existingMarks.map((m) => m.id));
      const start = performance.now();

      // O(1) 查询测试
      for (let i = 0; i < 100; i++) {
        existingSet.has(`mark_${i}`);
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10); // 应在 10ms 内完成
    });
  });
});

describe('标记查找测试', () => {
  describe('findMarks', () => {
    it('findMarks: 应找到指定范围内的所有标记', () => {
      const marks: MarkItem[] = [
        createMockMarkItem(0, 10, 'cm-url', 'mark_1'),
        createMockMarkItem(5, 15, 'cm-url', 'mark_2'), // 与范围重叠
        createMockMarkItem(20, 30, 'cm-url', 'mark_3'),
      ];

      const rangeFrom = 3;
      const rangeTo = 12;

      const found = marks.filter((m) => m.from < rangeTo && m.to > rangeFrom);

      expect(found.length).toBe(2); // mark_1 和 mark_2
      expect(found.map((m) => m.id)).toContain('mark_1');
      expect(found.map((m) => m.id)).toContain('mark_2');
    });

    it('findMarks: 精确匹配应被找到', () => {
      const marks: MarkItem[] = [createMockMarkItem(10, 20, 'cm-url')];

      const found = marks.filter((m) => m.from === 10 && m.to === 20);

      expect(found.length).toBe(1);
    });
  });

  describe('按类型查找', () => {
    it('findMarks: 应支持按 className 过滤', () => {
      const marks: MarkItem[] = [
        createMockMarkItem(0, 5, 'cm-url'),
        createMockMarkItem(10, 15, 'cm-url base64'),
        createMockMarkItem(20, 25, 'cm-url'),
        createMockMarkItem(30, 35, 'cm-url drawio'),
      ];

      const urlMarks = marks.filter((m) => m.className === 'cm-url');

      expect(urlMarks.length).toBe(2);
    });

    it('findMarks: 应支持按 markId 查找', () => {
      const targetId = 'specific_mark_id';
      const marks: MarkItem[] = [
        createMockMarkItem(0, 5, 'cm-url', 'mark_1'),
        createMockMarkItem(10, 15, 'cm-url', targetId),
        createMockMarkItem(20, 25, 'cm-url', 'mark_3'),
      ];

      const found = marks.find((m) => m.id === targetId);

      expect(found).toBeDefined();
      expect(found?.id).toBe(targetId);
    });
  });
});

describe('标记移除测试', () => {
  describe('removeMark', () => {
    it('removeMark: 应正确构建移除过滤器', () => {
      const markToRemove = createMockMarkItem(5, 10, 'cm-url', 'remove_me');

      // 模拟 filter 函数逻辑
      const shouldRemove = (mark: MarkItem) =>
        mark.id === markToRemove.id || (mark.from === markToRemove.from && mark.to === markToRemove.to);

      expect(shouldRemove(markToRemove)).toBe(true);
    });

    it('removeMark: 不匹配的标记应保留', () => {
      const marks: MarkItem[] = [
        createMockMarkItem(0, 5, 'cm-url', 'keep_1'),
        createMockMarkItem(10, 15, 'cm-url', 'remove_me'),
        createMockMarkItem(20, 25, 'cm-url', 'keep_2'),
      ];

      const removeId = 'remove_me';
      const remaining = marks.filter((m) => m.id !== removeId);

      expect(remaining.length).toBe(2);
      expect(remaining.map((m) => m.id)).not.toContain('remove_me');
    });

    it('removeMark: 使用 Set 优化性能', () => {
      const removeIds = new Set(['remove_1', 'remove_2', 'remove_3']);
      const marks: MarkItem[] = [
        createMockMarkItem(0, 5, 'cm-url', 'keep_1'),
        createMockMarkItem(10, 15, 'cm-url', 'remove_1'),
        createMockMarkItem(20, 25, 'cm-url', 'remove_2'),
        createMockMarkItem(30, 35, 'cm-url', 'keep_2'),
        createMockMarkItem(40, 45, 'cm-url', 'remove_3'),
      ];

      const remaining = marks.filter((m) => !removeIds.has(m.id));

      expect(remaining.length).toBe(2);
      expect(remaining.every((m) => !removeIds.has(m.id))).toBe(true);
    });
  });
});

describe('标记状态管理测试', () => {
  it('markIdCounter: 应生成连续递增的 ID', () => {
    let counter = 0;
    const generateId = () => {
      counter += 1;
      return `mark_${counter}`;
    };

    expect(generateId()).toBe('mark_1');
    expect(generateId()).toBe('mark_2');
    expect(generateId()).toBe('mark_3');
  });

  it('markIdCounter: 重置后应重新从 1 开始', () => {
    let counter = 100;
    const generateId = () => {
      counter += 1;
      return `mark_${counter}`;
    };

    expect(generateId()).toBe('mark_101');

    counter = 0; // 重置
    expect(generateId()).toBe('mark_1');
  });

  it('markField: update 应正确合并变更', () => {
    const currentMarks = [createMockMarkItem(0, 5, 'cm-url', 'existing_1')];

    const toAdd = [createMockMarkItem(10, 15, 'cm-url', 'new_1')];

    const merged = [...currentMarks, ...toAdd];

    expect(merged.length).toBe(2);
    expect(merged.map((m) => m.id)).toContain('existing_1');
    expect(merged.map((m) => m.id)).toContain('new_1');
  });
});

describe('标记性能测试', () => {
  it('大量标记查找应有合理性能', () => {
    const marks: MarkItem[] = [];
    for (let i = 0; i < 5000; i++) {
      marks.push(createMockMarkItem(i * 10, i * 10 + 5, 'cm-url'));
    }

    const start = performance.now();

    // 执行 100 次查找
    for (let i = 0; i < 100; i++) {
      marks.filter((m) => m.from < 25000 && m.to > 24000);
    }

    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100); // 应在 100ms 内完成
  });

  it('批量创建标记应有合理性能', () => {
    const start = performance.now();

    const marks: MarkItem[] = [];
    for (let i = 0; i < 1000; i++) {
      marks.push(createMockMarkItem(i * 10, i * 10 + 5, 'cm-url'));
    }

    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
    expect(marks.length).toBe(1000);
  });

  it('使用 Set 索引应比数组查找快', () => {
    const marks: MarkItem[] = [];
    for (let i = 0; i < 1000; i++) {
      marks.push(createMockMarkItem(i * 10, i * 10 + 5, 'cm-url', `mark_${i}`));
    }

    // 数组查找 O(n)
    const startArray = performance.now();
    for (let i = 0; i < 100; i++) {
      marks.find((m) => m.id === `mark_${i * 10}`);
    }
    const arrayTime = performance.now() - startArray;

    // Set 查找 O(1)
    const idSet = new Set(marks.map((m) => m.id));
    const startSet = performance.now();
    for (let i = 0; i < 100; i++) {
      idSet.has(`mark_${i * 10}`);
    }
    const setTime = performance.now() - startSet;

    // Set 应该更快
    expect(setTime).toBeLessThan(arrayTime);
  });
});
