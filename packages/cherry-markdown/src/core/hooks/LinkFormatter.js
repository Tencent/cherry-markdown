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
import ParagraphBase from '@/core/ParagraphBase';
import { getLinkRule } from '@/utils/regexp';

/**
 * LinkFormatter：超链接内容的“护栏”预处理
 *
 * 背景：
 * 1. Cherry 在 Engine 阶段会把用户输入的 `$` 统一编码成 `~D`，然后由 InlineMath / MathBlock
 *    等段落 hook 基于 `~D` / `~D~D` / `\[ ... \]` / `\( ... \)` 识别公式。
 * 2. 但用户完全可能在 `[text](url)` 的 text 或 url 中出现 `$`、`\[`、`\(` 等字符
 *    （例如 `[价格 $10](https://a.com/?q=\[x\])`）。若不做保护，这些字符会被数学 hook
 *    误当作公式定界符，导致链接结构被破坏（URL 被误渲染成公式的一部分）。
 * 3. 过去这块保护逻辑分散在 `Link.makeHtml`（`~D ↔ ~1D` 来回替换）与 `mathDelimiter.js`
 *    （`getLinkDestinationRanges` 每次归一化都全文扫一遍 link 正则），维护成本较高，
 *    也无法覆盖 `\[` `\(` 出现在链接内部的场景。
 *
 * 方案：
 * 引入一个段落级 hook `LinkFormatter`，紧跟 `InlineCode` 之后执行：
 *   - `beforeMakeHtml`：在所有数学相关 hook 触发前，将 `[text](url)` 语法整段内的
 *      `~D`、`\[`、`\]`、`\(`、`\)` 转义为不会被下游误识别的占位符；
 *   - `afterMakeHtml`：所有段落 hook 完成后再统一还原，保证 `Link` 行内 hook 依旧
 *      拿到的是原始待渲染的字符。
 *
 * 这样数学 hook 及后续任何依赖 `~D` / `\[` / `\(` 的语法，都可以不再感知链接的存在。
 */

// 转义映射：将 link 内部的敏感字符 → 不会被下游 hook 误识别的占位符
const ESCAPE_MAP = [
  { from: /~D/g, to: '~1D' },
  { from: /\\\[/g, to: '~1LB' },
  { from: /\\\]/g, to: '~1RB' },
  { from: /\\\(/g, to: '~1LP' },
  { from: /\\\)/g, to: '~1RP' },
];

// 还原映射：afterMakeHtml 时将占位符还原为原字符
const UNESCAPE_REG = /~1(D|LB|RB|LP|RP)/g;
const UNESCAPE_MAP = {
  D: '~D',
  LB: '\\[',
  RB: '\\]',
  LP: '\\(',
  RP: '\\)',
};

export default class LinkFormatter extends ParagraphBase {
  static HOOK_NAME = 'linkFormatter';

  constructor() {
    super({ needCache: false });
    this.linkRule = getLinkRule().reg;
  }

  beforeMakeHtml(str) {
    if (!str) {
      return str;
    }
    // 只针对完整命中链接语法的片段做转义，避免误伤正文中的 ~D / \[ / \( 等
    return str.replace(this.linkRule, (match) => {
      let escaped = match;
      for (const { from, to } of ESCAPE_MAP) {
        escaped = escaped.replace(from, to);
      }
      return escaped;
    });
  }

  makeHtml(str) {
    return str;
  }

  afterMakeHtml(str) {
    if (!str) {
      return str;
    }
    return str.replace(UNESCAPE_REG, (_, key) => UNESCAPE_MAP[key]);
  }

  rule() {
    // LinkFormatter 不参与实际渲染，仅利用生命周期做预处理，此处返回一个永不命中的空规则
    return {
      begin: '',
      content: '',
      end: '',
      reg: /(?!)/g,
    };
  }
}
