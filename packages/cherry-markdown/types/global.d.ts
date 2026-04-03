import Mermaid from 'mermaid';
import katex from 'katex';

// for IE
export {};

declare global {
  const BUILD_ENV: string;
  interface Window {
    // for IE
    clipboardData: ClipboardEvent['clipboardData'];
    mermaid?: typeof Mermaid;
    // @deprecated v10+ 已废弃，mermaidAPI 合并到顶层 mermaid 对象。保留此声明以兼容旧版本。
    mermaidAPI?: any;
    echarts?: echarts.ECharts;
    MathJax?: any;
    katex?: katex;
  }
}
