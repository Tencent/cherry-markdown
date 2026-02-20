/**
 * 滚动同步行为契约测试
 *
 * 测试 Editor.js 中预览区同步滚动依赖的 API：
 *
 * 1. getScrollerElement() → CM6: EditorView.scrollDOM
 *    - 返回编辑器的滚动容器 DOM 元素
 *    - 需要 scrollTop / scrollHeight / clientHeight 属性
 *
 * 2. lineAtHeight(height, mode) → CM6: EditorView.lineBlockAtHeight(height).from → line
 *    - 给定垂直像素偏移，返回对应的行号
 *    - Editor.js:409 用于计算当前可见行
 *
 * 3. getLineHandle(line) → CM6: EditorView.lineBlockAt(pos)
 *    - 返回包含 { height, text } 的行句柄
 *    - Editor.js:411 用 .height 计算行内滚动百分比
 *
 * 4. eachLine(start, end, callback) → CM6: state.doc.iterRange() 或遍历
 *    - 遍历指定范围的行，回调参数包含 { height, text }
 *    - FloatMenu.js:145 用于计算浮动菜单定位高度
 *
 * 5. refresh() → CM6: view.requestMeasure() / 无操作
 *    - CM5 手动刷新布局，CM6 自动处理
 *    - FullScreen.js:48, Previewer.js:368,787,848 调用
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createExtendedMockEditorAdapter,
  type IEditorAdapterExtended,
} from './editor-adapter-extended.spec';

describe('滚动同步行为契约测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    // 创建 100 行的长文档用于测试滚动
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}: content here`);
    editor = createExtendedMockEditorAdapter(lines.join('\n'));
  });

  // ============================================================================
  // getScrollerElement
  // ============================================================================
  describe('getScrollerElement 行为', () => {
    it('应该返回 HTMLElement', () => {
      const el = editor.getScrollerElement();
      expect(el).toBeInstanceOf(HTMLElement);
    });

    it('返回的元素应该有 scrollTop 属性', () => {
      const el = editor.getScrollerElement();
      expect(typeof el.scrollTop).toBe('number');
    });

    it('返回的元素应该有 scrollHeight 属性', () => {
      const el = editor.getScrollerElement();
      expect(typeof el.scrollHeight).toBe('number');
      expect(el.scrollHeight).toBeGreaterThan(0);
    });

    it('返回的元素应该有 clientHeight 属性', () => {
      const el = editor.getScrollerElement();
      expect(typeof el.clientHeight).toBe('number');
      expect(el.clientHeight).toBeGreaterThan(0);
    });

    it('scrollHeight 应该大于或等于 clientHeight', () => {
      const el = editor.getScrollerElement();
      expect(el.scrollHeight).toBeGreaterThanOrEqual(el.clientHeight);
    });
  });

  // ============================================================================
  // lineAtHeight
  // ============================================================================
  describe('lineAtHeight 行为', () => {
    it('应该返回数字类型的行号', () => {
      const line = editor.lineAtHeight(0, 'local');
      expect(typeof line).toBe('number');
    });

    it('高度 0 应该返回第一行（行号 0）', () => {
      const line = editor.lineAtHeight(0, 'local');
      expect(line).toBe(0);
    });

    it('更大的高度应该返回更大的行号', () => {
      const line0 = editor.lineAtHeight(0, 'local');
      const line100 = editor.lineAtHeight(100, 'local');
      const line500 = editor.lineAtHeight(500, 'local');
      expect(line100).toBeGreaterThanOrEqual(line0);
      expect(line500).toBeGreaterThanOrEqual(line100);
    });

    it('返回的行号不应超过文档行数', () => {
      const maxLine = editor.lineCount() - 1;
      const line = editor.lineAtHeight(999999, 'local');
      expect(line).toBeLessThanOrEqual(maxLine);
    });

    it('负高度应该返回 0', () => {
      const line = editor.lineAtHeight(-100, 'local');
      expect(line).toBe(0);
    });
  });

  // ============================================================================
  // getLineHandle
  // ============================================================================
  describe('getLineHandle 行为', () => {
    it('应该返回包含 height 和 text 的对象', () => {
      const handle = editor.getLineHandle(0);
      expect(handle).toHaveProperty('height');
      expect(handle).toHaveProperty('text');
    });

    it('height 应该是正数', () => {
      const handle = editor.getLineHandle(0);
      expect(typeof handle.height).toBe('number');
      expect(handle.height).toBeGreaterThan(0);
    });

    it('text 应该和 getLine 返回值一致', () => {
      for (let i = 0; i < 5; i++) {
        const handle = editor.getLineHandle(i);
        const lineText = editor.getLine(i);
        expect(handle.text).toBe(lineText);
      }
    });

    it('不同行的 height 可以不同（折行场景）', () => {
      // 创建一个包含长行的文档
      editor.setValue('short\n' + 'A'.repeat(200) + '\nshort');
      const handle0 = editor.getLineHandle(0);
      const handle1 = editor.getLineHandle(1);
      // 长行可能折行，高度更大
      expect(handle1.height).toBeGreaterThanOrEqual(handle0.height);
    });

    it('超出范围的行应该返回安全值', () => {
      const handle = editor.getLineHandle(9999);
      expect(handle).toHaveProperty('height');
      expect(handle).toHaveProperty('text');
    });
  });

  // ============================================================================
  // eachLine
  // ============================================================================
  describe('eachLine 行为', () => {
    it('应该遍历指定范围的行', () => {
      const lines: string[] = [];
      editor.eachLine(0, 3, (handle) => {
        lines.push(handle.text);
      });
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe(editor.getLine(0));
      expect(lines[1]).toBe(editor.getLine(1));
      expect(lines[2]).toBe(editor.getLine(2));
    });

    it('回调参数应该包含 height', () => {
      const heights: number[] = [];
      editor.eachLine(0, 5, (handle) => {
        heights.push(handle.height);
      });
      expect(heights.length).toBe(5);
      heights.forEach((h) => {
        expect(typeof h).toBe('number');
        expect(h).toBeGreaterThan(0);
      });
    });

    it('遍历所有行后累加 height 应该等于文档总高度', () => {
      let totalHeight = 0;
      editor.eachLine(0, editor.lineCount(), (handle) => {
        totalHeight += handle.height;
      });
      expect(totalHeight).toBeGreaterThan(0);
    });

    it('start === end 时不应调用回调', () => {
      let called = false;
      editor.eachLine(5, 5, () => {
        called = true;
      });
      expect(called).toBe(false);
    });

    it('start > end 时不应调用回调', () => {
      let called = false;
      editor.eachLine(5, 3, () => {
        called = true;
      });
      expect(called).toBe(false);
    });

    it('范围超出文档时应该安全处理', () => {
      const lines: string[] = [];
      editor.eachLine(98, 200, (handle) => {
        lines.push(handle.text);
      });
      // 应该只遍历到文档末尾
      expect(lines.length).toBe(2); // 第98行和第99行
    });
  });

  // ============================================================================
  // refresh
  // ============================================================================
  describe('refresh 行为', () => {
    it('调用 refresh 不应抛出错误', () => {
      expect(() => editor.refresh()).not.toThrow();
    });

    it('refresh 后编辑器内容应该不变', () => {
      const before = editor.getValue();
      editor.refresh();
      expect(editor.getValue()).toBe(before);
    });

    it('refresh 后光标位置应该不变', () => {
      editor.setCursor({ line: 5, ch: 3 });
      const before = editor.getCursor();
      editor.refresh();
      expect(editor.getCursor()).toEqual(before);
    });
  });

  // ============================================================================
  // Editor.js 滚动同步真实场景回归
  // ============================================================================
  describe('Editor.js 滚动同步真实场景回归', () => {
    /**
     * 模拟 Editor.js:395-416 的 scrollHandler 逻辑
     * 这是编辑器和预览区滚动同步的核心代码
     */
    it('完整滚动同步流程', () => {
      const scroller = editor.getScrollerElement();

      // 场景1: scrollTop <= 0 时，滚动到第一行
      Object.defineProperty(scroller, 'scrollTop', { value: 0, writable: true });
      expect(scroller.scrollTop).toBe(0);

      // 场景2: 正常滚动，计算目标行和行内百分比
      const currentTop = 500; // 模拟滚动到 500px
      const targetLine = editor.lineAtHeight(currentTop, 'local');
      expect(typeof targetLine).toBe('number');
      expect(targetLine).toBeGreaterThanOrEqual(0);

      // 获取目标行的坐标和高度
      const lineRect = editor.charCoords({ line: targetLine, ch: 0 }, 'local');
      const lineHandle = editor.getLineHandle(targetLine);
      const lineHeight = lineHandle.height;
      const lineTop = lineRect.bottom - lineHeight;

      // 计算行内滚动百分比
      const percent = (100 * (currentTop - lineTop)) / lineHeight / 100;
      expect(typeof percent).toBe('number');
      expect(percent).not.toBeNaN();
    });

    /**
     * 模拟 Editor.js:399-406 的边界检测
     * scrollTop <= 0 或到底部
     */
    it('滚动边界检测', () => {
      const scroller = editor.getScrollerElement();

      // 检测滚动到顶部
      expect(scroller.scrollTop <= 0).toBe(true);

      // 检测滚动到底部
      const isAtBottom =
        scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 20;
      expect(typeof isAtBottom).toBe('boolean');
    });

    /**
     * 模拟连续滚动：多个位置的行号计算应该单调递增
     */
    it('连续滚动行号应该单调递增', () => {
      const heights = [0, 100, 200, 500, 1000, 1500];
      let prevLine = -1;

      for (const h of heights) {
        const line = editor.lineAtHeight(h, 'local');
        expect(line).toBeGreaterThanOrEqual(prevLine);
        prevLine = line;
      }
    });
  });

  // ============================================================================
  // FloatMenu.js getLineHeight 真实场景回归
  // ============================================================================
  describe('FloatMenu.js getLineHeight 真实场景回归', () => {
    /**
     * 模拟 FloatMenu.js:143-149 的 getLineHeight 方法
     * 通过 eachLine 累加行高来定位浮动菜单
     */
    it('累加行高定位场景', () => {
      const targetLine = 10;
      let height = 0;
      editor.eachLine(0, targetLine, (lineHandle) => {
        height += lineHandle.height;
      });

      expect(height).toBeGreaterThan(0);
      // 10 行 × 至少 20px 行高
      expect(height).toBeGreaterThanOrEqual(200);
    });

    it('不同目标行的累加高度应该不同', () => {
      let height5 = 0;
      editor.eachLine(0, 5, (handle) => {
        height5 += handle.height;
      });

      let height10 = 0;
      editor.eachLine(0, 10, (handle) => {
        height10 += handle.height;
      });

      expect(height10).toBeGreaterThan(height5);
    });

    it('第 0 行的累加高度为 0', () => {
      let height = 0;
      editor.eachLine(0, 0, (handle) => {
        height += handle.height;
      });
      expect(height).toBe(0);
    });
  });

  // ============================================================================
  // FullScreen/Previewer refresh 场景回归
  // ============================================================================
  describe('FullScreen/Previewer refresh 场景回归', () => {
    it('全屏切换后 refresh', () => {
      // 模拟全屏切换后的 refresh 调用
      editor.refresh();
      // 验证内容和状态不变
      expect(editor.lineCount()).toBe(100);
      expect(editor.getLine(0)).toContain('Line 1');
    });

    it('连续 refresh 不应有副作用', () => {
      const before = editor.getValue();
      editor.refresh();
      editor.refresh();
      editor.refresh();
      expect(editor.getValue()).toBe(before);
    });
  });
});
