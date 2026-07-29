/**
 * 面向 UMD/CDN script 用户的全局类型声明。
 *
 * 该声明为可选引入，不会被默认 ESM 类型入口包含。
 * 仅在通过 `<script>` 加载 Cherry Markdown 并使用 `window.Cherry`
 * 等全局变量时引入。
 *
 * @example
 * 在 tsconfig.json 中引入：
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["cherry-markdown/types/global"]
 *   }
 * }
 * ```
 *
 * 或在任意 .d.ts 文件中：
 * ```ts
 * /// <reference types="cherry-markdown/types/global" />
 * ```
 */

import type Cherry from '../dist/types/Cherry';
import type CherryStream from '../dist/types/CherryStream';
import type CherryEngine from '../dist/types/index.engine.core';
import type MermaidCodeEngine from '../dist/types/addons/cherry-code-block-mermaid-plugin';
import type PlantUMLCodeEngine from '../dist/types/addons/cherry-code-block-plantuml-plugin';

export {};

declare global {
  interface Window {
    /**
     * Cherry Markdown 编辑器构造函数。
     *
     * 通过 UMD/CDN 构建产物引入时，根据文件不同，类型有所区别：
     * - 完整版（cherry-markdown.js / cherry-markdown.core.js）→ `Cherry`
     * - 流式版（cherry-markdown.stream.js）→ `CherryStream`
     *
     * @example
     * ```ts
     * const cherry = new window.Cherry({ id: 'markdown' });
     * ```
     */
    Cherry?: typeof Cherry | typeof CherryStream;

    /**
     * Cherry Markdown 引擎构造函数。
     *
     * 仅包含核心引擎，不包含编辑器 UI。适用于：
     * - 服务端渲染（SSR）
     * - 纯文本转换场景
     * - 无 UI 的解析需求
     *
     * @example
     * ```ts
     * const engine = new window.CherryEngine({
     *   engine: { global: { urlProcessor: (url) => url } }
     * });
     * const html = engine.makeHtml(markdownText);
     * ```
     */
    CherryEngine?: typeof CherryEngine;

    /**
     * Mermaid 代码块插件（UMD 构建产物自动挂载）
     *
     * @example
     * ```ts
     * Cherry.usePlugin(window.CherryCodeBlockMermaidPlugin, {
     *   mermaid: window.mermaid,
     * });
     * ```
     */
    CherryCodeBlockMermaidPlugin?: typeof MermaidCodeEngine;

    /**
     * PlantUML 代码块插件（UMD 构建产物自动挂载）
     *
     * @example
     * ```ts
     * Cherry.usePlugin(window.CherryCodeBlockPlantumlPlugin, {
     *   baseUrl: 'http://www.plantuml.com/plantuml',
     * });
     * ```
     */
    CherryCodeBlockPlantumlPlugin?: typeof PlantUMLCodeEngine;
  }
}
