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
import { EditorView, ViewUpdate, Rect, BlockInfo } from '@codemirror/view';
import { EditorState, SelectionRange, TransactionSpec } from '@codemirror/state';
import Cherry from '../src/Cherry.js';
import { EditorMode, CherryToolbarsOptions } from './cherry.js';
declare module '@replit/codemirror-vim' {
  import { Extension } from '@codemirror/state';
  export function vim(): Extension;
}

/**
 * 标记文本选项
 */
export interface MarkTextOptions {
  className?: string;
  title?: string;
  replacedWith?: HTMLElement;
  atomic?: boolean;
  markId?: string;
}

/**
 * 文本标记对象
 */
export interface TextMarker {
  clear(): void;
  find(): { from: number; to: number } | null;
  className?: string;
  markId?: string;
}

/**
 * 标记信息
 */
export interface MarkInfo {
  from: number;
  to: number;
  className?: string;
  clear?(): void;
}

/**
 * 批量标记项（用于批量添加装饰）
 */
export interface BatchMarkItem {
  from: number;
  to: number;
  className?: string;
  replacedWith?: HTMLElement;
  options: MarkTextOptions;
}

/**
 * 滚动信息
 */
export interface ScrollInfo {
  left: number;
  top: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
}

/**
 * 搜索游标
 */
export interface SearchCursor {
  /**
   * 查找下一个匹配
   * @returns 返回匹配结果数组或 false（无匹配）
   */
  findNext(): string[] | false;

  /**
   * 查找上一个匹配
   * @returns 返回匹配结果数组或 false（无匹配）
   */
  findPrevious(): string[] | false;

  /**
   * 获取当前匹配的起始位置
   * @returns 文档偏移量或 null（无当前匹配）
   */
  from(): number | null;

  /**
   * 获取当前匹配的结束位置
   * @returns 文档偏移量或 null（无当前匹配）
   */
  to(): number | null;

  /**
   * 从指定位置查找匹配
   * @param reverse 是否反向搜索
   * @param startPos 起始位置
   * @returns 匹配的范围信息
   */
  matches(reverse: boolean, startPos: number): { from: number; to: number };
}

/**
 * CodeMirror 6 适配器
 * 使用 CM6 原生的文档偏移量（number）而非 {line, ch} 格式
 */
export interface CM6Adapter {
  /** 底层 EditorView 实例 */
  view: EditorView;
  /** 事件处理器映射 */
  eventHandlers: Map<string, Array<(...args: unknown[]) => void>>;
  /** 当前键盘映射模式 */
  currentKeyMap: 'sublime' | 'vim';
  /** vim 模式的 Compartment（用于多实例隔离） */
  vimCompartment: import('@codemirror/state').Compartment | null;
  /** 标记 ID 计数器（实例级别，用于多实例隔离） */
  markIdCounter: number;

  // 代理属性 - 直接访问底层 EditorView 的属性
  /** 代理到 view.state */
  readonly state: EditorState;
  /** 代理到 view.scrollDOM */
  readonly scrollDOM: HTMLElement;
  /** 分发事务到编辑器 */
  dispatch(...specs: TransactionSpec[]): void;
  /** 请求测量 */
  requestMeasure<T>(request?: { read: (view: EditorView) => T; write?: (measure: T, view: EditorView) => void }): void;
  /** 获取坐标对应的文档位置 */
  posAtCoords(coords: { x: number; y: number }): number | null;
  /** 获取指定位置的行块信息 */
  lineBlockAt(pos: number): BlockInfo;

  // 基本操作
  getValue(): string;
  setValue(value: string): void;
  getSelection(): string;
  getSelections(): string[];
  replaceSelection(text: string, select?: 'around' | 'start'): void;
  replaceSelections(texts: string[], select?: 'around' | 'start'): void;

  // 光标操作（使用文档偏移量）
  /**
   * 获取光标位置
   * @param type 光标类型：'head' 或 'anchor'
   * @returns 文档偏移量
   */
  getCursor(type?: 'head' | 'anchor'): number;

  /**
   * 设置光标位置
   * @param pos 文档偏移量
   */
  setCursor(pos: number): void;

  /**
   * 设置选区
   * @param anchor 锚点位置
   * @param head 头部位置（可选，默认与 anchor 相同）
   * @param options 选区选项
   */
  setSelection(
    anchor: number,
    head?: number,
    options?: {
      userEvent?: string;
      scrollIntoView?: boolean;
    },
  ): void;

  listSelections(): readonly SelectionRange[];

  // 行操作
  getLine(lineNumber: number): string;
  lineCount(): number;
  getRange(from: number, to: number): string;
  replaceRange(text: string, from: number, to?: number): void;

