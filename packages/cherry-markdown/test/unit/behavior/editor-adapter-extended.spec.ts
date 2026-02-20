/**
 * 编辑器适配器扩展接口和行为测试
 *
 * 这是升级 CodeMirror 6 的核心抽象层
 * 所有测试都基于行为而非具体实现
 *
 * 设计原则：
 * 1. 测试编辑器行为，不测试 CodeMirror API
 * 2. CM5/CM6 只需实现相同接口，测试代码无需修改
 * 3. 作为升级回归测试的安全网
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// 编辑器适配器扩展接口定义
// 升级 CM6 时需要实现这些接口
// ============================================================================

/**
 * 光标/选区位置
 */
export interface Position {
  line: number;
  ch: number;
}

/**
 * 选区范围
 */
export interface SelectionRange {
  anchor: Position;
  head: Position;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  from: Position;
  to: Position;
  text: string;
}

/**
 * 历史记录状态
 */
export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * 滚动信息
 */
export interface ScrollInfo {
  top: number;
  left: number;
  height: number;
  width: number;
  clientHeight: number;
  clientWidth: number;
}

/**
 * 编辑器事件类型
 */
export type EditorEventType =
  | 'change'
  | 'changes'
  | 'cursorActivity'
  | 'beforeChange'
  | 'beforeSelectionChange'
  | 'focus'
  | 'blur'
  | 'scroll'
  | 'paste'
  | 'drop';

/**
 * 编辑器事件处理器
 */
export type EditorEventHandler = (editor: IEditorAdapterExtended, event?: any) => void;

/**
 * 编辑器适配器扩展接口
 * 定义了编辑器必须提供的所有核心能力
 *
 * CM5 → CM6 映射说明：
 * - getValue/setValue → EditorState.doc / dispatch({ changes })
 * - getCursor/setCursor → EditorState.selection.main.head
 * - on/off → EditorView.updateListener / DOM events
 * - getSearchCursor → @codemirror/search SearchCursor
 * - undo/redo → @codemirror/commands history
 * - markText → Decoration.mark / Decoration.widget
 */
export interface IEditorAdapterExtended {
  // ============ 内容操作 ============
  getValue(): string;
  setValue(value: string): void;
  getLine(lineNum: number): string;
  lineCount(): number;

  // ============ 光标操作 ============
  getCursor(): Position;
  setCursor(pos: Position): void;

  // ============ 选区操作 ============
  getSelection(): string;
  getSelections(): string[];
  setSelection(anchor: Position, head?: Position): void;
  listSelections(): SelectionRange[];
  replaceSelection(text: string): void;
  replaceSelections(texts: string[]): void;
  replaceRange(text: string, from: Position, to: Position): void;

  // ============ 高级操作 ============
  findWordAt(pos: Position): SelectionRange;

  // ============ 事件系统 ============
  on(event: EditorEventType, handler: EditorEventHandler): void;
  off(event: EditorEventType, handler: EditorEventHandler): void;

  // ============ 历史操作 ============
  undo(): void;
  redo(): void;
  historySize(): HistoryState;
  clearHistory(): void;

  // ============ 搜索功能 ============
  getSearchCursor(query: string | RegExp, start?: Position): ISearchCursor;

  // ============ 文本标记 ============
  markText(from: Position, to: Position, options?: MarkTextOptions): ITextMarker;
  findMarks(from: Position, to: Position): ITextMarker[];
  getAllMarks(): ITextMarker[];

  // ============ 滚动功能 ============
  getScrollInfo(): ScrollInfo;
  scrollTo(x: number | null, y: number | null): void;
  scrollIntoView(pos: Position | null): void;

  // ============ 光标坐标（用于视觉定位）============
  charCoords(pos: Position, mode?: 'local' | 'global'): { left: number; top: number; bottom: number };
  cursorCoords(
    where?: 'start' | 'end' | null,
    mode?: 'local' | 'global',
  ): { left: number; top: number; bottom: number };
  coordsChar(coords: { left: number; top: number }): Position;

  // ============ 焦点功能 ============
  focus(): void;
  hasFocus(): boolean;

  // ============ DOM 访问 ============
  getWrapperElement(): HTMLElement;
  getInputField(): HTMLTextAreaElement | HTMLInputElement;

  // ============ 选项 ============
  setOption(key: string, value: any): void;
  getOption(key: string): any;

