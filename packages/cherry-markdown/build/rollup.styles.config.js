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
import scss from 'rollup-plugin-scss';
import dartSass from 'sass';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * @type {import('rollup').RollupOptions}
 */
const options = [
  {
    input: 'src/sass/index.scss',
    output: {
      file: 'dist/cherry-markdown.styles.js',
    },
    plugins: [
      scss({
        // Filename to write all styles to
        fileName: IS_PRODUCTION ? 'cherry-markdown.min.css' : 'cherry-markdown.css',

        // Determine if node process should be terminated on error (default: false)
        failOnError: true,
        ...(IS_PRODUCTION && {
          outputStyle: 'compressed',
        }),
        sass: dartSass,
        watch: ['src/sass'],
      }),
      {
        generateBundle: (option, bundle) => {
          // remove all non-asset files from bundle
          Object.keys(bundle).forEach((key) => {
            if (bundle[key].type !== 'asset') {
              delete bundle[key];
            }
          });
        },
      },
    ],
  },
  {
    input: 'src/sass/markdown_pure.scss',
    output: {
      file: 'dist/cherry-previewer.styles.js',
    },
    plugins: [
      scss({
        fileName: IS_PRODUCTION ? 'cherry-markdown.markdown.min.css' : 'cherry-markdown.markdown.css',
        // node进程是否在错误时终止
        failOnError: true,
        ...(IS_PRODUCTION && {
          outputStyle: 'compressed',
        }),
        sass: dartSass,
      }),
      {
        generateBundle: (option, bundle) => {
          // remove all non-asset files from bundle
          Object.keys(bundle).forEach((key) => {
            if (bundle[key].type !== 'asset') {
              delete bundle[key];
            }
          });
        },
      },
    ],
  },
];

export default options;
