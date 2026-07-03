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
import sass from 'rollup-plugin-sass';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * @type {import('rollup').RollupOptions}
 */
const createCleanupPlugin = () => ({
  name: 'remove-non-asset-artifacts',
  generateBundle: (_option, bundle) => {
    const removableKeys = Object.keys(bundle).filter((key) => bundle[key].type !== 'asset');
    removableKeys.forEach((key) => {
      delete bundle[key];
    });
  },
});

const createStyleConfigs = ({ input, cssBaseName, outputBaseName, watch: _watch }) => {
  const configs = [
    {
      input,
      treeshake: false,
      output: {
        file: `dist/${outputBaseName}.styles.js`,
      },
      plugins: [
        sass({
          api: 'modern',
          output: `dist/${cssBaseName}.css`,
          options: { style: 'expanded' },
        }),
        createCleanupPlugin(),
      ],
    },
  ];

  if (IS_PRODUCTION) {
    configs.push({
      input,
      treeshake: false,
      output: {
        file: `dist/${outputBaseName}.styles.min.js`,
      },
      plugins: [
        sass({
          api: 'modern',
          output: `dist/${cssBaseName}.min.css`,
          options: { style: 'compressed' },
        }),
        createCleanupPlugin(),
      ],
    });
  }

  return configs;
};

const options = [
  ...createStyleConfigs({
    input: 'src/sass/index.scss',
    cssBaseName: 'cherry-markdown',
    outputBaseName: 'cherry-markdown',
    watch: ['src/sass'],
  }),
  ...createStyleConfigs({
    input: 'src/sass/markdown_pure.scss',
    cssBaseName: 'cherry-markdown.markdown',
    outputBaseName: 'cherry-previewer',
  }),
];

export default options;
