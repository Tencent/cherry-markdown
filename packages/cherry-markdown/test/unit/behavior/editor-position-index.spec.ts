/**
 * 位置-偏移量转换行为契约测试
 *
 * 测试 Cherry.js 中 insert/setValue 操作依赖的位置转换 API：
 *
 * 1. indexFromPos(pos) → CM6: 直接使用 offset（CM6 原生就是 offset 模型）
 *    - 将 {line, ch} 位置转换为文档中的字符偏移量
 *    - Cherry.js:482 用于保存光标位置
 *
 * 2. posFromIndex(index) → CM6: 通过 state.doc.lineAt(offset) 转换
 *    - 将字符偏移量转换为 {line, ch} 位置
 *    - Cherry.js:485 用于恢复光标位置
 *
 * 这两个 API 在 CM5 中通过 getDoc() 访问，在 CM6 中位置模型完全不同：
 * - CM5: {line, ch} 为主，需要 indexFromPos/posFromIndex 做转换
 * - CM6: offset 为主，{line, ch} 需要从 offset 推导
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createExtendedMockEditorAdapter,
  type IEditorAdapterExtended,
  type Position,
} from './editor-adapter-extended.spec';

describe('位置-偏移量转换行为契约测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Hello World\nSecond Line\nThird Line');
  });

  // ============================================================================
  // indexFromPos 基础行为
  // ============================================================================
  describe('indexFromPos 基础行为', () => {
    it('文档开头 {line:0, ch:0} 应该返回 0', () => {
      expect(editor.indexFromPos({ line: 0, ch: 0 })).toBe(0);
    });

    it('第一行的字符偏移应该等于 ch', () => {
      expect(editor.indexFromPos({ line: 0, ch: 5 })).toBe(5);
      expect(editor.indexFromPos({ line: 0, ch: 11 })).toBe(11);
    });

    it('第二行开头应该是第一行长度 + 1（换行符）', () => {
      // "Hello World" = 11 chars + 1 newline = 12
      expect(editor.indexFromPos({ line: 1, ch: 0 })).toBe(12);
    });

    it('第二行中间位置', () => {
      // "Hello World\n" = 12, "Second" = 6 chars → index 18
      expect(editor.indexFromPos({ line: 1, ch: 6 })).toBe(18);
    });

    it('第三行开头应该是前两行总长度 + 2（两个换行符）', () => {
      // "Hello World\nSecond Line\n" = 12 + 12 = 24
      expect(editor.indexFromPos({ line: 2, ch: 0 })).toBe(24);
    });

    it('文档末尾', () => {
      // "Hello World\nSecond Line\nThird Line" = 12 + 12 + 10 = 34
      expect(editor.indexFromPos({ line: 2, ch: 10 })).toBe(34);
    });
  });

  // ============================================================================
  // posFromIndex 基础行为
  // ============================================================================
  describe('posFromIndex 基础行为', () => {
    it('offset 0 应该返回 {line:0, ch:0}', () => {
      expect(editor.posFromIndex(0)).toEqual({ line: 0, ch: 0 });
    });

    it('第一行内的偏移', () => {
      expect(editor.posFromIndex(5)).toEqual({ line: 0, ch: 5 });
    });

    it('第一行末尾（换行符前）', () => {
      expect(editor.posFromIndex(11)).toEqual({ line: 0, ch: 11 });
    });

    it('第二行开头', () => {
      expect(editor.posFromIndex(12)).toEqual({ line: 1, ch: 0 });
    });

    it('第二行中间', () => {
      expect(editor.posFromIndex(18)).toEqual({ line: 1, ch: 6 });
    });

    it('第三行开头', () => {
      expect(editor.posFromIndex(24)).toEqual({ line: 2, ch: 0 });
    });

    it('文档末尾', () => {
      expect(editor.posFromIndex(34)).toEqual({ line: 2, ch: 10 });
    });
  });

  // ============================================================================
  // indexFromPos 和 posFromIndex 互为逆操作
  // ============================================================================
  describe('互逆性验证', () => {
    it('indexFromPos(posFromIndex(i)) === i', () => {
      const content = editor.getValue();
      for (let i = 0; i <= content.length; i++) {
        const pos = editor.posFromIndex(i);
        const idx = editor.indexFromPos(pos);
        expect(idx).toBe(i);
      }
    });

    it('posFromIndex(indexFromPos(pos)) === pos', () => {
      const positions: Position[] = [
        { line: 0, ch: 0 },
        { line: 0, ch: 5 },
        { line: 0, ch: 11 },
        { line: 1, ch: 0 },
        { line: 1, ch: 6 },
        { line: 1, ch: 11 },
        { line: 2, ch: 0 },
        { line: 2, ch: 5 },
        { line: 2, ch: 10 },
      ];

      for (const pos of positions) {
        const idx = editor.indexFromPos(pos);
        const recovered = editor.posFromIndex(idx);
        expect(recovered).toEqual(pos);
      }
    });
  });

  // ============================================================================
  // 单行文档
  // ============================================================================
  describe('单行文档', () => {
    beforeEach(() => {
      editor = createExtendedMockEditorAdapter('Hello');
    });

    it('indexFromPos 应该等于 ch', () => {
      expect(editor.indexFromPos({ line: 0, ch: 0 })).toBe(0);
      expect(editor.indexFromPos({ line: 0, ch: 3 })).toBe(3);
      expect(editor.indexFromPos({ line: 0, ch: 5 })).toBe(5);
    });

    it('posFromIndex 应该始终是 line 0', () => {
      expect(editor.posFromIndex(0)).toEqual({ line: 0, ch: 0 });
      expect(editor.posFromIndex(3)).toEqual({ line: 0, ch: 3 });
      expect(editor.posFromIndex(5)).toEqual({ line: 0, ch: 5 });
    });
  });

  // ============================================================================
  // 空文档
  // ============================================================================
  describe('空文档', () => {
    beforeEach(() => {
      editor = createExtendedMockEditorAdapter('');
    });

    it('indexFromPos({line:0, ch:0}) 应该返回 0', () => {
      expect(editor.indexFromPos({ line: 0, ch: 0 })).toBe(0);
    });

    it('posFromIndex(0) 应该返回 {line:0, ch:0}', () => {
      expect(editor.posFromIndex(0)).toEqual({ line: 0, ch: 0 });
    });
  });

  // ============================================================================
  // 包含空行的文档
  // ============================================================================
  describe('包含空行的文档', () => {
    beforeEach(() => {
      editor = createExtendedMockEditorAdapter('Line1\n\nLine3');
    });

    it('空行的 indexFromPos 应该正确', () => {
      // "Line1\n" = 6 chars
      expect(editor.indexFromPos({ line: 1, ch: 0 })).toBe(6);
      // 空行只有换行符，Line3 从 index 7 开始
      expect(editor.indexFromPos({ line: 2, ch: 0 })).toBe(7);
    });

    it('空行的 posFromIndex 应该正确', () => {
      expect(editor.posFromIndex(6)).toEqual({ line: 1, ch: 0 });
      expect(editor.posFromIndex(7)).toEqual({ line: 2, ch: 0 });
    });
  });

  // ============================================================================
  // 中文文本
  // ============================================================================
  describe('中文文本', () => {
    beforeEach(() => {
      editor = createExtendedMockEditorAdapter('你好世界\n第二行');
    });

    it('中文字符占 1 个 ch 单位', () => {
      expect(editor.indexFromPos({ line: 0, ch: 2 })).toBe(2);
      expect(editor.posFromIndex(2)).toEqual({ line: 0, ch: 2 });
    });

    it('跨行的中文文本', () => {
      // "你好世界\n" = 5 chars (4 + 1 newline)
      expect(editor.indexFromPos({ line: 1, ch: 0 })).toBe(5);
      expect(editor.posFromIndex(5)).toEqual({ line: 1, ch: 0 });
    });
  });

  // ============================================================================
  // Cherry.js setValue 真实场景回归
  // ============================================================================
  describe('Cherry.js setValue 真实场景回归', () => {
    /**
     * 模拟 Cherry.js:475-489 的 setValue 方法
     * 核心逻辑：
     * 1. 保存当前光标的偏移量 (indexFromPos)
     * 2. 用 diff 算法计算新内容中的对应位置
     * 3. 将偏移量转回 {line, ch} (posFromIndex)
     * 4. 设置新光标位置
     */
    it('setValue 保持光标位置场景', () => {
      editor.setValue('Hello World\nSecond Line\nThird Line');
      editor.setCursor({ line: 1, ch: 5 });

      // 步骤1: 保存光标偏移量
      const cursorPos = editor.getCursor();
      const offset = editor.indexFromPos(cursorPos);
      expect(offset).toBe(17); // 12 + 5

      // 步骤2: 模拟内容变更（假设在第一行末尾加了文字）
      const newContent = 'Hello World!!!\nSecond Line\nThird Line';
      // 偏移量需要调整（+3 因为加了 "!!!"）
      const newOffset = offset + 3; // 20

      // 步骤3: 将新偏移量转回位置
      editor.setValue(newContent);
      const newPos = editor.posFromIndex(newOffset);
      expect(newPos).toEqual({ line: 1, ch: 5 }); // "Hello World!!!\n" = 15, 15+5=20

      // 步骤4: 设置新光标
      editor.setCursor(newPos);
      expect(editor.getCursor()).toEqual({ line: 1, ch: 5 });
    });

    it('insert 操作场景', () => {
      editor.setValue('# Title\n\nContent here');

      // 在第三行的 "Content" 后面插入内容
      editor.setCursor({ line: 2, ch: 7 });
      const offset = editor.indexFromPos(editor.getCursor());

      // 通过偏移量定位，然后转回位置进行插入
      const insertPos = editor.posFromIndex(offset);
      expect(insertPos).toEqual({ line: 2, ch: 7 });

      editor.replaceRange(' new', insertPos, insertPos);
      expect(editor.getValue()).toBe('# Title\n\nContent new here');
    });
  });

  // ============================================================================
  // getDoc().indexFromPos / posFromIndex 兼容性
  // ============================================================================
  describe('通过 getDoc() 访问', () => {
    it('getDoc().indexFromPos 应该和直接调用一致', () => {
      const doc = editor.getDoc();
      const pos = { line: 1, ch: 5 };
      expect(doc.indexFromPos(pos)).toBe(editor.indexFromPos(pos));
    });

    it('getDoc().posFromIndex 应该和直接调用一致', () => {
      const doc = editor.getDoc();
      expect(doc.posFromIndex(17)).toEqual(editor.posFromIndex(17));
    });
  });

  // ============================================================================
  // 边界情况
  // ============================================================================
  describe('边界情况', () => {
    it('超出文档末尾的 posFromIndex 应该返回文档末尾', () => {
      const content = editor.getValue();
      const pos = editor.posFromIndex(content.length + 100);
      const lastLine = editor.lineCount() - 1;
      expect(pos.line).toBe(lastLine);
      expect(pos.ch).toBeLessThanOrEqual(editor.getLine(lastLine).length);
    });

    it('只含换行符的文档', () => {
      editor.setValue('\n\n\n');
      expect(editor.indexFromPos({ line: 0, ch: 0 })).toBe(0);
      expect(editor.indexFromPos({ line: 1, ch: 0 })).toBe(1);
      expect(editor.indexFromPos({ line: 2, ch: 0 })).toBe(2);
      expect(editor.indexFromPos({ line: 3, ch: 0 })).toBe(3);

      expect(editor.posFromIndex(0)).toEqual({ line: 0, ch: 0 });
      expect(editor.posFromIndex(1)).toEqual({ line: 1, ch: 0 });
      expect(editor.posFromIndex(2)).toEqual({ line: 2, ch: 0 });
      expect(editor.posFromIndex(3)).toEqual({ line: 3, ch: 0 });
    });
  });
});