  // ============ 补充的内容操作方法（与 cm5-adapter 兼容）============
  getValueInRange(from: Position, to: Position): string;
  getRange(from: Position, to: Position): string;

  // ============ 补充的选区操作方法 ============
  setSelections(ranges: SelectionRange[], primary?: number): void;
  somethingSelected(): boolean;

  // ============ 补充的文档操作方法 ============
  getDoc(): IEditorAdapterExtended;

  // ============ 补充的命令执行方法 ============
  execCommand(name: string): void;

  // ============ 位置-偏移量转换（Cherry.js insert 依赖）============
  indexFromPos(pos: Position): number;
  posFromIndex(index: number): Position;

  // ============ 滚动同步（Editor.js 预览区滚动同步依赖）============
  getScrollerElement(): HTMLElement;
  lineAtHeight(height: number, mode?: 'local' | 'page' | 'window'): number;
  getLineHandle(line: number): { height: number; text: string };

  // ============ 行遍历（FloatMenu.js 依赖）============
  eachLine(start: number, end: number, callback: (lineHandle: { height: number; text: string }) => void): void;

  // ============ 刷新（全屏/预览切换依赖）============
  refresh(): void;
}

/**
 * 搜索光标接口
 */
export interface ISearchCursor {
  findNext(): boolean;
  findPrevious(): boolean;
  from(): Position | null;
  to(): Position | null;
  replace(text: string): void;
}

/**
 * 文本标记接口
 */
export interface ITextMarker {
  clear(): void;
  find(): { from: Position; to: Position } | null;
  options?: MarkTextOptions;
}

/**
 * 文本标记选项
 */
export interface MarkTextOptions {
  className?: string;
  replacedWith?: HTMLElement;
  atomic?: boolean;
  inclusiveLeft?: boolean;
  inclusiveRight?: boolean;
  title?: string;
}

// ============================================================================
// Mock 编辑器适配器扩展实现（用于单元测试）
// ============================================================================

/**
 * 创建一个扩展的 Mock 编辑器适配器
 * 完全不依赖 CodeMirror，用于行为测试
 */
