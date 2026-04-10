/**
 * CodeMirror 6 测试辅助工具
 *
 * 在 jsdom 环境中创建真实的 EditorView 实例。
 * 封装了 jsdom 缺失的浏览器 API polyfill，
 * 使任何需要真实 CM6 实例的测试文件只需调用 createCm6View() 即可。
 *
 * 使用方式：
 *   import { createCm6View } from '@/test/helpers/cM6View';
 *   const view = createCm6View('hello', 0);
 */

import { EditorView } from '@codemirror/view';
import { EditorState, EditorSelection } from '@codemirror/state';
import { closeBrackets } from '@codemirror/autocomplete';
import { bracketMatching } from '@codemirror/language';
import { search } from '@codemirror/search';

// ============ jsdom Polyfill（仅在此模块内生效）============

let _polyfilled = false;

/**
 * 注入 jsdom 环境缺失的浏览器 API。
 * 幂等操作：多次调用不会重复注入。
 *
 * 原因：
 * CM6 的 EditorView 在创建时执行 measureTextSize()，
 * 该方法依赖 Range.getClientRects() 和 getBoundingClientRect()，
 * 但 jsdom 默认未实现这些 API。
 */
function injectJsdomPolyfills(): void {
  if (_polyfilled) return;
  _polyfilled = true;

  // Range.getClientRects / getBoundingClientRect — CM6 DocView.measureTextSize 需要
  if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function (): DOMRectList {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = { length: 0, item: () => null } as unknown as DOMRectList;
      return list;
    };

    Range.prototype.getBoundingClientRect = function (): DOMRect {
      return new (DOMRect || function () {})();
    };
  }

  // requestAnimationFrame — 确保 jsdom 中存在
  if (typeof requestAnimationFrame === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).requestAnimationFrame = (cb: (time: number) => void) => setTimeout(cb, 16);
  }
}

// ============ Public API ============

/**
 * 创建一个带有指定内容和光标位置的真实 CM6 EditorView 实例。
 *
 * 内部自动完成：
 * 1. 注入 jsdom polyfill（幂等）
 * 2. 启用多选区支持
 * 3. 加载必要的 CM6 扩展
 *
 * @param doc 初始文档内容
 * @param anchor 选区起点（默认 0）
 * @param head 选区终点（默认等于 anchor）
 * @returns EditorView 实例（使用完毕后应调用 view.destroy()）
 */
export function createCm6View(doc: string, anchor = 0, head = anchor): EditorView {
  injectJsdomPolyfills();

  return new EditorView({
    state: EditorState.create({
      doc,
      selection: EditorSelection.single(anchor, head),
      extensions: [
        closeBrackets(),
        bracketMatching(),
        search(),
        // 允许多光标/多选区（Sublime 风格快捷键需要）
        EditorState.allowMultipleSelections.of(true),
      ],
    }),
  });
}

/**
 * 获取 EditorView 当前文档内容
 */
export function getDoc(view: EditorView): string {
  return view.state.doc.toString();
}

/**
 * 获取主选区的 anchor 和 head
 */
export function getSelection(view: EditorView): { anchor: number; head: number } {
  const { main } = view.state.selection;
  return { anchor: main.anchor, head: main.head };
}

/**
 * 获取所有选区
 */
export function getAllSelections(view: EditorView): Array<{ anchor: number; head: number }> {
  return view.state.selection.ranges.map((r) => ({
    anchor: r.anchor,
    head: r.head,
  }));
}
