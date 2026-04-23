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
import * as dartSass from 'sass';
import path from 'node:path';
// baseConfig not used in styles config

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * @type {import('rollup').RollupOptions}
 */
const createCleanupPlugin = () => ({
  name: 'remove-non-asset-artifacts',
  generateBundle: (option, bundle) => {
    Object.keys(bundle).forEach((key) => {
      if (bundle[key].type !== 'asset') {
        delete bundle[key];
      }
    });
  },
});

const createSassAssetPlugin = ({ input, fileName, style = 'expanded', watch }) => ({
  name: `sass-asset:${fileName}`,
  transform(code, id) {
    if (path.resolve(id) !== path.resolve(input)) {
      return null;
    }

    return {
      code: 'export default undefined;',
      map: { mappings: '' },
    };
  },
  buildStart() {
    if (watch) {
      const files = Array.isArray(watch) ? watch : [watch];
      files.forEach((file) => this.addWatchFile(file));
    }
  },
  async generateBundle() {
    const entryFile = path.resolve(input);
    const result = await dartSass.compileAsync(entryFile, {
      loadPaths: ['node_modules', process.cwd()],
      style,
      charset: false,
    });

    this.emitFile({
      type: 'asset',
      fileName,
      source: result.css,
    });
  },
});

const createStyleConfigs = ({ input, cssBaseName, outputBaseName, watch }) => {
  const configs = [
    {
      input,
      output: {
        file: `dist/${outputBaseName}.styles.js`,
      },
      plugins: [
        createSassAssetPlugin({
          input,
          fileName: `${cssBaseName}.css`,
          watch,
        }),
        createCleanupPlugin(),
      ],
    },
  ];

  if (IS_PRODUCTION) {
    configs.push({
      input,
      output: {
        file: `dist/${outputBaseName}.styles.min.js`,
      },
      plugins: [
        createSassAssetPlugin({
          input,
          fileName: `${cssBaseName}.min.css`,
          style: 'compressed',
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
