/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Stream 版本构建配置 - 专为流式输出场景优化
 *
 * 特点：
 * 1. 排除 codemirror、mermaid、echarts 等大型依赖
 * 2. 使用 HooksConfig.stream.js（不含 Suggester）从源头避免 codemirror 导入
 * 3. 提供 UMD 和 ESM 两种格式，ESM 支持消费者的 tree-shaking
 */

import terser from '@rollup/plugin-terser';
import baseConfig from './rollup.base.config.js';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';

const terserPlugin = (options = {}) =>
  terser({
    output: {
      comments: false,
    },
    compress: {
      pure_funcs: ['console.log', 'console.info'],
    },
    ecma: 5,
    ...options,
  });

// 自定义插件：拦截 core/HooksConfig 导入，重定向到 stream 版本
const hooksConfigInterceptPlugin = {
  name: 'hooks-config-intercept',

  resolveId(source) {
    // 拦截 HooksConfig 导入
    if (source === './core/HooksConfig' || source.endsWith('/core/HooksConfig')) {
      console.log('[hooks-config-intercept] Redirecting HooksConfig to stream version');
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      // 返回实际的 HooksConfig.stream.js 文件路径
      const streamPath = path.resolve(currentDir, '../src/core/HooksConfig.stream.js');
      return streamPath;
    }
    return null;
  },
};

// 自定义插件：强制标记 codemirror 相关模块为外部依赖
const codemirrorExternalPlugin = {
  name: 'codemirror-external',

  resolveId(source) {
    // 拦截所有 codemirror 相关的导入，强制标记为外部依赖
    if (source === 'codemirror' || source.startsWith('codemirror/')) {
      console.log(`[codemirror-external] Marking "${source}" as external`);
      // 直接返回外部依赖标记，确保 rollup 不会尝试 bundle 这个模块
      return { id: source, external: true };
    }
    return null;
  },
};

// 自定义插件：移除 PreviewerBubble 相关代码，避免引入 codemirror
const removePreviewerBubblePlugin = {
  name: 'remove-previewer-bubble',

  transform(code, id) {
    // 只处理 Previewer.js 文件
    if (!id.endsWith('Previewer.js')) {
      return null;
    }

    console.log('[remove-previewer-bubble] Removing PreviewerBubble from Previewer.js');

    // 移除 PreviewerBubble 的导入语句
    let modifiedCode = code.replace(
      /import\s+PreviewerBubble\s+from\s+['"]\.\/toolbars\/PreviewerBubble['"];?\s*/,
      '// PreviewerBubble removed in stream build\n',
    );

    // 将 $initPreviewerBubble 方法改为空实现
    modifiedCode = modifiedCode.replace(
      /\$initPreviewerBubble\(\)\s*\{[^}]*this\.previewerBubble\s*=\s*new\s+PreviewerBubble\([^)]*\);?\s*\}/,
      '$initPreviewerBubble() {\n    // PreviewerBubble disabled in stream build\n  }',
    );

    return {
      code: modifiedCode,
      map: null,
    };
  },
};

// 明确列出需要的插件
const dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(dirname, '../src');

const basePlugins = [
  codemirrorExternalPlugin, // 最高优先级：强制标记 codemirror 为外部依赖
  hooksConfigInterceptPlugin, // 拦截 HooksConfig 导入，重定向到 stream 版本
  removePreviewerBubblePlugin, // 移除 PreviewerBubble，避免引入 codemirror
  baseConfig.plugins.find((p) => p.name === 'json'),
  baseConfig.plugins.find((p) => p.name === 'replace'),
  // 添加 alias 插件以解析 @/ 别名
  alias({
    entries: [{ find: '@', replacement: srcPath }],
  }),
  resolve({
    browser: true,
    preferBuiltins: false,
    mainFields: ['module', 'jsnext:main', 'browser', 'main'],
    exportConditions: ['default', 'module'],
  }),
  commonjs({
    include: [/node_modules/, /src[\\/]libs/],
    exclude: [/node_modules[\\/](lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es|codemirror)/],
    extensions: ['.js'],
    ignoreGlobal: false,
    sourceMap: false,
    ignoreDynamicRequires: true,
  }),
  baseConfig.plugins.find((p) => p.name === 'babel'),
  baseConfig.plugins.find((p) => p.name === 'dist-types'), // 添加 dist-types 插件以生成类型声明
].filter(Boolean);

const umdPlugins = [...basePlugins, terserPlugin()];
const esmPlugins = [...basePlugins, terserPlugin({ module: true, ecma: 2015 })];

const umdOutputConfig = {
  exports: 'named',
  file: 'dist/cherry-markdown.stream.js',
  format: 'umd',
  name: 'CherryStream',
  sourcemap: true,
  compact: true,
  inlineDynamicImports: true,
  globals: {
    mermaid: 'mermaid',
    codemirror: 'CodeMirror',
    'codemirror/src/util/misc': 'CodeMirror',
    'codemirror/src/util/browser': 'CodeMirror',
    prism: 'Prism',
  },
};

const esmOutputConfig = {
  exports: 'named',
  file: 'dist/cherry-markdown.stream.esm.js',
  format: 'esm',
  name: 'CherryStream',
  sourcemap: true,
  compact: true,
  interop: 'auto',
  inlineDynamicImports: false,
  preserveEntrySignatures: 'allow-extension',
};

const streamExternal = [
  // 排除外部依赖
  'mermaid',
  'codemirror',
  /^codemirror\/.*/,
  'echarts',
];

/**
 * UMD 配置 - 用于 <script> 标签直接引入
 * 特点：完整打包，所有代码内联，没有拆分
 */
const umdConfig = {
  input: 'src/index.stream.js',
  output: {
    ...umdOutputConfig,
    inlineDynamicImports: true, // 内联动态导入，避免生成额外的chunk
  },
  plugins: umdPlugins,
  external: streamExternal,
  cache: true, // 启用缓存加速重新构建
  maxParallelFileOps: 20, // 并行处理优化
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    preset: 'recommended',
  },
  onwarn: baseConfig.onwarn,
};

/**
 * ESM 配置 - 用于模块化导入，支持 tree-shaking
 * 特点：
 * - 保留 ES6 模块语法，让消费者的打包工具进行 tree-shaking
 * - inlineDynamicImports: true 暂时内联动态导入，确保构建成功
 * - 对应用消费者的打包工具配置提出的要求更低
 */
const esmConfig = {
  input: 'src/index.stream.js',
  output: {
    ...esmOutputConfig,
    inlineDynamicImports: true, // 内联动态导入，避免生成额外的chunk
  },
  plugins: esmPlugins,
  external: streamExternal,
  cache: true, // 启用缓存加速重新构建
  maxParallelFileOps: 20, // 并行处理优化
  treeshake: {
    // 关键：'no-external' 意味着只对非外部模块进行副作用分析
    // 这样 codemirror 导入会被正确处理为外部依赖，不会被 bundle
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    // 确保删除未使用的代码
    preset: 'recommended',
  },
  onwarn: baseConfig.onwarn,
};

export default [umdConfig, esmConfig];
