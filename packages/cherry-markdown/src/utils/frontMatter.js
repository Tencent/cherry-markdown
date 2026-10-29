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

/**
 * Front Matter 工具函数集
 * 职责：
 *  - 识别文档顶部 `---` 包裹的 front-matter 块
 *  - 解析 front-matter 内容为对象（JSON 优先，k:v 多行兜底）
 *  - 将对象序列化为 front-matter 内容（简单键用 k:v 多行，含复杂值回退到 JSON）
 *
 * 以上行为与 `src/core/hooks/FrontMatter.js` hook 内置解析规则保持一致，保证 round-trip 不丢数据。
 */

/**
 * 构造用于匹配 front-matter 块的正则
 * 与 FrontMatter hook 的 rule() 保持一致：
 *  - 位于文档最开头
 *  - 分隔线必须恰好 3 个连字符
 *  - 允许前后出现水平空白，但不允许跨行
 * @returns {RegExp}
 */
export function getFrontMatterRegExp() {
  return /^[ \t]*-{3}[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*-{3}[ \t]*(?:\r?\n|$)/;
}

/**
 * 将 front-matter 内容字符串解析为对象
 * 解析顺序：JSON → k:v 多行
 * @param {string} content front-matter 内容（不含 `---` 分隔符）
 * @returns {Record<string, any>}
 */
export function parseFrontMatterContent(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) return {};
  try {
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return obj;
    }
  } catch (e) {
    // fallthrough to k:v parser
  }
  /** @type {Record<string, any>} */
  const result = {};
  trimmed.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx <= 0) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key || key.length > 1024) return;
    result[key] = value;
  });
  return result;
}

/**
 * 将对象序列化为 front-matter 内容字符串（不含 `---` 分隔符）
 * 规则：
 *  - 全部为简单键（value 是 string/number/boolean/null）→ 使用 k:v 多行格式，可读性更好
 *  - 存在复杂值（数组/对象）→ 使用 JSON 格式，保证 round-trip 不丢数据
 * @param {Record<string, any>} data
 * @returns {string}
 */
export function stringifyFrontMatter(data) {
  const keys = Object.keys(data || {});
  if (keys.length === 0) return '';
  const isSimple = keys.every((k) => {
    const v = data[k];
    return v === null || ['string', 'number', 'boolean'].includes(typeof v);
  });
  if (isSimple) {
    return keys.map((k) => `${k}: ${data[k] === null ? '' : String(data[k])}`).join('\n');
  }
  return JSON.stringify(data, null, 2);
}
