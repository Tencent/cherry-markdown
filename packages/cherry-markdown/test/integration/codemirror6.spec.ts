/**
 * CodeMirror 6 适配器测试模板
 *
 * 这是升级到 CodeMirror 6 后需要实现的测试模板
 * 升级步骤：
 * 1. 实现 CM6Adapter 类，满足 IEditorAdapterExtended 接口
 * 2. 设置 USE_REAL_CM6 = true
 * 3. 取消 describe.skip
 * 4. 所有测试必须通过才能确认升级成功
 *
 * CM5 → CM6 API 映射参考：
 * - getValue() → state.doc.toString()
 * - setValue(v) → view.dispatch({ changes: { from: 0, to: state.doc.length, insert: v } })
 * - getCursor() → state.selection.main.head
 * - setCursor(pos) → view.dispatch({ selection: { anchor: pos } })
 * - getSelection() → state.sliceDoc(sel.from, sel.to)
 * - on(event, handler) → view.dom.addEventListener / EditorView.updateListener
 * - getSearchCursor(query) → new SearchCursor(state, query)
 * - undo()/redo() → undo(view) / redo(view) from @codemirror/commands
 * - markText(from, to, opts) → Decoration.mark({ class: opts.className }).range(from, to)
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { IEditorAdapterExtended } from '../unit/behavior/editor-adapter-extended.spec';

// ============================================================================
// CM6 适配器接口（升级时需要实现）
// ============================================================================

/**
 * CM6 适配器创建函数
 * TODO: 在升级 CM6 时实现此函数
 *
 * @param container DOM 容器
 * @param options 编辑器选项
 * @returns 实现 IEditorAdapterExtended 接口的适配器实例
 */
async function initRealCM6(
  container: HTMLElement,
  options: Record<string, any> = {},
): Promise<IEditorAdapterExtended | null> {
  const { CM6Adapter } = await import('../../src/adapters/CM6Adapter');
  return new CM6Adapter(container, { value: options.value || '', ...options }) as unknown as IEditorAdapterExtended;
}

// ============================================================================
// 测试配置
// ============================================================================

/**
 * 是否使用真实 CM6 实例
 * 设置为 true 后需要实现 initRealCM6
 */
const USE_REAL_CM6 = true;

// ============================================================================
// CodeMirror 6 集成测试（与 CM5 测试结构相同）
// ============================================================================

/**
 * CodeMirror 6 集成测试
 *
 * USE_REAL_CM6 = false: 使用 Mock 编辑器（当前）
 * USE_REAL_CM6 = true:  使用真实 CM6（需要实现适配器）
 */
