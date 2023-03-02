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
import { isBrowser } from '@/utils/env';
import { compileRegExp } from '@/utils/regexp';
import { getIsClassicBrFromLocal, testKeyInLocal } from '@/utils/config';

export default class Br extends ParagraphBase {
  static HOOK_NAME = 'br';

  constructor(options) {
    super({ needCache: true });
    this.classicBr = testKeyInLocal('classicBr') ? getIsClassicBrFromLocal() : options.globalConfig.classicBr;
  }

  beforeMakeHtml(str) {
    if (!this.test(str)) {
      return str;
    }
    return str.replace(this.RULE.reg, (match, lines, index) => {
      // 不处理全文开头的连续空行
      if (index === 0) {
        return match;
      }
      const lineCount = lines.match(/\n/g)?.length ?? 0;
      const sign = `br${lineCount}`;
      let html = '';
      if (isBrowser()) {
        // 为了同步滚动
        if (this.classicBr) {
          html = `<span data-sign="${sign}" data-type="br" data-lines="${lineCount}"></span>`;
        } else {
          html = `<p data-sign="${sign}" data-type="br" data-lines="${lineCount}">&nbsp;</p>`;
        }
      } else {
        // node环境下直接输出br
        html = this.classicBr ? '' : '<br/>';
      }
      const placeHolder = this.pushCache(html, sign, lineCount);
      // 结尾只补充一个\n是因为Br将下一个段落中间的所有换行都替换掉了，而两个换行符会导致下一个区块行数计算错误
      return `\n\n${placeHolder}\n`;
    });
  }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  // afterMakeHtml(str) {
  //     return str.replace(/~~B/g, (match) => {
  //         let lines = that.brCache.shift() - 1;
  //         return '<p data-sign="br' + lines + '" data-type="br" data-lines="' + lines + '">&nbsp;</p>';
  //     });
  // }
  // default: this.restoreCache();

  rule() {
    /**
     * 样例：
     * block1\n
     * \n
     * \n
     * block2
     *
     * 匹配逻辑：
     * 开头必为一个换行符，所以后续只需要匹配至少两个空行即可生成一个换行，行数即content匹配到的换行符个数
     */
    const ret = { begin: '(?:\\n)', end: '', content: '((?:\\h*\\n){2,})' };
    ret.reg = compileRegExp(ret, 'g', true);
    return ret;
  }
}
