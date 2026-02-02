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
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import alias from '@rollup/plugin-alias';
import babelConfig from '../babel.config.mjs';
import json from '@rollup/plugin-json';
import envReplacePlugin from './env.js';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const currentDir = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT_PATH = path.resolve(currentDir, '..');

const aliasPluginOptions = {
  entries: [
    {
      find: '@',
      replacement: path.resolve(PROJECT_ROOT_PATH, 'src'),
    },
  ],
};

/**
 * @type {import('rollup').RollupOptions}
 */
const options = {
  input: 'src/index.js',
  output: {
    globals: {
      jsdom: 'jsdom',
    },
  },
  // 性能优化：启用缓存加速二次构建
  cache: true,

  // 并行处理优化
  maxParallelFileOps: 20,

  // Tree-shake 配置 - 平衡优化和兼容性
  treeshake: {
    // 标记模块副作用
    moduleSideEffects: (id) => {
      // CSS 文件有副作用
      if (id.endsWith('.css')) return true;

      // 源代码模块默认有副作用，避免错误 tree-shake
      // 注意：package.json 的 sideEffects 字段也会被考虑
      if (!/node_modules[\\/]/.test(id)) {
        return true;
      }

      // 对特定第三方库保持保守，避免错误 tree-shake
      // crypto-js、mermaid、echarts、codemirror 等库在 tree-shake 时会出问题
      if (id.includes('crypto-js') || id.includes('mermaid') || id.includes('echarts') || id.includes('codemirror')) {
        return true;
      }
      // prismjs 及其组件有副作用（将语言注册到 Prism.languages）
      if (id.includes('prismjs')) {
        return true;
      }

      // 其他 node_modules 可以安全地 tree-shake
      return false;
    },
    // 禁用属性读取副作用检查，确保 Prism.languages 赋值不被优化掉
    propertyReadSideEffects: true,
  },
  plugins: [
    // Only run ESLint in builds that explicitly enable it. Default: disabled to avoid
    // parser errors when tools load ESM Babel configs during rollup CLI execution.
    ...(process.env.ENABLE_ESLINT === 'true'
      ? [
          eslint({
            exclude: ['**/node_modules/**', 'src/libs/**'],
            // don't fail the whole build on lint parse errors; allow bundling to continue
            throwOnError: false,
            throwOnWarning: false,
          }),
        ]
      : []),
    json(),
    envReplacePlugin(),
    alias(aliasPluginOptions),
    resolve({
      browser: true,
      // 优化：优先使用 ESM 模块
      preferBuiltins: false,
      mainFields: ['module', 'browser', 'main'],
      // 去重依赖，避免重复打包
      dedupe: ['lodash', 'lodash-es'],
      // 扩展解析
      extensions: ['.mjs', '.js', '.json', '.node'],
    }),
    commonjs({
      // non-CommonJS modules will be ignored, but you can also
      // specifically include/exclude files
      include: [/node_modules/, /src[\\/]libs/], // Default: undefined
      exclude: [/node_modules[\\/](lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/],

      // search for files other than .js files (must already
      // be transpiled by a previous plugin!)
      extensions: ['.js'], // Default: [ '.js' ]

      // if true then uses of `global` won't be dealt with by this plugin
      ignoreGlobal: false, // Default: false

      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: !IS_PRODUCTION, // Default: true

      // 优化：忽略动态 require
      ignoreDynamicRequires: true,

      // 性能优化：严格模式检查
      strictRequires: 'auto',

      // 默认导出模式
      defaultIsModuleExports: 'auto',
    }),
    babel({
      // use inline config to avoid Babel attempting to load an ESM config file asynchronously
      babelHelpers: 'runtime',
      // 默认转译所有代码（包括 node_modules 和 src/libs），确保 ES5 兼容性
      // 仅排除 core-js（polyfill 本身不需要转译）
      exclude: [/node_modules[\\/]core-js/],
      babelrc: false,
      configFile: false,
      presets: babelConfig.presets,
      plugins: babelConfig.plugins,
    }),
    // TODO: 重构抽出为独立的插件
    {
      name: 'dist-types',
      generateBundle(options, bundle, isWrite) {
        const bundles = Object.keys(bundle);
        bundles.forEach((fileName) => {
          if (!fileName.endsWith('.js')) {
            return;
          }
          const file = bundle[fileName];

          // 只为入口文件生成类型声明
          if (!file.isEntry) {
            return;
          }

          const fileBaseName = fileName.replace(/\.js$/, '');

          // 获取 facadeModuleId，如果不存在则跳过
          if (!file.facadeModuleId) {
            return;
          }

          const entryFileName = file.facadeModuleId.split(/[/\\]/).pop();
          const entryFileBase = entryFileName.replace(/\.js$/, '');

          // 确保 file.exports 是数组
          const exports = Array.isArray(file.exports) ? file.exports : [];
          const namedExports = exports.filter((name) => name !== 'default');

          // 使用 options.name 或 file.name
          const defaultName = options?.name || file?.name || 'Cherry';

          const source = [
            `import ${defaultName}, { ${namedExports.join(', ')} } from "./types/${entryFileBase}";`,
            `export { ${namedExports.join(', ')} };`,
            `export default ${defaultName};`,
          ].join('\n');
          this.emitFile({
            type: 'asset',
            fileName: `${fileBaseName}.d.ts`,
            source,
          });
        });
      },
    },
  ],
  onwarn(warning, warn) {
    // 忽略 juice 和 d3 的 circular dependency
    try {
      if (
        warning &&
        warning.code === 'CIRCULAR_DEPENDENCY' &&
        typeof warning.importer === 'string' &&
        (warning.importer.includes('node_modules/juice') || warning.importer.includes('node_modules/d3-'))
      ) {
        return;
      }

      // 忽略 Babel helper 的未使用导入警告（这是 Babel 转译的正常行为）
      // 使用更宽松的匹配，因为 warning.message 可能是对象
      const messageStr = warning.message ? String(warning.message) : warning.exporter ? warning.exporter : '';

      if (
        warning &&
        messageStr &&
        (messageStr.includes('readOnlyError') ||
          messageStr.includes('assertThisInitialized') ||
          messageStr.includes('objectDestructuringEmpty') ||
          messageStr.includes('@babel/runtime'))
      ) {
        return;
      }

      // 忽略全局变量名称警告（UMD 构建中常见的无害警告）
      if (warning && warning.code === 'MISSING_GLOBAL_NAME') {
        return;
      }
    } catch (e) {
      // 如果 warning 对象结构异常，安全地回退到默认行为
    }
    warn(warning);
  },
  external: ['jsdom'],
  // external: ['echarts']
};

export default options;

/**
 * 从 baseConfig 中提取基础插件
 * @param {string} name - 插件名称
 * @returns {object} 插件实例
 * @throws {Error} 如果插件未找到
 */
export function getBasePlugin(name) {
  const plugin = options.plugins.find((p) => p.name === name);
  if (!plugin) {
    throw new Error(
      `Required Rollup plugin '${name}' not found in baseConfig.plugins. Please check the plugin configuration in rollup.base.config.js`
    );
  }
  return plugin;
}

/**
 * 获取常用的基础插件集合
 * @returns {Array} 基础插件数组
 */
export function getBasePlugins() {
  const pluginNames = ['json', 'replace', 'alias', 'node-resolve', 'commonjs', 'babel', 'dist-types'];
  return pluginNames.map((name) => getBasePlugin(name)).filter(Boolean);
}