export function createExtendedMockEditorAdapter(initialValue = ''): IEditorAdapterExtended {
  let content = initialValue;
  let cursor: Position = { line: 0, ch: 0 };
  let selections: SelectionRange[] = [{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } }];
  let history: string[] = [initialValue];
  let historyIndex = 0;
  const marks: Array<{ from: Position; to: Position; options?: MarkTextOptions; id: number }> = [];
  let markIdCounter = 0;
  const eventHandlers: Map<EditorEventType, Set<EditorEventHandler>> = new Map();
  let isFocused = false;

  const getLines = () => content.split('\n');

  const saveHistory = () => {
    // 裁剪未来历史
    history = history.slice(0, historyIndex + 1);
    history.push(content);
    historyIndex = history.length - 1;
  };

  const triggerEvent = (event: EditorEventType, eventData?: any) => {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(adapter, eventData));
    }
  };

  const adapter: IEditorAdapterExtended = {
    // 内容操作
    getValue: () => content,

    setValue: (value: string) => {
      const oldContent = content;
      content = value;
      cursor = { line: 0, ch: 0 };
      selections = [{ anchor: cursor, head: cursor }];
      saveHistory();
      triggerEvent('change', { oldValue: oldContent, newValue: value });
    },

    getLine: (lineNum: number) => {
      const lines = getLines();
      return lines[lineNum] || '';
    },

    lineCount: () => getLines().length,

    // 光标操作
    getCursor: () => ({ ...cursor }),

    setCursor: (pos: Position) => {
      cursor = { ...pos };
      selections = [{ anchor: pos, head: pos }];
      triggerEvent('cursorActivity');
    },

    // 选区操作
    getSelection: () => {
      const sel = selections[0];
      const lines = getLines();

      if (sel.anchor.line === sel.head.line) {
        const line = lines[sel.anchor.line] || '';
        const start = Math.min(sel.anchor.ch, sel.head.ch);
        const end = Math.max(sel.anchor.ch, sel.head.ch);
        return line.substring(start, end);
      }

      // 多行选区
      let result = '';
      const startLine = Math.min(sel.anchor.line, sel.head.line);
      const endLine = Math.max(sel.anchor.line, sel.head.line);
      const isAnchorFirst =
        sel.anchor.line < sel.head.line || (sel.anchor.line === sel.head.line && sel.anchor.ch <= sel.head.ch);
      const startCh = isAnchorFirst ? sel.anchor.ch : sel.head.ch;
      const endCh = isAnchorFirst ? sel.head.ch : sel.anchor.ch;

      for (let i = startLine; i <= endLine; i += 1) {
        if (i === startLine) {
          result += lines[i].substring(startCh);
        } else if (i === endLine) {
          result += `\n${lines[i].substring(0, endCh)}`;
        } else {
          result += `\n${lines[i]}`;
        }
      }
      return result;
    },

    getSelections: () => {
      return selections.map((sel) => {
        const lines = getLines();
        if (sel.anchor.line === sel.head.line) {
          const line = lines[sel.anchor.line] || '';
          const start = Math.min(sel.anchor.ch, sel.head.ch);
          const end = Math.max(sel.anchor.ch, sel.head.ch);
          return line.substring(start, end);
        }
        return '';
      });
    },

    setSelection: (anchor: Position, head?: Position) => {
      const actualHead = head || anchor;
      selections = [{ anchor: { ...anchor }, head: { ...actualHead } }];
      cursor = { ...actualHead };
      triggerEvent('beforeSelectionChange');
      triggerEvent('cursorActivity');
    },

    listSelections: () => selections.map((s) => ({ anchor: { ...s.anchor }, head: { ...s.head } })),

    replaceSelection: (text: string) => {
      const oldContent = content;
      const sel = selections[0];
      const lines = getLines();
      const startLine = Math.min(sel.anchor.line, sel.head.line);
      const endLine = Math.max(sel.anchor.line, sel.head.line);
      const isAnchorFirst =
        sel.anchor.line < sel.head.line || (sel.anchor.line === sel.head.line && sel.anchor.ch <= sel.head.ch);
      const startCh = isAnchorFirst ? sel.anchor.ch : sel.head.ch;
      const endCh = isAnchorFirst ? sel.head.ch : sel.anchor.ch;

      if (startLine === endLine) {
        const line = lines[startLine];
        lines[startLine] = line.substring(0, startCh) + text + line.substring(endCh);
        content = lines.join('\n');
        const newCh = startCh + text.length;
        cursor = { line: startLine, ch: newCh };
        selections = [{ anchor: cursor, head: cursor }];
      } else {
        const startLineText = lines[startLine].substring(0, startCh);
        const endLineText = lines[endLine].substring(endCh);
        const newLines = text.split('\n');
        newLines[0] = startLineText + newLines[0];
        newLines[newLines.length - 1] = newLines[newLines.length - 1] + endLineText;
        lines.splice(startLine, endLine - startLine + 1, ...newLines);
        content = lines.join('\n');
        const newCh = startCh + text.length;
        cursor = { line: startLine, ch: newCh };
        selections = [{ anchor: cursor, head: cursor }];
      }
      saveHistory();
      triggerEvent('change', { oldValue: oldContent, newValue: content });
    },

    replaceSelections: (texts: string[]) => {
      if (texts.length > 0) {
        const sel = selections[0];
        const lines = getLines();
        const startLine = Math.min(sel.anchor.line, sel.head.line);
        const start = Math.min(sel.anchor.ch, sel.head.ch);
        const end = Math.max(sel.anchor.ch, sel.head.ch);

        const line = lines[startLine];
        lines[startLine] = line.substring(0, start) + texts[0] + line.substring(end);
        content = lines.join('\n');
        saveHistory();
      }
    },

    replaceRange: (text: string, from: Position, to: Position) => {
      const lines = getLines();
      if (from.line === to.line) {
        const line = lines[from.line] || '';
        lines[from.line] = line.substring(0, from.ch) + text + line.substring(to.ch);
      } else {
        const startLineText = (lines[from.line] || '').substring(0, from.ch);
        const endLineText = (lines[to.line] || '').substring(to.ch);
        const newLines = text.split('\n');
        newLines[0] = startLineText + newLines[0];
        newLines[newLines.length - 1] = newLines[newLines.length - 1] + endLineText;
        lines.splice(from.line, to.line - from.line + 1, ...newLines);
      }
      content = lines.join('\n');
      saveHistory();
      triggerEvent('change');
    },

    findWordAt: (pos: Position) => {
      const line = getLines()[pos.line] || '';
      let start = pos.ch;
      let end = pos.ch;

      while (start > 0 && /\w/.test(line[start - 1])) {
        start -= 1;
      }
      while (end < line.length && /\w/.test(line[end])) {
        end += 1;
      }

      return {
        anchor: { line: pos.line, ch: start },
        head: { line: pos.line, ch: end },
      };
    },

    // 事件系统
    on: (event: EditorEventType, handler: EditorEventHandler) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
      }
      eventHandlers.get(event)!.add(handler);
    },

    off: (event: EditorEventType, handler: EditorEventHandler) => {
      eventHandlers.get(event)?.delete(handler);
    },

    // 历史操作
    undo: () => {
      if (historyIndex > 0) {
        historyIndex -= 1;
        content = history[historyIndex];
        triggerEvent('change');
      }
    },

    redo: () => {
      if (historyIndex < history.length - 1) {
        historyIndex += 1;
        content = history[historyIndex];
        triggerEvent('change');
      }
    },

    historySize: () => ({
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
    }),

    clearHistory: () => {
      history = [content];
      historyIndex = 0;
    },

    // 搜索功能
    getSearchCursor: (query: string | RegExp, start?: Position): ISearchCursor => {
      const startPos = start || { line: 0, ch: 0 };
      // 确保正则有全局标志
      const regex =
        typeof query === 'string'
          ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
          : new RegExp(query.source, query.flags.includes('g') ? query.flags : `${query.flags}g`);
      let currentMatch: RegExpExecArray | null = null;
      const searchContent = content;

      const posToIndex = (pos: Position): number => {
        const lines = getLines();
        let index = 0;
        for (let i = 0; i < pos.line && i < lines.length; i += 1) {
          index += lines[i].length + 1; // +1 for newline
        }
        return index + pos.ch;
      };

      const indexToPos = (index: number): Position => {
        const lines = getLines();
        let remaining = index;
        for (let i = 0; i < lines.length; i += 1) {
          if (remaining <= lines[i].length) {
            return { line: i, ch: remaining };
          }
          remaining -= lines[i].length + 1;
        }
        return { line: lines.length - 1, ch: lines[lines.length - 1]?.length || 0 };
      };

      // 初始化搜索位置
      const startIndex = posToIndex(startPos);
      regex.lastIndex = startIndex;

      return {
        findNext: () => {
          // 防止无限循环：如果 lastIndex 没有移动，强制前进
          const prevLastIndex = regex.lastIndex;
          currentMatch = regex.exec(searchContent);

          if (currentMatch) {
            // 如果匹配了空字符串，手动前进 lastIndex
            if (currentMatch[0].length === 0) {
              regex.lastIndex = prevLastIndex + 1;
            }
            return true;
          }
          return false;
        },

        findPrevious: () => {
          // 简化实现：从开头重新搜索所有匹配
          const allMatches: Array<{ index: number; text: string }> = [];
          const tempRegex = new RegExp(regex.source, regex.flags);
          tempRegex.lastIndex = 0;

          let match;
          let safety = 0;
          while ((match = tempRegex.exec(searchContent)) !== null && safety < 10000) {
            allMatches.push({
              index: match.index,
              text: match[0],
            });
            // 防止空匹配导致的无限循环
            if (match[0].length === 0) {
              tempRegex.lastIndex += 1;
            }
            safety += 1;
          }

          const currentPosIndex = currentMatch ? currentMatch.index : startIndex;
          for (let i = allMatches.length - 1; i >= 0; i -= 1) {
            if (allMatches[i].index < currentPosIndex) {
              currentMatch = { index: allMatches[i].index, 0: allMatches[i].text } as unknown as RegExpExecArray;
              return true;
            }
          }
          return false;
        },

        from: () => (currentMatch ? indexToPos(currentMatch.index) : null),

        to: () => (currentMatch ? indexToPos(currentMatch.index + currentMatch[0].length) : null),

        replace: (text: string) => {
          if (currentMatch) {
            const from = indexToPos(currentMatch.index);
            const to = indexToPos(currentMatch.index + currentMatch[0].length);
            adapter.replaceRange(text, from, to);
          }
        },
      };
    },

    // 文本标记
    markText: (from: Position, to: Position, options?: MarkTextOptions): ITextMarker => {
      const id = markIdCounter;
      markIdCounter += 1;
      const mark = { from, to, options, id };
      marks.push(mark);

      return {
        clear: () => {
          const index = marks.findIndex((m) => m.id === id);
          if (index !== -1) {
            marks.splice(index, 1);
          }
        },
        find: () => {
          const m = marks.find((m) => m.id === id);
          return m ? { from: m.from, to: m.to } : null;
        },
        options,
      };
    },

    findMarks: (from: Position, to: Position): ITextMarker[] => {
      return marks
        .filter((m) => {
          return (
            (m.from.line > from.line || (m.from.line === from.line && m.from.ch >= from.ch)) &&
            (m.to.line < to.line || (m.to.line === to.line && m.to.ch <= to.ch))
          );
        })
        .map((m) => ({
          clear: () => {
            const index = marks.findIndex((mark) => mark.id === m.id);
            if (index !== -1) marks.splice(index, 1);
          },
          find: () => ({ from: m.from, to: m.to }),
          options: m.options,
        }));
    },

    getAllMarks: (): ITextMarker[] => {
      return marks.map((m) => ({
        clear: () => {
          const index = marks.findIndex((mark) => mark.id === m.id);
          if (index !== -1) marks.splice(index, 1);
        },
        find: () => ({ from: m.from, to: m.to }),
        options: m.options,
      }));
    },

    // 滚动功能
    getScrollInfo: (): ScrollInfo => ({
      top: 0,
      left: 0,
      height: 500,
      width: 800,
      clientHeight: 400,
      clientWidth: 700,
    }),

    scrollTo: (x: number | null, y: number | null) => {
      // Mock implementation
    },

    scrollIntoView: (pos: Position | null) => {
      // Mock implementation
    },

    // 光标坐标（用于视觉定位）
    charCoords: (pos: Position, mode?: 'local' | 'global'): { left: number; top: number; bottom: number } => {
      // Mock 实现：基于字符位置计算简单坐标
      const lineHeight = 20;
      const charWidth = 8;
      return {
        left: pos.ch * charWidth,
        top: pos.line * lineHeight,
        bottom: pos.line * lineHeight + lineHeight,
      };
    },

    cursorCoords: (
      where?: 'start' | 'end' | null,
      mode?: 'local' | 'global',
    ): { left: number; top: number; bottom: number } => {
      // Mock 实现：返回当前光标位置坐标
      const lineHeight = 20;
      const charWidth = 8;
      let pos: Position | undefined;
      if (where === 'start') pos = selections[0]?.anchor;
      else if (where === 'end') pos = selections[0]?.head;
      else pos = cursor;
      return {
        left: (pos?.ch || 0) * charWidth,
        top: (pos?.line || 0) * lineHeight,
        bottom: (pos?.line || 0) * lineHeight + lineHeight,
      };
    },

    coordsChar: (coords: { left: number; top: number }): Position => {
      // Mock 实现：将屏幕坐标转换为文档位置
      const lineHeight = 20;
      const charWidth = 8;
      return {
        line: Math.floor(coords.top / lineHeight),
        ch: Math.floor(coords.left / charWidth),
      };
    },

    // 焦点功能
    focus: () => {
      isFocused = true;
      triggerEvent('focus');
    },

    hasFocus: () => isFocused,

    // DOM 访问
    getWrapperElement: (): HTMLElement => {
      const el = document.createElement('div');
      el.className = 'mock-editor-wrapper';
      return el;
    },

    getInputField: (): HTMLTextAreaElement => {
      const el = document.createElement('textarea');
      el.className = 'mock-editor-input';
      return el;
    },

    // 选项
    setOption: (key: string, value: any) => {
      // Mock implementation
    },

    getOption: (key: string): any => {
      return null;
    },

    // 内容操作 - 补充缺失的方法
    getValueInRange: (from: Position, to: Position): string => {
      const lines = getLines();
      if (from.line === to.line) {
        return lines[from.line]?.substring(from.ch, to.ch) || '';
      }
      // 多行范围
      let result = lines[from.line]?.substring(from.ch) || '';
      for (let i = from.line + 1; i < to.line; i += 1) {
        result += `\n${lines[i] || ''}`;
      }
      result += `\n${lines[to.line]?.substring(0, to.ch) || ''}`;
      return result;
    },

    getRange: (from: Position, to: Position): string => {
      return adapter.getValueInRange(from, to);
    },

    // 选区操作 - 补充缺失的方法
    setSelections: (ranges: SelectionRange[], primary = 0): void => {
      selections = ranges.map((r) => ({ anchor: r.anchor, head: r.head }));
      if (ranges[primary]) {
        cursor = { ...ranges[primary].head };
      }
      triggerEvent('cursorActivity');
    },

    somethingSelected: (): boolean => {
      const sel = selections[0];
      return sel && (sel.anchor.line !== sel.head.line || sel.anchor.ch !== sel.head.ch);
    },

    // 文本标记 - 补充缺失的方法
    getDoc: (): IEditorAdapterExtended => {
      return adapter;
    },

    // 其他 - 补充缺失的方法
    execCommand: (name: string): void => {
      switch (name) {
        case 'selectAll':
          selections = [
            {
              anchor: { line: 0, ch: 0 },
              head: { line: getLines().length - 1, ch: getLines()[getLines().length - 1]?.length || 0 },
            },
          ];
          break;
        case 'undo':
          adapter.undo();
          break;
        case 'redo':
          adapter.redo();
          break;
        default:
          // 未知命令，静默忽略
          break;
      }
    },

    // 位置-偏移量转换
    indexFromPos: (pos: Position): number => {
      const lines = getLines();
      let index = 0;
      for (let i = 0; i < pos.line && i < lines.length; i += 1) {
        index += lines[i].length + 1; // +1 for newline
      }
      return index + pos.ch;
    },

    posFromIndex: (index: number): Position => {
      const lines = getLines();
      let remaining = index;
      for (let i = 0; i < lines.length; i += 1) {
        if (remaining <= lines[i].length) {
          return { line: i, ch: remaining };
        }
        remaining -= lines[i].length + 1;
      }
      return { line: lines.length - 1, ch: lines[lines.length - 1]?.length || 0 };
    },

    // 滚动同步
    getScrollerElement: (): HTMLElement => {
      const el = document.createElement('div');
      el.className = 'mock-scroller';
      // 模拟真实的滚动属性
      Object.defineProperties(el, {
        scrollTop: { value: 0, writable: true },
        scrollHeight: { value: getLines().length * 20 },
        clientHeight: { value: 400 },
      });
      return el;
    },

    lineAtHeight: (height: number, _mode?: string): number => {
      const lineHeight = 20;
      const line = Math.floor(height / lineHeight);
      return Math.max(0, Math.min(line, getLines().length - 1));
    },

    getLineHandle: (line: number): { height: number; text: string } => {
      const lines = getLines();
      const text = lines[line] || '';
      // 模拟行高：默认 20px，长行自动折行会更高
      const charPerLine = 80;
      const wrappedLines = Math.max(1, Math.ceil(text.length / charPerLine));
      return { height: wrappedLines * 20, text };
    },

    // 行遍历
    eachLine: (start: number, end: number, callback: (lineHandle: { height: number; text: string }) => void): void => {
      const lines = getLines();
      const safeStart = Math.max(0, start);
      const safeEnd = Math.min(end, lines.length);
      for (let i = safeStart; i < safeEnd; i += 1) {
        const text = lines[i] || '';
        const charPerLine = 80;
        const wrappedLines = Math.max(1, Math.ceil(text.length / charPerLine));
        callback({ height: wrappedLines * 20, text });
      }
    },

    // 刷新
    refresh: (): void => {
      // Mock: CM6 不需要手动刷新，此方法为空操作
    },
  };

  return adapter;
}

