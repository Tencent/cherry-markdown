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
      const { type, title, body } = this.$getPanelInfo(name, content, sentenceMakeFunc);
      const ret = this.pushCache(
        `<div class="cherry-panel cherry-panel__${type}" data-sign="${sign}" data-lines="${lineCount}" >${title}${body}</div>`,
        sign,
        lineCount,
      );
      return prependLineFeedForParagraph(match, ret);
    });
  }

  $getPanelInfo(name, str, sentenceMakeFunc) {
    const ret = { type: this.$getTargetType(name), title: '', body: str };
    str.replace(/^([^\n]+)\n\s*:\s*\n([\w\W]+)$/, (match, title, body) => {
      ret.title = sentenceMakeFunc(title).html;
      ret.body = body;
    });
    ret.title = `<div class="cherry-panel--title ${ret.title ? 'cherry-panel--title__not-empty' : ''}">${
      ret.title
    }</div>`;
    ret.body = `<div class="cherry-panel--body">${this.$cleanParagraph(sentenceMakeFunc(ret.body).html)}</div>`;
    return ret;
  }

  $getTargetType(name) {
    switch (name.toLowerCase()) {
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
      default:
        return 'primary';
    }
  }

  rule() {
    return getPanelRule();
  }
}
