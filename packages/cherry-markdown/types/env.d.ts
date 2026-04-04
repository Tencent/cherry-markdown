/**
 * 开发环境类型声明
 *
 * @remarks 此文件仅供 cherry-markdown 项目内部开发使用，
 * 不随 npm publish 发布给最终用户（通过 package.json files 排除）。
 */

import Mermaid from 'mermaid';
import katex from 'katex';
import type * as EChartsType from 'echarts';
import type Cherry from '../src/Cherry';
import type CherryStream from '../src/CherryStream';

// ─── 全局类型扩展 ─────────────────────────────────────────
// 注：global.d.ts 也声明了 Window.Cherry（用户面向，仅 typeof Cherry）。
// 两者不冲突——global.d.ts 不在 tsconfig files 中，开发时不参与编译。
// env.d.ts 的声明使用联合类型，覆盖 index.core.js 和 index.stream.js 两个入口。

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

    /** mermaid 实例（v9+ 均通过顶层对象访问） */
    mermaid?: typeof Mermaid;

    /** @deprecated v10+ 已废弃。v9 及以下版本的独立 mermaidAPI 子对象。 */
    mermaidAPI?: (typeof Mermaid)['mermaidAPI'];

    /** echarts 实例 */
    echarts?: EChartsType.ECharts;

    /**
     * MathJax v3 实例
     * @remarks mathjax v3 无标准 npm 类型包，@types/mathjax 仅覆盖 v2 API。
     * 此处内联声明项目实际使用的 API 子集。
     */
    MathJax?: {
      texReset?(): void;
      tex2mmlPromise?(tex: string, opts?: { display: boolean }): Promise<string>;
      startup?: { elements?: string[]; typeset?: boolean; [k: string]: unknown };
      tex?: Record<string, unknown>;
      options?: Record<string, unknown>;
      loader?: { load?: string[] };
      [k: string]: unknown;
    };

    /** katex 实例 */
    katex?: typeof katex;
  }
}
