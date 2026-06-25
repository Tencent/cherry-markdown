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
 * 用户事件集成测试
 *
 * 验证 userEvent 处理的正确性：
 * - userEvent 精确匹配
 * - origin 字段分类正确
 * - 边界情况处理
 */

import { describe, it, expect } from 'vitest';

// ============ Mock 类型 ============

type UserEventOrigin = '+input' | '+delete' | '+undo' | '+redo' | '+paste' | '+drop' | 'other';

interface UserEventMapping {
  userEvent: string;
  expected: UserEventOrigin;
}

// ============ userEvent 匹配逻辑 ============

const mapUserEventToOrigin = (userEvent: string): UserEventOrigin => {
  // 使用精确匹配或 startsWith（而非 includes）
  if (userEvent === 'input' || userEvent.startsWith('input.')) {
    return '+input';
  }
  if (userEvent === 'delete' || userEvent.startsWith('delete.')) {
    return '+delete';
  }
  if (userEvent === 'undo' || userEvent.startsWith('undo.')) {
    return '+undo';
  }
  if (userEvent === 'redo' || userEvent.startsWith('redo.')) {
    return '+redo';
  }
  if (userEvent === 'paste' || userEvent.startsWith('paste.')) {
    return '+paste';
  }
  if (userEvent === 'drop' || userEvent.startsWith('drop.')) {
    return '+drop';
  }
  return 'other';
};

// ============ 测试数据 ============

const VALID_USER_EVENTS: UserEventMapping[] = [
  // input 变种
  { userEvent: 'input', expected: '+input' },
  { userEvent: 'input.type', expected: '+input' },
  { userEvent: 'input.compose', expected: '+input' },
  { userEvent: 'input.paste.shift', expected: '+input' }, // startsWith('input.')

  // delete 变种
  { userEvent: 'delete', expected: '+delete' },
  { userEvent: 'delete.selection', expected: '+delete' },
  { userEvent: 'delete.backward', expected: '+delete' },
  { userEvent: 'delete.forward', expected: '+delete' },

  // undo 变种
  { userEvent: 'undo', expected: '+undo' },
  { userEvent: 'undo.ctrl+z', expected: '+undo' },

  // redo 变种
  { userEvent: 'redo', expected: '+redo' },
  { userEvent: 'redo.ctrl+shift+z', expected: '+redo' },

  // paste 变种
  { userEvent: 'paste', expected: '+paste' },
  { userEvent: 'paste.html', expected: '+paste' },
  { userEvent: 'paste.text', expected: '+paste' },
  { userEvent: 'paste.image', expected: '+paste' },

  // drop 变种
  { userEvent: 'drop', expected: '+drop' },
  { userEvent: 'drop.file', expected: '+drop' },
  { userEvent: 'drop.image', expected: '+drop' },
];

const EDGE_CASE_USER_EVENTS: UserEventMapping[] = [
  // 带特殊字符的事件
  { userEvent: 'input.type-with-dash', expected: '+input' },
  { userEvent: 'delete.backward.word', expected: '+delete' },

  // 嵌套事件
  { userEvent: 'input.type.compose.ime', expected: '+input' },

  // 类似但不同的事件
  { userEvent: 'inputValue', expected: 'other' }, // 不是 input.
  { userEvent: 'deleted', expected: 'other' }, // 不是 delete.
  { userEvent: 'undone', expected: 'other' }, // 不是 undo.
  { userEvent: 'redone', expected: 'other' }, // 不是 redo.
  { userEvent: 'pasted', expected: 'other' }, // 不是 paste.
  { userEvent: 'dropped', expected: 'other' }, // 不是 drop.

  // 容易混淆的情况
  { userEvent: 'redo', expected: '+redo' }, // redo 不应被识别为 undo
  { userEvent: 'paste', expected: '+paste' }, // paste 不应被识别为 delete（都有 'e'）
  { userEvent: 'undo', expected: '+undo' }, // undo 不应被识别为 redo

  // 空字符串和未知事件
  { userEvent: '', expected: 'other' },
  { userEvent: 'unknown', expected: 'other' },
  { userEvent: 'keystroke', expected: 'other' },
];

// ============ 测试用例 ============

