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

/**
 * 自定义插件：移除 codemirror 相关的 import 语句
 * stream 版本不需要 codemirror，但某些模块（如 Suggester）引用了它
 * 这些引用已经被标记为 external，但 import 语句仍会出现在打包产物中
 * 这个插件用于清理这些无用的 import 语句
 */
const removeCodemirrorImports = () => ({
  name: 'remove-codemirror-imports',
  renderChunk(code) {
    // 移除所有 codemirror 相关的 import 语句
    const newCode = code.replace(/import\s*{[^}]*}\s*from\s*['"]codemirror(\/src\/util\/misc)?['"];?/g, '')
                         .replace(/import\s+\w+\s+from\s*['"]codemirror['"];?/g, '');

    // 如果代码没有变化，返回原始内容以保留 sourcemap
    if (newCode === code) {
      return null;
    }

    // 返回修改后的代码，不生成 sourcemap（因为简单的正则替换无法准确映射）
    return { code: newCode, map: { mappings: '' } };
  },
});

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
  globals: {
    mermaid: 'mermaid',
    codemirror: 'CodeMirror',
    'codemirror/src/util/misc': 'CodeMirror',
  },
};

const esmOutputConfig = {
  ...baseConfig.output,
  file: 'dist/cherry-markdown.stream.esm.js',
  format: 'esm',
  name: 'Cherry',
  sourcemap: true,
  compact: true,
  plugins: [
    removeCodemirrorImports(), // 移除 codemirror 相关的 import 语句
    terserPlugin({
      module: true,
      ecma: 2015,
    }),
  ],
};

const options = {
  ...baseConfig,
  input: 'src/index.stream.js',
  output: [umdOutputConfig, esmOutputConfig],
};

if (!Array.isArray(options.external)) {
  options.external = [];
}
// 流式渲染包不需要mermaid和codemirror
options.external.push('mermaid');
options.external.push('codemirror');
options.external.push(/^codemirror\/.*/); // 排除所有codemirror子模块

export default options;
