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

const umdOutputConfig = {
  ...baseConfig.output,
  exports: 'named',
  file: isCoreBuild ? 'dist/cherry-markdown.engine.core.js' : 'dist/cherry-markdown.engine.js',
  format: 'umd',
  name: 'CherryEngine',
  sourcemap: true,
  compact: true,
  plugins: [terserUMD],
};

const esmOutputConfig = {
  ...baseConfig.output,
  file: isCoreBuild ? 'dist/cherry-markdown.engine.core.esm.js' : 'dist/cherry-markdown.engine.esm.js',
  format: 'esm',
  name: 'CherryEngine',
  sourcemap: true,
  compact: true,
  plugins: [terserESM],
};

const options = {
  ...baseConfig,
  input: isCoreBuild ? 'src/index.engine.core.js' : 'src/index.engine.js',
  output: [umdOutputConfig, esmOutputConfig],
};

if (!Array.isArray(options.external)) {
  options.external = [];
}
options.external.push('mermaid');

export default options;
