/**
 * Searcher 插件类型定义（单一来源）
 * 修改类型请只改此文件；index.d.ts 负责对外声明与运行时 API。
 */

/** 搜索面板 UI 文案（可通过 localeId 选内置包，或通过 locale 单项覆盖） */
export interface SearcherLocale {
  /** 搜索输入框 placeholder */
  searchFor?: string;
  /** 清空/关闭按钮 tooltip 或 aria 文案 */
  close?: string;
  /** 「区分大小写」开关 tooltip */
  caseSensitiveSearch?: string;
  /** 「全字匹配」开关 tooltip */
  wholeWordSearch?: string;
  /** 跳转到上一个匹配项按钮 tooltip */
  previousMatch?: string;
  /** 跳转到下一个匹配项按钮 tooltip */
  nextMatch?: string;
  /** 替换区域标题或替换按钮文案 */
  replace?: string;
  /** 替换内容输入框 placeholder */
  replaceWith?: string;
  /** 「全部替换」按钮文案 */
  replaceAll?: string;
  /** 展开/收起替换行按钮 tooltip */
  toggleReplace?: string;
}

/** Searcher 行为与文案配置（独立使用时传入 SearcherPanel；Cherry 集成时通过 usePlugin 传入） */
export interface SearcherOptions {
  /**
   * 内置语言包 ID
   * @default 按 navigator.language 推断，无法识别时为 en_US
   */
  localeId?: 'zh_CN' | 'en_US';
  /**
   * 面板文案覆盖，与 localeId 对应内置包合并，同名字段以本项为准
   * @example { searchFor: 'Find' }
   */
  locale?: Partial<SearcherLocale>;
  /**
   * 是否启用替换能力（关闭后隐藏替换行与 Mod+H 等替换入口）
   * @default true
   */
  enableReplace?: boolean;
  /**
   * 打开搜索面板时是否默认展开替换行
   * @default false
   */
  expandReplaceOnOpen?: boolean;
  /**
   * 点击面板外时是否自动关闭（面板内任意点击保持打开）
   * @default true
   */
  closeOnClickOutside?: boolean;
  /**
   * 搜索完成回调（关键词非空且匹配计算结束后触发）
   * @param event 当前搜索词、选项与匹配结果
   */
  onSearch?: (event: SearcherSearchEvent) => void;
  /**
   * 替换成功回调（单个 / 全部统一入口）
   * @param event 替换方式、搜索词、原文与替换文
   */
  onReplace?: (event: SearcherReplaceEvent) => void;
}

/** 搜索完成事件参数 */
export interface SearcherSearchEvent {
  /** 当前搜索关键词 */
  query: string;
  /** 是否区分大小写 */
  caseSensitive: boolean;
  /** 是否全字匹配 */
  wholeWord: boolean;
  /** 当前文档内全部匹配区间 */
  matches: SearcherMatchRange[];
  /** 当前高亮的匹配项索引，-1 表示无激活项 */
  activeMatchIndex: number;
}

/** 替换事件参数 */
export interface SearcherReplaceEvent {
  /** 替换方式：单个匹配 / 全部匹配 */
  mode: 'single' | 'all';
  /** 当前搜索关键词 */
  query: string;
  /** 被替换的原文（单个为当前匹配文本；全部为匹配项原文，同一 query 下通常相同） */
  from: string;
  /** 替换后的文本 */
  to: string;
  /** 本次替换数量（单个为 1） */
  count: number;
  /** 单个替换时的文档区间，全部为 undefined */
  range?: SearcherMatchRange;
}

/** 编辑器适配接口（宿主实现，与 Cherry / CodeMirror 等解耦） */
export interface EditorAdapter {
  /** 获取当前文档全文，用于匹配计算 */
  getDocString(): string;
  /** 获取当前选区起止位置（文档内 offset） */
  getSelection(): { from: number; to: number };
  /** 获取当前选中的文本，无选区时返回空字符串 */
  getSelectedText(): string;
  /** 获取光标位置（head），用于定位距光标最近的匹配项 */
  getCursorHead(): number;
  /** 设置选区并可选滚动到可见区域 */
  setSelection(from: number, to: number, options?: Record<string, unknown>): void;
  /** 在指定区间替换文本 */
  replaceRange(text: string, from: number, to: number): void;
  /**
   * 设置编辑器内搜索高亮
   * @param pattern 已由 buildSearchRegex 处理过的正则 pattern（regex.source）
   * @param caseSensitive 是否区分大小写
   * @param asRegex 是否按正则解析 pattern（SearcherPanel 固定传 true）
   */
  setSearchQuery(pattern: string, caseSensitive: boolean, asRegex: boolean): void;
  /** 清除编辑器内搜索高亮 */
  clearSearchQuery(): void;
  /** 聚焦编辑器 */
  focus(): void;
  /** 是否只读（只读时不允许替换） */
  isReadOnly(): boolean;
}

/** SearcherPanel 构造参数 */
export interface SearcherPanelParams {
  /** 编辑器能力适配器，由宿主实现 */
  editorAdapter: EditorAdapter;
  /** 面板行为与文案配置，缺省项由 mergeOptions 补全 */
  options?: SearcherOptions;
  /** 面板挂载容器，缺省为 document.body */
  mountTarget?: HTMLElement | null;
}

/** 文档内一处匹配的区间 */
export interface SearcherMatchRange {
  /** 匹配起始位置（含） */
  from: number;
  /** 匹配结束位置（不含） */
  to: number;
}

/** 搜索状态（面板内部维护） */
export interface SearcherSearchState {
  /** 当前搜索关键词 */
  query: string;
  /** 是否区分大小写 */
  caseSensitive: boolean;
  /** 是否全字匹配 */
  wholeWord: boolean;
  /** 当前文档内全部匹配区间 */
  matches: SearcherMatchRange[];
  /** 当前高亮的匹配项索引，-1 表示无激活项 */
  activeMatchIndex: number;
}

/** show() 打开面板时的可选参数 */
export interface SearcherShowOptions {
  /**
   * 是否展开替换行（优先级高于 expandReplaceOnOpen）
   * @default 由 expandReplaceOnOpen 决定
   */
  expandReplace?: boolean;
}
