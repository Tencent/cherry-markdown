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
import baseConfig from './rollup.base.config.js';
import { terserUMD, terserESM } from './terser.config.js';

// 明确列出需要的插件，避免使用扩展运算符，保持正确的插件顺序
const basePlugins = [
  baseConfig.plugins.find((p) => p.name === 'json'),
  baseConfig.plugins.find((p) => p.name === 'replace'),
  baseConfig.plugins.find((p) => p.name === 'alias'),
  baseConfig.plugins.find((p) => p.name === 'resolve'),
  baseConfig.plugins.find((p) => p.name === 'commonjs'),
  baseConfig.plugins.find((p) => p.name === 'babel'),
  baseConfig.plugins.find((p) => p.name === 'dist-types'),
].filter(Boolean);

const umdPlugins = [...basePlugins, terserUMD];
const esmPlugins = [...basePlugins, terserESM];

// UMD 配置 - 单文件输出
const umdConfig = {
  input: 'src/index.js',
  output: {
    exports: 'named',
    file: 'dist/cherry-markdown.js',
    format: 'umd',
    name: 'Cherry',
    sourcemap: true,
    compact: true,
  },
  plugins: umdPlugins,
  treeshake: baseConfig.treeshake,
  onwarn: baseConfig.onwarn,
  external: baseConfig.external,
};

// ESM 配置 - 代码分割优化
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
  },
  plugins: esmPlugins,
  treeshake: baseConfig.treeshake,
  onwarn: baseConfig.onwarn,
  external: baseConfig.external,
};

// 导出配置数组
export default [umdConfig, esmConfig];
