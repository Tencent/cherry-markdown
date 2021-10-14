/**
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.
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
import { terser } from 'rollup-plugin-terser';
import baseConfig from './rollup.base.config';

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
  output: [
    {
      ...baseConfig.output,
      exports: 'named',
      file: 'dist/cherry-markdown.min.js',
      format: 'umd',
      name: 'Cherry',
      sourcemap: false,
      compact: true,
      plugins: [terserPlugin()],
    },
    {
      ...baseConfig.output,
      file: 'dist/cherry-markdown.esm.js',
      format: 'esm',
      name: 'Cherry',
      sourcemap: false,
      compact: true,
      plugins: [
        terserPlugin({
          module: true,
          ecma: 2015,
        }),
      ],
    },
  ],
};
