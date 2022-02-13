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
import ParagraphBase from '@/core/ParagraphBase';
import { escapeHTMLSpecialChar } from '@/utils/sanitize';
/**
 * 四个以上空格生成代码块语法（不带代码高亮和行号）
 */
export default class Pre extends ParagraphBase {
  static HOOK_NAME = 'pre';

  constructor({ config }) {
    super({ needCache: true });
    this.config = config || {};
  }

  beforeMakeHtml(str) {
    if (!this.config.enable) {
      return str;
    }
    return str.replace(this.RULE.reg, (match, code) => {
      const lineCount = (match.match(/\n/g) || []).length;
      const sign = this.$engine.md5(match);
      const html = `<pre data-sign="${sign}" data-lines="${lineCount}">${escapeHTMLSpecialChar(
        code.replace(/\n( {4}|\t)/g, '\n'),
      )}</pre>`;
      return this.getCacheWithSpace(this.pushCache(html), match, true);
    });
  }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  rule() {
    const ret = {
      begin: '(?:^|\\n\\s*\\n)(?: {4}|\\t)',
      end: '(?=$|\\n( {0,3}[^ \\t\\n]|\\n[^ \\t\\n]))',
      content: '([\\s\\S]+?)',
    };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
