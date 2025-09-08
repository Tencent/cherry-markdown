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
    mermaidAPI?: typeof Mermaid['mermaidAPI'];
    echarts?: echarts.ECharts;
    MathJax?: any;
    katex?: katex;
  }
}