describe('userEvent 映射测试', () => {
  describe('有效的 userEvent 映射', () => {
    VALID_USER_EVENTS.forEach(({ userEvent, expected }) => {
      it(`应正确映射 "${userEvent}" 为 "${expected}"`, () => {
        const result = mapUserEventToOrigin(userEvent);
        expect(result).toBe(expected);
      });
    });
  });

  describe('边界情况处理', () => {
    EDGE_CASE_USER_EVENTS.forEach(({ userEvent, expected }) => {
      it(`应正确处理边界情况 "${userEvent}" -> "${expected}"`, () => {
        const result = mapUserEventToOrigin(userEvent);
        expect(result).toBe(expected);
      });
    });
  });

  describe('精确匹配 vs includes() 问题', () => {
    it('paste 不应被误认为是 delete（都包含 e）', () => {
      // 使用 includes 会导致错误：'paste'.includes('e') 为真
      const result = mapUserEventToOrigin('paste');
      expect(result).toBe('+paste');
      expect(result).not.toBe('+delete');
    });

    it('undo 不应被误认为是 redo（都包含 o 和 d）', () => {
      const undo = mapUserEventToOrigin('undo');
      const redo = mapUserEventToOrigin('redo');

      expect(undo).toBe('+undo');
      expect(redo).toBe('+redo');
      expect(undo).not.toBe(redo);
    });

    it('输入以 paste 开头的字符串不应误触发', () => {
      const input = mapUserEventToOrigin('input.paste');
      expect(input).toBe('+input'); // 应该是 input 而非 paste
    });

    it('输入以 delete 开头的字符串不应误触发', () => {
      const input = mapUserEventToOrigin('input.delete');
      expect(input).toBe('+input'); // 应该是 input 而非 delete
    });
  });

  describe('startsWith 的正确性', () => {
    it('应正确识别带修饰符的事件类型', () => {
      const events = [
        'input.type',
        'input.compose',
        'delete.selection',
        'delete.backward',
        'undo.shortcut',
        'redo.shortcut',
        'paste.html',
        'drop.file',
      ];

      events.forEach((event) => {
        const result = mapUserEventToOrigin(event);
        expect(result).not.toBe('other');
      });
    });

    it('不应识别假的复合事件', () => {
      const invalidEvents = ['inputValue', 'deleteme', 'undoing', 'redoing', 'pastevalue', 'dropping'];

      invalidEvents.forEach((event) => {
        const result = mapUserEventToOrigin(event);
        expect(result).toBe('other');
      });
    });
  });

  describe('性能特性', () => {
    it('应快速处理大量 userEvent', () => {
      const events = Array(1000)
        .fill(null)
        .map((_, i) => `event${i % 6}`)
        .concat(VALID_USER_EVENTS.map((e) => e.userEvent));

      const start = performance.now();
      events.forEach((event) => mapUserEventToOrigin(event));
      const end = performance.now();

      // 应在 10ms 内处理 1000+ 事件
      expect(end - start).toBeLessThan(10);
    });
  });

  describe('类型安全性', () => {
    it('返回值应始终是有效的 origin 类型', () => {
      const validOrigins = ['+input', '+delete', '+undo', '+redo', '+paste', '+drop', 'other'];
      const testEvents = [
        'input',
        'delete',
        'undo',
        'redo',
        'paste',
        'drop',
        'unknown',
        'input.type',
        'delete.backward',
        '',
      ];

      testEvents.forEach((event) => {
        const result = mapUserEventToOrigin(event);
        expect(validOrigins).toContain(result);
      });
    });
  });
});

// ============ 与 CM5 兼容性测试 ============

describe('CM5 兼容性', () => {
  it('应支持 CM5 的标准 userEvent 值', () => {
    const cm5Events = ['input', 'delete', 'undo', 'redo', 'paste', 'drop'];

    cm5Events.forEach((event) => {
      const result = mapUserEventToOrigin(event);
      expect(result).not.toBe('other');
    });
  });

  it('应支持 CM6 的扩展 userEvent 值', () => {
    const cm6Events = [
      'input.type',
      'input.compose',
      'delete.selection',
      'delete.backward',
      'undo.popped',
      'redo.popped',
      'paste.image',
      'drop.file',
    ];

    cm6Events.forEach((event) => {
      const result = mapUserEventToOrigin(event);
      expect(result).not.toBe('other');
    });
  });

  it('应保持 origin 字段的向后兼容性', () => {
    const expectations: Record<string, UserEventOrigin> = {
      input: '+input',
      delete: '+delete',
      undo: '+undo',
      redo: '+redo',
      paste: '+paste',
      drop: '+drop',
    };

    Object.entries(expectations).forEach(([event, expected]) => {
      const result = mapUserEventToOrigin(event);
      expect(result).toBe(expected);
    });
  });
});
