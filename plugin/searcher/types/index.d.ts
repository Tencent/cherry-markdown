/**
 * @cherry-markdown/plugin-searcher 包入口类型声明
 * 构建时与 searcher.types.d.ts、styles.d.ts 一并复制到 dist/。
 */
import './styles.js';
import type {
  EditorAdapter,
  SearcherLocale,
  SearcherMatchRange,
  SearcherOptions,
  SearcherPanelParams,
  SearcherSearchState,
  SearcherShowOptions,
} from './searcher.types.js';

export type {
  SearcherLocale,
  SearcherOptions,
  SearcherSearchEvent,
  SearcherReplaceEvent,
  EditorAdapter,
  SearcherPanelParams,
  SearcherMatchRange,
  SearcherSearchState,
  SearcherShowOptions,
} from './searcher.types.js';

export declare const DEFAULT_OPTIONS: Required<
  Pick<SearcherOptions, 'enableReplace' | 'expandReplaceOnOpen' | 'closeOnClickOutside'>
>;

export declare const SEARCHER_LOCALES: {
  zh_CN: Required<SearcherLocale>;
  en_US: Required<SearcherLocale>;
};

export declare const DEFAULT_LOCALE_ID: 'en_US';

export declare function mergeOptions(options?: SearcherOptions): SearcherOptions & typeof DEFAULT_OPTIONS;

export declare function resolveLocale(options?: SearcherOptions): Required<SearcherLocale>;

export default class SearcherPanel {
  constructor(params: SearcherPanelParams);
  dom: HTMLElement;
  options: SearcherOptions;
  editorAdapter: EditorAdapter;
  /** 当前搜索状态（关键词、匹配列表、激活项等） */
  state: SearcherSearchState;
  /** 替换内容输入框，未启用替换时为 null */
  replaceInput: HTMLInputElement | null;
  isVisible(): boolean;
  show(
    anchorRect?: { left: number; top: number; width: number; height: number },
    selection?: string,
    showOptions?: SearcherShowOptions,
  ): void;
  hide(): void;
  destroy(): void;
  setReplaceExpanded(expanded: boolean): void;
  updateLocaleStrings(): void;
  /** 按当前输入重新计算匹配并刷新高亮 */
  runSearch(keepActiveIndex?: boolean): void;
  /** 防抖调度搜索（输入或文档变更时使用） */
  scheduleSearch(keepActiveIndex?: boolean): void;
  /** 取消待执行的防抖搜索 */
  cancelScheduledSearch(): void;
  /** 立即执行待定的防抖搜索 */
  flushScheduledSearch(keepActiveIndex?: boolean): void;
  /** 设置搜索关键词并触发搜索 */
  setQuery(query: string, keepCurrentIndex?: boolean, immediate?: boolean): void;
  /** 清空搜索关键词 */
  clearQuery(): void;
}

export function escapeRegExp(str: string): string;

export function buildSearchRegex(query: string, caseSensitive: boolean, wholeWord: boolean): RegExp | null;

export function findMatches(
  text: string,
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
): SearcherMatchRange[];

export function findNearestMatchIndex(matches: SearcherMatchRange[], cursorPos: number): number;