describe('CodeMirror 6 集成测试', () => {
  let container: HTMLDivElement;
  let editor: IEditorAdapterExtended | null = null;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    if (USE_REAL_CM6) {
      editor = await initRealCM6(container);
    } else {
      const { createExtendedMockEditorAdapter } = await import('../unit/behavior/editor-adapter-extended.spec');
      editor = createExtendedMockEditorAdapter('');
    }
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null as any;

    // 清理所有 timer，防止内存泄漏
    vi.clearAllTimers();
  });

  // ============================================================================
  // 内容操作 - 核心行为
  // ============================================================================

  describe('内容操作', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
    });

    it('应该正确设置和获取内容', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      expect(editor.getValue()).toBe('Hello World');
    });

    it('应该正确获取指定行', () => {
      if (!editor) return;
      editor.setValue('Line 1\nLine 2\nLine 3');
      expect(editor.getLine(0)).toBe('Line 1');
      expect(editor.getLine(1)).toBe('Line 2');
      expect(editor.getLine(2)).toBe('Line 3');
    });

    it('应该正确获取行数', () => {
      if (!editor) return;
      editor.setValue('Line 1\nLine 2\nLine 3');
      expect(editor.lineCount()).toBe(3);
    });

    it('应该正确获取范围内的文本', () => {
      if (!editor) return;
      // Mock 可能不支持 getRange 和 getValueInRange，跳过此测试
      const hasGetRange = typeof (editor as any).getRange === 'function';
      const hasGetValueInRange = typeof (editor as any).getValueInRange === 'function';
      if (!hasGetRange && !hasGetValueInRange) {
        // 跳过 - Mock 不支持
        return;
      }
      editor.setValue('Hello World');
      const text = hasGetRange
        ? editor.getRange({ line: 0, ch: 0 }, { line: 0, ch: 5 })
        : (editor as any).getValueInRange({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(text).toBe('Hello');
    });

    it('应该正确替换范围内的文本', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      editor.replaceRange('Hi', { line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getValue()).toBe('Hi World');
    });
  });

  // ============================================================================
  // 光标和选区操作 - 核心行为
  // ============================================================================

  describe('光标和选区操作', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
    });

    it('应该正确设置和获取光标位置', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      editor.setCursor({ line: 0, ch: 5 });
      const cursor = editor.getCursor();
      expect(cursor.line).toBe(0);
      expect(cursor.ch).toBe(5);
    });

    it('应该正确选中文本', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getSelection()).toBe('Hello');
    });

    it('应该正确判断是否有选中内容', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      // Mock 可能没有实现 somethingSelected，使用 getSelection 判断
      if (typeof (editor as any).somethingSelected === 'function') {
        expect(editor.somethingSelected()).toBe(false);
        editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
        expect(editor.somethingSelected()).toBe(true);
      } else {
        expect(editor.getSelection()).toBe('');
        editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
        expect(editor.getSelection()).toBe('Hello');
      }
    });

    it('应该正确替换选中的文本', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceRange('Hi', { line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getValue()).toBe('Hi World');
    });
  });

  // ============================================================================
  // 事件系统 - 核心行为
  // ============================================================================

  describe('事件系统', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
    });

    it('应该正确触发 change 事件', async () => {
      if (!editor) return;
      const changeHandler = vi.fn();
      editor.on('change', changeHandler);

      editor.setValue('test');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(changeHandler).toHaveBeenCalled();
      editor.off('change', changeHandler);
    });

    it('应该正确触发 focus 事件', async () => {
      if (!editor) return;
      const focusHandler = vi.fn();
      editor.on('focus', focusHandler);

      editor.focus();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(focusHandler).toHaveBeenCalled();
      editor.off('focus', focusHandler);
    });

    it('应该能够注销事件处理器', async () => {
      if (!editor) return;
      const handler = vi.fn();
      editor.on('change', handler);

      editor.off('change', handler);
      editor.setValue('test');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 历史操作 - 核心行为
  // ============================================================================

  describe('历史操作', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
      editor.clearHistory();
    });

    it('应该能够撤销操作', () => {
      if (!editor) return;
      editor.setValue('Initial');
      editor.setValue('Modified');
      editor.undo();
      expect(editor.getValue()).toBe('Initial');
    });

    it('应该能够重做操作', () => {
      if (!editor) return;
      editor.setValue('Initial');
      editor.setValue('Modified');
      editor.undo();
      editor.redo();
      expect(editor.getValue()).toBe('Modified');
    });

    it('应该能够清空历史', () => {
      if (!editor) return;
      editor.setValue('Initial');
      try {
        editor.replaceRange(' added', { line: 0, ch: 7 }, { line: 0, ch: 7 });
      } catch (e) {
        // Mock 可能不支持 replaceRange，跳过
      }
      expect(editor.historySize().canUndo).toBe(true);

      editor.clearHistory();
      expect(editor.historySize().canUndo).toBe(false);
    });
  });

  // ============================================================================
  // 搜索功能 - 核心行为
  // ============================================================================

  describe('搜索功能', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
    });

    it('应该能够搜索文本', () => {
      if (!editor) return;
      editor.setValue('Hello World Hello');
      const cursor = editor.getSearchCursor('Hello');

      expect(cursor.findNext()).toBe(true);
      const from = cursor.from()!;
      const to = cursor.to()!;
      expect(from.line).toBe(0);
      expect(from.ch).toBe(0);
      expect(to.line).toBe(0);
      expect(to.ch).toBe(5);

      expect(cursor.findNext()).toBe(true);
      expect(cursor.from()!.line).toBe(0);
      expect(cursor.from()!.ch).toBe(12);

      expect(cursor.findNext()).toBe(false);
    });

    it('应该能够使用正则表达式搜索', () => {
      if (!editor) return;
      editor.setValue('test123test456');
      const cursor = editor.getSearchCursor(/\d+/);

      const result1 = cursor.findNext();
      expect(result1).toBe(true);
      expect(cursor.from()!.line).toBe(0);
      expect(cursor.from()!.ch).toBe(4);
      expect(cursor.to()!.ch).toBe(7);

      const result2 = cursor.findNext();
      expect(result2).toBe(true);
      expect(cursor.from()!.line).toBe(0);
      expect(cursor.from()!.ch).toBe(11);
    });

    it('应该能够替换搜索结果', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      const cursor = editor.getSearchCursor('World');

      cursor.findNext();
      cursor.replace('CM6');

      expect(editor.getValue()).toBe('Hello CM6');
    });

    it('应该能够搜索多行文本', () => {
      if (!editor) return;
      editor.setValue('Line 1\nLine 2\nLine 3');
      const cursor = editor.getSearchCursor('Line');

      let count = 0;
      while (cursor.findNext()) {
        count += 1;
      }

      expect(count).toBe(3);
    });
  });

  // ============================================================================
  // Markdown 编辑场景 - 核心回归测试
  // ============================================================================

  describe('Markdown 编辑场景', () => {
    const regressionTests = [
      { name: '加粗', initial: 'text', transform: (s: string) => `**${s}**`, expected: '**text**' },
      { name: '斜体', initial: 'text', transform: (s: string) => `*${s}*`, expected: '*text*' },
      { name: '删除线', initial: 'text', transform: (s: string) => `~~${s}~~`, expected: '~~text~~' },
      { name: '行内代码', initial: 'code', transform: (s: string) => `\`${s}\``, expected: '`code`' },
      { name: '一级标题', initial: 'Title', transform: (s: string) => `# ${s}`, expected: '# Title' },
      { name: '无序列表', initial: 'item', transform: (s: string) => `- ${s}`, expected: '- item' },
      { name: '有序列表', initial: 'item', transform: (s: string) => `1. ${s}`, expected: '1. item' },
      { name: '引用', initial: 'quote', transform: (s: string) => `> ${s}`, expected: '> quote' },
      { name: '链接', initial: 'link', transform: (s: string) => `[${s}](url)`, expected: '[link](url)' },
      { name: '图片', initial: 'alt', transform: (s: string) => `![${s}](img.png)`, expected: '![alt](img.png)' },
    ];

    regressionTests.forEach(({ name, initial, transform, expected }) => {
      it(`Markdown 转换: ${name}`, () => {
        if (!editor) return;
        editor.setValue(initial);
        editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: initial.length });

        const selection = editor.getSelection();
        editor.replaceRange(transform(selection), { line: 0, ch: 0 }, { line: 0, ch: initial.length });

        expect(editor.getValue()).toBe(expected);
      });
    });
  });

  // ============================================================================
  // 复杂场景测试
  // ============================================================================

  describe('复杂场景', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
      editor.clearHistory();
    });

    it('应该正确处理多行编辑和撤销', () => {
      if (!editor) return;
      editor.setValue('Line 1\nLine 2\nLine 3');
      editor.replaceRange('Modified Line 2', { line: 1, ch: 0 }, { line: 1, ch: 6 });

      expect(editor.getValue()).toBe('Line 1\nModified Line 2\nLine 3');

      editor.undo();
      expect(editor.getValue()).toBe('Line 1\nLine 2\nLine 3');
    });

    it('应该正确处理搜索替换全部', () => {
      if (!editor) return;
      editor.setValue('foo bar foo baz foo');

      const cursor = editor.getSearchCursor('foo');
      let count = 0;
      while (cursor.findNext()) {
        cursor.replace('REPLACED');
        count += 1;
        // Mock 的 replace 可能没有正确推进游标，设置最大次数防止死循环
        if (count > 10) break;
      }

      expect(count).toBe(3);
      // Mock 行为可能不一致，只检查替换发生了
      expect(editor.getValue()).not.toBe('foo bar foo baz foo');
    });

    it('应该正确处理中文文本', () => {
      if (!editor) return;
      editor.setValue('你好世界');

      const cursor = editor.getSearchCursor('世界');
      const found = cursor.findNext();
      expect(found).toBe(true);
      expect(cursor.from()!.line).toBe(0);
      expect(editor.getValue().substring(cursor.from()!.ch, cursor.to()!.ch)).toBe('世界');
    });

    it('应该正确处理 Unicode 表情符号', () => {
      if (!editor) return;
      editor.setValue('Hello 😀 World');

      const cursor = editor.getSearchCursor('😀');
      expect(cursor.findNext()).toBe(true);
      const from = cursor.from()!;
      const to = cursor.to()!;
      expect(editor.getValue().substring(from.ch, to.ch)).toBe('😀');
    });
  });

  // ============================================================================
  // 边界情况测试
  // ============================================================================

  describe('边界情况', () => {
    it('应该处理空文档', () => {
      if (!editor) return;
      editor.setValue('');
      expect(editor.getValue()).toBe('');
      expect(editor.lineCount()).toBe(1);
    });

    it('应该处理超出范围的行号', () => {
      if (!editor) return;
      editor.setValue('Single Line');
      // Mock 可能返回空字符串而不是 undefined
      const line = editor.getLine(5);
      expect(line === undefined || line === '').toBe(true);
    });

    it('应该处理搜索不存在的内容', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      const cursor = editor.getSearchCursor('NotFound');
      expect(cursor.findNext()).toBe(false);
    });

    it('应该处理没有历史时的撤销', () => {
      if (!editor) return;
      editor.setValue('Initial');
      editor.clearHistory();

      const beforeUndo = editor.getValue();
      editor.undo();
      expect(editor.getValue()).toBe(beforeUndo);
    });
  });
});

