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
/**
 * AI 流式输出场景，自动闭合语法，避免语法被截断，涉及语法：
 * - 加粗、斜体
 * - 图片、音频、视频
 * - 超链接
 */
export default class AiFlowAutoClose extends ParagraphBase {
  static HOOK_NAME = 'aiFlowAutoClose';
  constructor({ config, cherry }) {
    super({ needCache: false });
    this.$cherry = cherry;
  }

  // 自动补全最后一行的加粗、斜体语法
  $dealEmphasis(str) {
    if (
      (!!this.$cherry.options.engine.syntax.fontEmphasis &&
        this.$cherry.options.engine.syntax.fontEmphasis.selfClosing) ||
      this.$cherry.options.engine.global.flowSessionContext
    ) {
    } else {
      return str;
    }
    let $str = str;
    // 自动补全最后一行的加粗、斜体语法
    if (/(^|\n)[^\n]*\*{1,3}[^\n]+$/.test($str) && $str.match(/(^|\n)([^\n]+)$/)) {
      // 处理公式里有*号的情况
      $str = $str.replace(/(~D{1,2})([^\n]+?)\1/g, (match, begin, content) => {
        return `${begin}${content.replace(/\*/g, 'Σ*CONTENT*TMP')}${begin}`;
      });
      const lastLineStr = $str.match(/(^|\n)([^\n]+)$/)[2].split(/(\*{1,3})/g);
      const emphasis = [];
      for (let i = 0; i < lastLineStr.length; i++) {
        // 判断是否命中无序列表语法（用* 也可表示无序列表）
        if (i === 1 && lastLineStr[i] === '*' && lastLineStr[i + 1] && /^\s+/.test(lastLineStr[i + 1])) {
          continue;
        }
        if (/\*{1,3}/.test(lastLineStr[i])) {
          const current = lastLineStr[i];
          if (emphasis.length <= 0) {
            emphasis.push(current);
          } else {
            if (emphasis[emphasis.length - 1] === current) {
              emphasis.pop();
            } else {
              emphasis.push(current);
            }
          }
        }
      }
      // 只剩一个未配对的，表示最后没有*
      if (emphasis.length === 1) {
        $str = $str.replace(/(\*{1,3})(\s*)([^*\n]+?)$/, '$1$2$3$2$1');
      }
      // 剩两个未配对的，表示最后有未配对的*
      if (emphasis.length === 2) {
        $str = $str.replace(/(\*{1,3})(\s*)([^*\n]+?)\*{0,2}$/, '$1$2$3$2$1');
      }
      $str = $str.replace(/(~D{1,2})([^\n]+?)\1/g, (match, begin, content) => {
        return `${begin}${content.replace(/Σ\*CONTENT\*TMP/g, '*')}${begin}`;
      });
    }
    return $str;
  }

  // 自动补全最后一行的图片、音频、视频语法
  dealMedia(str) {
    if (
      (!!this.$cherry.options.engine.syntax.image && this.$cherry.options.engine.syntax.image.selfClosing) ||
      this.$cherry.options.engine.global.flowSessionContext
    ) {
    } else {
      return str;
    }
    let $str = str;
    const selfClosingRender =
      !!this.$cherry.options.engine.syntax.image && this.$cherry.options.engine.syntax.image.selfClosingRender
        ? this.$cherry.options.engine.syntax.image.selfClosingRender
        : false;
    // 写了闭合中括号，但括号没闭合的情况
    $str = $str.replace(/([^[]*?)!(video|audio|)\[([^\n\]]*)\]\(([^)]*)$/, (whole, before, type, content, url) => {
      let ret = '';
      if (typeof selfClosingRender === 'function') {
        const targetType = /(video|audio)/.test(type) ? type : 'image';
        ret = selfClosingRender(targetType, content, url);
      }
      if (ret) {
        return ret;
      }
      if (type.toLowerCase === 'video') {
        return `${before}<video src></video>`;
      }
      if (type.toLowerCase === 'audio') {
        return `${before}<audio src></audio>`;
      }
      return `${before}<img src/>`;
    });

    // 只写了中括号的情况
    $str = $str.replace(/([^[]*?)!(video|audio|)\[([^\n\]]*)\]{0,1}$/, (whole, before, type, content) => {
      let ret = '';
      if (typeof selfClosingRender === 'function') {
        const targetType = /(video|audio)/.test(type) ? type : 'image';
        ret = selfClosingRender(targetType, content, '');
      }
      if (ret) {
        return ret;
      }
      if (type.toLowerCase === 'video') {
        return `${before}<video src></video>`;
      }
      if (type.toLowerCase === 'audio') {
        return `${before}<audio src></audio>`;
      }
      return `${before}<img src/>`;
    });
    return $str;
  }

  // 自动补全最后一行的链接语法
  dealLink(str) {
    if (
      (!!this.$cherry.options.engine.syntax.link && this.$cherry.options.engine.syntax.link?.selfClosing) ||
      this.$cherry.options.engine.global.flowSessionContext
    ) {
    } else {
      return str;
    }
    let $str = str;
    // 写了闭合中括号，但括号没闭合的情况
    $str = $str.replace(/([^[]*?)\[([^\n\]]*)\]\(([^)]*)$/, (whole, before, content, url) => {
      return `${before}<a href="${url}">${content}</a>`;
    });

    // 只写了中括号的情况
    $str = $str.replace(/([^[]*?)\[([^\n\]]*)\]{0,1}$/, (whole, before, content) => {
      return `${before}<a href>${content}</a>`;
    });
    return $str;
  }

  makeHtml(str, sentenceMakeFunc) {
    const lastN = /\n$/.test(str) ? '\n' : '';
    let $str = str.replace(/\n$/, '');
    // 判断是否有虚拟光标
    const flowCursor = /CHERRYFLOWSESSIONCURSOR/.test($str) ? 'CHERRYFLOWSESSIONCURSOR' : '';
    $str = $str.replace(/CHERRYFLOWSESSIONCURSOR/g, '');
    // 自动补全最后一行的加粗、斜体语法
    $str = this.$dealEmphasis($str);
    // 自动补全最后一行的图片、音频、视频语法
    $str = this.dealMedia($str);
    // 自动补全最后一行的链接语法
    $str = this.dealLink($str);
    // 避免正则性能问题，如/.+\n/.test(' '.repeat(99999)), 回溯次数过多
    // 参考文章：http://www.alloyteam.com/2019/07/13574/
    $str = $str + flowCursor + lastN;
    return $str;
  }
}
