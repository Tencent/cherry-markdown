/**
 * CodeMirror 5 适配器
 *
 * 将真实的 CodeMirror 5 实例包装成 IEditorAdapterExtended 接口
 * 用于运行行为测试，验证 Mock 行为与真实行为一致
 *
 * @vitest-environment jsdom
 */
import CodeMirror, { type CoordsMode, type EditorFromTextArea } from 'codemirror';

// 类型定义（与 editor-adapter-extended.spec.ts 保持一致）
export interface Position {
  line: number;
  ch: number;
}

export interface SelectionRange {
  anchor: Position;
  head: Position;
}

export interface SearchResult {
  from: Position;
  to: Position;
  text: string;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

export interface ScrollInfo {
  top: number;
  left: number;
  width: number;
  height: number;
  clientWidth: number;
  clientHeight: number;
}

export type EditorEventType = 'change' | 'changes' | 'cursorActivity' | 'focus' | 'blur' | 'scroll' | 'update';

export type EditorEventHandler = (instance: any, ...args: any[]) => void;

export interface ISearchCursor {
  findNext(): boolean;
  findPrevious(): boolean;
  from(): Position | null;
  to(): Position | null;
  atOccurrence(): boolean;
  replace(text: string, origin?: string): void;
  pos: { from: Position; to: Position };
}

export interface ITextMarker {
  clear(): void;
  find(): Position | { from: Position; to: Position } | undefined;
  changed(): void;
}

export interface MarkTextOptions {
  className?: string;
  title?: string;
  atomic?: boolean;
  collapsed?: boolean;
  inclusiveLeft?: boolean;
  inclusiveRight?: boolean;
  clearOnEnter?: boolean;
  clearWhenEmpty?: boolean;
  replacedWith?: HTMLElement;
  handleMouseEvents?: boolean;
  readOnly?: boolean;
  addToHistory?: boolean;
  startStyle?: string;
  endStyle?: string;
  css?: string;
  attributes?: Record<string, string>;
}

export interface IEditorAdapterExtended {
  // 内容操作
  getValue(): string;
  setValue(content: string): void;
  getValueInRange(from: Position, to: Position): string;
  getLine(line: number): string;
  lineCount(): number;
  getRange(from: Position, to: Position): string;
  replaceRange(text: string, from: Position, to?: Position, origin?: string): void;

  // 光标操作
  getCursor(pos?: 'start' | 'end' | 'head' | 'anchor'): Position;
  setCursor(pos: Position | number, ch?: number, options?: { bias?: number; origin?: string; scroll?: boolean }): void;

  // 选区操作
  getSelection(): string;
  setSelection(anchor: Position, head?: Position, options?: { bias?: number; origin?: string; scroll?: boolean }): void;
  getSelections(): string[];
  setSelections(ranges: SelectionRange[], primary?: number): void;
  listSelections(): SelectionRange[];
  somethingSelected(): boolean;

  // 事件系统
  on(eventName: EditorEventType, handler: EditorEventHandler): void;
  off(eventName: EditorEventType, handler: EditorEventHandler): void;
  trigger(eventName: string, ...args: any[]): void;

  // 历史操作
  undo(): void;
  redo(): void;
  historySize(): HistoryState;
  clearHistory(): void;

  // 搜索功能
  getSearchCursor(query: string | RegExp, start?: Position): ISearchCursor;

  // 滚动与视口
  getScrollInfo(): ScrollInfo;
  scrollTo(x?: number, y?: number): void;
  scrollIntoView(
    pos?: Position | { line: number; ch: number } | null,
    options?: { margin?: number; top?: number; bottom?: number },
  ): void;

  // 光标坐标（用于视觉定位）
  charCoords(pos: Position, mode?: CoordsMode): { left: number; top: number; bottom: number };
  cursorCoords(where?: 'start' | 'end' | null, mode?: CoordsMode): { left: number; top: number; bottom: number };
  coordsChar(coords: { left: number; top: number }, mode?: CoordsMode): Position;

  // 文本标记
  markText(from: Position, to: Position, options?: MarkTextOptions): ITextMarker;
  getDoc(): IEditorAdapterExtended;

  // 编辑器状态
  focus(): void;
  blur(): void;
  hasFocus(): boolean;

