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
import { compileRegExp } from '@/utils/regexp';
import { escapeHTMLSpecialChar } from '@/utils/sanitize';
import { parseFrontMatterContent } from '@/utils/frontMatter';

export default class FrontMatter extends ParagraphBase {
  static HOOK_NAME = 'frontMatter';

  constructor(options) {
    super({ needCache: true });
  }

  beforeMakeHtml(str) {
    return str.replace(this.RULE.reg, (match, content) => {
      const lineCount = match.match(/\n/g)?.length ?? 0;
      const sign = `fontMatter${lineCount}`;
      // 解析 front-matter 内容（JSON 优先，k:v 多行兜底），逻辑由 utils/frontMatter 统一维护
      const frontmatter = parseFrontMatterContent(content);
      // empty frontmatter, skip parse
      if (Object.keys(frontmatter).length <= 0) {
        return match;
      }
      // update font-size
      if ('font-size' in frontmatter || 'fontSize' in frontmatter) {
        this.$engine.$cherry.previewer.getDom().style.fontSize = frontmatter['font-size'] || frontmatter.fontSize;
      }
      const html = `<p data-sign="${sign}" data-type="frontMatter" data-lines="${lineCount}" data-content="${escapeHTMLSpecialChar(
        JSON.stringify(frontmatter),
      )}"></p>`;
      const placeHolder = this.pushCache(html, sign, lineCount);
      return `${placeHolder}\n`;
    });
  }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  rule() {
    // 分隔行必须恰好是三个连字符，两侧只允许水平空白，且空白不能跨行。
    // 更长的分割线（------）或带后缀的行（---#）不是 front matter。
    const ret = { begin: '^\\h*-{3}\\h*\\n', end: '\\n\\h*-{3}\\h*\\n', content: '([\\s\\S]+?)' };
    ret.reg = compileRegExp(ret, 'g', true);
    return ret;
  }
}
