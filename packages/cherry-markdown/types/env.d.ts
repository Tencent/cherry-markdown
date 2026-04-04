/**
 * 开发环境类型声明
 *
 * @remarks 此文件仅供 cherry-markdown 项目内部开发使用，
 * 不随 npm publish 发布给最终用户（通过 .npmignore 排除）。
 *
 * 直接 import 可选依赖的真实类型，提供完整的类型推断。
 */

import Mermaid from 'mermaid';
import katex from 'katex';
import type * as EChartsType from 'echarts';
import type Cherry from '../src/Cherry';
import type CherryStream from '../src/CherryStream';

// 标记为 ES module，使 declare global 生效
export {};

declare global {
  const BUILD_ENV: string;
  interface Window {
    // for IE
    clipboardData: ClipboardEvent['clipboardData'];

    /**
     * Cherry Markdown 编辑器构造函数。
     * - 在 index.core.js 入口中挂载为完整版 Cherry 类
     * - 在 index.stream.js 入口中挂载为精简版 CherryStream 类
     */
    Cherry?: typeof Cherry | typeof CherryStream;

    /**
     * mermaid 实例（v9+ 均通过顶层对象访问）
     */
    mermaid?: typeof Mermaid;

    /**
     * @deprecated v10+ 已废弃。v9 及以下版本的独立 mermaidAPI 子对象。
     */
    mermaidAPI?: (typeof Mermaid)['mermaidAPI'];

    /** echarts 实例 */
    echarts?: EChartsType.ECharts;

    /** MathJax 实例（MathJax 没有标准 npm 类型包，使用 any） */
    MathJax?: any;

    /** katex 实例 */
    katex?: typeof katex;
  }
}
