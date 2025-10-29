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

export default class Footnote extends ParagraphBase {
  static HOOK_NAME = 'footnote';

  constructor({ externals, config, cherry }) {
    super();
    this.config = config;
    this.$cherry = cherry;
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
    const $key = key.replace(/"/g, "'");
    const num = this.footnote.length + 1;
    const fn = {};
    const refNumberContent = this.config.refNumber.render(num, $key) || `[${num}]`;
    const refNumberClass = this.config.refNumber?.appendClass || '';
    const refNumberLinkContent = this.config.refList?.listItem?.render(num, $key, note, () => {
      const refNumberContent = this.config.refNumber.render(num, $key) || `[${num}]`;
      return `<a href="#fnref:${num}" id="fn:${num}" title="${$key}" class="footnote-ref ${refNumberClass}">${refNumberContent}</a>`;
    });
    fn.fnref = `<a href="#fnref:${num}" id="fn:${num}" title="${$key}" class="footnote-ref ${refNumberClass}">${refNumberContent}</a>`;
    fn.num = num;
    fn.note = refNumberLinkContent || fn.fnref + note.trim();
    fn.note = this.$engine.makeHtmlForFootnote(fn.note);
    const refNumberBubble = this.config.bubbleCard ? 'cherry-show-bubble-card' : '';
    const refNumberFinalClass = `footnote ${refNumberClass} ${refNumberBubble}`.replace(/ {2,}/g, ' ');
    fn.fn = `<sup class="cherry-footnote-number"><a href="#fn:${num}" id="fnref:${num}" title="${$key}" data-index="${num}" data-key="${$key}" class="${refNumberFinalClass}">${refNumberContent}</a></sup>`;
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
    const oneFootnoteClass = this.config.refList?.listItem?.appendClass || '';
    let html = footnote
      .map(
        (note, index) => `<div data-index="${index + 1}" class="one-footnote ${oneFootnoteClass}">${note.note}</div>`,
      )
      .join('');
    const sign = this.$engine.hash(html);
    const title = this.config.refList?.title?.render() || (this.$engine?.$cherry?.locale?.footnoteTitle ?? 'title');
    const hiddenClass = this.config.refList ? '' : 'hidden';
    const footnoteClass = this.config.refList?.appendClass || '';
    const footnoteTitleClass = this.config.refList?.title?.appendClass || '';
    html = `<div class="footnote ${footnoteClass} ${hiddenClass}" data-sign="${sign}" data-lines="0"><div class="footnote-title ${footnoteTitleClass}">${title}</div>${html}</div>`;
    return html;
  }

  // getParagraphHook() {
  //     return this.commentPAR;
  // }

  beforeMakeHtml(str) {
    // 单行注释，TODO: 替换为引用
    // str = str.replace(/(^|\n)\[([^^][^\]]*?)\]:([^\n]+?)(?=$|\n)/g, '$1');
    let $str = str;
    $str = $str.replace(this.RULE.reg, (match, leading, key, content) => {
      this.pushFootnoteCache(key, content);
      const LF = match.match(/\n/g) || [];
      return LF.join('');
    });
    const unMatched = [];
    // 替换实际引用
    $str = $str.replace(/\[\^([^\]]+?)\](?!:)/g, (match, key) => {
      const cache = this.getFootnoteCache(key);
      if (cache) {
        return this.pushFootNote(key, cache);
      }
      /**
       * 自闭合模式下，未定义的角标也显示角标
       */
      if (this.config.selfClosing || this.$cherry.options.engine.global.flowSessionContext) {
        const $key = key.replace(/"/g, "'");
        if (unMatched.indexOf($key) === -1) {
          unMatched.push($key);
        }
        const num = this.footnote.length + unMatched.indexOf($key) + 1;
        const refNumberClass = this.config.refNumber?.appendClass || '';
        const refNumberFinalClass = `footnote ${refNumberClass}`;
        const refNumberContent = this.config.refNumber.render(num, $key) || `[${num}]`;
        return `<sup class="cherry-footnote-number"><a href="#fn:${num}" id="fnref:${num}" class="${refNumberFinalClass}">${refNumberContent}</a></sup>`;
      }
      return match;
    });
    $str += this.formatFootNote();
    return $str;
  }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  afterMakeHtml(str) {
    const footNotes = this.getFootNote();
    const $str = str.replace(/\0~fn#([0-9]+)#\0/g, (match, num) => footNotes[num].fn);
    // this.$cleanCache();
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
