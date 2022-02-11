import * as mermaid from 'mermaid';
// for IE
export {};

declare global {
  const BUILD_ENV: string;
  interface Window {
    // for IE
    clipboardData: ClipboardEvent['clipboardData'];
    mermaid?: mermaid.Mermaid;
    mermaidAPI?: mermaid.Mermaid['mermaidAPI'];
    echarts?: echarts.ECharts;
    MathJax?: any;
  }
}
