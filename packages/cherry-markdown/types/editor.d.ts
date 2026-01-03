/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// 可选依赖的类型声明
import { EditorView, ViewUpdate } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import Cherry from '../src/Cherry.js';
import { EditorMode, CherryToolbarsOptions } from './cherry.js';
declare module '@replit/codemirror-vim' {
  import { Extension } from '@codemirror/state';
  export function vim(): Extension;
}

/**
 * CodeMirror 6 适配器
 */
export interface CM6Adapter {
  /** 底层 EditorView 实例 */
  view: EditorView;
  /** 事件处理器映射 */
  eventHandlers: Map<string, Array<(...args: unknown[]) => void>>;
  /** 上次搜索结果 */
  lastSearchResult: { from: number; to: number } | null;

  // 代理属性 - 直接访问底层 EditorView 的属性
  /** 代理到 view.state */
  readonly state: EditorState;
  /** 代理到 view.scrollDOM */
  readonly scrollDOM: HTMLElement;
  /** 代理到 view.dispatch */
  dispatch: EditorView['dispatch'];
  /** 代理到 view.requestMeasure */
  requestMeasure: EditorView['requestMeasure'];
  /** 代理到 view.posAtCoords */
  posAtCoords: EditorView['posAtCoords'];
  /** 代理到 view.lineBlockAt */
  lineBlockAt: EditorView['lineBlockAt'];

  // 基本操作
  getValue(): string;
  setValue(value: string): void;
  getSelection(): string;
  getSelections(): string[];
  replaceSelection(text: string, select?: string): void;
  replaceSelections(texts: string[], select?: string): void;

  // 光标操作
  getCursor(type?: 'head' | 'anchor'): { line: number; ch: number };
  setCursor(line: number, ch: number): void;
  setSelection(from: { line: number; ch: number } | number, to?: { line: number; ch: number } | number): void;
  listSelections(): Array<{ anchor: { line: number; ch: number }; head: { line: number; ch: number } }>;

  // 行操作
  getLine(line: number): string;
  lineCount(): number;
  getRange(from: { line: number; ch: number }, to: { line: number; ch: number }): string;
  replaceRange(text: string, from: { line: number; ch: number }, to?: { line: number; ch: number }): void;

  // 文档操作
  getDoc(): CM6Adapter;
  posToLineAndCh(pos: number): { line: number; ch: number };
  lineAndChToPos(line: number | { line: number; ch: number }, ch?: number): number;

  // 坐标操作
  cursorCoords(where?: { line: number; ch: number }): { left: number; top: number; bottom: number };

  // 滚动操作
  scrollTo(x: number | null, y: number | null): void;
  scrollIntoView(pos: { line: number; ch: number }): void;
  getScrollInfo(): {
    left: number;
    top: number;
    height: number;
    width: number;
    clientHeight: number;
    clientWidth: number;
  };

  // DOM 操作
  getWrapperElement(): HTMLElement;
  getScrollerElement(): HTMLElement;
  refresh(): void;
  focus(): void;

  // 选项操作
  setOption(option: 'value' | 'keyMap' | string, value: string | boolean | object): void;
  getOption(option: 'readOnly' | 'disableInput' | 'value' | string): string | boolean | object | null;

  // 键盘映射
  setKeyMap(mode: 'sublime' | 'vim'): Promise<void>;

  // 搜索操作
  setSearchQuery(query: string, caseSensitive?: boolean, isRegex?: boolean): void;
  clearSearchQuery(): void;

  // 标记操作
  markText(
    from: { line: number; ch: number },
    to: { line: number; ch: number },
    options: {
      className?: string;
      title?: string;
      replacedWith?: HTMLElement;
      atomic?: boolean;
    },
  ): {
    clear(): void;
    find(): { from: { line: number; ch: number }; to: { line: number; ch: number } };
    className?: string;
  };
  findMarks(
    from: { line: number; ch: number },
    to: { line: number; ch: number },
  ): Array<{
    from: { line: number; ch: number };
    to: { line: number; ch: number };
    className?: string;
    clear?(): void;
  }>;

