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
/* eslint-env commonjs */
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        // 'targets': 'defaults, not ie < 10'
        // useBuiltIns: 'usage',
        // corejs: 3
      },
    ],
  ],
  env: {
    test: {
      presets: [['@babel/preset-env']],
    },
  },
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: 3,
      },
    ],
    [
      '@babel/plugin-proposal-decorators',
      {
        legacy: true,
      },
    ],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
    [
      'prismjs',
      {
        languages: [
          'c',
          'csharp',
          'cpp',
          'css',
          'dart',
          'diff',
          'docker',
          'git',
          'glsl',
          'go',
          'go-mod',
          'graphql',
          'haml',
          'ini',
          'java',
          'javascript',
          'json',
          'json5',
          'less',
          'lua',
          'markdown',
          'markup',
          'matlab',
          'mongodb',
          'nginx',
          'objc',
          'pascal',
          'php',
          'protobuf',
          'python',
          'r',
          'regex',
          'ruby',
          'rust',
          'jsx',
          'tsx',
          'sass',
          'scss',
          'shell',
          'sql',
          'swift',
          'typescript',
          'vb',
          'wasm',
          'yaml',
        ],
        plugins: [],
        css: false,
      },
    ],
  ],
};