  // 其他
  execCommand(name: string): void;
  somethingSelected(): boolean;
}

/**
 * 创建 CodeMirror 5 适配器
 */
export function createCM5Adapter(cm: CodeMirror.Editor | EditorFromTextArea): IEditorAdapterExtended {
  const doc = cm.getDoc();

  const adapter = {
    // 内容操作
    getValue: () => doc.getValue(),
    setValue: (content: string) => doc.setValue(content),
    getValueInRange: (from: Position, to: Position) => doc.getRange(from, to),
    getLine: (line: number) => doc.getLine(line),
    lineCount: () => doc.lineCount(),
    getRange: (from: Position, to: Position) => doc.getRange(from, to),
    replaceRange: (text: string, from: Position, to?: Position, origin?: string) => {
      if (to) {
        doc.replaceRange(text, from, to, origin);
      } else {
        doc.replaceRange(text, from, undefined, origin);
      }
    },

    // 光标操作
    getCursor: (pos?: 'start' | 'end' | 'head' | 'anchor') => doc.getCursor(pos),
    setCursor: (
      pos: Position | number,
      ch?: number,
      options?: { bias?: number; origin?: string; scroll?: boolean },
    ) => {
      if (typeof pos === 'number') {
        doc.setCursor(pos, ch, options);
      } else {
        // CM5 setCursor 接受 (Pos, options) 或 (line, ch)
        doc.setCursor(pos.line, pos.ch, options);
      }
    },

    // 选区操作
    getSelection: () => doc.getSelection(),
    setSelection: (
      anchor: Position,
      head?: Position,
      options?: { bias?: number; origin?: string; scroll?: boolean },
    ) => {
      if (head) {
        doc.setSelection(anchor, head, options);
      } else {
        doc.setSelection(anchor, anchor, options);
      }
    },
    getSelections: () => doc.getSelections(),
    setSelections: (ranges: SelectionRange[], primary?: number) => doc.setSelections(ranges, primary),
    listSelections: () => doc.listSelections() as SelectionRange[],
    somethingSelected: () => doc.somethingSelected(),

    // 事件系统
    on: (eventName: EditorEventType, handler: EditorEventHandler) => {
      cm.on(eventName, handler);
    },
    off: (eventName: EditorEventType, handler: EditorEventHandler) => {
      cm.off(eventName, handler);
    },
    trigger: (eventName: string, ...args: any[]) => {
      (cm as any).signal(cm, eventName, ...args);
    },

    // 历史操作
    undo: () => doc.undo(),
    redo: () => doc.redo(),
    historySize: () => {
      const size = doc.historySize();
      return {
        canUndo: size.undo > 0,
        canRedo: size.redo > 0,
      };
    },
    clearHistory: () => doc.clearHistory(),

    // 搜索功能
    getSearchCursor: (query: string | RegExp, start?: Position): ISearchCursor => {
      // CM5 的 getSearchCursor 在 doc 上
      const cursor = doc.getSearchCursor(query, start);
      return {
        findNext: () => {
          const result = cursor.findNext();
          // CM5 正则搜索返回匹配数组或 false
          return !!result;
        },
        findPrevious: () => {
          const result = cursor.findPrevious();
          return !!result;
        },
        from: () => cursor.from() as Position | null,
        to: () => cursor.to() as Position | null,
        replace: (text: string, origin?: string) => cursor.replace(text, origin),
        get pos() {
          return { from: cursor.from(), to: cursor.to() };
        },
      } as ISearchCursor;
    },

    // 滚动与视口
    getScrollInfo: () => cm.getScrollInfo() as ScrollInfo,
    scrollTo: (x?: number, y?: number) => cm.scrollTo(x, y),
    scrollIntoView: (
      pos?: Position | { line: number; ch: number } | null,
      options?: { margin?: number; top?: number; bottom?: number },
    ) => {
      if (pos) {
        // CM5 scrollIntoView 接受 position 和可选的 margin
        const margin = options?.margin ?? 0;
        cm.scrollIntoView(pos, margin);
      }
    },

    // 光标坐标（用于视觉定位）
    charCoords: (pos: Position, mode?: CoordsMode) => {
      return cm.charCoords(pos, mode) as { left: number; top: number; bottom: number };
    },
    cursorCoords: (where?: 'start' | 'end' | null, mode?: CoordsMode) => {
      // CM5 cursorCoords: where 可以是 boolean (true=start of line, false=end of line) 或 null (cursor)
      // 映射: 'start' -> true, 'end' -> false, null -> undefined
      let whereBool: boolean | undefined;
      if (where === 'start') whereBool = true;
      else if (where === 'end') whereBool = false;
      else whereBool = undefined;
      return cm.cursorCoords(whereBool, mode) as { left: number; top: number; bottom: number };
    },
    coordsChar: (coords: { left: number; top: number }, mode?: CoordsMode) => {
      return cm.coordsChar(coords, mode) as Position;
    },

    // 文本标记
    markText: (from: Position, to: Position, options?: MarkTextOptions) =>
      doc.markText(from, to, options) as ITextMarker,
    getDoc: () => adapter as IEditorAdapterExtended,

    // 编辑器状态
    focus: () => cm.focus(),
    blur: () => {
      // CM5 可以通过 getInputField 获取输入元素
      const input = (cm as CodeMirror.Editor).getInputField?.();
      if (input) input.blur();
    },
    hasFocus: () => cm.hasFocus(),

    // 其他
    execCommand: (name: string) => cm.execCommand(name),

    // 销毁方法（重要：防止内存泄露）
    destroy: () => {
      try {
        // CM5 从 textarea 创建的编辑器有 toTextArea 方法
        if ('toTextArea' in cm) {
          (cm as EditorFromTextArea).toTextArea();
        }
      } catch (e) {
        // 忽略销毁时的错误
      }
    },
  };

  return adapter as IEditorAdapterExtended;
}

/**
 * 初始化真实的 CodeMirror 5 编辑器
 */
export async function initRealCM5(
  container: HTMLElement,
  options: Record<string, any> = {},
): Promise<IEditorAdapterExtended | null> {
  try {
    // 动态导入 CodeMirror 和必要的 addon
    const CodeMirror = (await import('codemirror')).default;

    // 导入搜索 addon (CM5 的搜索功能需要)
    await import('codemirror/addon/search/searchcursor.js');
    await import('codemirror/addon/search/search.js');
    await import('codemirror/addon/search/jump-to-line.js');

    const cm = CodeMirror(container, {
      value: '',
      mode: 'markdown',
      lineNumbers: true,
      lineWrapping: true,
      ...options,
    });
    return createCM5Adapter(cm);
  } catch (error) {
    console.warn('CodeMirror 5 not available:', error);
    return null;
  }
}
