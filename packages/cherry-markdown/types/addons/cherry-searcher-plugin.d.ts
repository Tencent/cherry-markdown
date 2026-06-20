/**
 * Cherry Markdown Searcher 插件类型（Cherry.usePlugin 集成层）
 *
 * 运行时入口：cherry-markdown/dist/addons/cherry-searcher-plugin(.esm.js)
 * UI 核心类型见 @cherry-markdown/plugin-searcher
 */
import type SearcherPanel from '@cherry-markdown/plugin-searcher';
import type { DEFAULT_OPTIONS, SearcherOptions } from '@cherry-markdown/plugin-searcher';

/** usePlugin(install) 合并后的 Searcher 配置 */
export type SearcherCherryMergedOptions = SearcherOptions & typeof DEFAULT_OPTIONS;

/**
 * Cherry 实例上挂载 Searcher 桥接层时的宿主形态
 * （生命周期回调参数，涵盖 onCherryInit / onCherryDestroy 所需字段）
 */
export interface SearcherCherryHost {
  locale?: Record<string, string | undefined>;
  options?: {
    locale?: string;
  };
  editor?: {
    editor?: {
      view?: {
        state?: {
          doc?: { toString(): string; sliceString(from: number, to: number): string };
          selection?: { main?: { from: number; to: number; head: number } };
        };
        focus?: () => void;
      };
      setSelection?: (from: number, to: number, options?: Record<string, unknown>) => void;
      replaceRange?: (text: string, from: number, to: number) => void;
      setSearchQuery?: (pattern: string, caseSensitive: boolean, asRegex: boolean) => void;
      clearSearchQuery?: () => void;
      getOption?: (key: string) => unknown;
    };
    options?: {
      editorDom?: HTMLElement;
      wrapperDom?: HTMLElement;
    };
  };
  wrapperDom?: HTMLElement;
  $event?: {
    Events?: {
      afterChangeLocale?: string;
      afterChange?: string;
    };
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
    off?: (event: string, handler: (...args: unknown[]) => void) => void;
  };
  /** Searcher 插件初始化后挂载 */
  searcherBridge?: SearcherCherryBridge;
}

/** Cherry 与 Searcher 的桥接层（快捷键、事件、面板生命周期） */
export declare class SearcherCherryBridge {
  readonly panel: SearcherPanel;
  destroy(): void;
}

/**
 * Searcher Cherry 集成插件
 *
 * @example
 * ```ts
 * import Cherry from 'cherry-markdown';
 * import SearcherCherryPlugin from 'cherry-markdown/dist/addons/cherry-searcher-plugin.esm.js';
 *
 * Cherry.usePlugin(SearcherCherryPlugin, { localeId: 'zh_CN' });
 * ```
 */
export default class SearcherCherryPlugin {
  /** install 阶段 mergeOptions 的结果 */
  static mergedOptions: SearcherCherryMergedOptions;

  /**
   * 注册插件配置（须在 new Cherry() 之前调用）
   * @param _cherryDefaults Cherry 默认配置，本插件不修改 toolbars
   * @param userOptions Searcher 行为与文案配置
   */
  static install(_cherryDefaults: Record<string, unknown>, userOptions?: SearcherOptions): void;

  /** Cherry 实例初始化完成后创建 searcherBridge */
  static onCherryInit(cherry: SearcherCherryHost): void;

  /** Cherry 实例销毁前清理 searcherBridge */
  static onCherryDestroy(cherry: SearcherCherryHost): void;
}

/** 为 Cherry 实例补充 searcherBridge 属性（usePlugin 注册 Searcher 后可用） */
declare module 'cherry-markdown/dist/types/Cherry' {
  export default class Cherry {
    searcherBridge?: SearcherCherryBridge;
  }
}
