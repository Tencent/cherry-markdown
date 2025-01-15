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
import { compileRegExp } from '@/utils/regexp';

export default class FrontMatter extends ParagraphBase {
  static HOOK_NAME = 'frontMatter';

  constructor(options) {
    super({ needCache: true });
  }

  beforeMakeHtml(str) {
    return str.replace(this.RULE.reg, (match, content) => {
      const lineCount = match.match(/\n/g)?.length ?? 0;
      const sign = `fontMatter${lineCount}`;
      content.replace(/(?:^|\n)\s*(font-size|fontSize): ([0-9a-zA-Z]+)(\n|$)/, (match, m1, m2) => {
        this.$engine.$cherry.previewer.getDom().style.fontSize = m2;
        return match;
      });
      // 预判下是否为json格式，json格式就去掉换行，yaml格式就把换成换成分号
      const dataContent = /^\s*{/.test(content) ? content.replace(/\n/g, '') : content.replace(/\n/g, ';');
      const html = `<p data-sign="${sign}" data-type="frontMatter" data-lines="${lineCount}" data-content="${dataContent}"></p>`;
      const placeHolder = this.pushCache(html, sign, lineCount);
      return `${placeHolder}\n`;
    });
  }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  rule() {
    const ret = { begin: '^\\s*-{3,}[^\\n]*\\n', end: '\\n-{3,}[^\\n]*\\n', content: '([\\s\\S]+?)' };
    ret.reg = compileRegExp(ret, 'g', true);
    return ret;
  }
}
