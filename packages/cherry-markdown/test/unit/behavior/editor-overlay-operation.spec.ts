/**
 * 搜索覆盖层和批量操作行为契约测试
 *
 * 测试 addOverlay / removeOverlay / operation / showMatchesOnScrollbar 的行为
 * 这些 API 在 cm-search-replace.js 中使用：
 * - addOverlay: 搜索高亮覆盖层
 * - removeOverlay: 清除搜索高亮
 * - operation: 批量操作（作为单一撤销单元）
 * - showMatchesOnScrollbar: 滚动条匹配高亮
 *
 * CM5 → CM6 映射：
 * - addOverlay → ViewPlugin with Decoration
 * - removeOverlay → 销毁 ViewPlugin
 * - operation → dispatch with multiple changes (自动合并为单一事务)
 * - showMatchesOnScrollbar → @codemirror/search 的 highlightSelectionMatches
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCodeMirrorMock, type CodeMirrorMock } from '../../__mocks__/codemirror.mock';

describe('搜索覆盖层和批量操作行为契约测试', () => {
  let cm: CodeMirrorMock;

  beforeEach(() => {
    cm = createCodeMirrorMock('Hello World\nHello Cherry\nHello Test');
  });

  // ============================================================================
  // addOverlay / removeOverlay
  // ============================================================================
  describe('addOverlay / removeOverlay 行为', () => {
    it('addOverlay 应该接受一个 overlay 对象', () => {
      const overlay = {
        token(stream: any) {
          // 搜索高亮 token 函数
        },
      };

      expect(() => cm.addOverlay(overlay)).not.toThrow();
      expect(cm.addOverlay).toHaveBeenCalledWith(overlay);
    });

    it('removeOverlay 应该移除已添加的 overlay', () => {
      const overlay = { token: vi.fn() };

      cm.addOverlay(overlay);
      cm.removeOverlay(overlay);

      expect(cm.removeOverlay).toHaveBeenCalledWith(overlay);
    });

    it('多次 addOverlay 后应该能逐个 removeOverlay', () => {
      const overlay1 = { token: vi.fn() };
      const overlay2 = { token: vi.fn() };

      cm.addOverlay(overlay1);
      cm.addOverlay(overlay2);

      // 先移除第一个
      cm.removeOverlay(overlay1);
      // 再移除第二个
      cm.removeOverlay(overlay2);

      // 两次移除都应正常完成
      expect(cm.removeOverlay).toHaveBeenCalledTimes(2);
    });

    it('removeOverlay 未添加的 overlay 不应报错', () => {
      const overlay = { token: vi.fn() };
      expect(() => cm.removeOverlay(overlay)).not.toThrow();
    });
  });

  // ============================================================================
  // operation 批量操作
  // ============================================================================
  describe('operation 批量操作行为', () => {
    it('operation 应该执行传入的函数', () => {
      const fn = vi.fn();
      cm.operation(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('operation 内部的多次修改应该被执行', () => {
      cm.operation(() => {
        cm.setValue('first');
        cm.replaceRange(' change', { line: 0, ch: 5 }, { line: 0, ch: 5 });
      });

      // 两次修改都应生效
      expect(cm.getValue()).toBe('first change');
    });

    it('operation 应该返回内部函数的返回值（如有）', () => {
      const result = cm.operation(() => {
        return 'result';
      });
      // Mock 实现直接调用 fn()，应该返回结果
      expect(result).toBe('result');
    });
  });

  // ============================================================================
  // showMatchesOnScrollbar
  // ============================================================================
  describe('showMatchesOnScrollbar 行为', () => {
    it('应该返回带有 clear 方法的对象', () => {
      const annotate = cm.showMatchesOnScrollbar('Hello');

      expect(annotate).toBeDefined();
      expect(typeof annotate.clear).toBe('function');
    });

    it('clear 应该可以安全调用', () => {
      const annotate = cm.showMatchesOnScrollbar('Hello');
      expect(() => annotate.clear()).not.toThrow();
    });

    it('应该接受正则表达式参数', () => {
      const annotate = cm.showMatchesOnScrollbar(/Hello/gi);
      expect(annotate).toBeDefined();
    });
  });

  // ============================================================================
  // 模拟 cm-search-replace.js 的 clearSearch 行为
  // ============================================================================
  describe('cm-search-replace clearSearch 场景', () => {
    it('clearSearch: operation 内清除搜索状态', () => {
      // 模拟搜索状态
      const overlay = { token: vi.fn() };
      cm.state.search = {
        posFrom: null,
        posTo: null,
        lastQuery: null,
        query: 'Hello',
        queryText: 'Hello',
        overlay,
        annotate: { clear: vi.fn() },
      };

      cm.addOverlay(overlay);

      // 模拟 clearSearch
      cm.operation(() => {
        const state = cm.state.search!;
        state.lastQuery = state.query;
        if (!state.query) return;
        state.query = null;
        state.queryText = null;
        cm.removeOverlay(state.overlay);
        if (state.annotate) {
          state.annotate.clear();
          state.annotate = null;
        }
      });

      expect(cm.state.search!.query).toBeNull();
      expect(cm.state.search!.annotate).toBeNull();
      expect(cm.removeOverlay).toHaveBeenCalledWith(overlay);
    });
  });

  // ============================================================================
  // 模拟 cm-search-replace.js 的 startSearch 行为
  // ============================================================================
  describe('cm-search-replace startSearch 场景', () => {
    it('startSearch: 先清除旧 overlay 再添加新 overlay', () => {
      const oldOverlay = { token: vi.fn() };
      const newOverlay = {
        token(stream: any) {
          // 新的搜索高亮逻辑
        },
      };

      // 模拟已有搜索状态
      cm.state.search = {
        posFrom: null,
        posTo: null,
        lastQuery: null,
        query: 'old',
        queryText: 'old',
        overlay: oldOverlay,
        annotate: null,
      };

      // 模拟 startSearch
      const state = cm.state.search!;
      state.queryText = 'new';
      state.query = 'new';
      cm.removeOverlay(state.overlay);
      state.overlay = newOverlay;
      cm.addOverlay(state.overlay);

      expect(cm.removeOverlay).toHaveBeenCalledWith(oldOverlay);
      expect(cm.addOverlay).toHaveBeenCalledWith(newOverlay);
    });

    it('startSearch: 更新滚动条匹配标注', () => {
      const oldAnnotate = { clear: vi.fn() };

      cm.state.search = {
        posFrom: null,
        posTo: null,
        lastQuery: null,
        query: 'old',
        queryText: 'old',
        overlay: { token: vi.fn() },
        annotate: oldAnnotate,
      };

      const state = cm.state.search!;

      // 清除旧的滚动条标注
      if (state.annotate) {
        state.annotate.clear();
        state.annotate = null;
      }

      // 创建新的滚动条标注
      state.annotate = cm.showMatchesOnScrollbar('new');

      expect(oldAnnotate.clear).toHaveBeenCalled();
      expect(state.annotate).toBeDefined();
      expect(typeof state.annotate!.clear).toBe('function');
    });
  });

  // ============================================================================
  // 模拟 cm-search-replace.js 的 replaceAll 行为
  // ============================================================================
  describe('cm-search-replace replaceAll 场景', () => {
    it('replaceAll: 通过 getValue + replace + setValue 实现全部替换', () => {
      cm.setValue('Hello World\nHello Cherry\nHello Test');

      // 模拟 replaceAll 逻辑
      const from = 'Hello';
      const to = 'Hi';
      const reg = new RegExp(from, 'gi');

      // 需要有选区才能执行（cm-search-replace.js:403）
      cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      const cursorBefore = cm.getCursor();
      let value = cm.getValue();
      value = value.replace(reg, to);
      cm.setValue(value);
      cm.setCursor(cursorBefore);

      expect(cm.getValue()).toBe('Hi World\nHi Cherry\nHi Test');
    });
  });

  // ============================================================================
  // 模拟 cm-search-replace.js 的 $find 行为
  // ============================================================================
  describe('cm-search-replace $find 场景', () => {
    it('搜索 + getSearchCursor + setSelection 完整流程', () => {
      cm.setValue('apple banana apple cherry apple');

      // 模拟 $find 中的搜索流程
      const cursor = cm.getCursor();
      const searchCursor = cm.getSearchCursor('apple', cursor);

      const found = searchCursor.findNext();
      expect(found).toBeTruthy();

      const from = searchCursor.from();
      const to = searchCursor.to();
      expect(from).not.toBeNull();
      expect(to).not.toBeNull();

      // 选中找到的匹配
      cm.setSelection(from!, to!);
    });

    it('搜索不到内容时不设置选区', () => {
      cm.setValue('apple banana cherry');

      const searchCursor = cm.getSearchCursor('notexist', { line: 0, ch: 0 });
      const found = searchCursor.findNext();
      expect(found).toBeFalsy();
    });
  });

  // ============================================================================
  // 边界情况
  // ============================================================================
  describe('边界情况', () => {
    it('空文档上的搜索操作', () => {
      cm.setValue('');
      const searchCursor = cm.getSearchCursor('test');
      expect(searchCursor.findNext()).toBeFalsy();
    });

    it('operation 内抛出错误应该传播', () => {
      expect(() => {
        cm.operation(() => {
          throw new Error('test error');
        });
      }).toThrow('test error');
    });

    it('连续多次 operation 调用', () => {
      cm.setValue('initial');

      cm.operation(() => {
        cm.setValue('first');
      });
      cm.operation(() => {
        cm.setValue('second');
      });

      expect(cm.getValue()).toBe('second');
    });
  });
});
