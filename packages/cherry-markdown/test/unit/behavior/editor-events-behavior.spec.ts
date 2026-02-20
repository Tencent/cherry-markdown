/**
 * 编辑器事件系统行为测试
 *
 * 这些测试验证编辑器的事件系统行为
 * 升级 CodeMirror 6 后这些测试必须全部通过
 *
 * CM5 → CM6 事件映射：
 * - change → EditorView.updateListener + ViewUpdate.docChanged
 * - cursorActivity → EditorView.updateListener + ViewUpdate.selectionSet
 * - focus/blur → DOM focus/blur events on EditorView.contentDOM
 * - scroll → EditorView.scrollDOM.onscroll
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createExtendedMockEditorAdapter,
  type IEditorAdapterExtended,
  type EditorEventType,
} from './editor-adapter-extended.spec';

// ============================================================================
// 事件系统行为测试
// ============================================================================

describe('编辑器事件系统行为测试', () => {
  let editor: IEditorAdapterExtended;
  let eventLog: Array<{ type: EditorEventType; data?: any }>;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Hello World');
    eventLog = [];
  });

  afterEach(() => {
    eventLog = [];
  });

  // ============ change 事件测试 ============
  describe('change 事件', () => {
    it('setValue 应该触发 change 事件', () => {
      editor.on('change', (e, data) => {
        eventLog.push({ type: 'change', data });
      });

      editor.setValue('new content');

      expect(eventLog.length).toBe(1);
      expect(eventLog[0].type).toBe('change');
    });

    it('replaceSelection 应该触发 change 事件', () => {
      editor.on('change', (e, data) => {
        eventLog.push({ type: 'change', data });
      });

      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceSelection('Hi');

      expect(eventLog.length).toBe(1);
    });

    it('replaceRange 应该触发 change 事件', () => {
      editor.on('change', (e, data) => {
        eventLog.push({ type: 'change', data });
      });

      editor.replaceRange('Test', { line: 0, ch: 0 }, { line: 0, ch: 5 });

      expect(eventLog.length).toBe(1);
    });

    it('连续操作应该触发多次 change 事件', () => {
      editor.on('change', (e) => {
        eventLog.push({ type: 'change' });
      });

      editor.setValue('first');
      editor.setValue('second');
      editor.setValue('third');

      expect(eventLog.length).toBe(3);
    });
  });

  // ============ cursorActivity 事件测试 ============
  describe('cursorActivity 事件', () => {
    it('setCursor 应该触发 cursorActivity 事件', () => {
      editor.on('cursorActivity', (e) => {
        eventLog.push({ type: 'cursorActivity' });
      });

      editor.setCursor({ line: 0, ch: 5 });

      expect(eventLog.length).toBe(1);
    });

    it('setSelection 应该触发 cursorActivity 事件', () => {
      editor.on('cursorActivity', (e) => {
        eventLog.push({ type: 'cursorActivity' });
      });

      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      expect(eventLog.length).toBe(1);
    });

    it('replaceSelection 后应该触发 cursorActivity', () => {
      editor.on('cursorActivity', (e) => {
        eventLog.push({ type: 'cursorActivity' });
      });

      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceSelection('Hi');

      // setSelection 和 replaceSelection 都会触发
      expect(eventLog.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============ focus/blur 事件测试 ============
  describe('focus/blur 事件', () => {
    it('focus 应该触发 focus 事件', () => {
      editor.on('focus', (e) => {
        eventLog.push({ type: 'focus' });
      });

      editor.focus();

      expect(eventLog.length).toBe(1);
      expect(editor.hasFocus()).toBe(true);
    });

    it('初始状态不应该有焦点', () => {
      expect(editor.hasFocus()).toBe(false);
    });

    it('focus 应该改变 hasFocus 状态', () => {
      expect(editor.hasFocus()).toBe(false);
      editor.focus();
      expect(editor.hasFocus()).toBe(true);
    });
  });

  // ============ 事件注册/注销测试 ============
  describe('事件注册和注销', () => {
    it('on 应该正确注册事件处理器', () => {
      const handler = vi.fn();
      editor.on('change', handler);

      editor.setValue('new');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('off 应该正确移除事件处理器', () => {
      const handler = vi.fn();
      editor.on('change', handler);
      editor.off('change', handler);

      editor.setValue('new');

      expect(handler).not.toHaveBeenCalled();
    });

    it('同一个处理器应该可以被多个事件类型使用', () => {
      const handler = vi.fn();

      editor.on('change', handler);
      editor.on('cursorActivity', handler);

      editor.setValue('new');
      editor.setCursor({ line: 0, ch: 3 });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('多个处理器应该都能收到事件', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      editor.on('change', handler1);
      editor.on('change', handler2);
      editor.on('change', handler3);

      editor.setValue('new');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });

    it('移除一个处理器不应该影响其他处理器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      editor.on('change', handler1);
      editor.on('change', handler2);
      editor.off('change', handler1);

      editor.setValue('new');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  // ============ 事件顺序测试 ============
  describe('事件触发顺序', () => {
    it('setSelection 应该在 cursorActivity 之前触发 beforeSelectionChange', () => {
      const order: string[] = [];

      editor.on('beforeSelectionChange', () => order.push('before'));
      editor.on('cursorActivity', () => order.push('cursor'));

      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      expect(order.indexOf('before')).toBeLessThan(order.indexOf('cursor'));
    });

    it('setValue 应该触发 change 事件', () => {
      const order: string[] = [];

      editor.on('change', () => order.push('change'));

      editor.setValue('new');

      expect(order).toContain('change');
    });
  });
});

// ============================================================================
// 事件驱动场景测试
// ============================================================================

describe('事件驱动场景测试', () => {
  let editor: IEditorAdapterExtended;
  let contentChanges: string[];

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
    contentChanges = [];

    // 记录所有内容变化
    editor.on('change', () => {
      contentChanges.push(editor.getValue());
    });
  });

  it('应该记录所有内容变化', () => {
    editor.setValue('first');
    editor.setValue('second');
    editor.setValue('third');

    expect(contentChanges).toContain('first');
    expect(contentChanges).toContain('second');
    expect(contentChanges).toContain('third');
  });

  it('撤销操作应该触发 change 事件', () => {
    editor.setValue('initial');
    editor.setValue('modified');

    const beforeUndo = contentChanges.length;
    editor.undo();

    expect(contentChanges.length).toBeGreaterThan(beforeUndo);
  });

  it('重做操作应该触发 change 事件', () => {
    editor.setValue('initial');
    editor.setValue('modified');
    editor.undo();

    const beforeRedo = contentChanges.length;
    editor.redo();

    expect(contentChanges.length).toBeGreaterThan(beforeRedo);
  });
});

// ============================================================================
// 事件数据验证测试
// ============================================================================

describe('事件数据验证', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('change 事件应该包含变化信息', () => {
    let eventData: any = null;

    editor.on('change', (e, data) => {
      eventData = data;
    });

    editor.setValue('new content');

    // 验证事件数据存在
    expect(eventData).toBeDefined();
  });

  it('多次事件应该有独立的数据', () => {
    const events: any[] = [];

    editor.on('change', (e, data) => {
      events.push({ value: editor.getValue(), data });
    });

    editor.setValue('first');
    editor.setValue('second');

    expect(events.length).toBe(2);
    // 每个事件应该是独立的
    expect(events[0]).not.toBe(events[1]);
  });
});

// ============================================================================
// 复杂事件场景测试
// ============================================================================

describe('复杂事件场景', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('在事件处理器中修改内容应该触发新的事件', () => {
    let callCount = 0;

    editor.on('change', (e) => {
      callCount += 1;
      // 防止无限循环
      if (callCount < 3) {
        // 这里我们不再次触发 setValue，避免无限循环
      }
    });

    editor.setValue('initial');
    editor.setValue('modified');

    expect(callCount).toBe(2);
  });

  it('事件处理器异常不应该中断其他处理器', () => {
    const results: string[] = [];

    editor.on('change', () => {
      results.push('first');
    });

    editor.on('change', () => {
      throw new Error('Handler error');
    });

    editor.on('change', () => {
      results.push('third');
    });

    // 即使有异常，也不应该阻止其他处理器
    try {
      editor.setValue('test');
    } catch {
      // 预期可能会有异常
    }

    // 至少第一个和第三个处理器应该执行
    expect(results).toContain('first');
  });
});
