import Mermaid from 'mermaid';
import type * as EChartsType from 'echarts';
import type { KatexOptions } from 'katex';

// for IE
export {};

/** MathJax 运行时核心 API（仅声明 CherryMarkdown 实际使用的部分） */
interface MathJaxRuntime {
  /** 重置 tex 计数器 */
  texReset?(): void;
  /** 将 tex 源码转为 MathML Promise */
  tex2mmlPromise?(tex: string, opts?: { display: boolean }): Promise<string>;
  startup?: {
    /** CSS 选择器数组，指定哪些元素需要 typeset */
    elements?: string[];
    /** 是否在页面加载时自动排版 */
    typeset?: boolean;
    [key: string]: unknown;
  };
  tex?: Record<string, unknown>;
  options?: Record<string, unknown>;
  loader?: { load?: string[] };
  [key: string]: unknown;
}

/** katex 运行时 API（仅声明 CherryMarkdown 实际使用的部分） */
interface KatexRuntime {
  renderToString(tex: string, options?: KatexOptions): string;
  render?(tex: string, element: HTMLElement, options?: KatexOptions): void;
  [key: string]: unknown;
}

declare global {
  const BUILD_ENV: string;
  interface Window {
    // for IE
    clipboardData: ClipboardEvent['clipboardData'];

    /**
     * mermaid 实例（v9+ 均通过顶层对象访问）
     * 用户可通过 CDN <script> 加载后挂载到 window，或通过 CherryMarkdown externals 注入
     */
    mermaid?: typeof Mermaid;

    /**
     * @deprecated v10+ 已废弃。v9 及以下版本的独立 mermaidAPI 子对象。
     * v10+ 所有功能已合并到顶层 mermaid 对象。
     * 保留此声明仅为兼容旧版本使用者传入的 mermaidAPI 参数。
     */
    mermaidAPI?: {
      initialize(config: Record<string, unknown>): void;
      render(
        id: string,
        code: string,
        callback?: (svg: string) => void,
        container?: HTMLElement,
      ): unknown | Promise<{ svg: string }>;
      [key: string]: unknown;
    };

    /** echarts 实例（用户需自行通过 CDN 或 script 标签注入） */
    echarts?: EChartsType.ECharts;

    /** MathJax 实例（用户需自行通过 CDN 或 script 标签注入） */
    MathJax?: MathJaxRuntime;

    /** katex 实例（用户需自行通过 CDN 或 script 标签注入） */
    katex?: KatexRuntime;
  }
}
