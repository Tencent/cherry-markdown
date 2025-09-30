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
import path from 'path';
import { fileURLToPath } from 'url';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import alias from '@rollup/plugin-alias';
import babelConfig from '../babel.config.js';
import json from '@rollup/plugin-json';
import envReplacePlugin from './env.js';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT_PATH = path.resolve(__dirname, '..');
/** 构建目标是否 node */
const IS_COMMONJS_BUILD = process.env.BUILD_TARGET === 'commonjs';

const aliasPluginOptions = {
  entries: [
    {
      find: '@',
      replacement: path.resolve(PROJECT_ROOT_PATH, 'src'),
    },
  ],
};

if (IS_COMMONJS_BUILD) {
  aliasPluginOptions.entries.unshift({
    find: '@/Sanitizer',
    replacement: path.resolve(PROJECT_ROOT_PATH, 'src', 'Sanitizer.node.js'),
  });
}

/**
 * @type {import('rollup').RollupOptions}
 */
const options = {
  input: 'src/index.js',
  output: {
    globals: {
      jsdom: 'jsdom',
    },
    // disable code splitting
    manualChunks: () => 'cherry',
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
      // ignoreGlobal: false,
      browser: true,
    }),
    commonjs({
      // non-CommonJS modules will be ignored, but you can also
      // specifically include/exclude files
      include: [/node_modules/, /src[\\/]libs/], // Default: undefined
      exclude: [/node_modules[\\/](lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/],
      // exclude: [/src\/(?!libs)/],
      // exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],  // Default: undefined
      // these values can also be regular expressions
      // include: /node_modules/

      // search for files other than .js files (must already
      // be transpiled by a previous plugin!)
      extensions: ['.js'], // Default: [ '.js' ]

      // if true then uses of `global` won't be dealt with by this plugin
      ignoreGlobal: false, // Default: false

      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: !IS_PRODUCTION, // Default: true

      // explicitly specify unresolvable named exports
      // (see below for more details)
      // namedExports: { 'react': ['createElement', 'Component' ] },  // Default: undefined

      // sometimes you have to leave require statements
      // unconverted. Pass an array containing the IDs
      // or a `id => boolean` function. Only use this
      // option if you know what you're doing!
      // ignore: [ 'conditional-runtime-dependency' ]
    }),
    babel({
      // use inline config to avoid Babel attempting to load an ESM config file asynchronously
      babelHelpers: 'runtime',
      exclude: [/node_modules[\\/](?!codemirror[\\/]src[\\/]|parse5|lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/],
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
          const fileBaseName = fileName.replace(/\.js$/, '');
          const entryFileName = file.facadeModuleId.split(/[/\\]/).pop();
          const entryFileBase = entryFileName.replace(/\.js$/, '');
          const namedExports = file.exports.filter((name) => name !== 'default');
          const defaultName = options.name;
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
    // 忽略 juice 的 circular dependency
    try {
      if (
        warning &&
        warning.code === 'CIRCULAR_DEPENDENCY' &&
        (typeof warning.importer === 'string' && (warning.importer.includes('node_modules/juice') || warning.importer.includes('node_modules/d3-')))
      ) {
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
