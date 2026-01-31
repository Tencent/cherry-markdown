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

const umdOutputConfig = {
  ...baseConfig.output,
  exports: 'named',
  file: 'dist/cherry-markdown.stream.js',
  format: 'umd',
  name: 'Cherry',
  sourcemap: true,
  compact: true,
  plugins: [terserPlugin()],
  // UMD 使用 manualChunks 合并为单个文件，保持兼容性
  manualChunks: () => 'cherry',
  // 指定全局变量名
  globals: {
    ...baseConfig.output.globals,
    'codemirror': 'CodeMirror',
    'codemirror/src/util/browser': 'CodeMirror.browser',
    'codemirror/src/util/misc': 'CodeMirror',
  },
};

const esmOutputConfig = {
  ...baseConfig.output,
  dir: 'dist',
  entryFileNames: 'cherry-markdown.stream.esm.js',
  format: 'esm',
  name: 'Cherry',
  sourcemap: true,
  compact: true,
  // ESM 不使用 manualChunks，启用 tree-shaking
  // 内联动态导入，保持单个文件
  inlineDynamicImports: true,
  plugins: [
    terserPlugin({
      module: true,
      ecma: 2015,
      compress: {
        ecma: 2015,
        passes: 2,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        dead_code: true,
        // 启用更激进的压缩
        pure_getters: true,
        unused: true,
      },
    }),
  ],
};

const options = {
  ...baseConfig,
  input: 'src/index.stream.js',
  output: [umdOutputConfig, esmOutputConfig],
  // Stream 模式下排除依赖，减少打包体积
  external: (id) => {
    // 排除默认版 hooks-config
    if (id.includes('hooks-config/default.js')) return true;
    // 排除 codemirror 及其子模块
    if (/^codemirror(\/|$)/.test(id)) return true;
    if (id.includes('codemirror/')) return true;
    // 排除 mermaid
    if (id === 'mermaid' || id.includes('node_modules/mermaid')) return true;
    return false;
  },
};

// Stream 模式下排除完整版 hooks-config
// 因为 Engine.js 默认导入它，但我们通过 CherryStream 传入了 stream 版本的配置
// 这里通过 external 配置排除它，防止被打包

export default options;
