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

// TODO: 新增完整版引擎构建, 目前引擎构建仅支持核心构建
const isCoreBuild = process.env.CORE_BUILD === 'true';

// 明确列出需要的插件，避免使用扩展运算符，保持正确的插件顺序
const basePlugins = [
  baseConfig.plugins.find(p => p.name === 'json'),
  baseConfig.plugins.find(p => p.name === 'replace'),
  baseConfig.plugins.find(p => p.name === 'alias'),
  baseConfig.plugins.find(p => p.name === 'resolve'),
  baseConfig.plugins.find(p => p.name === 'commonjs'),
  baseConfig.plugins.find(p => p.name === 'babel'),
  baseConfig.plugins.find(p => p.name === 'dist-types'),
].filter(Boolean);

const umdPlugins = [...basePlugins, terserUMD];
const esmPlugins = [...basePlugins, terserESM];

const umdOutputConfig = Object.assign(Object.create(null), {
  exports: 'named',
  file: isCoreBuild ? 'dist/cherry-markdown.engine.core.js' : 'dist/cherry-markdown.engine.js',
  format: 'umd',
  name: 'CherryEngine',
  sourcemap: true,
  compact: true,
});

const esmOutputConfig = Object.assign(Object.create(null), {
  exports: 'named',
  dir: 'dist',
  entryFileNames: isCoreBuild ? 'cherry-markdown.engine.core.esm.js' : 'cherry-markdown.engine.esm.js',
  chunkFileNames: 'engine-[hash].esm.js',
  format: 'esm',
  name: 'CherryEngine',
  sourcemap: true,
  compact: true,
});

const umdConfig = {
  input: isCoreBuild ? 'src/index.engine.core.js' : 'src/index.engine.js',
  output: umdOutputConfig,
  plugins: umdPlugins,
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  onwarn: baseConfig.onwarn,
  external: ['mermaid', 'codemirror', /^codemirror\/.*/, 'echarts'],
};

const esmConfig = {
  input: isCoreBuild ? 'src/index.engine.core.js' : 'src/index.engine.js',
  output: esmOutputConfig,
  plugins: esmPlugins,
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  onwarn: baseConfig.onwarn,
  external: ['mermaid', 'codemirror', /^codemirror\/.*/, 'echarts'],
};

export default [umdConfig, esmConfig];
