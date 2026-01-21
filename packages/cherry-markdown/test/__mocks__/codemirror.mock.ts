/**
 * CodeMirror Mock 工具
 * 用于在 vitest 环境中模拟 CodeMirror 的行为
 * 这对于升级到 CodeMirror 6 时验证行为一致性非常重要
 */
import { vi } from 'vitest';

export interface MockPosition {
  line: number;
  ch: number;
}

export interface MockRange {
  anchor: MockPosition;
  head: MockPosition;
  empty?: () => boolean;
}

export interface MockLineHandle {
  height: number;
  text: string;
}

export interface MockSearchCursor {
  findNext: ReturnType<typeof vi.fn>;
  findPrevious: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  to: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  matches: ReturnType<typeof vi.fn>;
}

export interface MockSearchState {
  posFrom: MockPosition | null;
  posTo: MockPosition | null;
  lastQuery: string | RegExp | null;
  query: string | RegExp | null;
  queryText: string | null;
  overlay: any;
  annotate: any;
}

/**
 * 创建一个 CodeMirror Editor 的 Mock 实例
 * @param initialValue 初始文本内容
 * @returns Mock 的 CodeMirror 实例
 */
export function createCodeMirrorMock(initialValue: string = '') {
  let value = initialValue;
  let cursor: MockPosition = { line: 0, ch: 0 };
  let selections: MockRange[] = [{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } }];
  const marks: any[] = [];
  const options: Record<string, any> = {};
  const overlays: any[] = [];
  const state: { search?: MockSearchState } = {};

  const getLines = () => value.split('\n');

  const mock = {
    // 获取/设置值
    getValue: vi.fn(() => value),
    setValue: vi.fn((newValue: string) => {
      value = newValue;
    }),

    // 行操作
    getLine: vi.fn((lineNum: number) => {
      const lines = getLines();
      return lines[lineNum] || '';
    }),
    lineCount: vi.fn(() => getLines().length),
    getLineHandle: vi.fn(
      (lineNum: number): MockLineHandle => ({
        height: 20,
        text: getLines()[lineNum] || '',
      }),
    ),

    // 光标操作
    getCursor: vi.fn((start?: string) => ({ ...cursor })),
    setCursor: vi.fn((pos: MockPosition) => {
      cursor = { ...pos };
      selections = [{ anchor: pos, head: pos }];
    }),

    // 选区操作
    getSelection: vi.fn(() => {
      if (selections.length === 0) return '';
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
      for (let i = startLine; i <= endLine; i++) {
        if (i === startLine) {
          result += lines[i].substring(sel.anchor.ch);
        } else if (i === endLine) {
          result += `\n${lines[i].substring(0, sel.head.ch)}`;
        } else {
          result += `\n${lines[i]}`;
        }
      }
      return result;
    }),
    getSelections: vi.fn(() => {
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
    }),
    setSelection: vi.fn((anchor: MockPosition, head?: MockPosition) => {
      const actualHead = head || anchor;
      selections = [{ anchor: { ...anchor }, head: { ...actualHead } }];
      cursor = { ...actualHead };
    }),
    listSelections: vi.fn(() => selections.map((s) => ({ ...s }))),
    replaceSelection: vi.fn((replacement: string, select?: string) => {
      const sel = selections[0];
      const lines = getLines();
      const startLine = Math.min(sel.anchor.line, sel.head.line);
      const endLine = Math.max(sel.anchor.line, sel.head.line);
      const startCh = sel.anchor.line <= sel.head.line ? sel.anchor.ch : sel.head.ch;
      const endCh = sel.anchor.line >= sel.head.line ? sel.anchor.ch : sel.head.ch;

      if (startLine === endLine) {
        const line = lines[startLine];
        const start = Math.min(startCh, endCh);
        const end = Math.max(startCh, endCh);
        lines[startLine] = line.substring(0, start) + replacement + line.substring(end);
      } else {
        const startLineText = lines[startLine].substring(0, startCh);
        const endLineText = lines[endLine].substring(endCh);
        const newLines = replacement.split('\n');
        newLines[0] = startLineText + newLines[0];
        newLines[newLines.length - 1] = newLines[newLines.length - 1] + endLineText;
        lines.splice(startLine, endLine - startLine + 1, ...newLines);
      }

      value = lines.join('\n');
      const newCh = startCh + replacement.length;
      cursor = { line: startLine, ch: newCh };
      selections = [{ anchor: cursor, head: cursor }];
    }),
    replaceSelections: vi.fn((replacements: string[]) => {
      // 简化实现：只处理单个选区
      if (replacements.length > 0) {
        mock.replaceSelection(replacements[0]);
      }
    }),
    replaceRange: vi.fn((replacement: string, from: MockPosition, to?: MockPosition) => {
      const lines = getLines();
      const actualTo = to || from;

      if (from.line === actualTo.line) {
        const line = lines[from.line] || '';
        lines[from.line] = line.substring(0, from.ch) + replacement + line.substring(actualTo.ch);
      } else {
        const startLineText = (lines[from.line] || '').substring(0, from.ch);
        const endLineText = (lines[actualTo.line] || '').substring(actualTo.ch);
        const newLines = replacement.split('\n');
        newLines[0] = startLineText + newLines[0];
        newLines[newLines.length - 1] = newLines[newLines.length - 1] + endLineText;
        lines.splice(from.line, actualTo.line - from.line + 1, ...newLines);
      }

      value = lines.join('\n');
    }),

    // 查找单词
    findWordAt: vi.fn((pos: MockPosition) => {
      const line = getLines()[pos.line] || '';
      let start = pos.ch;
      let end = pos.ch;

      // 向前查找单词边界
      while (start > 0 && /\w/.test(line[start - 1])) {
        start -= 1;
      }
      // 向后查找单词边界
      while (end < line.length && /\w/.test(line[end])) {
        end += 1;
      }

      return {
        anchor: { line: pos.line, ch: start },
        head: { line: pos.line, ch: end },
      };
    }),

    // 执行命令
    execCommand: vi.fn((cmd: string) => {
      // Mock 命令执行
    }),

    // 选项
    getOption: vi.fn((name: string) => options[name]),
    setOption: vi.fn((name: string, val: any) => {
      options[name] = val;
    }),

    // 标记
    markText: vi.fn((from: MockPosition, to: MockPosition, opts?: any) => {
      const mark = {
        from,
        to,
        opts,
        clear: vi.fn(),
        find: vi.fn(() => ({ from, to })),
        className: opts?.className,
      };
      marks.push(mark);
      return mark;
    }),
    findMarks: vi.fn((from: MockPosition, to: MockPosition) => {
      return marks.filter((m) => {
        return m.from.line >= from.line && m.to.line <= to.line;
      });
    }),
    getAllMarks: vi.fn(() => [...marks]),

    // 搜索
    getSearchCursor: vi.fn((query: RegExp | string, startPos?: MockPosition) => {
      const matches: Array<{ from: MockPosition; to: MockPosition; match: RegExpExecArray | null }> = [];
      const lines = getLines();

      // 安全处理 query
      let regex: RegExp;
      try {
        if (typeof query === 'string') {
          regex = query ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : /(?!)/g;
        } else if (query instanceof RegExp) {
          regex = new RegExp(query.source, query.flags.includes('g') ? query.flags : `${query.flags}g`);
        } else {
          regex = /(?!)/g;
        }
      } catch {
        regex = /(?!)/g;
      }

      lines.forEach((line, lineNum) => {
        let match;
        regex.lastIndex = 0; // 重置 lastIndex
        while ((match = regex.exec(line)) !== null) {
          matches.push({
            from: { line: lineNum, ch: match.index },
            to: { line: lineNum, ch: match.index + match[0].length },
            match,
          });
          // 防止空匹配导致无限循环
          if (match[0].length === 0) break;
        }
      });

      let currentIndex = -1;

      const searchCursor = {
        findNext: vi.fn(() => {
          currentIndex += 1;
          if (currentIndex >= 0 && currentIndex < matches.length) {
            return matches[currentIndex].match;
          }
          currentIndex = matches.length; // 防止越界
          return false;
        }),
        findPrevious: vi.fn(() => {
          // 如果还没开始搜索，从末尾开始
          if (currentIndex < 0) {
            currentIndex = matches.length;
          }
          currentIndex -= 1;
          if (currentIndex >= 0 && currentIndex < matches.length) {
            return matches[currentIndex].match;
          }
          currentIndex = -1; // 防止越界
          return false;
        }),
        from: vi.fn(() => (currentIndex >= 0 && currentIndex < matches.length ? matches[currentIndex].from : null)),
        to: vi.fn(() => (currentIndex >= 0 && currentIndex < matches.length ? matches[currentIndex].to : null)),
        replace: vi.fn((text: string) => {
          if (currentIndex >= 0 && currentIndex < matches.length) {
            const m = matches[currentIndex];
            mock.replaceRange(text, m.from, m.to);
          }
        }),
        matches: vi.fn((reverse: boolean, pos: MockPosition) => {
          if (currentIndex >= 0 && currentIndex < matches.length) {
            return {
              from: matches[currentIndex].from,
              to: matches[currentIndex].to,
            };
          }
          return null;
        }),
      };

      return searchCursor;
    }),

    // Overlay (用于搜索高亮)
    addOverlay: vi.fn((overlay: any) => {
      overlays.push(overlay);
    }),
    removeOverlay: vi.fn((overlay: any) => {
      const idx = overlays.indexOf(overlay);
      if (idx >= 0) overlays.splice(idx, 1);
    }),

    // 显示滚动条匹配
    showMatchesOnScrollbar: vi.fn(() => ({
      clear: vi.fn(),
    })),

    // operation 包装
    operation: vi.fn((fn: () => void) => fn()),

    // state 用于搜索状态
    state,

    // display wrapper (用于 SearchBox) - 延迟创建，避免内存泄漏
    display: {
      _wrapper: null as HTMLElement | null,
      get wrapper(): HTMLElement {
        if (!this._wrapper) {
          this._wrapper = document.createElement('div');
          this._wrapper.className = 'CodeMirror';
          const parent = document.createElement('div');
          parent.appendChild(this._wrapper);
        }
        return this._wrapper;
      },
    },

    // doc size
    doc: {
      size: getLines().length,
    },

    // 滚动
    getScrollInfo: vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      clientWidth: 800,
      clientHeight: 600,
    })),
    scrollTo: vi.fn(),
    scrollIntoView: vi.fn(),
    getScrollerElement: vi.fn(() => ({
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 600,
    })),

    // 坐标
    charCoords: vi.fn((pos: MockPosition, mode?: string) => ({
      left: pos.ch * 8,
      right: (pos.ch + 1) * 8,
      top: pos.line * 20,
      bottom: (pos.line + 1) * 20,
    })),
    coordsChar: vi.fn((coords: { left: number; top: number }, mode?: string) => ({
      line: Math.floor(coords.top / 20),
      ch: Math.floor(coords.left / 8),
    })),
    lineAtHeight: vi.fn((height: number, mode?: string) => Math.floor(height / 20)),

    // DOM - 缓存元素，避免重复创建
    _wrapperElement: null as HTMLElement | null,
    _inputField: null as HTMLElement | null,
    getWrapperElement: vi.fn(function (this: any) {
      if (!this._wrapperElement) {
        this._wrapperElement = document.createElement('div');
      }
      return this._wrapperElement;
    }),
    getInputField: vi.fn(function (this: any) {
      if (!this._inputField) {
        this._inputField = document.createElement('textarea');
      }
      return this._inputField;
    }),

    // 事件
    on: vi.fn(),
    off: vi.fn(),


    // Focus
    focus: vi.fn(),
    hasFocus: vi.fn(() => true),

    // Doc
    getDoc: vi.fn(() => ({
      getValue: () => value,
      setValue: (v: string) => {
        value = v;
      },
      replaceSelection: mock.replaceSelection,
    })),

    // 刷新
    refresh: vi.fn(),

    // 保存
    save: vi.fn(),

    /**
     * 清理资源，防止内存泄漏
     * 应在每个测试的 afterEach 中调用
     */
    destroy: () => {
      // 清理 DOM 元素
      if (mock._wrapperElement?.parentNode) {
        mock._wrapperElement.parentNode.removeChild(mock._wrapperElement);
      }
      mock._wrapperElement = null;
      if (mock._inputField?.parentNode) {
        mock._inputField.parentNode.removeChild(mock._inputField);
      }
      mock._inputField = null;
      if (mock.display._wrapper?.parentNode) {
        mock.display._wrapper.parentNode.removeChild(mock.display._wrapper);
      }
      mock.display._wrapper = null;
      // 清理标记
      marks.length = 0;
      overlays.length = 0;
      // 重置状态
      value = '';
      selections.length = 0;
    },
  };

  return mock;
}

