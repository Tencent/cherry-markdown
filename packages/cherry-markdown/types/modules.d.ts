/**
 * cherry-markdown 环境模块声明
 *
 * 为 cherry-markdown 对外提供的非 TypeScript 资源（CSS 等）声明模块类型，
 * 使消费者在 noUncheckedSideEffectImports 开启时不会报错。
 *
 * 此文件随 npm 发布，不参与 TSC 编译，无需构建脚本处理。
 *
 * @example
 * 在 tsconfig.json 中引入：
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["cherry-markdown/types/modules"]
 *   }
 * }
 * ```
 *
 * 或在任意 .d.ts 文件中：
 * ```ts
 * /// <reference types="cherry-markdown/types/modules" />
 * ```
 */

/** 完整样式（编辑器 UI + Markdown 渲染），未压缩 */
declare module 'cherry-markdown/dist/cherry-markdown.css';
/** 完整样式（编辑器 UI + Markdown 渲染），压缩版 */
declare module 'cherry-markdown/dist/cherry-markdown.min.css';
/** 仅 Markdown 渲染样式（不含编辑器 UI），适用于预览场景，未压缩 */
declare module 'cherry-markdown/dist/cherry-markdown.markdown.css';
/** 仅 Markdown 渲染样式（不含编辑器 UI），适用于预览场景，压缩版 */
declare module 'cherry-markdown/dist/cherry-markdown.markdown.min.css';

// ─── Addon 插件 ─────────────────────────────────────────

/** Mermaid 代码块插件（独立构建产物，需单独引入） */
declare module 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin' {
  const plugin: any;
  export default plugin;
}

/** PlantUML 代码块插件（独立构建产物，需单独引入） */
declare module 'cherry-markdown/dist/addons/cherry-code-block-plantuml-plugin' {
  const plugin: any;
  export default plugin;
}

/** Searcher 搜索插件（独立构建产物，需单独引入） */
declare module 'cherry-markdown/dist/addons/cherry-searcher-plugin' {
  import type { SearcherOptions } from '@cherry-markdown/plugin-searcher';

  export class SearcherCherryBridge {
    handleTrigger(selection?: string, aliasName?: string): void;
  }

  const SearcherCherryPlugin: {
    install(
      cherryDefaults: { toolbars?: { config?: { searcher?: SearcherOptions } } },
      userOptions?: SearcherOptions,
    ): void;
    onCherryInit(cherry: unknown, userOptions?: SearcherOptions): void;
    onCherryDestroy(cherry: unknown): void;
  };

  export default SearcherCherryPlugin;
}

/** Searcher 搜索插件 ESM 构建产物 */
declare module 'cherry-markdown/dist/addons/cherry-searcher-plugin.esm.js' {
  import type SearcherCherryPlugin from 'cherry-markdown/dist/addons/cherry-searcher-plugin';
  export default SearcherCherryPlugin;
}

/** Searcher 搜索插件样式（由 addons.build.js 从 plugin-searcher 编译同步） */
declare module 'cherry-markdown/dist/addons/cherry-searcher-plugin.css';

/** @cherry-markdown/plugin-searcher 样式（Cherry 集成或独立使用时引入） */
declare module '@cherry-markdown/plugin-searcher/styles/searcher.scss';
