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
import baseConfig, { getBasePlugins } from './rollup.base.config.js';
import { terserUMD, terserESM } from './terser.config.js';

// 使用统一的插件提取函数
const basePlugins = getBasePlugins();

const umdPlugins = [...basePlugins, terserUMD];
const esmPlugins = [...basePlugins, terserESM];

/**
 * UMD 配置 - 单文件输出
 * 特点：完整打包，包含所有依赖（codemirror、mermaid、echarts）
 */
const umdConfig = {
  input: 'src/index.js',
  output: {
    exports: 'named',
    file: 'dist/cherry-markdown.js',
    format: 'umd',
    name: 'Cherry',
    sourcemap: true,
    compact: true,
    // 禁用 inlineDynamicImports 以避免类定义外的代码被 tree shaking 优化掉
    // 这对于静态属性（如 Cherry.constants）的保留是必要的
    inlineDynamicImports: false,
  },
  plugins: umdPlugins,
  cache: true, // 启用缓存加速重新构建
  maxParallelFileOps: 20, // 并行处理优化
  treeshake: baseConfig.treeshake,
  onwarn: baseConfig.onwarn,
  external: baseConfig.external,
};

/**
 * ESM 配置 - 代码分割优化
 * 特点：保留 ES6 模块语法支持 tree-shaking，允许消费者按需引入
 */
const esmConfig = {
  input: 'src/index.js',
  output: {
    exports: 'named',
    dir: 'dist',
    entryFileNames: 'cherry-markdown.esm.js',
    chunkFileNames: '[name]-[hash].esm.js',
    format: 'esm',
    name: 'Cherry',
    sourcemap: true,
    compact: true,
    interop: 'auto',
    inlineDynamicImports: false,
    // 保留导出符号的完整性，确保静态属性不被优化掉
    preserveEntrySignatures: 'strict',
    // 性能优化：自动代码分割
    manualChunks(id) {
      // 将 node_modules 中的依赖分离到 vendor chunk
      if (id.includes('node_modules')) {
        // 大型库单独分割
        if (id.includes('codemirror')) return 'vendor-codemirror';
        if (id.includes('mermaid')) return 'vendor-mermaid';
        if (id.includes('echarts')) return 'vendor-echarts';
        if (id.includes('prismjs')) return 'vendor-prism';
        // 其他依赖
        return 'vendor';
      }
    },
  },
  plugins: esmPlugins,
  cache: true, // 启用缓存加速重新构建
  maxParallelFileOps: 20, // 并行处理优化
  treeshake: baseConfig.treeshake,
  onwarn: baseConfig.onwarn,
  external: baseConfig.external,
};

// 导出配置数组
export default [umdConfig, esmConfig];
