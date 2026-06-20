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
import { generateFonts } from 'fantasticon';
import config from './fantasticon.config.js';

/**
 * 将 content 中的 unicode 十六进制恢复为大写，与历史 gulp 产物格式一致
 * @param {string} scssPath
 */
function uppercaseIconContent(scssPath) {
  const scss = fs.readFileSync(scssPath, 'utf8');
  const fixed = scss.replace(/(content: "\\)([0-9a-fA-F]+)(")/g, (_, prefix, hex, suffix) => {
    return `${prefix}${hex.toUpperCase()}${suffix}`;
  });
  fs.writeFileSync(scssPath, fixed);
}

async function main() {
  await generateFonts(config);
  uppercaseIconContent(config.pathOptions.scss);
}

main().catch((error) => {
  console.error('[iconfont] 生成失败:', error);
  process.exit(1);
});
