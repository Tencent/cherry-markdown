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
import path from 'path';
import babel from '@rollup/plugin-babel';
// node-resolve升级会导致出现新问题
import resolve from 'rollup-plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import scss from 'rollup-plugin-scss';
import eslint from '@rollup/plugin-eslint';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import envReplacePlugin from './env';
import dartSass from 'sass';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
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

export default {
  input: 'src/index.js',
  output: {
    globals: {
      jsdom: 'jsdom',
    },
  },
  plugins: [
    eslint({
      exclude: ['node_modules/**', 'src/sass/**', 'src/libs/**'],
    }),
    json(),
    envReplacePlugin(),
    alias(aliasPluginOptions),
    resolve({
      ignoreGlobal: false,
      browser: true,
    }),
    commonjs({
      // non-CommonJS modules will be ignored, but you can also
      // specifically include/exclude files
      include: [/node_modules/, /src[\\/]libs/], // Default: undefined
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
    scss({
      // Filename to write all styles to
      output: IS_PRODUCTION ? 'dist/cherry-markdown.min.css' : 'dist/cherry-markdown.css',

      // Determine if node process should be terminated on error (default: false)
      failOnError: true,
      ...(IS_PRODUCTION && {
        outputStyle: 'compressed',
      }),
      sass: dartSass,
    }),
    babel({
      babelHelpers: 'runtime',
      exclude: [/node_modules[\\/](?!codemirror[\\/]src[\\/]|parse5)/],
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
    // 忽略 mermaid 的 eval
    if (warning.code === 'EVAL' && warning.id.indexOf('mermaid') !== -1) {
      return;
    }
    // 忽略 juice 的 circular dependency
    if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.importer.includes('node_modules/juice')) {
      return;
    }
    warn(warning);
  },
  external: [/@babel[\\/]runtime/, 'jsdom'],
  // external: ['echarts']
};
