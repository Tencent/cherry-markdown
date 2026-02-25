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

// TODO: 新增完整版引擎构建, 目前引擎构建仅支持核心构建
const isCoreBuild = process.env.CORE_BUILD === 'true';

/**
 * 替换 codemirror 的动态导入为默认值，避免在构建时触发模块解析
 */
function replaceCodeMirrorImports() {
  return {
    name: 'replace-codemirror-imports',
    transform(sourceCode, id) {
      // 只在源文件中替换，跳过 node_modules
      if (id.includes('node_modules')) {
        return null;
      }

      // 将 codemirror 的动态导入替换为返回默认 Promise
      // 使用正则替换 import() 语句，避免触发代码分割
      let code = sourceCode;
      code = code.replace(/import\s*\(\s*['"]codemirror['"]\s*\)/g, 'Promise.resolve({ default: {} })');
      code = code.replace(
        /import\s*\(\s*['"]codemirror\/[^'"]+['"]\s*\)/g,
        'Promise.resolve({ default: { toString: function() { return "Pass"; } } })',
      );
      return { code };
    },
  };
}

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
  file: isCoreBuild ? 'dist/cherry-markdown.engine.core.js' : 'dist/cherry-markdown.engine.js',
  format: 'umd',
  name: 'CherryEngine',
  sourcemap: false,
  compact: true,
  plugins: [terserPlugin()],
  manualChunks: undefined, // UMD 单文件输出不需要代码分割
};

const esmOutputConfig = {
  exports: 'named',
  file: isCoreBuild ? 'dist/cherry-markdown.engine.core.esm.js' : 'dist/cherry-markdown.engine.esm.js',
  format: 'esm',
  name: 'CherryEngine',
  sourcemap: false,
  compact: true,
  plugins: [
    terserPlugin({
      module: true,
      ecma: 2015,
    }),
  ],
};

const options = {
  ...baseConfig,
  // 禁用 tree-shaking，保持最大兼容性
  treeshake: false,
  input: isCoreBuild ? 'src/index.engine.core.js' : 'src/index.engine.js',
  output: [umdOutputConfig, esmOutputConfig],
  plugins: [...(baseConfig.plugins || []), replaceCodeMirrorImports()],
};

if (!Array.isArray(options.external)) {
  options.external = [];
}
options.external.push('mermaid');

export default options;