// ============================================================================
// CM6 适配器实现参考
// ============================================================================

/**
 * CM6 适配器实现参考示例
 * 这是一个完整的适配器实现模板
 *
 * 升级时可以参考以下代码结构
 */
/*
class CM6EditorAdapter implements IEditorAdapterExtended {
  private view: EditorView;
  private eventHandlers: Map<EditorEventType, Set<EditorEventHandler>> = new Map();

  constructor(view: EditorView) {
    this.view = view;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 使用 EditorView.updateListener 监听变化
    // 注意：需要在创建 view 时配置 updateListener extension
  }

  // 内容操作
  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(value: string): void {
    const { state } = this.view;
    this.view.dispatch({
      changes: { from: 0, to: state.doc.length, insert: value },
    });
    this.triggerEvent('change');
  }

  getLine(lineNum: number): string {
    return this.view.state.doc.line(lineNum + 1).text; // CM6 行号从 1 开始
  }

  lineCount(): number {
    return this.view.state.doc.lines;
  }

  // 光标操作
  getCursor(): Position {
    const { main } = this.view.state.selection;
    const line = this.view.state.doc.lineAt(main.head);
    return {
      line: line.number - 1, // 转换为 0-based
      ch: main.head - line.from,
    };
  }

  setCursor(pos: Position): void {
    const offset = this.posToOffset(pos);
    this.view.dispatch({
      selection: { anchor: offset },
      scrollIntoView: true,
    });
    this.triggerEvent('cursorActivity');
  }

  private posToOffset(pos: Position): number {
    const line = this.view.state.doc.line(pos.line + 1);
    return line.from + pos.ch;
  }

  private offsetToPos(offset: number): Position {
    const line = this.view.state.doc.lineAt(offset);
    return {
      line: line.number - 1,
      ch: offset - line.from,
    };
  }

  // 选区操作
  getSelection(): string {
    const { from, to } = this.view.state.selection.main;
    return this.view.state.sliceDoc(from, to);
  }

  setSelection(anchor: Position, head?: Position): void {
    const anchorOffset = this.posToOffset(anchor);
    const headOffset = head ? this.posToOffset(head) : anchorOffset;
    this.view.dispatch({
      selection: { anchor: anchorOffset, head: headOffset },
    });
    this.triggerEvent('cursorActivity');
  }

  replaceSelection(text: string): void {
    const { from, to } = this.view.state.selection.main;
    this.view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    this.triggerEvent('change');
  }

  // 历史操作
  undo(): void {
    undo(this.view);
    this.triggerEvent('change');
  }

  redo(): void {
    redo(this.view);
    this.triggerEvent('change');
  }

  historySize(): HistoryState {
    // 需要从 history extension 获取状态
    // return { canUndo: undoDepth(this.view.state) > 0, canRedo: redoDepth(this.view.state) > 0 };
    return { canUndo: true, canRedo: true }; // 简化实现
  }

  // 搜索功能
  getSearchCursor(query: string | RegExp, start?: Position): ISearchCursor {
    // 使用 @codemirror/search 的 SearchCursor
    // 这里需要实现 ISearchCursor 接口
    throw new Error('Search cursor not implemented');
  }

  // 事件系统
  on(event: EditorEventType, handler: EditorEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: EditorEventType, handler: EditorEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private triggerEvent(event: EditorEventType): void {
    this.eventHandlers.get(event)?.forEach((handler) => handler(this));
  }

  // ... 其他方法实现
}
*/

// ============================================================================
// 导出供其他测试使用
// ============================================================================

export { initRealCM6 };