  // 搜索游标
  getSearchCursor(
    query: string | RegExp,
    pos?: { line: number; ch: number },
    caseFold?: boolean,
  ): {
    findNext(): string[] | false;
    findPrevious(): string[] | false;
    from(): { line: number; ch: number } | null;
    to(): { line: number; ch: number } | null;
    matches(
      reverse: boolean,
      start: { line: number; ch: number },
    ): {
      from: { line: number; ch: number };
      to: { line: number; ch: number };
    };
  };

  // 事件 - 支持类型安全的事件监听
  on<K extends keyof CM6AdapterEventMap>(event: K, handler: CM6AdapterEventMap[K]): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  emit<K extends keyof CM6AdapterEventMap>(event: K, ...args: Parameters<CM6AdapterEventMap[K]>): void;
  emit(event: string, ...args: unknown[]): void;
}

/** CM6Adapter 内部事件映射 */
interface CM6AdapterEventMap {
  blur: (event: Event) => void;
  focus: (event: Event) => void;
  change: () => void;
  scroll: () => void;
  paste: (event: ClipboardEvent) => void;
  mousedown: (event: MouseEvent) => void;
  keydown: (event: KeyboardEvent) => void;
  keyup: (event: KeyboardEvent) => void;
  cursorActivity: () => void;
  beforeChange: (editor: CM6Adapter) => void;
  drop: (event: DragEvent) => void;
}

/** Editor 配置回调事件映射 */
interface EditorEventMap {
  onBlur: ViewUpdate;
  onFocus: ViewUpdate;
  onKeydown: KeyboardEvent;
  onPaste: ClipboardEvent;
}

export type EditorEventCallback<K extends keyof EditorEventMap> = (
  event: EditorEventMap[K],
  codemirror: CM6Adapter,
) => void;

type EditorPasteEventHandler = (
  event: ClipboardEvent,
  clipboardData: ClipboardEvent['clipboardData'],
  codemirror: CM6Adapter,
) => void;

/** 工具栏菜单项配置 */
interface ToolbarMenuConfig {
  iconName?: string;
  onClick?: () => void;
  [key: string]: string | boolean | number | ((...args: unknown[]) => void) | undefined;
}

/**
 * Cherry 编辑器配置
 */
interface CherryEditorConfig {
  /** 是否显示行号 */
  lineNumbers?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否自动聚焦 */
  autofocus?: boolean;
}

export type EditorConfiguration = {
  id?: string; // textarea 的id属性值
  name?: string; // textarea 的name属性值
  autoSave2Textarea?: boolean; // 是否自动将编辑区的内容回写到textarea里
  editorDom: HTMLElement;
  wrapperDom: HTMLElement;
  toolbars: Record<string, ToolbarMenuConfig | boolean> | CherryToolbarsOptions;
  value?: string;
  convertWhenPaste?: boolean;
  keyMap?: 'sublime' | 'vim'; // 快捷键风格，目前仅支持 sublime 和 vim
  keepDocumentScrollAfterInit?: boolean;
  /** 是否高亮全角符号 ·|￥|、|：|“|”|【|】|（|）|《|》 */
  showFullWidthMark?: boolean;
  /** 是否显示联想框 */
  showSuggestList?: boolean;
  /** Cherry 编辑器配置 */
  codemirror: CherryEditorConfig;
  onKeydown: EditorEventCallback<'onKeydown'>;
  onFocus: EditorEventCallback<'onFocus'>;
  onBlur: EditorEventCallback<'onBlur'>;
  onPaste: EditorEventCallback<'onPaste'>;
  onChange: (update: ViewUpdate | null, codemirror: CM6Adapter) => void;
  onScroll: (editorView: EditorView) => void;
  handlePaste?: EditorPasteEventHandler;
  /** 预览区域跟随编辑器光标自动滚动 */
  autoScrollByCursor: boolean;
  fileUpload?: (file: File, callback: (fileUrl: string) => void) => void;
  $cherry?: Cherry;
  /** 书写风格，normal 普通 | typewriter 打字机 | focus 专注，默认normal */
  writingStyle?: string;
  /** 编辑器初始化后的模式 */
  defaultModel?: EditorMode;
};