  // 文档操作
  getDoc(): CM6Adapter;

  // 坐标操作（使用文档偏移量）
  /**
   * 获取光标坐标
   * @param pos 文档偏移量（可选，默认为当前光标位置）
   * @returns 坐标矩形或 null（如果位置不可见）
   */
  cursorCoords(pos?: number): Rect | null;

  // 滚动操作
  scrollTo(x: number | null, y: number | null): void;
  scrollIntoView(pos: number): void;
  getScrollInfo(): ScrollInfo;

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

  // 标记操作（使用文档偏移量）
  markText(from: number, to: number, options: MarkTextOptions): TextMarker;
  findMarks(from: number, to: number): MarkInfo[];

  // 搜索游标（使用文档偏移量）
  getSearchCursor(query: string | RegExp, pos?: number, caseFold?: boolean): SearchCursor;

  // 事件 - 支持类型安全的事件监听
  on<K extends keyof CM6AdapterEventMap>(event: K, handler: CM6AdapterEventMap[K]): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off<K extends keyof CM6AdapterEventMap>(event: K, handler: CM6AdapterEventMap[K]): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  emit<K extends keyof CM6AdapterEventMap>(event: K, ...args: Parameters<CM6AdapterEventMap[K]>): void;
  emit(event: string, ...args: unknown[]): void;
}

/** 变更对象类型 */
export interface ChangeObject {
  from: number;
  to: number;
  text: string[];
  removed: string[];
  origin?: string;
  /** 当有多个变更时，包含完整的变更列表 */
  changes?: ChangeObject[];
}

/** beforeChange 事件对象 */
export interface BeforeChangeEvent {
  from: number;
  to: number;
  text: string[];
}

/** CM6Adapter 内部事件映射 */
interface CM6AdapterEventMap {
  blur: (event: Event) => void;
  focus: (event: Event) => void;
  /** change 事件传递 ViewUpdate 对象 */
  change: (update: ViewUpdate) => void;
  scroll: () => void;
  paste: (event: ClipboardEvent) => void;
  mousedown: (event: MouseEvent) => void;
  keydown: (event: KeyboardEvent) => void;
  keyup: (event: KeyboardEvent) => void;
  cursorActivity: () => void;
  /** beforeChange 事件在变更前触发，可以取消变更 */
  beforeChange: (event: BeforeChangeEvent) => boolean | void;
  drop: (event: DragEvent) => void;
}

/** Editor 配置回调事件映射 */
interface EditorEventMap {
  onBlur: Event;
  onFocus: Event;
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

/**
 * 特殊字符处理配置
 * 用于控制高频特殊字符标记（如 Base64、Drawio、URL 缩短）的性能
 */
export interface DealSpecialWordsConfig {
  /** 防抖延迟时间（毫秒），默认 200ms。
   * 更小的值增加 CPU 负担，更大的值增加用户感知延迟 */
  debounceMs?: number;

  /** 强制处理超时（毫秒），默认 1000ms。
   * 超过此时间则直接处理而不再等待防抖 */
  forceProcessMs?: number;

  /** 是否启用特殊字符处理，默认 true */
  enabled?: boolean;
}

/**
 * 大文档处理策略配置
 * 用于在超大文档（>10000 行）场景下的性能平衡
 */
export interface LargeDocumentConfig {
  /** 行数阈值，超过则触发处理策略，默认 10000 */
  lineThreshold?: number;

  /** 处理策略，默认 'degrade'：
   * - 'degrade'：仅处理高优先级标记（paste-wrapper、base64），跳过 URL/全角字符等低优先级标记（性能优先）
   * - 'full'：处理所有标记类型，忽略阈值（功能优先，可能导致卡顿）
   * - 'skip'：完全跳过所有特殊字符标记处理（最高性能）
   */
  strategy?: 'degrade' | 'full' | 'skip';

  /** 强制处理的正则表达式集合，即使超过阈值也会处理 */
  forceProcessRegex?: RegExp[];
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
  /** 是否高亮全角符号 ·|￥|、|：|"|"|【|】|（|）|《|》 */
  showFullWidthMark?: boolean;
  /** 是否显示联想框 */
  showSuggestList?: boolean;
  /** URL 最大显示长度 */
  maxUrlLength?: number;
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

  /** 特殊字符处理配置（防抖、启用等） */
  dealSpecialWordsConfig?: DealSpecialWordsConfig;

  /** 大文档处理策略配置（阈值、降级策略等） */
  largeDocumentConfig?: LargeDocumentConfig;
};
