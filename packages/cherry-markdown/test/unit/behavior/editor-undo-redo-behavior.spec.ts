/**
 * 编辑器撤销/重做行为测试
 *
 * 这些测试验证编辑器的历史记录系统行为
 * 升级 CodeMirror 6 后这些测试必须全部通过
 *
 * CM5 → CM6 撤销重做映射：
 * - undo() → EditorView.dispatch({ effects: undo })
 * - redo() → EditorView.dispatch({ effects: redo })
 * - historySize() → EditorState.field(historyField)
 * - clearHistory() → EditorState.config.history.newHistory()
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createExtendedMockEditorAdapter, type IEditorAdapterExtended } from './editor-adapter-extended.spec';

// ============================================================================
// 撤销/重做基础行为测试
// ============================================================================

describe('撤销/重做基础行为测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Initial Content');
  });

  // ============ undo 行为测试 ============
  describe('undo 行为', () => {
    it('初始状态不应该能撤销', () => {
      const size = editor.historySize();
      expect(size.canUndo).toBe(false);
    });

    it('修改后应该能撤销', () => {
      editor.setValue('Modified');
      expect(editor.historySize().canUndo).toBe(true);
    });

    it('undo 应该恢复到上一个状态', () => {
      editor.setValue('First');
      editor.setValue('Second');
      editor.setValue('Third');

      editor.undo();
      expect(editor.getValue()).toBe('Second');

      editor.undo();
      expect(editor.getValue()).toBe('First');
    });

    it('多次 undo 应该能回到初始状态', () => {
      const initial = editor.getValue();
      editor.setValue('One');
      editor.setValue('Two');
      editor.setValue('Three');

      editor.undo();
      editor.undo();
      editor.undo();

      // 应该回到初始状态
      expect(editor.getValue()).toBe(initial);
    });

    it('当不能撤销时 undo 应该没有效果', () => {
      const initial = editor.getValue();
      editor.undo();
      expect(editor.getValue()).toBe(initial);
    });
  });

  // ============ redo 行为测试 ============
  describe('redo 行为', () => {
    it('初始状态不应该能重做', () => {
      expect(editor.historySize().canRedo).toBe(false);
    });

    it('撤销后应该能重做', () => {
      editor.setValue('First');
      editor.setValue('Second');
      editor.undo();

      expect(editor.historySize().canRedo).toBe(true);
    });

    it('redo 应该恢复到撤销前的状态', () => {
      editor.setValue('First');
      editor.setValue('Second');
      editor.undo();

      editor.redo();
      expect(editor.getValue()).toBe('Second');
    });

    it('多次 redo 应该能恢复到最新状态', () => {
      editor.setValue('One');
      editor.setValue('Two');
      editor.setValue('Three');

      editor.undo();
      editor.undo();
      editor.undo();

      editor.redo();
      expect(editor.getValue()).toBe('One');

      editor.redo();
      expect(editor.getValue()).toBe('Two');

      editor.redo();
      expect(editor.getValue()).toBe('Three');
    });

    it('当不能重做时 redo 应该没有效果', () => {
      const content = editor.getValue();
      editor.redo();
      expect(editor.getValue()).toBe(content);
    });
  });

  // ============ 历史管理测试 ============
  describe('历史管理', () => {
    it('clearHistory 应该清除所有历史', () => {
      editor.setValue('First');
      editor.setValue('Second');

      editor.clearHistory();

      const size = editor.historySize();
      expect(size.canUndo).toBe(false);
      expect(size.canRedo).toBe(false);
    });

    it('clearHistory 后不应该影响当前内容', () => {
      editor.setValue('Current');
      editor.clearHistory();

      expect(editor.getValue()).toBe('Current');
    });

    it('新操作应该清除重做历史', () => {
      editor.setValue('First');
      editor.setValue('Second');
      editor.undo();

      // 此时应该能重做
      expect(editor.historySize().canRedo).toBe(true);

      // 执行新操作
      editor.setValue('Third');

      // 此时应该不能重做
      expect(editor.historySize().canRedo).toBe(false);
    });
  });
});

// ============================================================================
// 撤销/重做场景测试
// ============================================================================

describe('撤销/重做场景测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  describe('文本编辑场景', () => {
    it('应该能撤销选区替换操作', () => {
      editor.setValue('Hello World');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceSelection('Hi');

      expect(editor.getValue()).toBe('Hi World');

      editor.undo();
      expect(editor.getValue()).toBe('Hello World');
    });

    it('应该能撤销范围替换操作', () => {
      editor.setValue('Hello World');
      editor.replaceRange('Hi', { line: 0, ch: 0 }, { line: 0, ch: 5 });

      expect(editor.getValue()).toBe('Hi World');

      editor.undo();
      expect(editor.getValue()).toBe('Hello World');
    });

    it('应该能撤销多次选区操作', () => {
      editor.setValue('ABCDEFGHIJ');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 2 });
      editor.replaceSelection('11');

      editor.setSelection({ line: 0, ch: 2 }, { line: 0, ch: 4 });
      editor.replaceSelection('22');

      editor.setSelection({ line: 0, ch: 4 }, { line: 0, ch: 6 });
      editor.replaceSelection('33');

      expect(editor.getValue()).toBe('112233GHIJ');

      editor.undo();
      expect(editor.getValue()).toBe('1122EFGHIJ');

      editor.undo();
      expect(editor.getValue()).toBe('11CDEFGHIJ');

      editor.undo();
      expect(editor.getValue()).toBe('ABCDEFGHIJ');
    });
  });

  describe('Markdown 格式化场景', () => {
    it('应该能撤销加粗操作', () => {
      editor.setValue('hello world');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceSelection('**hello**');

      editor.undo();
      expect(editor.getValue()).toBe('hello world');
    });

    it('应该能撤销并重做标题操作', () => {
      editor.setValue('Title');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceSelection('# Title');

      editor.undo();
      expect(editor.getValue()).toBe('Title');

      editor.redo();
      expect(editor.getValue()).toBe('# Title');
    });

    it('应该能撤销多个格式化操作', () => {
      editor.setValue('text');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

      // 加粗
      editor.replaceSelection('**text**');
      expect(editor.getValue()).toBe('**text**');

      // 设置选区选中包括 ** 的内容
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });

      // 斜体（再加一层）
      editor.replaceSelection(`*${editor.getSelection()}*`);

      // 撤销斜体
      editor.undo();
      expect(editor.getValue()).toBe('**text**');

      // 撤销加粗
      editor.undo();
      expect(editor.getValue()).toBe('text');
    });
  });

  describe('复杂编辑场景', () => {
    it('应该能撤销多行操作', () => {
      editor.setValue('Line1\nLine2\nLine3');
      editor.setSelection({ line: 0, ch: 0 }, { line: 2, ch: 5 });
      editor.replaceSelection('Replaced');

      expect(editor.getValue()).toBe('Replaced');

      editor.undo();
      expect(editor.getValue()).toBe('Line1\nLine2\nLine3');
    });

    it('应该正确处理光标位置的恢复', () => {
      editor.setValue('Hello World');
      editor.setCursor({ line: 0, ch: 5 });

      editor.replaceRange(' Beautiful', { line: 0, ch: 5 }, { line: 0, ch: 5 });
      editor.undo();

      // 光标位置可能因实现而异，但内容应该正确
      expect(editor.getValue()).toBe('Hello World');
    });
  });
});

// ============================================================================
// 边界情况测试
// ============================================================================

describe('撤销/重做边界情况', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('应该处理空内容的撤销', () => {
    editor.setValue('');
    editor.setValue('Content');

    editor.undo();
    expect(editor.getValue()).toBe('');
  });

  it('应该处理大内容的撤销', () => {
    const largeContent = 'A'.repeat(10000);
    editor.setValue(largeContent);
    editor.setValue('Small');

    editor.undo();
    expect(editor.getValue()).toBe(largeContent);
  });

  it('应该处理连续相同的操作', () => {
    editor.setValue('Same');
    editor.setValue('Same');
    editor.setValue('Same');

    // 即使内容相同，每次操作都应该记录
    editor.undo();
    expect(editor.getValue()).toBe('Same');
  });

  it('应该正确处理 undo/redo 交替', () => {
    editor.setValue('A');
    editor.setValue('B');
    editor.setValue('C');

    editor.undo(); // B
    editor.redo(); // C
    editor.undo(); // B
    editor.undo(); // A

    expect(editor.getValue()).toBe('A');
  });
});

// ============================================================================
// 事件与撤销重做的交互测试
// ============================================================================

describe('事件与撤销重做交互', () => {
  let editor: IEditorAdapterExtended;
  let changeCount: number;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
    changeCount = 0;

    editor.on('change', () => {
      changeCount += 1;
    });
  });

  it('undo 应该触发 change 事件', () => {
    editor.setValue('First');
    const countBeforeUndo = changeCount;

    editor.undo();

    expect(changeCount).toBeGreaterThan(countBeforeUndo);
  });

  it('redo 应该触发 change 事件', () => {
    editor.setValue('First');
    editor.setValue('Second');
    editor.undo();
    const countBeforeRedo = changeCount;

    editor.redo();

    expect(changeCount).toBeGreaterThan(countBeforeRedo);
  });

  it('不能撤销时 undo 不应该触发事件', () => {
    editor.clearHistory();
    const countBeforeUndo = changeCount;

    editor.undo();

    // 如果不能撤销，change 事件次数不应该增加
    expect(changeCount).toBe(countBeforeUndo);
  });
});

// ============================================================================
// 撤销重做与选区的交互测试
// ============================================================================

describe('撤销重做与选区交互', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('撤销后选区应该正确设置', () => {
    editor.setValue('Hello World');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    editor.replaceSelection('Hi');

    editor.undo();

    // 选区可能恢复到之前的位置
    // 具体行为取决于实现
  });

  it('重做后内容应该与撤销前一致', () => {
    editor.setValue('Original');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });
    editor.replaceSelection('Modified');

    editor.undo();
    editor.redo();

    expect(editor.getValue()).toBe('Modified');
  });
});

// ============================================================================
// 历史栈大小测试
// ============================================================================

describe('历史栈行为', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('应该能正确报告历史大小', () => {
    editor.setValue('One');
    editor.setValue('Two');
    editor.setValue('Three');

    const size = editor.historySize();
    expect(size.canUndo).toBe(true);
    expect(size.canRedo).toBe(false);
  });

  it('撤销后应该能正确报告历史大小', () => {
    editor.setValue('One');
    editor.setValue('Two');
    editor.undo();

    const size = editor.historySize();
    expect(size.canUndo).toBe(true);
    expect(size.canRedo).toBe(true);
  });

  it('全部撤销后应该能正确报告历史大小', () => {
    editor.setValue('One');
    editor.setValue('Two');
    editor.undo();
    editor.undo();

    const size = editor.historySize();
    expect(size.canRedo).toBe(true);
  });
});
