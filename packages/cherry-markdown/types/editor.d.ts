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
import { EditorView, ViewUpdate, Decoration } from '@codemirror/view';
import { EditorState, EditorSelection } from '@codemirror/state';
import Cherry from '../src/Cherry.js';
import { EditorMode } from './cherry.js';

/**
 * CodeMirror 6 适配器 - 提供与 CodeMirror 5 兼容的 API
 */
export interface CM6Adapter {
  /** 底层 EditorView 实例 */
  view: EditorView;
  /** 事件处理器映射 */
  _eventHandlers: Map<string, Function[]>;
  
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
  cursorCoords(where?: { line: number; ch: number }, mode?: string): { left: number; top: number; bottom: number };
  charCoords(pos: { line: number; ch: number }, mode?: string): { left: number; top: number; bottom: number };
  coordsChar(coords: { x: number; y: number }): { line: number; ch: number };
  
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
  lineAtHeight(height: number, mode?: string): number;
  
  // DOM 操作
  getWrapperElement(): HTMLElement;
  getScrollerElement(): HTMLElement;
  refresh(): void;
  focus(): void;
  
  // 选项操作
  setOption(option: string, value: any): void;
  getOption(option: string): any;
  
  // 搜索操作
  setSearchQuery(query: string, caseSensitive?: boolean, isRegex?: boolean): void;
  clearSearchQuery(): void;
  
  // 标记操作
  markText(from: { line: number; ch: number }, to: { line: number; ch: number }, options: {
    className?: string;
    title?: string;
    replacedWith?: HTMLElement;
    atomic?: boolean;
  }): {
    clear(): void;
    find(): { from: { line: number; ch: number }; to: { line: number; ch: number } };
    className?: string;
  };
  findMarks(from: { line: number; ch: number }, to: { line: number; ch: number }): Array<{
    from: { line: number; ch: number };
    to: { line: number; ch: number };
    className?: string;
    clear?(): void;
  }>;
  getAllMarks(): Array<{
    from: { line: number; ch: number };
    to: { line: number; ch: number };
    className?: string;
    clear(): void;
  }>;
  
  // 搜索游标
  getSearchCursor(query: string | RegExp, pos?: { line: number; ch: number }, caseFold?: boolean): {
    findNext(): string[] | false;
    findPrevious(): string[] | false;
    from(): { line: number; ch: number } | null;
    to(): { line: number; ch: number } | null;
    matches(reverse: boolean, start: { line: number; ch: number }): {
      from: { line: number; ch: number };
      to: { line: number; ch: number };
    };
  };
  
  // 其他
  findWordAt(pos: { line: number; ch: number }): {
    anchor: { line: number; ch: number };
    head: { line: number; ch: number };
  };
  
  // 事件
  on(event: string, handler: Function): void;
  _emit(event: string, ...args: any[]): void;
  
  // 命令
  execCommand(command: string): void;
  save(): void;
  getLineHandle(line: number): { height: number };
}

interface EditorEventMap {
  onBlur: ViewUpdate;
  onFocus: ViewUpdate;
  onKeydown: KeyboardEvent;
  onPaste: ClipboardEvent;
}

type EditorDefaultCallback = () => void;
export type EditorEventCallback<
  E = unknown,
  K extends keyof EditorEventMap = keyof EditorEventMap,
> = E extends EditorEventMap[K]
  ? (event: E, codemirror: CM6Adapter) => void
  : (codemirror: CM6Adapter) => void;

type EditorPasteEventHandler = (
  event: ClipboardEvent,
  clipboardData: ClipboardEvent['clipboardData'],
  codemirror: CM6Adapter,
) => void;

export type EditorConfiguration = {
  id?: string; // textarea 的id属性值
  name?: string; // textarea 的name属性值
  autoSave2Textarea?: boolean; // 是否自动将编辑区的内容回写到textarea里
  editorDom: HTMLElement;
  wrapperDom: HTMLElement;
  toolbars: any;
  value?: string;
  convertWhenPaste?: boolean;
  keyMap?: 'sublime' | 'vim'; // 快捷键风格，目前仅支持 sublime 和 vim
  keepDocumentScrollAfterInit?: boolean;
  /** 是否高亮全角符号 ·|￥|、|：|"|"|【|】|（|）|《|》 */
  showFullWidthMark?: boolean;
  /** 是否显示联想框 */
  showSuggestList?: boolean;
  codemirror: any; // CodeMirror v6 配置对象
  onKeydown: EditorEventCallback<EditorEventMap['onKeydown']>;
  onFocus: EditorEventCallback<EditorEventMap['onFocus']>;
  onBlur: EditorEventCallback<EditorEventMap['onBlur']>;
  onPaste: EditorEventCallback<EditorEventMap['onPaste']>;
  onChange: (update: ViewUpdate, codemirror: CM6Adapter) => void;
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
