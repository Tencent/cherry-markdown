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

const options = {
  ...baseConfig,
  output: {
    ...baseConfig.output,
    file: 'dist/cherry-markdown.js',
    format: 'umd',
    name: 'Cherry',
    sourcemap: true,
    exports: 'named',
    // compact: true
    // paths: {
    //     echarts: 'https://cdn.jsdelivr.net/npm/echarts@4.6.0/dist/echarts.js'
    // }
  },
};

/**
 * CODESPACES is always 'true' in github codespaces
 *
 * @see https://docs.github.com/en/codespaces/developing-in-codespaces/default-environment-variables-for-your-codespace
 */
if (process.env.CODESPACES === 'true') {
  // a hack for rollup-plugin-livereload's websocket connection
  process.env.CODESANDBOX_SSE = 'true';
}

// Using Tencent Cloud Studio is always 'TRUE' for Cloud Development Environment (X_IDE_IS_CLOUDSTUDIO=TRUE)
if (process.env.X_IDE_IS_CLOUDSTUDIO === 'TRUE') {
  // a hack for rollup-plugin-livereload's websocket connection
  process.env.CODESANDBOX_SSE = 'true';
}

export default options;
