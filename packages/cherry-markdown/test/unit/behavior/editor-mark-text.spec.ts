/**
 * 文本标记行为契约测试
 *
 * 测试 markText / findMarks / getAllMarks 的行为
 * 这些 API 在 Editor.js 中用于：
 * - 大数据折叠标记（formatBigData2Mark: markText + replacedWith + atomic）
 * - 全角字符标记（formatFullWidthMark: markText + className）
 * - 查找/清除标记（findMarks / getAllMarks）
 *
 * CM5 → CM6 映射：
 * - markText → Decoration.mark / Decoration.replace / Decoration.widget
 * - findMarks → decorationSet.between()
 * - getAllMarks → iterate over decorationSet
 * - marker.clear() → dispatch filter transaction
 * - marker.find() → 从 decorationSet 中读取范围
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createExtendedMockEditorAdapter,
  type IEditorAdapterExtended,
  type ITextMarker,
  type MarkTextOptions,
} from './editor-adapter-extended.spec';

describe('文本标记行为契约测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Hello World\nSecond Line\nThird Line\nFourth Line');
  });

  // ============================================================================
  // markText 基础行为
  // ============================================================================
  describe('markText 基础行为', () => {
    it('应该创建标记并返回 ITextMarker 对象', () => {
      const marker = editor.markText(
        { line: 0, ch: 0 },
        { line: 0, ch: 5 },
        { className: 'highlight' },
      );

      expect(marker).toBeDefined();
      expect(typeof marker.clear).toBe('function');
      expect(typeof marker.find).toBe('function');
    });

    it('标记应该记录正确的范围', () => {
      const marker = editor.markText(
        { line: 0, ch: 6 },
        { line: 0, ch: 11 },
        { className: 'test-mark' },
      );

      const range = marker.find();
      expect(range).not.toBeNull();
      expect(range!.from).toEqual({ line: 0, ch: 6 });
      expect(range!.to).toEqual({ line: 0, ch: 11 });
    });

    it('应该支持 className 选项（全角字符标记场景）', () => {
      const marker = editor.markText(
        { line: 0, ch: 0 },
        { line: 0, ch: 5 },
        { className: 'cm-fullWidth' },
      );

      expect(marker.options?.className).toBe('cm-fullWidth');
    });

    it('应该支持 replacedWith 选项（大数据折叠场景）', () => {
      const span = document.createElement('span');
      span.textContent = '...';

      const marker = editor.markText(
        { line: 0, ch: 0 },
        { line: 0, ch: 5 },
        { replacedWith: span, atomic: true },
      );

      expect(marker.options?.replacedWith).toBe(span);
      expect(marker.options?.atomic).toBe(true);
    });

    it('应该支持不传 options 参数', () => {
      const marker = editor.markText(
        { line: 0, ch: 0 },
        { line: 0, ch: 5 },
      );

      expect(marker).toBeDefined();
      expect(marker.find()).not.toBeNull();
    });

    it('应该支持跨行标记', () => {
      const marker = editor.markText(
        { line: 0, ch: 6 },
        { line: 1, ch: 6 },
        { className: 'cross-line' },
      );

      const range = marker.find();
      expect(range!.from).toEqual({ line: 0, ch: 6 });
      expect(range!.to).toEqual({ line: 1, ch: 6 });
    });
  });

  // ============================================================================
  // marker.clear() 行为
  // ============================================================================
  describe('marker.clear() 行为', () => {
    it('清除标记后 getAllMarks 不再包含该标记', () => {
      const marker1 = editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      const marker2 = editor.markText({ line: 1, ch: 0 }, { line: 1, ch: 6 });

      expect(editor.getAllMarks().length).toBe(2);

      marker1.clear();
      expect(editor.getAllMarks().length).toBe(1);

      marker2.clear();
      expect(editor.getAllMarks().length).toBe(0);
    });

    it('清除标记后 find() 返回 null', () => {
      const marker = editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      marker.clear();

      expect(marker.find()).toBeNull();
    });

    it('多次 clear 同一标记应该安全（幂等）', () => {
      const marker = editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      marker.clear();
      marker.clear(); // 不应该抛错
      expect(editor.getAllMarks().length).toBe(0);
    });
  });

  // ============================================================================
  // findMarks 行为
  // ============================================================================
  describe('findMarks 行为', () => {
    it('应该返回指定范围内的标记', () => {
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 }, { className: 'a' });
      editor.markText({ line: 0, ch: 6 }, { line: 0, ch: 11 }, { className: 'b' });
      editor.markText({ line: 1, ch: 0 }, { line: 1, ch: 6 }, { className: 'c' });

      // 搜索第一行的全部范围
      const marks = editor.findMarks({ line: 0, ch: 0 }, { line: 0, ch: 11 });
      expect(marks.length).toBeGreaterThanOrEqual(1);
    });

    it('应该不返回范围外的标记', () => {
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 }, { className: 'a' });
      editor.markText({ line: 2, ch: 0 }, { line: 2, ch: 5 }, { className: 'b' });

      // 只搜索第二行
      const marks = editor.findMarks({ line: 1, ch: 0 }, { line: 1, ch: 11 });
      expect(marks.length).toBe(0);
    });

    it('找到的标记应该可以被清除', () => {
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.markText({ line: 0, ch: 6 }, { line: 0, ch: 11 });

      const marks = editor.findMarks({ line: 0, ch: 0 }, { line: 0, ch: 11 });
      marks.forEach((m) => m.clear());

      expect(editor.getAllMarks().length).toBe(0);
    });
  });

  // ============================================================================
  // getAllMarks 行为
  // ============================================================================
  describe('getAllMarks 行为', () => {
    it('初始应该返回空数组', () => {
      expect(editor.getAllMarks()).toEqual([]);
    });

    it('应该返回所有已创建的标记', () => {
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.markText({ line: 1, ch: 0 }, { line: 1, ch: 6 });
      editor.markText({ line: 2, ch: 0 }, { line: 2, ch: 5 });

      expect(editor.getAllMarks().length).toBe(3);
    });

    it('返回的标记应该有 clear 和 find 方法', () => {
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      const marks = editor.getAllMarks();
      expect(typeof marks[0].clear).toBe('function');
      expect(typeof marks[0].find).toBe('function');
    });

    it('通过 getAllMarks 清除所有标记', () => {
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.markText({ line: 1, ch: 0 }, { line: 1, ch: 6 });
      editor.markText({ line: 2, ch: 0 }, { line: 2, ch: 5 });

      const marks = editor.getAllMarks();
      marks.forEach((m) => m.clear());

      expect(editor.getAllMarks().length).toBe(0);
    });
  });

  // ============================================================================
  // 模拟 Editor.js 中的真实使用场景
  // ============================================================================
  describe('Editor.js 真实场景回归', () => {
    /**
     * 场景1: formatBigData2Mark
     * 当数据超过阈值时，用折叠标记替换大段文本
     * Editor.js L174-195
     */
    it('大数据折叠标记场景', () => {
      // 模拟大段重复内容
      const bigContent = Array(100).fill('line content here').join('\n');
      editor.setValue(bigContent);

      // 模拟 getSearchCursor 找到需要折叠的区域
      const foldStart = { line: 10, ch: 0 };
      const foldEnd = { line: 90, ch: 17 };

      // 检查该区域是否已有标记
      const existingMarks = editor.findMarks(foldStart, foldEnd);
      expect(existingMarks.length).toBe(0);

      // 创建折叠标记
      const span = document.createElement('span');
      span.textContent = '... (折叠了80行) ...';

      const marker = editor.markText(foldStart, foldEnd, {
        replacedWith: span,
        atomic: true,
      });

      // 验证标记已创建
      expect(editor.getAllMarks().length).toBe(1);
      expect(marker.find()).toEqual({ from: foldStart, to: foldEnd });
      expect(marker.options?.atomic).toBe(true);
    });

    /**
     * 场景2: formatFullWidthMark
     * 为全角字符添加 CSS 类名标记
     * Editor.js L208-235
     */
    it('全角字符标记场景', () => {
      editor.setValue('Hello，World！这是中文标点。');

      // 模拟搜索全角字符
      const searchCursor = editor.getSearchCursor(/[，。！？；：""''【】]/g);
      const markedPositions: Array<{ from: { line: number; ch: number }; to: { line: number; ch: number } }> = [];

      while (searchCursor.findNext()) {
        const from = searchCursor.from()!;
        const to = searchCursor.to()!;

        // 检查是否已有标记
        const existing = editor.findMarks(from, to);
        if (existing.length === 0) {
          editor.markText(from, to, { className: 'cm-fullWidth' });
          markedPositions.push({ from, to });
        }
      }

      // 应该标记了全角标点
      expect(markedPositions.length).toBeGreaterThan(0);
      expect(editor.getAllMarks().length).toBe(markedPositions.length);
    });

    /**
     * 场景3: 先清除旧标记再创建新标记
     * 编辑器内容变化后需要重新计算标记位置
     */
    it('内容变化后重置标记', () => {
      editor.setValue('Hello World');

      // 创建初始标记
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 }, { className: 'old-mark' });
      expect(editor.getAllMarks().length).toBe(1);

      // 模拟内容变化后清除所有旧标记
      const oldMarks = editor.getAllMarks();
      oldMarks.forEach((m) => m.clear());
      expect(editor.getAllMarks().length).toBe(0);

      // 重新创建新标记
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 }, { className: 'new-mark' });
      expect(editor.getAllMarks().length).toBe(1);
    });

    /**
     * 场景4: 多个不同类型的标记共存
     */
    it('多类型标记共存', () => {
      editor.setValue('Hello，World！Test');

      // CSS 类名标记
      const cssMark = editor.markText(
        { line: 0, ch: 5 },
        { line: 0, ch: 6 },
        { className: 'cm-fullWidth' },
      );

      // 替换标记
      const span = document.createElement('span');
      span.textContent = '...';
      const replaceMark = editor.markText(
        { line: 0, ch: 12 },
        { line: 0, ch: 13 },
        { replacedWith: span, atomic: true },
      );

      expect(editor.getAllMarks().length).toBe(2);

      // 只清除 CSS 标记
      cssMark.clear();
      expect(editor.getAllMarks().length).toBe(1);

      // 清除替换标记
      replaceMark.clear();
      expect(editor.getAllMarks().length).toBe(0);
    });
  });

  // ============================================================================
  // 边界情况
  // ============================================================================
  describe('边界情况', () => {
    it('在空文档上创建标记', () => {
      editor.setValue('');
      const marker = editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 0 });
      expect(marker).toBeDefined();
    });

    it('标记范围为单个字符', () => {
      const marker = editor.markText(
        { line: 0, ch: 0 },
        { line: 0, ch: 1 },
        { className: 'single-char' },
      );
      const range = marker.find();
      expect(range!.from.ch).toBe(0);
      expect(range!.to.ch).toBe(1);
    });

    it('创建大量标记', () => {
      for (let i = 0; i < 50; i++) {
        editor.markText(
          { line: 0, ch: i % 11 },
          { line: 0, ch: (i % 11) + 1 },
          { className: `mark-${i}` },
        );
      }
      expect(editor.getAllMarks().length).toBe(50);

      // 全部清除
      editor.getAllMarks().forEach((m) => m.clear());
      expect(editor.getAllMarks().length).toBe(0);
    });

    it('findMarks 在无标记时返回空数组', () => {
      const marks = editor.findMarks({ line: 0, ch: 0 }, { line: 3, ch: 11 });
      expect(marks).toEqual([]);
    });
  });
});
