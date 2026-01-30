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
import terser from '@rollup/plugin-terser';
import baseConfig from './rollup.base.config.js';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

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

// 明确列出需要的插件，避免使用扩展运算符，保持正确的插件顺序
const basePlugins = [
  baseConfig.plugins.find((p) => p.name === 'json'),
  baseConfig.plugins.find((p) => p.name === 'replace'),
  baseConfig.plugins.find((p) => p.name === 'alias'),
  // 自定义 resolve 插件，确保 prismjs 组件能被正确打包
  resolve({
    browser: true,
    preferBuiltins: false,
    mainFields: ['module', 'browser', 'main'],
    exportConditions: ['default', 'module'],
    resolveOnly: [],
  }),
  // 自定义 commonjs 插件，确保 prismjs 组件被正确转换
  commonjs({
    include: [/node_modules/, /src[\\/]libs/],
    exclude: [/node_modules[\\/](lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/],
    extensions: ['.js'],
    ignoreGlobal: false,
    sourceMap: false,
    ignoreDynamicRequires: true,
  }),
  baseConfig.plugins.find((p) => p.name === 'babel'),
  baseConfig.plugins.find((p) => p.name === 'dist-types'),
].filter(Boolean);

const umdPlugins = [...basePlugins, terserPlugin()];
const esmPlugins = [...basePlugins, terserPlugin({ module: true, ecma: 2015 })];

const umdOutputConfig = Object.assign(Object.create(null), {
  exports: 'named',
  file: 'dist/cherry-markdown.stream.js',
  format: 'umd',
  name: 'Cherry',
  sourcemap: true,
  compact: true,
  inlineDynamicImports: true,
  globals: {
    mermaid: 'mermaid',
    codemirror: 'CodeMirror',
    'codemirror/src/util/misc': 'CodeMirror',
    prism: 'Prism',
  },
});

const esmOutputConfig = Object.assign(Object.create(null), {
  exports: 'named',
  dir: 'dist',
  entryFileNames: 'cherry-markdown.stream.esm.js',
  chunkFileNames: 'stream-[hash].esm.js',
  format: 'esm',
  name: 'Cherry',
  sourcemap: true,
  compact: true,
  interop: 'auto',
  inlineDynamicImports: true,
});

const streamExternal = [
  ...(baseConfig.external || []),
  'mermaid',
  'codemirror',
  /^codemirror\/.*/,
  'echarts',
  // codemirror 的类型导入和工具模块
  'codemirror/src/util/misc',
  'codemirror/src/util/browser',
];

const umdConfig = {
  input: 'src/index.stream.js',
  output: umdOutputConfig,
  plugins: umdPlugins,
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  onwarn: baseConfig.onwarn,
  external: streamExternal,
};

const esmConfig = {
  input: 'src/index.stream.js',
  output: esmOutputConfig,
  plugins: esmPlugins,
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  onwarn: baseConfig.onwarn,
  external: streamExternal,
};

export default [umdConfig, esmConfig];
