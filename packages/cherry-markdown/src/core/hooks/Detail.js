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
import { prependLineFeedForParagraph } from '@/utils/lineFeed';
import { getDetailRule, getDetailHtmlRule } from '@/utils/regexp';
import { blockNames } from '@/utils/sanitize';

/**
 * +++(-) 点击查看详情
 * body
 * body
 * ++ 标题（默认收起内容）
 * 内容
 * ++- 标题（默认展开内容）
 * 内容2
 * +++
 */
export default class Detail extends ParagraphBase {
  static HOOK_NAME = 'detail';

  constructor() {
    super({ needCache: true });
  }

  afterMakeHtml(
    str,
    sentenceMakeFunc = (md) => {
      return { sign: '', html: md };
    },
  ) {
    // 因为同时处理了details语法和details Html标签，所以需要调用两次restoreCache避免嵌套的情况出现占位符
    return this.restoreCache(this.restoreCache(str));
  }

  makeHtml(str, sentenceMakeFunc) {
    this.sentenceMakeFunc = sentenceMakeFunc;
    str = str.replace(this.RULE.reg, this.$makeHtml.bind(this));
    return str.replace(getDetailHtmlRule(), this.$makeHtml.bind(this));
  }

  $makeHtml(match, preLines, isOpen, title, content) {
    const isDetailsHtml = /^[\s]*<details[ >]/.test(match);
    const lineCount = this.getLineCount(match, preLines);
    const sign = this.$engine.hash(match);
    const testHasCache = this.testHasCache(sign);
    if (testHasCache !== false) {
      return prependLineFeedForParagraph(match, testHasCache);
    }
    const { type, html } = this.$getDetailInfo(isOpen, title, content, this.sentenceMakeFunc, isDetailsHtml);
    const ret = this.pushCache(
      `<div class="cherry-detail cherry-detail__${type}" data-sign="${sign}" data-lines="${lineCount}" >${html}</div>`,
      sign,
      lineCount,
    );
    return prependLineFeedForParagraph(match, ret);
  }

  $getDetailInfo(isOpen, title, str, sentenceMakeFunc, isDetailsHtml) {
    const type = !isDetailsHtml && /\n\s*(\+\+|\+\+-)\s*[^\n]+\n/.test(str) ? 'multiple' : 'single';
    const arr = str.split(/\n\s*(\+\+[-]{0,1}\s*[^\n]+)\n/);
    let defaultOpen = /(-|open)/.test(isOpen);
    let currentTitle = title;
    let html = '';
    if (type === 'multiple') {
      arr.forEach((item) => {
        if (/^\s*\+\+/.test(item)) {
          defaultOpen = /^\s*\+\+-/.test(item);
          currentTitle = item.replace(/\+\+[-]{0,1}\s*([^\n]+)$/, '$1');
          return true;
        }
        html += this.$getDetailHtml(defaultOpen, currentTitle, item, sentenceMakeFunc);
      });
    } else {
      html = this.$getDetailHtml(defaultOpen, currentTitle, str, sentenceMakeFunc);
    }
    return { type, html };
  }

  $getDetailHtml(defaultOpen, title, str, sentenceMakeFunc) {
    let ret = `<details ${defaultOpen ? 'open' : ''}>`;
    const paragraphProcessor = (str) => {
      if (str.trim() === '') {
        return '';
      }
      // 手风琴 body 作为"容器内容"，走一遍剩余的段落级语法（List/Table/Hr/Header 等），
      // 以便 `+++ ... +++` 内部可以正确渲染列表、表格等块级语法。
      const html = this.$engine.makeHtmlForMe(str, 'detail');
      // 如果包含html块级标签（比如 p、div、blockquote 等），说明 html 已经是渲染后的块级结构，
      // 此时块级标签之间残留的 \n 仅是分隔符，不应被 $cleanParagraph 转成 <br>，
      // 直接去除这些 \n 后用 div 包裹即可
      const isContainBlockTest = new RegExp(`<(${blockNames})[^>]*>`, 'i');
      if (isContainBlockTest.test(html)) {
        return `<div>${html.replace(/\n+/g, '')}</div>`;
      }
      // 纯文本段落（无块级标签）才走 $cleanParagraph 处理用户手动换行 -> <br>
      return `<p>${this.$cleanParagraph(html)}</p>`;
    };
    ret += `<summary>${sentenceMakeFunc(title).html}</summary>`;
    let $body = '';
    if (this.isContainsCache(str)) {
      $body = this.makeExcludingCached(str, paragraphProcessor);
    } else {
      $body = paragraphProcessor(str);
    }
    ret += `<div class="cherry-detail-body">${$body}</div>`;
    ret += `</details>`;
    return ret;
  }

  rule() {
    return getDetailRule();
  }
}
