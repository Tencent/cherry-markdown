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
import { getPanelRule } from '@/utils/regexp';
import { blockNames } from '@/utils/sanitize';
/**
 * 面板语法
 * 例：
 *  :::tip
 *  这是一段提示信息
 *  :::
 *  :::warning
 *  这是一段警告信息
 *  :::
 *  :::danger
 *  这是一段危险信息
 *  :::
 */
export default class Panel extends ParagraphBase {
  static HOOK_NAME = 'panel';

  constructor(options) {
    super({ needCache: true });
    this.initBrReg(options.globalConfig.classicBr);
  }

  makeHtml(str, sentenceMakeFunc) {
    return str.replace(this.RULE.reg, (match, preLines, name, content) => {
      const lineCount = this.getLineCount(match, preLines);
      const sign = this.$engine.md5(match);
      const { title, body, appendStyle, className } = this.$getPanelInfo(name, content, sentenceMakeFunc);
      const ret = this.pushCache(
        `<div class="${className}" data-sign="${sign}" data-lines="${lineCount}" ${appendStyle}>${title}${body}</div>`,
        sign,
        lineCount,
      );
      return prependLineFeedForParagraph(match, ret);
    });
  }

  $getClassByType(type) {
    if (/(left|right|center)/i.test(type)) {
      return `cherry-text-align cherry-text-align__${type}`;
    }
    return `cherry-panel cherry-panel__${type}`;
  }

  $getPanelInfo(name, str, sentenceMakeFunc) {
    const ret = {
      type: this.$getTargetType(name),
      title: sentenceMakeFunc(this.$getTitle(name)).html,
      body: str,
      appendStyle: '',
      className: '',
    };
    ret.className = this.$getClassByType(ret.type);
    if (/(left|right|center)/i.test(ret.type)) {
      ret.appendStyle = `style="text-align:${ret.type};"`;
    }
    ret.title = `<div class="cherry-panel--title ${ret.title ? 'cherry-panel--title__not-empty' : ''}">${
      ret.title
    }</div>`;
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
    let $body = '';
    if (this.isContainsCache(ret.body)) {
      $body = this.makeExcludingCached(ret.body, paragraphProcessor);
    } else {
      $body = paragraphProcessor(ret.body);
    }
    ret.body = `<div class="cherry-panel--body">${$body}</div>`;
    return ret;
  }

  $getTitle(name) {
    const $name = name.trim();
    return /\s/.test($name) ? $name.replace(/[^\s]+\s/, '') : '';
  }

  $getTargetType(name) {
    const $name = /\s/.test(name.trim()) ? name.trim().replace(/\s.*$/, '') : name;
    switch ($name.trim().toLowerCase()) {
      case 'primary':
      case 'p':
        return 'primary';
      case 'info':
      case 'i':
        return 'info';
      case 'warning':
      case 'w':
        return 'warning';
      case 'danger':
      case 'd':
        return 'danger';
      case 'success':
      case 's':
        return 'success';
      case 'right':
      case 'r':
        return 'right';
      case 'center':
      case 'c':
        return 'center';
      case 'left':
      case 'l':
        return 'left';
      default:
        return 'primary';
    }
  }

  rule() {
    return getPanelRule();
  }
}
