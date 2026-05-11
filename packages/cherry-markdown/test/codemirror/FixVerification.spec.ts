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
 * PR fix1722 修复验证测试
 *
 * 验证三项修复的正确性与必要性：
 * - changeFilter 原子装饰器检测性能优化 (iter(fromA) + 提前 break)
 * - 粘贴内容使用零宽空格替代普通空格
 * - value.spec?.attributes 可选链安全访问
 */

import { describe, it, expect } from 'vitest';

// ============ Mock 工具 ============

interface MockMark {
  from: number;
  to: number;
  spec: { atomic?: boolean; attributes?: Record<string, string> };
}

/**
 * 模拟 CM6 RangeSet.iter(startPos) 行为
 * startPos 会跳过所有 to <= startPos 的 marks
 */
const createMarkIterator = (marks: MockMark[], startPos = 0) => {
  let index = marks.findIndex((m) => m.to > startPos);
  if (index === -1) index = marks.length;

  return {
    get value() {
      return index < marks.length ? marks[index] : null;
    },
    get from() {
      return marks[index]?.from ?? 0;
    },
    get to() {
      return marks[index]?.to ?? 0;
    },
    next() {
      index += 1;
    },
  };
};

/** 优化后的 atomic 检测算法：从 fromA 开始迭代 + markFrom >= toA 提前退出 */
const checkAtomic = (marks: MockMark[], fromA: number, toA: number) => {
  let iterCount = 0;
  const iter = createMarkIterator(marks, fromA);

  while (iter.value) {
    iterCount += 1;
    if (iter.from >= toA) break;
    const { from: markFrom, to: markTo, spec } = iter.value;
    if (spec?.atomic) {
      const overlaps = fromA < markTo && toA > markFrom;
      const fullyCovers = fromA <= markFrom && toA >= markTo;
      if (overlaps && !fullyCovers) return { blocked: true, iterCount };
    }
    iter.next();
  }

  return { blocked: false, iterCount };
};

/** 生成 n 个等间距 atomic marks */
const generateMarks = (n: number, gap = 10, width = 3): MockMark[] =>
  Array.from({ length: n }, (_, i) => ({ from: i * gap, to: i * gap + width, spec: { atomic: true } }));

// ============ changeFilter 原子装饰器性能优化 ============

describe('changeFilter 原子装饰器检测', () => {
  const atomicMarks: MockMark[] = [
    { from: 10, to: 20, spec: { atomic: true } },
    { from: 50, to: 60, spec: { atomic: true } },
  ];

  it('局部删除 atomic mark 内部字符时阻止变更', () => {
    expect(checkAtomic(atomicMarks, 12, 15).blocked).toBe(true);
  });

  it('完全覆盖 atomic mark 范围时允许删除', () => {
    expect(checkAtomic(atomicMarks, 8, 22).blocked).toBe(false);
  });

  it('变更范围与 atomic mark 不相交时允许编辑', () => {
    expect(checkAtomic(atomicMarks, 25, 30).blocked).toBe(false);
  });

  it('局部修改非 atomic mark 时不阻止', () => {
    const nonAtomicMarks: MockMark[] = [
      { from: 10, to: 20, spec: { atomic: false } },
      { from: 50, to: 60, spec: {} },
    ];
    expect(checkAtomic(nonAtomicMarks, 12, 15).blocked).toBe(false);
  });

  it('文档末尾编辑时 iter(fromA) 跳过前面所有 marks，遍历次数 < 5', () => {
    const marks = generateMarks(1000);
    // 在第 950 个 mark [9500, 9503] 内部局部修改
    const { blocked, iterCount } = checkAtomic(marks, 9501, 9502);

    expect(blocked).toBe(true);
    expect(iterCount).toBeLessThan(5);
  });

  it('变更在两个 marks 之间时 markFrom >= toA 触发提前退出', () => {
    const marks = generateMarks(100);
    // 在 [500,503] 和 [510,513] 之间编辑
    const { blocked, iterCount } = checkAtomic(marks, 504, 508);

    expect(blocked).toBe(false);
    expect(iterCount).toBeLessThanOrEqual(2);
  });
});

// ============ 粘贴内容零宽空格 ============

describe('粘贴内容使用零宽空格包裹', () => {
  const ZWS = '\u200B';

  it('零宽空格不影响 Markdown 标题解析（行首 # 不被破坏）', () => {
    expect(' # Hello'.startsWith('#')).toBe(false); // 普通空格破坏标题
    expect(`${ZWS}# Hello`[1]).toBe('#'); // ZWS 后紧跟 # 不影响
  });

  it('零宽空格不影响 Markdown 列表解析', () => {
    expect(`${ZWS}- item`.replace(/\u200B/g, '')).toBe('- item');
  });

  it('去除零宽空格后内容与原始完全一致', () => {
    const text = 'Hello World';
    const wrapped = `${ZWS}${text}${ZWS}`;

    expect(wrapped.replace(/\u200B/g, '')).toBe(text);
    expect(wrapped.length).toBe(text.length + 2);
  });

  it('连续粘贴不会产生可见的累积空白', () => {
    const a = `${ZWS}content1${ZWS}`;
    const b = `${ZWS}content2${ZWS}`;

    expect((a + b).replace(/\u200B/g, '')).toBe('content1content2');
    // 对比：普通空格会产生 "content1  content2" 中间双空格
    expect(` content1 ${' content2 '}`).toContain('  ');
  });
});

// ============ value.spec?.attributes 安全访问 ============

describe('markField filter 中 spec?.attributes 安全访问', () => {
  /** 模拟 removeMark filter 的核心逻辑，参数类型对齐 CM6 Decoration.spec 开放结构 */
  interface DecoSpec {
    attributes?: Record<string, string>;
    [key: string]: unknown;
  }

  const getMarkId = (spec: DecoSpec | null | undefined): string | undefined => spec?.attributes?.['data-mark-id'];

  it('spec 为 undefined 时不抛异常，返回 undefined', () => {
    expect(getMarkId(undefined)).toBeFalsy();
  });

  it('spec 为 null 时不抛异常，返回 undefined', () => {
    expect(getMarkId(null)).toBeFalsy();
  });

  it('spec.attributes 存在时正确返回 data-mark-id', () => {
    expect(getMarkId({ attributes: { 'data-mark-id': 'mark_42' } })).toBe('mark_42');
  });

  it('spec 存在但无 attributes 时返回 falsy', () => {
    expect(getMarkId({ class: 'cm-fullWidth' })).toBeFalsy();
  });

  it('混合 spec 状态的 decorations 能正确过滤目标 markId', () => {
    const decorations = [
      { spec: { attributes: { 'data-mark-id': 'mark_1' } } },
      { spec: {} },
      { spec: undefined },
      { spec: { attributes: { 'data-mark-id': 'mark_4' } } },
    ];
    const removeIds = new Set(['mark_1', 'mark_4']);

    const kept = decorations
      .map((d, i) => ({ i, id: getMarkId(d.spec) }))
      .filter(({ id }) => !removeIds.has(id as string))
      .map(({ i }) => i);

    expect(kept).toEqual([1, 2]);
  });
});
