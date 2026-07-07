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

let jsdomPolyfilled = false;

/**
 * 注入 jsdom 环境缺失的浏览器 API。
 * 幂等操作：多次调用不会重复注入。
 *
 * 原因：
 * CM6 的 EditorView 在创建时执行 measureTextSize()，
 * 该方法依赖 Range.getClientRects() 和 getBoundingClientRect()，
 * 但 jsdom 默认未实现这些 API。
 */
/**
 * 创建空 DOMRect，兼容 jsdom 未实现 DOMRect 构造器的场景
 */
function createEmptyDOMRect(): DOMRect {
  if (typeof DOMRect !== 'undefined') {
    return new DOMRect();
  }
  const rect: DOMRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
  };
  return rect;
}

/**
 * 创建空 DOMRectList，兼容 jsdom 未实现 getClientRects 的场景
 */
function createEmptyDOMRectList(): DOMRectList {
  const list: DOMRectList = {
    length: 0,
    item: () => null,
    *[Symbol.iterator]() {},
  };
  return list;
}

function injectJsdomPolyfills(): void {
  if (jsdomPolyfilled) return;
  jsdomPolyfilled = true;

  // Range.getClientRects / getBoundingClientRect — CM6 DocView.measureTextSize 需要
  if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function (): DOMRectList {
      return createEmptyDOMRectList();
    };

    Range.prototype.getBoundingClientRect = function (): DOMRect {
      return createEmptyDOMRect();
    };
  }

  // requestAnimationFrame — 确保 jsdom 中存在
  if (typeof requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb: (time: number) => void) => window.setTimeout(cb, 16);
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