// ============================================================================
// 测试用例 - 验证扩展适配器行为
// 这些测试在升级 CM6 后必须全部通过
// ============================================================================

describe('编辑器适配器扩展行为测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Hello World\nSecond Line\nThird Line');
  });

  // ============ 基础内容操作测试 ============
  describe('内容操作', () => {
    it('getValue 应该返回完整内容', () => {
      expect(editor.getValue()).toBe('Hello World\nSecond Line\nThird Line');
    });

    it('setValue 应该替换全部内容并触发 change 事件', () => {
      const changeHandler = vi.fn();
      editor.on('change', changeHandler);

      editor.setValue('New Content');

      expect(editor.getValue()).toBe('New Content');
      expect(changeHandler).toHaveBeenCalled();
    });

    it('getLine 应该返回指定行', () => {
      expect(editor.getLine(0)).toBe('Hello World');
      expect(editor.getLine(1)).toBe('Second Line');
      expect(editor.getLine(2)).toBe('Third Line');
    });

    it('lineCount 应该返回行数', () => {
      expect(editor.lineCount()).toBe(3);
    });
  });

  // ============ 光标操作测试 ============
  describe('光标操作', () => {
    it('getCursor 应该返回当前光标位置', () => {
      expect(editor.getCursor()).toEqual({ line: 0, ch: 0 });
    });

    it('setCursor 应该设置光标位置并触发 cursorActivity 事件', () => {
      const handler = vi.fn();
      editor.on('cursorActivity', handler);

      editor.setCursor({ line: 1, ch: 5 });

      expect(editor.getCursor()).toEqual({ line: 1, ch: 5 });
      expect(handler).toHaveBeenCalled();
    });
  });

  // ============ 选区操作测试 ============
  describe('选区操作', () => {
    it('setSelection 应该设置选区', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getSelection()).toBe('Hello');
    });

    it('getSelections 应该返回所有选区内容', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getSelections()).toEqual(['Hello']);
    });

    it('listSelections 应该返回选区范围', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      const sels = editor.listSelections();
      expect(sels[0].anchor).toEqual({ line: 0, ch: 0 });
      expect(sels[0].head).toEqual({ line: 0, ch: 5 });
    });
  });

  // ============ 事件系统测试 ============
  describe('事件系统', () => {
    it('on 应该注册事件处理器', () => {
      const handler = vi.fn();
      editor.on('change', handler);

      editor.setValue('new content');

      expect(handler).toHaveBeenCalled();
    });

    it('off 应该移除事件处理器', () => {
      const handler = vi.fn();
      editor.on('change', handler);
      editor.off('change', handler);

      editor.setValue('new content');

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该支持多个事件处理器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      editor.on('change', handler1);
      editor.on('change', handler2);

      editor.setValue('new content');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  // ============ 历史操作测试 ============
  describe('历史操作', () => {
    it('undo 应该撤销最近的更改', () => {
      editor.setValue('first');
      editor.setValue('second');
      editor.setValue('third');

      editor.undo();
      expect(editor.getValue()).toBe('second');

      editor.undo();
      expect(editor.getValue()).toBe('first');
    });

    it('redo 应该重做撤销的更改', () => {
      editor.setValue('first');
      editor.setValue('second');
      editor.undo();

      editor.redo();
      expect(editor.getValue()).toBe('second');
    });

    it('historySize 应该返回正确的撤销/重做状态', () => {
      editor.setValue('first');
      editor.setValue('second');

      const size = editor.historySize();
      expect(size.canUndo).toBe(true);
      expect(size.canRedo).toBe(false);

      editor.undo();
      const sizeAfterUndo = editor.historySize();
      expect(sizeAfterUndo.canUndo).toBe(true);
      expect(sizeAfterUndo.canRedo).toBe(true);
    });

    it('clearHistory 应该清除所有历史', () => {
      editor.setValue('first');
      editor.setValue('second');

      editor.clearHistory();

      const size = editor.historySize();
      expect(size.canUndo).toBe(false);
      expect(size.canRedo).toBe(false);
    });
  });

  // ============ 搜索功能测试 ============
  describe('搜索功能', () => {
    it('getSearchCursor 应该创建搜索光标', () => {
      const cursor = editor.getSearchCursor('World');
      expect(cursor).toHaveProperty('findNext');
      expect(cursor).toHaveProperty('from');
      expect(cursor).toHaveProperty('to');
    });

    it('findNext 应该找到下一个匹配', () => {
      const cursor = editor.getSearchCursor('Line');
      const found = cursor.findNext();
      expect(found).toBe(true);
    });

    it('from/to 应该返回匹配位置', () => {
      const cursor = editor.getSearchCursor('World');
      cursor.findNext();

      expect(cursor.from()).toEqual({ line: 0, ch: 6 });
      expect(cursor.to()).toEqual({ line: 0, ch: 11 });
    });

    it('replace 应该替换当前匹配', () => {
      const cursor = editor.getSearchCursor('World');
      cursor.findNext();
      cursor.replace('Cherry');

      expect(editor.getValue()).toBe('Hello Cherry\nSecond Line\nThird Line');
    });
  });

  // ============ 文本标记测试 ============
  describe('文本标记', () => {
    it('markText 应该创建文本标记', () => {
      const marker = editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 }, { className: 'highlight' });

      expect(marker).toHaveProperty('clear');
      expect(marker).toHaveProperty('find');
    });

    it('findMarks 应该返回范围内的标记', () => {
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      const marks = editor.findMarks({ line: 0, ch: 0 }, { line: 0, ch: 10 });
      expect(marks.length).toBeGreaterThan(0);
    });

    it('getAllMarks 应该返回所有标记', () => {
      editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.markText({ line: 1, ch: 0 }, { line: 1, ch: 5 });
      const marks = editor.getAllMarks();
      expect(marks.length).toBe(2);
    });

    it('clear 应该移除标记', () => {
      const marker = editor.markText({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      marker.clear();
      const marks = editor.getAllMarks();
      expect(marks.length).toBe(0);
    });
  });
});

// ============================================================================
// 端到端行为测试 - 模拟用户操作
// ============================================================================

describe('端到端编辑行为测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  describe('Markdown 格式化操作', () => {
    const formatTests = [
      {
        name: '加粗文本',
        initial: 'hello world',
        selection: { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
        transform: (s: string) => `**${s}**`,
        expected: '**hello** world',
      },
      {
        name: '斜体文本',
        initial: 'hello world',
        selection: { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
        transform: (s: string) => `*${s}*`,
        expected: '*hello* world',
      },
      {
        name: '删除线文本',
        initial: 'hello world',
        selection: { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
        transform: (s: string) => `~~${s}~~`,
        expected: '~~hello~~ world',
      },
      {
        name: '行内代码',
        initial: 'const x = 1',
        selection: { anchor: { line: 0, ch: 6 }, head: { line: 0, ch: 7 } },
        transform: (s: string) => `\`${s}\``,
        expected: 'const `x` = 1',
      },
      {
        name: '链接',
        initial: 'click here',
        selection: { anchor: { line: 0, ch: 6 }, head: { line: 0, ch: 10 } },
        transform: (s: string) => `[${s}](https://example.com)`,
        expected: 'click [here](https://example.com)',
      },
    ];

    formatTests.forEach(({ name, initial, selection, transform, expected }) => {
      it(name, () => {
        editor.setValue(initial);
        editor.setSelection(selection.anchor, selection.head);

        const selectedText = editor.getSelection();
        editor.replaceSelection(transform(selectedText));

        expect(editor.getValue()).toBe(expected);
      });
    });
  });

  describe('撤销重做场景', () => {
    it('应该能够撤销多次操作', () => {
      editor.setValue('initial');

      editor.replaceRange('A', { line: 0, ch: 0 }, { line: 0, ch: 0 });
      editor.replaceRange('B', { line: 0, ch: 1 }, { line: 0, ch: 1 });
      editor.replaceRange('C', { line: 0, ch: 2 }, { line: 0, ch: 2 });

      editor.undo();
      editor.undo();

      expect(editor.getValue()).toBe('Ainitial');
    });

    it('新操作应该清除重做历史', () => {
      editor.setValue('initial');
      editor.setValue('first');
      editor.undo();

      editor.setValue('new');

      expect(editor.historySize().canRedo).toBe(false);
    });
  });

  describe('复杂编辑场景', () => {
    it('应该支持多行选区操作', () => {
      editor.setValue('line1\nline2\nline3');
      editor.setSelection({ line: 0, ch: 0 }, { line: 2, ch: 5 });

      const selection = editor.getSelection();
      expect(selection).toBe('line1\nline2\nline3');

      editor.replaceSelection('replaced');
      expect(editor.getValue()).toBe('replaced');
    });

    it('应该支持连续的文本修改', () => {
      editor.setValue('Hello World');

      // 第一次修改
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceSelection('Hi');

      // 第二次修改
      editor.setSelection({ line: 0, ch: 3 }, { line: 0, ch: 8 });
      editor.replaceSelection('Cherry');

      expect(editor.getValue()).toBe('Hi Cherry');
    });
  });
});

// ============================================================================
// 导出供其他测试文件使用
// 注意：所有接口、类型和函数已在定义时通过 export 关键字导出
// ============================================================================
