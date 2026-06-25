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

export default {
  ...baseConfig,
  // 禁用 tree-shaking，保持最大兼容性
  treeshake: false,
  output: [
    {
      ...baseConfig.output,
      exports: 'named',
      file: 'dist/cherry-markdown.js',
      format: 'umd',
      name: 'Cherry',
      sourcemap: true,
      compact: false,
      inlineDynamicImports: true, // 禁用代码分割，强制内联所有动态导入
    },
    {
      exports: 'named',
      file: 'dist/cherry-markdown.esm.js',
      format: 'esm',
      name: 'Cherry',
      sourcemap: false,
      compact: true,
      inlineDynamicImports: true, // 禁用代码分割，强制内联所有动态导入
      plugins: [
        terserPlugin({
          module: true,
          ecma: 2015,
        }),
      ],
    },
  ],
};
