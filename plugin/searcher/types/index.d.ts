/**
 * @cherry-markdown/plugin-searcher 包入口类型声明
 * 构建时与 searcher.types.d.ts 一并复制到 dist/。
 */
import type {
  EditorAdapter,
  SearcherLocale,
  SearcherMatchRange,
  SearcherOptions,
  SearcherPanelParams,
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
  Pick<SearcherOptions, 'enableReplace' | 'expandReplaceOnOpen'>
>;

export declare const SEARCHER_LOCALES: {
  zh_CN: Required<SearcherLocale>;
  en_US: Required<SearcherLocale>;
};

export declare const LOCALE_ZH_CN: Required<SearcherLocale>;
export declare const LOCALE_EN_US: Required<SearcherLocale>;
export declare const DEFAULT_LOCALE_ID: 'en_US';

export declare function mergeOptions(
  options?: SearcherOptions,
): SearcherOptions & typeof DEFAULT_OPTIONS;

export declare function resolveLocale(options?: SearcherOptions): Required<SearcherLocale>;

export default class SearcherPanel {
  constructor(params: SearcherPanelParams);
  dom: HTMLElement;
  options: SearcherOptions;
  editorAdapter: EditorAdapter;
  isVisible(): boolean;
  show(
    anchorRect: { left: number; top: number; width: number; height: number },
    selection?: string,
    showOptions?: SearcherShowOptions,
  ): void;
  hide(): void;
  destroy(): void;
  setReplaceExpanded(expanded: boolean): void;
  updateLocaleStrings(): void;
}

export function escapeRegExp(str: string): string;

export function buildSearchRegex(
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
): RegExp | null;

export function findMatches(
  text: string,
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
): SearcherMatchRange[];

export function findNearestMatchIndex(matches: SearcherMatchRange[], cursorPos: number): number;
