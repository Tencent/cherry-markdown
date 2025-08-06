/**
 * Tencent is pleased to support the open source community by making CherryMarkdown available.
 *
 * Copyright (C) 2021 Tencent. All rights reserved.
 * The below software in this distribution may have been modified by Tencent ("Tencent Modifications").
 *
 * All Tencent Modifications are Copyright (C) Tencent.
 *
 * CherryMarkdown is licensed under the Apache License, Version 2.0 (the "License");
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
/* eslint-disable no-underscore-dangle */
import ParagraphBase from '@/core/ParagraphBase';
/**
 * [TAPD](https://tapd.cn)的html块语法
 * 被[html]**[/html]包裹的内容不会进行任何markdown引擎渲染而直接加载到预览区
 * 该功能常见的场景为“导入word”
 * 导入word后，后端返回word的html内容，此内容被[html]**[/html]包裹后会直接加载到预览区，保证样式的一致性
 * 一般不建议引导用户使用该功能
 */
export default class TapdHtmlTagPlugin extends ParagraphBase {
  static HOOK_NAME = 'tapdHtmlTag';

  constructor() {
    super({ needCache: true });
  }

  makeHtml(html, sentenceMakeFunc) {
    return html.replace(this.RULE.reg, (whole) => {
      const lines = whole.split(/[\r\n]/).length;
      let $whole = whole
        .replace('[html]', '')
        .replace('[/html]', '')
        .replace(/[\r\n]/g, '')
        .replace(/&#60;/g, '<')
        .replace(/&#62;/g, '>')
        .replace('style="LAYOUT-GRID', 'style="');
      $whole = this._trimScripTag($whole);
      const data = sentenceMakeFunc($whole);
      return `<div data-lines="${lines}" data-sign="${data.sign}">${$whole}</div>`;
    });
  }

  // @ts-ignore
  rule() {
    return {
      reg: /\[html\]([\s\S]*?)\[\/html\]/g,
    };
  }

  _trimScripTag(str) {
    return str
      .replace(/(<(?:script|script\s[^>]*)>)([\s\S]*?)(<\/script>)/gi, '')
      .replace(/(<iframe [^>]*>)|(<\/iframe>)/gi, '');
  }
}