/**
 * 创建一个简单的键盘事件 Mock
 */
export function createKeyboardEventMock(options: {
  key: string;
  code?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
}): KeyboardEvent {
  return {
    key: options.key,
    code: options.code || `Key${options.key.toUpperCase()}`,
    ctrlKey: options.ctrlKey || false,
    metaKey: options.metaKey || false,
    altKey: options.altKey || false,
    shiftKey: options.shiftKey || false,
    repeat: options.repeat || false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as KeyboardEvent;
}

/**
 * 创建 Cherry 实例的 Mock
 */
export function createCherryMock() {
  const eventHandlers: Record<string, Function[]> = {};

  return {
    getInstanceId: vi.fn(() => 'test-instance'),
    status: {
      editor: 'show',
    },
    options: {
      callback: {
        onPaste: vi.fn(() => false),
        fileUpload: vi.fn(),
      },
      editor: {
        maxUrlLength: 100,
      },
    },
    $event: {
      emit: vi.fn(),
      on: vi.fn((event: string, handler: Function) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(handler);
      }),
      off: vi.fn(),
    },
    engine: {
      makeMarkdown: vi.fn((html: string) => html),
    },
    locale: {
      // 基础
      addRow: '添加行',
      addCol: '添加列',
      deleteRow: '删除行',
      deleteColumn: '删除列',
      // 搜索替换相关
      close: '关闭',
      searchFor: '搜索',
      replaceWith: '替换为',
      nextMatch: '下一个',
      previousMatch: '上一个',
      replace: '替换',
      replaceAll: '全部替换',
      toggleReplace: '切换替换',
      regExpSearch: '正则表达式',
      caseSensitiveSearch: '区分大小写',
      wholeWordSearch: '全字匹配',
      matchesFoundText: '个匹配',
      // 工具栏相关
      bold: '粗体',
      italic: '斜体',
      strikethrough: '删除线',
      underline: '下划线',
      sub: '下标',
      sup: '上标',
      color: '颜色',
      header: '标题',
      list: '列表',
      insert: '插入',
    },
    editor: null as any, // 将在测试中设置
  };
}

/**
 * 创建 MenuBase 测试用的 Editor Mock
 */
export function createEditorMock(initialValue: string = '') {
  const cmMock = createCodeMirrorMock(initialValue);
  return {
    editor: cmMock,
  };
}

export type CodeMirrorMock = ReturnType<typeof createCodeMirrorMock>;
export type CherryMock = ReturnType<typeof createCherryMock>;
export type EditorMock = ReturnType<typeof createEditorMock>;
