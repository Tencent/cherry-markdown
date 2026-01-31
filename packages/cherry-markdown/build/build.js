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

export default {
  ...baseConfig,
  output: [
    // UMD 格式
    {
      ...baseConfig.output,
      exports: 'named',
      file: 'dist/cherry-markdown.js',
      format: 'umd',
      name: 'Cherry',
      sourcemap: true,
      compact: true,
      plugins: [terserUMD],
      // UMD 使用 manualChunks 合并为单个文件
      manualChunks: () => 'cherry',
      // 指定全局变量名
      globals: {
        ...baseConfig.output.globals,
        codemirror: 'CodeMirror',
      },
    },
    // ESM 格式 - 使用 dir 而不是 file，因为移除了 manualChunks
    {
      ...baseConfig.output,
      exports: 'named',
      dir: 'dist',
      entryFileNames: 'cherry-markdown.esm.js',
      format: 'esm',
      name: 'Cherry',
      sourcemap: true,
      compact: true,
      plugins: [terserESM],
      // 内联动态导入，保持单个文件
      inlineDynamicImports: true,
    },
  ],
};
