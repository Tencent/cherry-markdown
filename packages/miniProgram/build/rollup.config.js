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
import alias from '@rollup/plugin-alias';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import babelConfig from '../../cherry-markdown/babel.config.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(currentDir, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '../..');
const CHERRY_SRC = path.resolve(REPO_ROOT, 'packages/cherry-markdown/src');
const MINI_PROGRAM_SANITIZER = path.resolve(PACKAGE_ROOT, 'src/shared/Sanitizer.miniProgram.js');

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

const sharedPlugins = [
  json(),
  replace({
    preventAssignment: false,
    BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
  }),
  alias({
    entries: [
      { find: '@/Sanitizer', replacement: MINI_PROGRAM_SANITIZER },
      { find: '@', replacement: CHERRY_SRC },
      { find: '@cherry', replacement: CHERRY_SRC },
    ],
  }),
  resolve({
    browser: true,
    preferBuiltins: false,
    exportConditions: ['browser', 'import', 'default'],
  }),
  commonjs({
    include: [/node_modules/, /packages[/]cherry-markdown[/]src[/]libs/],
    exclude: [/node_modules[/](lodash-es|d3-.*[/]src|d3[/]src|dagre-d3-es)/],
    extensions: ['.js'],
    ignoreGlobal: false,
    sourceMap: process.env.NODE_ENV !== 'production',
  }),
  babel({
    babelHelpers: 'runtime',
    exclude: [/node_modules[/](?!codemirror[/]src[/]|parse5|lodash-es|d3-.*[/]src|d3[/]src|dagre-d3-es)/],
    babelrc: false,
    configFile: false,
    presets: babelConfig.presets,
    plugins: babelConfig.plugins,
  }),
];

const sharedExternal = ['mermaid', 'codemirror', /^codemirror\/.*/];

export default {
  input: 'src/index.js',
  output: {
    exports: 'named',
    file: 'dist/miniProgram.esm.js',
    format: 'esm',
    sourcemap: false,
    compact: true,
    plugins: [terserPlugin({ module: true, ecma: 2015 })],
  },
  treeshake: false,
  plugins: sharedPlugins,
  external: sharedExternal,
};
