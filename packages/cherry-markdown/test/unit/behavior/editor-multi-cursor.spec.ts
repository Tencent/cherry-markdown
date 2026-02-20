/**
 * 多光标/多选区行为契约测试
 *
 * 测试 listSelections / getSelections / replaceSelections / setSelections 的行为
 * 这些 API 在以下场景中使用：
 * - Editor.js:374 — listSelections() 获取所有选区
 * - Editor.js:375 — getSelections() 获取所有选区文本
 * - autoindent.js:29 — cm.listSelections() 获取多光标下的行范围
 * - autoindent.js:56 — cm.replaceSelections() 多光标替换
 *
 * CM5 → CM6 映射：
 * - listSelections → EditorState.selection.ranges
 * - getSelections → ranges.map(r => state.sliceDoc(r.from, r.to))
 * - replaceSelections → dispatch with changes for each range
 * - setSelections → dispatch({ selection: EditorSelection.create(ranges) })
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createExtendedMockEditorAdapter,
  type IEditorAdapterExtended,
  type SelectionRange,
} from './editor-adapter-extended.spec';

describe('多光标/多选区行为契约测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Hello World\nSecond Line\nThird Line\nFourth Line');
  });

  // ============================================================================
  // listSelections 行为
  // ============================================================================
  describe('listSelections 行为', () => {
    it('初始状态应有一个折叠的选区', () => {
      const sels = editor.listSelections();
      expect(sels.length).toBe(1);
      expect(sels[0].anchor).toEqual({ line: 0, ch: 0 });
      expect(sels[0].head).toEqual({ line: 0, ch: 0 });
    });

    it('setSelection 后 listSelections 应该反映新选区', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      const sels = editor.listSelections();
      expect(sels.length).toBe(1);
      expect(sels[0].anchor).toEqual({ line: 0, ch: 0 });
      expect(sels[0].head).toEqual({ line: 0, ch: 5 });
    });

    it('setSelections 应该设置多个选区', () => {
      const ranges: SelectionRange[] = [
        { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 6 } },
      ];
      editor.setSelections(ranges);

      const sels = editor.listSelections();
      expect(sels.length).toBe(2);
      expect(sels[0].anchor).toEqual({ line: 0, ch: 0 });
      expect(sels[0].head).toEqual({ line: 0, ch: 5 });
      expect(sels[1].anchor).toEqual({ line: 1, ch: 0 });
      expect(sels[1].head).toEqual({ line: 1, ch: 6 });
    });

    it('setSelections 的 primary 参数应该设置主光标', () => {
      const ranges: SelectionRange[] = [
        { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 6 } },
      ];
      editor.setSelections(ranges, 1);

      // 主光标应在第二个选区
      const cursor = editor.getCursor();
      expect(cursor).toEqual({ line: 1, ch: 6 });
    });

    it('返回的选区应该是副本（不影响内部状态）', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      const sels = editor.listSelections();

      // 修改返回的选区不应影响编辑器
      sels[0].anchor.ch = 999;
      const sels2 = editor.listSelections();
      expect(sels2[0].anchor.ch).toBe(0);
    });
  });

  // ============================================================================
  // getSelections 行为
  // ============================================================================
  describe('getSelections 行为', () => {
    it('折叠选区应该返回空字符串', () => {
      const texts = editor.getSelections();
      expect(texts).toEqual(['']);
    });

    it('单个选区应该返回选中的文本', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      const texts = editor.getSelections();
      expect(texts).toEqual(['Hello']);
    });

    it('多个选区应该返回各自选中的文本', () => {
      const ranges: SelectionRange[] = [
        { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 6 } },
      ];
      editor.setSelections(ranges);

      const texts = editor.getSelections();
      expect(texts.length).toBe(2);
      expect(texts[0]).toBe('Hello');
      expect(texts[1]).toBe('Second');
    });
  });

  // ============================================================================
  // replaceSelections 行为
  // ============================================================================
  describe('replaceSelections 行为', () => {
    it('应该替换当前选区内容', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceSelections(['Hi']);

      expect(editor.getValue()).toBe('Hi World\nSecond Line\nThird Line\nFourth Line');
    });

    it('空数组不应改变内容', () => {
      const before = editor.getValue();
      editor.replaceSelections([]);
      expect(editor.getValue()).toBe(before);
    });
  });

  // ============================================================================
  // somethingSelected 行为
  // ============================================================================
  describe('somethingSelected 行为', () => {
    it('折叠光标应该返回 false', () => {
      expect(editor.somethingSelected()).toBe(false);
    });

    it('选中文本后应该返回 true', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.somethingSelected()).toBe(true);
    });

    it('选区收起后应该返回 false', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.setCursor({ line: 0, ch: 0 });
      expect(editor.somethingSelected()).toBe(false);
    });
  });

  // ============================================================================
  // 模拟 autoindent.js 的真实场景
  // ============================================================================
  describe('autoindent.js 真实场景回归', () => {
    /**
     * autoindent.js:29-56
     * 处理 Cherry 列表的回车换行
     * cm.listSelections() → 获取所有光标位置
     * cm.getLine(pos.line) → 获取行文本
     * cm.replaceSelections(replacements) → 替换多个选区
     */
    it('模拟列表续列表行为', () => {
      editor.setValue('一. 第一项\n二. 第二项');

      // 光标在第二行末尾（模拟回车前）
      editor.setCursor({ line: 1, ch: 7 });

      const ranges = editor.listSelections();
      expect(ranges.length).toBe(1);

      const pos = ranges[0].head;
      const line = editor.getLine(pos.line);
      expect(line).toBe('二. 第二项');

      // Cherry 列表正则
      const cherryListRE = /^(\s*)([I一二三四五六七八九十]+)\.(\s+)/;
      const match = cherryListRE.exec(line);
      expect(match).not.toBeNull();

      // 模拟生成续列表文本
      if (match) {
        const indent = match[1];
        const after = match[3];
        const replacement = `\n${indent}I.${after}`;
        editor.replaceSelections([replacement]);

        // 验证续列表结果
        const result = editor.getValue();
        expect(result).toContain('I.');
      }
    });

    it('模拟多光标列表续列表', () => {
      editor.setValue('一. 项目A\n二. 项目B');

      // 设置多光标（第一行末尾和第二行末尾）
      const ranges: SelectionRange[] = [
        { anchor: { line: 0, ch: 7 }, head: { line: 0, ch: 7 } },
        { anchor: { line: 1, ch: 7 }, head: { line: 1, ch: 7 } },
      ];
      editor.setSelections(ranges);

      const sels = editor.listSelections();
      expect(sels.length).toBe(2);

      // 验证每个光标所在行都能匹配列表格式
      sels.forEach((sel) => {
        const line = editor.getLine(sel.head.line);
        const cherryListRE = /^(\s*)([I一二三四五六七八九十]+)\.(\s+)/;
        expect(cherryListRE.test(line)).toBe(true);
      });
    });
  });

  // ============================================================================
  // 模拟 Editor.js 的粘贴/拖拽场景
  // ============================================================================
  describe('Editor.js 粘贴场景回归', () => {
    /**
     * Editor.js:374-382
     * 粘贴时通过 listSelections + getSelections 获取当前选区
     * 然后用 replaceSelection 替换
     */
    it('模拟粘贴替换当前选区', () => {
      editor.setValue('Hello World');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      // 验证选区
      const sels = editor.listSelections();
      expect(sels.length).toBe(1);

      const selTexts = editor.getSelections();
      expect(selTexts[0]).toBe('Hello');

      // 模拟粘贴
      editor.replaceSelection('Pasted');
      expect(editor.getValue()).toBe('Pasted World');
    });

    it('模拟无选区时粘贴（插入模式）', () => {
      editor.setValue('Hello World');
      editor.setCursor({ line: 0, ch: 5 });

      expect(editor.somethingSelected()).toBe(false);

      // 无选区时粘贴 = 在光标处插入
      editor.replaceSelection(' Beautiful');
      expect(editor.getValue()).toBe('Hello Beautiful World');
    });
  });

  // ============================================================================
  // 边界情况
  // ============================================================================
  describe('边界情况', () => {
    it('空文档的选区操作', () => {
      editor.setValue('');
      expect(editor.listSelections().length).toBe(1);
      expect(editor.getSelections()).toEqual(['']);
      expect(editor.somethingSelected()).toBe(false);
    });

    it('选中全部内容', () => {
      editor.setSelection(
        { line: 0, ch: 0 },
        { line: 3, ch: editor.getLine(3).length },
      );

      expect(editor.somethingSelected()).toBe(true);
      expect(editor.getSelection()).toBe('Hello World\nSecond Line\nThird Line\nFourth Line');
    });

    it('反向选区（head 在 anchor 之前）', () => {
      editor.setSelection({ line: 0, ch: 5 }, { line: 0, ch: 0 });

      const sels = editor.listSelections();
      expect(sels[0].anchor).toEqual({ line: 0, ch: 5 });
      expect(sels[0].head).toEqual({ line: 0, ch: 0 });

      // getSelection 不管方向都应返回正确文本
      expect(editor.getSelection()).toBe('Hello');
    });

    it('setSelections 后 setSelection 应该重置为单选区', () => {
      editor.setSelections([
        { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 6 } },
      ]);
      expect(editor.listSelections().length).toBe(2);

      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 3 });
      expect(editor.listSelections().length).toBe(1);
    });
  });
});
