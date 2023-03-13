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
import { prependLineFeedForParagraph } from '@/utils/lineFeed';
import { getDetailRule } from '@/utils/regexp';
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

  makeHtml(str, sentenceMakeFunc) {
    return str.replace(this.RULE.reg, (match, preLines, isOpen, title, content) => {
      const lineCount = this.getLineCount(match, preLines);
      const sign = this.$engine.md5(match);
      const { type, html } = this.$getDetailInfo(isOpen, title, content, sentenceMakeFunc);
      const ret = this.pushCache(
        `<div class="cherry-detail cherry-detail__${type}" data-sign="${sign}" data-lines="${lineCount}" >${html}</div>`,
        sign,
        lineCount,
      );
      return prependLineFeedForParagraph(match, ret);
    });
  }

  $getDetailInfo(isOpen, title, str, sentenceMakeFunc) {
    const type = /\n\s*(\+\+|\+\+-)\s*[^\n]+\n/.test(str) ? 'multiple' : 'single';
    const arr = str.split(/\n\s*(\+\+[-]{0,1}\s*[^\n]+)\n/);
    let defaultOpen = isOpen === '-';
    let currentTitle = title;
    let html = '';
    if (type === 'multiple') {
      arr.forEach((item) => {
        if (/\+\+/.test(item)) {
          defaultOpen = /\+\+-/.test(item);
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
      // 调用行内语法，获得段落的签名和对应html内容
      const { html } = sentenceMakeFunc(str);
      let domName = 'p';
      // 如果包含html块级标签（比如div、blockquote等），则当前段落外层用div包裹，反之用p包裹
      const isContainBlockTest = new RegExp(`<(${blockNames})[^>]*>`, 'i');
      if (isContainBlockTest.test(html)) {
        domName = 'div';
      }
      return `<${domName}>${this.$cleanParagraph(html)}</${domName}>`;
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
