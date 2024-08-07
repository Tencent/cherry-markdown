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

export default class Footnote extends ParagraphBase {
  static HOOK_NAME = 'footnote';

  constructor({ externals, config }) {
    super();
    this.footnoteCache = {};
    this.footnoteMap = {}; // 角标缓存索引
    this.footnote = [];
  }

  $cleanCache() {
    this.footnoteCache = {};
    this.footnoteMap = {}; // 角标缓存索引
    this.footnote = [];
  }

  pushFootnoteCache(key, cache) {
    this.footnoteCache[key] = cache;
  }

  getFootnoteCache(key) {
    return this.footnoteCache[key] || null;
  }

  pushFootNote(key, note) {
    if (this.footnoteMap[key]) {
      // 重复引用时返回已缓存下标
      return this.footnoteMap[key];
    }
    const num = this.footnote.length + 1;
    const fn = {};
    fn.fn = `<sup><a href="#fn:${num}" id="fnref:${num}" title="${key}" class="footnote">[${num}]</a></sup>`;
    fn.fnref = `<a href="#fnref:${num}" id="fn:${num}" title="${key}" class="footnote-ref">[${num}]</a>`;
    fn.num = num;
    fn.note = note.trim();
    this.footnote.push(fn);
    const replaceKey = `\0~fn#${num - 1}#\0`;
    this.footnoteMap[key] = replaceKey;
    return replaceKey;
  }

  getFootNote() {
    return this.footnote;
  }

  formatFootNote() {
    const footnote = this.getFootNote();
    if (footnote.length <= 0) {
      return '';
    }
    let html = footnote.map((note) => `<div class="one-footnote">\n${note.fnref}${note.note}\n</div>`).join('');
    const sign = this.$engine.md5(html);
    html = `<div class="footnote" data-sign="${sign}" data-lines="0"><div class="footnote-title">脚注</div>${html}</div>`;
    return html;
  }

  // getParagraphHook() {
  //     return this.commentPAR;
  // }

  beforeMakeHtml(str) {
    // 单行注释，TODO: 替换为引用
    // str = str.replace(/(^|\n)\[([^^][^\]]*?)\]:([^\n]+?)(?=$|\n)/g, '$1');
    let $str = str;
    if (this.test($str)) {
      $str = $str.replace(this.RULE.reg, (match, leading, key, content) => {
        this.pushFootnoteCache(key, content);
        const LF = match.match(/\n/g) || [];
        return LF.join('');
      });
      // 替换实际引用
      $str = $str.replace(/\[\^([^\]]+?)\](?!:)/g, (match, key) => {
        const cache = this.getFootnoteCache(key);
        if (cache) {
          return this.pushFootNote(key, cache);
        }
        return match;
      });
      $str += this.formatFootNote();
    }
    return $str;
  }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  afterMakeHtml(str) {
    const footNotes = this.getFootNote();
    const $str = str.replace(/\0~fn#([0-9]+)#\0/g, (match, num) => footNotes[num].fn);
    this.$cleanCache();
    return $str;
  }

  rule() {
    const ret = {
      begin: '(^|\\n)[ \t]*',
      content: [
        '\\[\\^([^\\]]+?)\\]:\\h*', // footnote key
        '([\\s\\S]+?)', // footnote content
      ].join(''),
      end: '(?=\\s*$|\\n\\n)',
    };
    ret.reg = compileRegExp(ret, 'g', true);
    return ret;
  }
}
