export interface SearcherTagItem {
  value: string;
  label?: string;
}

export interface SearcherPluginOptions {
  /** 搜索输入框占位文本 */
  placeholder?: string;
  /** 最近文本区域标题 */
  recentTitle?: string;
  /** 历史记录/推荐标签 */
  recentTexts?: SearcherTagItem[];
  /** 最大历史记录数量，默认 10 */
  maxRecentCount?: number;
  /** localStorage 存储键名 */
  storageKey?: string;
  /** 标签删除回调，返回 false 可阻止删除 */
  onTagDelete?: (value: string) => boolean | void;
  /** 是否启用替换功能，默认 true */
  enableReplace?: boolean;
  /** 打开面板时是否默认展开替换行，默认 false */
  defaultExpandReplace?: boolean;
}

export default class SearcherPlugin {
  static install(cherryOptions: Record<string, unknown>, options?: SearcherPluginOptions): void;
}

export class SearcherMenu {}

export class SearcherPanel {}

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
): Array<{ from: number; to: number }>;

export function findNearestMatchIndex(
  matches: Array<{ from: number; to: number }>,
  cursorPos: number,
): number;
