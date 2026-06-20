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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, '..');
const iconsDir = path.join(packageRoot, 'src/sass/icons');
const fontsDir = path.join(packageRoot, 'dist/fonts');
const scssPath = path.join(packageRoot, 'src/sass/ch-icon.scss');
const templatePath = path.join(currentDir, 'iconfont.scss.hbs');

fs.mkdirSync(fontsDir, { recursive: true });

/**
 * 从 uEA03-list 这类文件名解析图标名与 unicode 码位
 * @param {string} basename
 */
function parseIconBasename(basename) {
  const match = basename.match(/^u([0-9a-fA-F]{4,6})-(.+)$/i);
  if (!match) {
    throw new Error(`图标文件名不符合 uXXXX-name 格式: ${basename}`);
  }

  return {
    iconName: match[2],
    codepoint: parseInt(match[1], 16),
  };
}

/**
 * 扫描 SVG 目录，构建 fantasticon 所需的 codepoints 映射
 * @returns {Record<string, number>}
 */
function loadCodepoints() {
  /** @type {Record<string, number>} */
  const codepoints = {};

  for (const fileName of fs.readdirSync(iconsDir)) {
    if (!fileName.endsWith('.svg')) {
      continue;
    }

    const { iconName, codepoint } = parseIconBasename(path.basename(fileName, '.svg'));
    if (codepoints[iconName] !== undefined) {
      throw new Error(`重复的图标名称: ${iconName}`);
    }

    codepoints[iconName] = codepoint;
  }

  if (!Object.keys(codepoints).length) {
    throw new Error(`未在 ${iconsDir} 找到 SVG 图标`);
  }

  return codepoints;
}

/** @type {import('fantasticon').RunnerOptions} */
export default {
  inputDir: iconsDir,
  outputDir: fontsDir,
  name: 'ch-icon',
  prefix: 'ch-icon',
  fontTypes: ['eot', 'woff2', 'woff', 'ttf', 'svg'],
  assetTypes: ['scss'],
  normalize: true,
  codepoints: loadCodepoints(),
  templates: {
    scss: templatePath,
  },
  pathOptions: {
    scss: scssPath,
  },
  getIconId: ({ basename }) => parseIconBasename(basename).iconName,
};
