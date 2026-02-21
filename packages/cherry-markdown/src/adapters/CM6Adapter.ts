/**
 * CodeMirror 6 适配器
 *
 * 将 CodeMirror 6 实例包装成 IEditorAdapterExtended 接口
 * 用于与现有 Cherry Markdown 代码兼容
 *
 * CM5 → CM6 关键映射：
 * - 行号：CM5 从 0 开始，CM6 从 1 开始
 * - 位置：CM5 使用 {line, ch}，CM6 使用偏移量
 * - 事件：CM6 使用 updateListener 替代 on/off
 * - 标记：CM6 使用 Decoration 系统
 */

import { EditorView, keymap, drawSelection, dropCursor, highlightSpecialChars, rectangularSelection, crosshairCursor, Decoration, WidgetType } from '@codemirror/view';
import { EditorState, EditorSelection, RangeSet, Extension, Facet, StateEffect, Transaction, Text } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo, undoDepth, redoDepth, isolateHistory } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { GFM, Strikethrough } from '@lezer/markdown';
import { search, SearchCursor as CM6SearchCursor, highlightSelectionMatches } from '@codemirror/search';
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';

// ============================================================================
// 类型定义
// ============================================================================

export interface Position {
  line: number;
  ch: number;
}

export interface SelectionRange {
  anchor: Position;
  head: Position;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

export interface ScrollInfo {
  top: number;
  left: number;
  height: number;
  width: number;
  clientHeight: number;
  clientWidth: number;
}

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

export type EditorEventHandler = (editor: IEditorAdapterExtended, event?: any) => void;

export interface ISearchCursor {
  findNext(): boolean;
  findPrevious(): boolean;
  from(): Position | null;
  to(): Position | null;
  replace(text: string): void;
}

export interface ITextMarker {
  clear(): void;
  find(): { from: Position; to: Position } | null;
  options?: MarkTextOptions;
}

export interface MarkTextOptions {
  className?: string;
  replacedWith?: HTMLElement;
  atomic?: boolean;
  inclusiveLeft?: boolean;
  inclusiveRight?: boolean;
  title?: string;
}

export interface IEditorAdapterExtended {
  getValue(): string;
  setValue(value: string): void;
  getLine(lineNum: number): string;
  lineCount(): number;
  getCursor(pos?: 'start' | 'end' | 'head' | 'anchor'): Position;
  setCursor(pos: Position | number, ch?: number, options?: any): void;
  getSelection(): string;
  getSelections(): string[];
  setSelection(anchor: Position, head?: Position, options?: any): void;
  setSelections(ranges: SelectionRange[], primary?: number): void;
  listSelections(): SelectionRange[];
  replaceSelection(text: string, collapse?: 'around' | 'start' | 'end'): void;
  replaceSelections(texts: string[]): void;
  replaceRange(text: string, from: Position, to?: Position, origin?: string): void;
  somethingSelected(): boolean;
  findWordAt(pos: Position): SelectionRange;
  on(event: EditorEventType | string, handler: EditorEventHandler): void;
  off(event: EditorEventType | string, handler: EditorEventHandler): void;
  undo(): void;
  redo(): void;
  historySize(): HistoryState;
  clearHistory(): void;
  getSearchCursor(query: string | RegExp, start?: Position): ISearchCursor;
  markText(from: Position, to: Position, options?: MarkTextOptions): ITextMarker;
  findMarks(from: Position, to: Position): ITextMarker[];
  getAllMarks(): ITextMarker[];
  getScrollInfo(): ScrollInfo;
  scrollTo(x: number | null, y: number | null): void;
  scrollIntoView(pos: Position | null): void;
  charCoords(pos: Position, mode?: 'local' | 'global'): { left: number; top: number; bottom: number };
  cursorCoords(where?: 'start' | 'end' | null, mode?: 'local' | 'global'): { left: number; top: number; bottom: number };
  coordsChar(coords: { left: number; top: number }): Position;
  focus(): void;
  hasFocus(): boolean;
  getWrapperElement(): HTMLElement;
  getInputField(): HTMLTextAreaElement | HTMLInputElement;
  setOption(key: string, value: any): void;
  getOption(key: string): any;
  getValueInRange(from: Position, to: Position): string;
  getRange(from: Position, to: Position): string;
  getDoc(): IEditorAdapterExtended;
  execCommand(name: string): void;
  indexFromPos(pos: Position): number;
  posFromIndex(index: number): Position;
  getScrollerElement(): HTMLElement;
  lineAtHeight(height: number, mode?: 'local' | 'page' | 'window'): number;
  getLineHandle(line: number): { height: number; text: string };
  eachLine(start: number, end: number, callback: (lineHandle: { height: number; text: string }) => void): void;
  refresh(): void;
  // CM5 兼容
  addOverlay?(overlay: any): void;
  removeOverlay?(overlay: any): void;
  showMatchesOnScrollbar?: any;
  save?(): void;
  doc?: IEditorAdapterExtended;
  trigger?(eventName: string, ...args: any[]): void;
}

// ============================================================================
// Cherry 主题语法高亮样式
// ============================================================================

/**
 * Cherry Markdown 主题的语法高亮样式
 * 使用 CSS 变量来支持主题切换
 */
const cherryHighlightStyle = HighlightStyle.define([
  // ============================================================================
  // 与线上 Cherry Markdown (CM5) 的实际渲染效果保持一致
  //
  // CM5 对 "> [Github 地址](url){target=_blank}" 的渲染：
  //   > → cm-quote → --editor-header-color
  //   (空格) → span → --base-font-color
  //   [Github 地址] → cm-link → --editor-link-color + underline
  //   (url) → cm-string cm-url → --editor-comment-color + bg
  //   {target=_blank} → span → --base-font-color
  //
  // CM6 的差异：
  //   - "Blockquote/..." 会给整个引用块内容加 quote tag（CM5 只给 ">" 加 cm-quote）
  //   - "QuoteMark" 被映射到 processingInstruction（而不是 quote）
  //   - "Link/..." 会给链接内容加 link tag
  //   - "LinkMark" ([, ]) 被映射到 processingInstruction
  //
  // 解决方案：
  //   - 不给 processingInstruction 设置颜色，让它继承父元素颜色
  //   - 把 link、url 放在 quote 之后，确保优先级高于 quote
  // ============================================================================

  // ---- 第 1 层：不设颜色的 tag ----
  // 处理指令（#, **, *, ~~, `, [, ], (, ), >, - 等标记符号）
  // 不设置颜色，让标记符号继承其所在语法元素的颜色
  // 这样 > 继承 quote 颜色，[, ] 继承 link 颜色，(, ) 继承 url 颜色
  { tag: t.processingInstruction },

  // ---- 第 2 层：通用基础颜色 ----
  // 普通文本 - CM5: .CodeMirror-scroll span → --base-font-color
  { tag: t.content, color: 'var(--base-font-color)' },
  // 字符串 - CM5: .CodeMirror-scroll .cm-string → --base-font-color
  { tag: t.string, color: 'var(--editor-string-color)' },
  // 关键字
  { tag: t.keyword, color: 'var(--editor-keyword-color)' },
  // 粗体
  { tag: t.strong, color: 'var(--base-font-color)', fontWeight: 'bold' },
  // 斜体
  { tag: t.emphasis, color: 'var(--base-font-color)', fontStyle: 'italic' },
  // 删除线
  { tag: t.strikethrough, color: 'var(--base-font-color)', textDecoration: 'line-through' },
  // 列表内容
  { tag: t.list, color: 'var(--base-font-color)' },
  // 分隔符
  { tag: t.contentSeparator, color: 'var(--base-font-color)' },
  // variable
  { tag: t.variableName, color: 'var(--editor-v2-color)' },
  { tag: t.propertyName, color: 'var(--editor-v3-color)' },
  // 元信息
  { tag: t.meta, color: 'var(--editor-meta-color)' },
  // 数字
  { tag: t.number, color: 'var(--editor-number-color)' },
  // 定义
  { tag: t.definition(t.variableName), color: 'var(--editor-def-color)' },
  // 内置函数
  { tag: t.standard(t.variableName), color: 'var(--editor-builtin-color)' },
  // 括号
  { tag: t.bracket, color: 'var(--editor-bracket-color)' },
  // 标签
  { tag: t.tagName, color: 'var(--editor-tag-color)' },
  // 属性
  { tag: t.attributeName, color: 'var(--editor-attribute-color)' },
  // 原子
  { tag: t.atom, color: 'var(--editor-atom-color)' },

  // ---- 第 3 层：标题 ----
  { tag: t.heading1, color: 'var(--editor-header-color)', fontWeight: 'bold' },
  { tag: t.heading2, color: 'var(--editor-header-color)', fontWeight: 'bold' },
  { tag: t.heading3, color: 'var(--editor-header-color)', fontWeight: 'bold' },
  { tag: t.heading4, color: 'var(--editor-header-color)', fontWeight: 'bold' },
  { tag: t.heading5, color: 'var(--editor-header-color)', fontWeight: 'bold' },
  { tag: t.heading6, color: 'var(--editor-header-color)', fontWeight: 'bold' },
  { tag: t.heading, color: 'var(--editor-header-color)', fontWeight: 'bold' },

  // ---- 第 4 层：引用块 ----
  // CM5: .CodeMirror-scroll .cm-quote → --editor-header-color
  // CM6 的 Blockquote/... 会给整个引用块加 quote tag
  // 放在 link/url 之前，这样引用块内的 link/url 可以覆盖 quote 样式
  { tag: t.quote, color: 'var(--editor-header-color)' },

  // 标签名（代码块语言标识）
  { tag: t.labelName, color: 'var(--editor-comment-color)' },

  // ---- 第 5 层：链接（优先级高于 quote）----
  // CM5: .cm-s-default .cm-link → --editor-link-color + underline
  // 在引用块内，链接文字应该保持 link 样式
  { tag: t.link, color: 'var(--editor-link-color)', textDecoration: 'underline' },

  // ---- 第 6 层：URL（优先级高于 quote 和 link）----
  // CM5: .CodeMirror-scroll .cm-url → --editor-comment-color + bg
  { tag: t.url, color: 'var(--editor-comment-color)', backgroundColor: 'var(--editor-url-bg-color)', fontFamily: 'var(--font-family-mono)', fontSize: '0.9em' },

  // ---- 第 7 层：注释和代码（最高优先级）----
  { tag: t.comment, color: 'var(--editor-comment-color)', fontFamily: 'var(--font-family-mono)', fontSize: '0.9em' },
  { tag: t.lineComment, color: 'var(--editor-comment-color)', fontFamily: 'var(--font-family-mono)', fontSize: '0.9em' },
  { tag: t.blockComment, color: 'var(--editor-comment-color)', fontFamily: 'var(--font-family-mono)', fontSize: '0.9em' },
  { tag: t.monospace, color: 'var(--editor-comment-color)', fontFamily: 'var(--font-family-mono)', fontSize: '0.9em' },

  // 错误
  { tag: t.invalid, color: 'var(--editor-error-color)' },
]);

// ============================================================================
// 辅助函数：位置转换
// ============================================================================

/**
 * CM5 位置 {line, ch} 转 CM6 偏移量
 * 注意：CM5 行号从 0 开始，CM6 从 1 开始
 */
function posToOffset(doc: Text, pos: Position): number {
  const lineNum = Math.max(1, Math.min(pos.line + 1, doc.lines)); // CM5 line 0 → CM6 line 1
  const line = doc.line(lineNum);
  return Math.max(line.from, Math.min(line.from + pos.ch, line.to));
}

/**
 * CM6 偏移量转 CM5 位置 {line, ch}
 */
function offsetToPos(doc: Text, offset: number): Position {
  const line = doc.lineAt(offset);
  return {
    line: line.number - 1, // CM6 line 1 → CM5 line 0
    ch: offset - line.from,
  };
}

// ============================================================================
// 事件系统扩展
// ============================================================================

/**
 * 自定义事件状态
 */
interface EventState {
  handlers: Map<EditorEventType, Set<EditorEventHandler>>;
}

const eventHandlersFacet = Facet.define<EventState, EventState>({
  combine: (values) => values[0] || { handlers: new Map() },
});

/**
 * 创建事件监听器扩展
 */
function createEventListenerExtension(adapter: CM6Adapter): Extension {
  return EditorView.updateListener.of((update) => {
    const state = update.state.facet(eventHandlersFacet);
    const handlers = state.handlers;
    
    if (update.docChanged) {
      // beforeChange 事件（CM5 兼容）
      const beforeChangeHandlers = handlers.get('beforeChange' as EditorEventType);
      if (beforeChangeHandlers) {
        beforeChangeHandlers.forEach((handler) => handler(adapter));
      }

      const changeHandlers = handlers.get('change');
      if (changeHandlers) {
        // 构造 CM5 兼容的 changeObj：{ text, from, to, origin }
        // CM5 中 text 是插入文本按行分割的数组，from/to 是 {line, ch} 格式
        const doc = update.state.doc;
        const prevDoc = update.startState.doc;
        
        update.transactions.forEach((tr) => {
          if (tr.docChanged) {
            tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
              const fromPos = offsetToPos(prevDoc, fromA);
              const toPos = offsetToPos(prevDoc, toA);
              const insertedText = inserted.toString();
              const textLines = insertedText.split('\n');
              // origin: CM5 用 '+input', '+delete', 'paste' 等
              const isUserInput = tr.isUserEvent('input');
              const isDelete = tr.isUserEvent('delete');
              const isPaste = tr.isUserEvent('input.paste');
              let origin = '+input';
              if (isPaste) origin = 'paste';
              else if (isDelete) origin = '+delete';
              else if (isUserInput) origin = '+input';
              
              const changeObj = {
                text: textLines,
                from: fromPos,
                to: toPos,
                origin,
                removed: prevDoc.sliceString(fromA, toA).split('\n'),
              };
              changeHandlers.forEach((handler) => handler(adapter, changeObj));
            });
          }
        });
      }
    }
    
    if (update.selectionSet) {
      const cursorHandlers = handlers.get('cursorActivity');
      if (cursorHandlers) {
        cursorHandlers.forEach((handler) => handler(adapter));
      }

      // beforeSelectionChange 事件（CM5 兼容）
      // CM5 中此事件在选区变化前触发，CM6 中在变化后触发，但参数格式兼容
      const beforeSelHandlers = handlers.get('beforeSelectionChange' as EditorEventType);
      if (beforeSelHandlers) {
        const doc = update.state.doc;
        const ranges = update.state.selection.ranges.map((r) => ({
          anchor: offsetToPos(doc, r.anchor),
          head: offsetToPos(doc, r.head),
        }));
        // origin: 用于区分鼠标选区和键盘选区
        // CM5 中 origin 是 '*mouse' | '+input' | '+move' 等
        const hasMouseTransaction = update.transactions.some(
          (tr) => tr.isUserEvent('select.pointer')
        );
        const info = {
          ranges,
          origin: hasMouseTransaction ? '*mouse' : null,
        };
        beforeSelHandlers.forEach((handler) => handler(adapter, info));
      }
    }

    // update 事件：任何视图更新时触发
    if (update.docChanged || update.viewportChanged || update.geometryChanged) {
      const updateHandlers = handlers.get('update' as EditorEventType);
      if (updateHandlers) {
        updateHandlers.forEach((handler) => handler(adapter));
      }
    }
  });
}

