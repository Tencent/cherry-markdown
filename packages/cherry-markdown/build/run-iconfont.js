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
import { createFont, woff2 } from 'fonteditor-core';
import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, '..');
const iconsDir = path.join(packageRoot, 'src/sass/icons');
const fontsDir = path.join(packageRoot, 'dist/fonts');
const scssPath = path.join(packageRoot, 'src/sass/ch-icon.scss');
const fontName = 'ch-icon';
const fontPrefix = 'ch-icon';

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
 * 使用 fs 扫描 SVG 目录，避免 fantasticon/glob 在 Windows 下失效
 * @returns {Array<{ iconName: string, codepoint: number, filePath: string }>}
 */
function loadIconEntries() {
  /** @type {Array<{ iconName: string, codepoint: number, filePath: string }>} */
  const entries = [];

  for (const fileName of fs.readdirSync(iconsDir)) {
    if (!fileName.endsWith('.svg')) {
      continue;
    }

    const { iconName, codepoint } = parseIconBasename(path.basename(fileName, '.svg'));
    if (entries.some((entry) => entry.iconName === iconName)) {
      throw new Error(`重复的图标名称: ${iconName}`);
    }

    entries.push({
      iconName,
      codepoint,
      filePath: path.join(iconsDir, fileName),
    });
  }

  if (!entries.length) {
    throw new Error(`未在 ${iconsDir} 找到 SVG 图标`);
  }

  return entries.sort((a, b) => a.codepoint - b.codepoint);
}

/**
 * 使用 svgicons2svgfont 合并 SVG 为 SVG 字体
 * @param {ReturnType<typeof loadIconEntries>} entries
 */
function buildSvgFont(entries) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    const fontStream = new SVGIcons2SVGFontStream({
      fontName,
      fontId: fontName,
      normalize: true,
    });

    fontStream.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    fontStream.on('error', reject);
    fontStream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    for (const entry of entries) {
      const glyphStream = fs.createReadStream(entry.filePath);
      glyphStream.metadata = {
        unicode: [String.fromCodePoint(entry.codepoint)],
        name: entry.iconName,
      };
      fontStream.write(glyphStream);
    }

    fontStream.end();
  });
}

/**
 * 生成与 templates/iconfont.scss.hbs 一致的 scss
 * @param {ReturnType<typeof loadIconEntries>} entries
 */
function buildScss(entries) {
  const iconRules = entries
    .map(({ iconName, codepoint }) => {
      const hex = codepoint.toString(16).toUpperCase();
      return `.${fontPrefix}-${iconName}:before { content: "\\${hex}" }`;
    })
    .join('\n');

  return `@font-face {
  font-family: "${fontName}";
  src: url('./fonts/${fontName}.eot');
  src: url('./fonts/${fontName}.eot?#iefix') format('eot'),
    url('./fonts/${fontName}.woff2') format('woff2'),
    url('./fonts/${fontName}.woff') format('woff'),
    url('./fonts/${fontName}.ttf') format('truetype'),
    url('./fonts/${fontName}.svg#${fontName}') format('svg');
  font-weight: normal;
  font-style: normal;
}

.${fontPrefix}:before {
  display: inline-block;
  font-family: "${fontName}";
  font-style: normal;
  font-weight: normal;
  //line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

${iconRules}
`;
}

/**
 * 写入各格式字体文件
 * @param {import('fonteditor-core').Font} font
 */
async function writeFontFiles(font) {
  await woff2.init();

  /** @type {Array<'ttf' | 'woff' | 'woff2' | 'eot' | 'svg'>} */
  const formats = ['ttf', 'woff', 'woff2', 'eot', 'svg'];

  for (const type of formats) {
    const buffer = font.write({ type });
    await fs.promises.writeFile(path.join(fontsDir, `${fontName}.${type}`), Buffer.from(buffer));
  }
}

async function main() {
  const entries = loadIconEntries();
  const svgFont = await buildSvgFont(entries);
  const font = createFont(svgFont, { type: 'svg', combinePath: false });
  const fontObject = font.get();

  fontObject.name.fontFamily = fontName;
  fontObject.name.fontSubFamily = 'Regular';
  fontObject.name.fullName = fontName;
  fontObject.name.postScriptName = fontName;
  font.set(fontObject);

  await fs.promises.mkdir(fontsDir, { recursive: true });
  await writeFontFiles(font);
  await fs.promises.writeFile(scssPath, buildScss(entries));

  console.log(`[iconfont] 已生成 ${entries.length} 个图标`);
  console.log(`[iconfont] 字体: ${fontsDir}`);
  console.log(`[iconfont] 样式: ${scssPath}`);
}

main().catch((error) => {
  console.error('[iconfont] 生成失败:', error);
  process.exit(1);
});
