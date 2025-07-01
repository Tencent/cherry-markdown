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

export default class FrontMatter extends ParagraphBase {
  static HOOK_NAME = 'frontMatter';

  constructor(options) {
    super({ needCache: true });
  }

  beforeMakeHtml(str) {
    return str.replace(this.RULE.reg, (match, content) => {
      const lineCount = match.match(/\n/g)?.length ?? 0;
      const sign = `fontMatter${lineCount}`;
      let frontmatter;
      try {
        // 优先按 JSON 格式解析
        frontmatter = JSON.parse(content.trim());
      } catch (error) {
        // 按 k:v[\nk:v]* 格式解析
        const lines = content.trim().split('\n');
        frontmatter = {};
        lines.forEach((line) => {
          const [key, value] = line.split(':');
          if (typeof key === 'string' && typeof value === 'string') {
            if (key.length > 1024) {
              // maximum key length 1024
              return;
            }
            frontmatter[key.trim()] = value.trim();
          }
        });
      }
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
    const ret = { begin: '^\\s*-{3}[^\\n]*\\n', end: '\\n-{3}[^\\n]*\\n', content: '([\\s\\S]+?)' };
    ret.reg = compileRegExp(ret, 'g', true);
    return ret;
  }
}