// ============================================================================
// 文本标记系统 (Decoration)
// ============================================================================

interface TextMark {
  id: number;
  from: number;
  to: number;
  options?: MarkTextOptions;
}

// ============================================================================
// CM6 适配器实现
// ============================================================================

export class CM6Adapter implements IEditorAdapterExtended {
  private view: EditorView;
  private eventState: EventState;
  private marks: Map<number, TextMark> = new Map();
  private markIdCounter = 0;
  private options: Record<string, any> = {};

  constructor(container: HTMLElement, options: Record<string, any> = {}) {
    // 初始化 extraKeys（CM5 兼容），确保 Suggester 等模块可以安全访问
    if (!options.extraKeys) {
      options.extraKeys = {};
    }
    this.options = options;
    this.eventState = { handlers: new Map() };

    this.view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: options.value || '',
        extensions: this.getBaseExtensions(),
      }),
    });
  }

  /**
   * 获取基础扩展配置（用于初始化和 clearHistory 后重建状态）
   */
  private getBaseExtensions(): Extension[] {
    return [
      // 基础设置
      highlightSpecialChars(),
      history({ newGroupDelay: 0 }),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      // Cherry 主题语法高亮（使用 CSS 变量支持主题切换，优先级最高）
      syntaxHighlighting(cherryHighlightStyle),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      
      // 搜索功能
      search({ top: true }),
      highlightSelectionMatches(),
      
      // 语言支持（含 GFM 扩展：删除线、表格等）
      markdown({ base: markdownLanguage, extensions: [GFM, Strikethrough] }),
      
      // 键位映射
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab,
        ...historyKeymap,
      ]),
      
      // 事件系统
      eventHandlersFacet.of(this.eventState),
      createEventListenerExtension(this),
      
      // 行包装
      EditorView.lineWrapping,
      
      // Cherry 主题覆盖
      // 注意：EditorView.theme() 生成 scoped class（如 .ͼ1f），specificity 高于普通 CSS
      // 因此必须在 JS 端设置 CM6 默认样式会覆盖的关键属性
      // 其余样式由 cherry.scss 中的 !important 规则管理
      EditorView.theme({
        '.cm-scroller': {
          fontFamily: 'inherit',
          lineHeight: 'inherit',
        },
      }),
    ];
  }

  // ============ 内容操作 ============

  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(value: string): void {
    const doc = this.view.state.doc;
    this.view.dispatch({
      changes: { from: 0, to: doc.length, insert: value },
      annotations: isolateHistory.of('full'),
    });
  }

  getLine(lineNum: number): string {
    const doc = this.view.state.doc;
    const lineIndex = lineNum + 1; // CM5 line 0 → CM6 line 1
    if (lineIndex < 1 || lineIndex > doc.lines) {
      return '';
    }
    return doc.line(lineIndex).text;
  }

  lineCount(): number {
    return this.view.state.doc.lines;
  }

  getValueInRange(from: Position, to: Position): string {
    return this.getRange(from, to);
  }

  getRange(from: Position, to: Position): string {
    const doc = this.view.state.doc;
    const startOffset = posToOffset(doc, from);
    const endOffset = posToOffset(doc, to);
    return doc.sliceString(startOffset, endOffset);
  }

  replaceRange(text: string, from: Position, to?: Position, _origin?: string): void {
    const doc = this.view.state.doc;
    const startOffset = posToOffset(doc, from);
    const endOffset = to ? posToOffset(doc, to) : startOffset;
    this.view.dispatch({
      changes: { from: startOffset, to: endOffset, insert: text },
    });
  }

  // ============ 光标操作 ============

  getCursor(pos?: 'start' | 'end' | 'head' | 'anchor'): Position {
    const sel = this.view.state.selection;
    const main = sel.main;
    
    if (pos === 'anchor') {
      return offsetToPos(this.view.state.doc, main.anchor);
    }
    if (pos === 'start') {
      return offsetToPos(this.view.state.doc, Math.min(main.from, main.to));
    }
    if (pos === 'end') {
      return offsetToPos(this.view.state.doc, Math.max(main.from, main.to));
    }
    // 默认返回 head
    return offsetToPos(this.view.state.doc, main.head);
  }

  setCursor(pos: Position | number, ch?: number, _options?: { bias?: number; origin?: string; scroll?: boolean }): void {
    let targetPos: Position;
    if (typeof pos === 'number') {
      targetPos = { line: pos, ch: ch ?? 0 };
    } else {
      targetPos = pos;
    }
    
    const offset = posToOffset(this.view.state.doc, targetPos);
    this.view.dispatch({
      selection: { anchor: offset, head: offset },
      scrollIntoView: true,
    });
  }

  // ============ 选区操作 ============

  getSelection(): string {
    const sel = this.view.state.selection.main;
    return this.view.state.doc.sliceString(sel.from, sel.to);
  }

  getSelections(): string[] {
    return this.view.state.selection.ranges.map((range) => 
      this.view.state.doc.sliceString(range.from, range.to)
    );
  }

  setSelection(anchor: Position, head?: Position, _options?: { bias?: number; origin?: string; scroll?: boolean }): void {
    const doc = this.view.state.doc;
    const anchorOffset = posToOffset(doc, anchor);
    const headOffset = head ? posToOffset(doc, head) : anchorOffset;
    
    this.view.dispatch({
      selection: { anchor: anchorOffset, head: headOffset },
      scrollIntoView: true,
    });
  }

  setSelections(ranges: SelectionRange[], primary?: number): void {
    const doc = this.view.state.doc;
    const selRanges = ranges.map((r) => EditorSelection.range(
      posToOffset(doc, r.anchor),
      posToOffset(doc, r.head)
    ));
    
    this.view.dispatch({
      selection: EditorSelection.create(selRanges, primary ?? 0),
    });
  }

  listSelections(): SelectionRange[] {
    const doc = this.view.state.doc;
    return this.view.state.selection.ranges.map((range) => ({
      anchor: offsetToPos(doc, range.anchor),
      head: offsetToPos(doc, range.head),
    }));
  }

  replaceSelection(text: string, collapse?: 'around' | 'start' | 'end'): void {
    const sel = this.view.state.selection.main;
    const from = sel.from;
    const to = sel.to;
    let selection: { anchor: number; head?: number };

    if (collapse === 'around') {
      // 选中刚插入的文本
      selection = { anchor: from, head: from + text.length };
    } else if (collapse === 'start') {
      // 光标移到插入文本之前
      selection = { anchor: from };
    } else {
      // 默认 'end'：光标移到插入文本之后
      selection = { anchor: from + text.length };
    }

    this.view.dispatch({
      changes: { from, to, insert: text },
      selection,
    });
  }

  replaceSelections(texts: string[]): void {
    const changes: Array<{ from: number; to: number; insert: string }> = [];
    
    this.view.state.selection.ranges.forEach((range, i) => {
      changes.push({
        from: range.from,
        to: range.to,
        insert: texts[i] || '',
      });
    });
    
    this.view.dispatch({ changes });
  }

  somethingSelected(): boolean {
    const sel = this.view.state.selection.main;
    return sel.from !== sel.to;
  }

  findWordAt(pos: Position): SelectionRange {
    const doc = this.view.state.doc;
    const offset = posToOffset(doc, pos);
    const line = doc.lineAt(offset);
    const text = line.text;
    const lineOffset = offset - line.from;
    
    // 查找单词边界
    let start = lineOffset;
    let end = lineOffset;
    
    while (start > 0 && /\w/.test(text[start - 1])) {
      start--;
    }
    while (end < text.length && /\w/.test(text[end])) {
      end++;
    }
    
    return {
      anchor: { line: line.number - 1, ch: start },
      head: { line: line.number - 1, ch: end },
    };
  }

  // ============ 事件系统 ============

  on(eventName: EditorEventType | string, handler: EditorEventHandler): void {
    const evtName = eventName as string;
    if (!this.eventState.handlers.has(evtName as EditorEventType)) {
      this.eventState.handlers.set(evtName as EditorEventType, new Set());
    }
    this.eventState.handlers.get(evtName as EditorEventType)!.add(handler);
    
    // DOM 事件特殊处理：将 CM5 风格的事件注册映射到 CM6 的 DOM 事件
    switch (evtName) {
      case 'focus':
        this.view.contentDOM.addEventListener('focus', (e) => handler(this, e));
        break;
      case 'blur':
        this.view.contentDOM.addEventListener('blur', (e) => handler(this, e));
        break;
      case 'scroll':
        this.view.scrollDOM.addEventListener('scroll', (e) => handler(this, e));
        break;
      case 'keydown':
        this.view.contentDOM.addEventListener('keydown', (e) => handler(this, e));
        break;
      case 'keyup':
        this.view.contentDOM.addEventListener('keyup', (e) => handler(this, e));
        break;
      case 'paste':
        this.view.contentDOM.addEventListener('paste', (e) => handler(this, e));
        break;
      case 'mousedown':
        this.view.contentDOM.addEventListener('mousedown', (e) => handler(this, e));
        break;
      case 'drop':
        this.view.contentDOM.addEventListener('drop', (e) => handler(this, e));
        break;
      // change, cursorActivity, beforeChange 通过 updateListener 处理
      default:
        break;
    }
  }

  off(eventName: EditorEventType | string, handler: EditorEventHandler): void {
    this.eventState.handlers.get(eventName as EditorEventType)?.delete(handler);
  }

  trigger(_eventName: string, ..._args: any[]): void {
    // 触发自定义事件（可选实现）
  }

  // ============ 历史操作 ============

  undo(): void {
    undo(this.view);
  }

  redo(): void {
    redo(this.view);
  }

  historySize(): HistoryState {
    return {
      canUndo: undoDepth(this.view.state) > 0,
      canRedo: redoDepth(this.view.state) > 0,
    };
  }

  clearHistory(): void {
    // CM6 清除历史：通过重建带有当前内容但无历史的编辑器状态
    const currentContent = this.view.state.doc.toString();
    const currentSelection = this.view.state.selection;
    this.view.setState(EditorState.create({
      doc: currentContent,
      selection: currentSelection,
      extensions: this.getBaseExtensions(),
    }));
  }

  // ============ 搜索功能 ============

  getSearchCursor(query: string | RegExp, start?: Position): ISearchCursor {
    const adapter = this;
    let currentMatch: { from: number; to: number } | null = null;
    let searchOffset = start ? posToOffset(adapter.view.state.doc, start) : 0;
    
    const getSearchRegex = () => {
      if (typeof query === 'string') {
        return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      }
      return new RegExp(query.source, query.flags.includes('g') ? query.flags : query.flags + 'g');
    };

    return {
      findNext: () => {
        const doc = adapter.view.state.doc;
        const text = doc.toString();
        const regex = getSearchRegex();
        regex.lastIndex = searchOffset;
        const match = regex.exec(text);
        if (match) {
          currentMatch = { from: match.index, to: match.index + match[0].length };
          searchOffset = match.index + match[0].length;
          return true;
        }
        currentMatch = null;
        return false;
      },

      findPrevious: () => {
        const doc = adapter.view.state.doc;
        const text = doc.toString();
        const regex = getSearchRegex();
        const allMatches: Array<{ from: number; to: number }> = [];
        let match;
        regex.lastIndex = 0;
        
        while ((match = regex.exec(text)) !== null) {
          allMatches.push({ from: match.index, to: match.index + match[0].length });
          if (match[0].length === 0) regex.lastIndex++;
        }
        
        const currentFrom = currentMatch?.from ?? searchOffset;
        for (let i = allMatches.length - 1; i >= 0; i--) {
          if (allMatches[i].from < currentFrom) {
            currentMatch = allMatches[i];
            searchOffset = allMatches[i].from;
            return true;
          }
        }
        currentMatch = null;
        return false;
      },

      from: () => currentMatch ? offsetToPos(adapter.view.state.doc, currentMatch.from) : null,

      to: () => currentMatch ? offsetToPos(adapter.view.state.doc, currentMatch.to) : null,

      replace: (text: string) => {
        if (currentMatch) {
          const oldLength = currentMatch.to - currentMatch.from;
          adapter.view.dispatch({
            changes: { from: currentMatch.from, to: currentMatch.to, insert: text },
          });
          // 替换后调整搜索偏移量：在替换文本之后继续搜索
          const delta = text.length - oldLength;
          searchOffset = currentMatch.from + text.length;
          currentMatch = null;
        }
      },
    };
  }

  // ============ 文本标记 ============

  markText(from: Position, to: Position, options?: MarkTextOptions): ITextMarker {
    const doc = this.view.state.doc;
    const fromOffset = posToOffset(doc, from);
    const toOffset = posToOffset(doc, to);
    const id = ++this.markIdCounter;

    const mark: TextMark = {
      id,
      from: fromOffset,
      to: toOffset,
      options,
    };

    this.marks.set(id, mark);

    // 如果有 className，添加装饰
    if (options?.className) {
      const decoration = Decoration.mark({ class: options.className });
      this.view.dispatch({
        effects: StateEffect.appendConfig.of(
          EditorView.decorations.of(
            RangeSet.of([decoration.range(fromOffset, toOffset)])
          )
        ),
      });
    }

    return {
      clear: () => {
        this.marks.delete(id);
      },
      find: () => {
        const m = this.marks.get(id);
        if (!m) return null;
        return {
          from: offsetToPos(this.view.state.doc, m.from),
          to: offsetToPos(this.view.state.doc, m.to),
        };
      },
      options,
    };
  }

  findMarks(from: Position, to: Position): ITextMarker[] {
    const doc = this.view.state.doc;
    const fromOffset = posToOffset(doc, from);
    const toOffset = posToOffset(doc, to);
    
    const result: ITextMarker[] = [];
    
    this.marks.forEach((mark, id) => {
      if (mark.from >= fromOffset && mark.to <= toOffset) {
        result.push({
          clear: () => this.marks.delete(id),
          find: () => ({
            from: offsetToPos(this.view.state.doc, mark.from),
            to: offsetToPos(this.view.state.doc, mark.to),
          }),
          options: mark.options,
        });
      }
    });
    
    return result;
  }

  getAllMarks(): ITextMarker[] {
    const result: ITextMarker[] = [];
    
    this.marks.forEach((mark, id) => {
      result.push({
        clear: () => this.marks.delete(id),
        find: () => ({
          from: offsetToPos(this.view.state.doc, mark.from),
          to: offsetToPos(this.view.state.doc, mark.to),
        }),
        options: mark.options,
      });
    });
    
    return result;
  }

  // ============ 滚动功能 ============

  getScrollInfo(): ScrollInfo {
    const scrollDOM = this.view.scrollDOM;
    return {
      top: scrollDOM.scrollTop,
      left: scrollDOM.scrollLeft,
      height: scrollDOM.scrollHeight,
      width: scrollDOM.scrollWidth,
      clientHeight: scrollDOM.clientHeight,
      clientWidth: scrollDOM.clientWidth,
    };
  }

  scrollTo(x: number | null, y: number | null): void {
    if (y !== null) {
      this.view.scrollDOM.scrollTop = y;
    }
    if (x !== null) {
      this.view.scrollDOM.scrollLeft = x;
    }
  }

  scrollIntoView(pos: Position | null): void {
    if (pos) {
      const offset = posToOffset(this.view.state.doc, pos);
      this.view.dispatch({
        effects: EditorView.scrollIntoView(offset),
      });
    } else {
      // CM5 兼容：scrollIntoView(null) 滚动到当前光标位置
      const head = this.view.state.selection.main.head;
      this.view.dispatch({
        effects: EditorView.scrollIntoView(head),
      });
    }
  }

  // ============ 光标坐标（用于视觉定位）============

  /**
   * 安全调用 coordsAt，在 jsdom 等无渲染环境中返回基于行号的估算值
   */
  private safeCoords(offset: number): { left: number; top: number; bottom: number } {
    try {
      if (typeof this.view.coordsAt === 'function') {
        const coords = this.view.coordsAt(offset);
        if (coords) {
          return { left: coords.left, top: coords.top, bottom: coords.bottom };
        }
      }
    } catch (_e) {
      // jsdom 或无渲染环境
    }
    // 基于行号的估算值（每行 20px）
    const doc = this.view.state.doc;
    const line = doc.lineAt(offset);
    const lineHeight = 20;
    const top = (line.number - 1) * lineHeight;
    const ch = offset - line.from;
    return { left: ch * 8, top, bottom: top + lineHeight };
  }

  charCoords(pos: Position, _mode?: 'local' | 'global'): { left: number; top: number; bottom: number } {
    const offset = posToOffset(this.view.state.doc, pos);
    return this.safeCoords(offset);
  }

  cursorCoords(where?: 'start' | 'end' | null, _mode?: 'local' | 'global'): { left: number; top: number; bottom: number } {
    const sel = this.view.state.selection.main;
    let offset: number;
    
    if (where === 'start') {
      offset = Math.min(sel.from, sel.to);
    } else if (where === 'end') {
      offset = Math.max(sel.from, sel.to);
    } else {
      offset = sel.head;
    }
    
    return this.safeCoords(offset);
  }

  coordsChar(coords: { left: number; top: number }): Position {
    try {
      if (typeof this.view.posAtCoords === 'function') {
        const pos = this.view.posAtCoords({ x: coords.left, y: coords.top });
        if (pos !== null && pos !== undefined) {
          return offsetToPos(this.view.state.doc, pos);
        }
      }
    } catch (_e) {
      // jsdom 或无渲染环境
    }
    // 基于坐标估算
    const lineHeight = 20;
    const charWidth = 8;
    const line = Math.max(0, Math.floor(coords.top / lineHeight));
    const ch = Math.max(0, Math.floor(coords.left / charWidth));
    const doc = this.view.state.doc;
    const safeLineNum = Math.min(line, doc.lines - 1);
    const docLine = doc.line(safeLineNum + 1);
    const safeCh = Math.min(ch, docLine.length);
    return { line: safeLineNum, ch: safeCh };
  }

  // ============ 焦点功能 ============

  focus(): void {
    this.view.focus();
  }

  hasFocus(): boolean {
    return this.view.hasFocus;
  }

  // ============ DOM 访问 ============

  getWrapperElement(): HTMLElement {
    return this.view.dom;
  }

  getInputField(): HTMLTextAreaElement | HTMLInputElement {
    // CM6 使用 contenteditable，返回 contentDOM
    return this.view.contentDOM as unknown as HTMLTextAreaElement;
  }

  // ============ 选项 ============

  setOption(key: string, value: any): void {
    this.options[key] = value;
  }

  getOption(key: string): any {
    return this.options[key];
  }

  // ============ CM5 兼容方法 ============

  /**
   * CM5 addOverlay 兼容（搜索高亮在 CM6 中通过内置 search 扩展实现）
   */
  addOverlay(_overlay: any): void {
    // CM6 不使用 overlay 机制，搜索高亮由内置 search 扩展处理
  }

  /**
   * CM5 removeOverlay 兼容
   */
  removeOverlay(_overlay: any): void {
    // CM6 不使用 overlay 机制
  }

  /**
   * CM5 showMatchesOnScrollbar 兼容
   */
  showMatchesOnScrollbar?: any = undefined;

  /**
   * CM5 save 兼容：将内容写回 textarea（如果存在）
   */
  save(): void {
    // CM6 不需要 save，内容通过事件同步
  }

  // ============ 文档操作 ============

  /**
   * 返回文档对象（CM5 兼容，返回自身）
   */
  getDoc(): IEditorAdapterExtended {
    return this;
  }

  /**
   * CM5 兼容：editor.doc 属性
   */
  get doc(): IEditorAdapterExtended {
    return this;
  }

  // ============ 命令执行 ============

  execCommand(name: string): void {
    switch (name) {
      case 'selectAll':
        const doc = this.view.state.doc;
        this.view.dispatch({
          selection: { anchor: 0, head: doc.length },
        });
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      default:
        console.warn(`Unknown command: ${name}`);
    }
  }

  // ============ 位置-偏移量转换 ============

  indexFromPos(pos: Position): number {
    return posToOffset(this.view.state.doc, pos);
  }

  posFromIndex(index: number): Position {
    return offsetToPos(this.view.state.doc, index);
  }

  // ============ 滚动同步 ============

  getScrollerElement(): HTMLElement {
    return this.view.scrollDOM;
  }

  lineAtHeight(height: number, mode?: 'local' | 'page' | 'window'): number {
    let clientY: number;
    
    if (mode === 'local' || !mode) {
      clientY = height;
    } else {
      const scrollTop = this.view.scrollDOM.scrollTop;
      clientY = height - this.view.dom.getBoundingClientRect().top + scrollTop;
    }
    
    try {
      if (typeof this.view.posAtCoords === 'function') {
        const pos = this.view.posAtCoords({ x: 0, y: clientY });
        if (pos !== null && pos !== undefined) {
          return this.view.state.doc.lineAt(pos).number - 1;
        }
      }
    } catch (_e) {
      // jsdom fallback
    }
    // 基于估算值的 fallback（每行 20px）
    const lineHeight = 20;
    const estimatedLine = Math.max(0, Math.floor(clientY / lineHeight));
    return Math.min(estimatedLine, this.view.state.doc.lines - 1);
  }

  getLineHandle(line: number): { height: number; text: string } {
    const doc = this.view.state.doc;
    const lineNum = Math.max(1, Math.min(line + 1, doc.lines));
    const docLine = doc.line(lineNum);
    const coords = this.safeCoords(docLine.from);
    const lineHeight = coords.bottom - coords.top;
    
    return {
      height: lineHeight > 0 ? lineHeight : 20,
      text: docLine.text,
    };
  }

  // ============ 行遍历 ============

  eachLine(start: number, end: number, callback: (lineHandle: { height: number; text: string }) => void): void {
    const doc = this.view.state.doc;
    const safeStart = Math.max(0, start);
    const safeEnd = Math.min(end, doc.lines);
    
    for (let i = safeStart; i < safeEnd; i++) {
      const lineHandle = this.getLineHandle(i);
      callback(lineHandle);
    }
  }

  // ============ 刷新 ============

  refresh(): void {
    // CM6 不需要手动刷新，但可以触发重绘
    this.view.dispatch({
      effects: EditorView.scrollIntoView(this.view.state.selection.main.head),
    });
    // 触发 refresh 事件（CM5 兼容），供 Bubble/FloatMenu 使用
    const refreshHandlers = this.eventState.handlers.get('refresh' as EditorEventType);
    if (refreshHandlers) {
      refreshHandlers.forEach((handler) => handler(this));
    }
  }

  // ============ 销毁 ============

  destroy(): void {
    this.view.destroy();
    this.marks.clear();
  }
}

// ============================================================================
// 导出创建函数
// ============================================================================

/**
 * 创建 CM6 编辑器适配器
 */
export function createCM6Adapter(container: HTMLElement, options: Record<string, any> = {}): IEditorAdapterExtended {
  return new CM6Adapter(container, options);
}

/**
 * 从 textarea 创建 CM6 编辑器
 * 模拟 CM5 的 fromTextArea API
 */
export function fromTextArea(textarea: HTMLTextAreaElement, options: Record<string, any> = {}): IEditorAdapterExtended {
  const container = document.createElement('div');
  container.className = 'cm-editor-container';
  textarea.parentNode?.insertBefore(container, textarea);
  textarea.style.display = 'none';
  
  const editorOptions = {
    ...options,
    value: textarea.value,
  };
  
  const adapter = new CM6Adapter(container, editorOptions);
  
  // 同步内容到原始 textarea
  adapter.on('change', () => {
    textarea.value = adapter.getValue();
  });
  
  return adapter;
}
