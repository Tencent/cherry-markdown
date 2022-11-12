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
import SyntaxBase from '@/core/SyntaxBase';
import { escapeHTMLSpecialChar as _e, isValidScheme, encodeURIOnce } from '@/utils/sanitize';
import { compileRegExp, isLookbehindSupported, NOT_ALL_WHITE_SPACES_INLINE } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';
import UrlCache from '@/UrlCache';

export default class Link extends SyntaxBase {
  static HOOK_NAME = 'link';

  constructor({ config, globalConfig }) {
    super({ config });
    this.urlProcessor = globalConfig.urlProcessor;
    this.openNewPage = config.openNewPage; // 是否支持链接新页面打开
  }

  /**
   * 校验link中text的方括号是否符合规则
   * @param {string} rawText
   */
  checkBrackets(rawText) {
    const stack = [];
    const text = `[${rawText}]`;
    // 前方有奇数个\当前字符被转义
    const checkEscape = (place) => text.slice(0, place).match(/\\*$/)[0].length & 1;
    for (let i = text.length - 1; text[i]; i--) {
      if (i === text.length - 1 && checkEscape(i)) break;
      if (text[i] === ']' && !checkEscape(i)) stack.push(']');
      if (text[i] === '[' && !checkEscape(i)) {
        stack.pop();
        if (!stack.length) {
          return {
            isValid: true,
            coreText: text.slice(i + 1, text.length - 1),
            extraLeadingChar: text.slice(0, i),
          };
        }
      }
    }
    return {
      isValid: false, // 方括号匹配不上
      coreText: rawText,
      extraLeadingChar: '',
    };
  }

  /**
   *
   * @param {string} match 匹配的完整字符串
   * @param {string} leadingChar 正则分组一：前置字符
   * @param {string} text 正则分组二：链接文字
   * @param {string|undefined} link 正则分组三：链接URL
   * @param {string|undefined} title 正则分组四：链接title
   * @param {string|undefined} ref 正则分组五：链接引用
   * @param {string|undefined} target 正则分组六：新窗口打开
   * @returns
   */
  toHtml(match, leadingChar, text, link, title, ref, target) {
    const refType = typeof link === 'undefined' ? 'ref' : 'url';
    let attrs = '';
    if (refType === 'ref') {
      // 全局引用，理应在CommentReference中被替换，没有被替换说明没有定义引用项
      return match;
    }

    if (refType === 'url') {
      const { isValid, coreText, extraLeadingChar } = this.checkBrackets(text);
      if (!isValid) return match;
      attrs = title && title.trim() !== '' ? ` title="${_e(title.replace(/["']/g, ''))}"` : '';
      if (target) {
        attrs += ` target="${target.replace(/{target\s*=\s*(.*?)}/, '$1')}"`;
      } else if (this.openNewPage) {
        attrs += ` target="_blank"`;
      }
      let processedURL = link.trim().replace(/~1D/g, '~D'); // 还原替换的$符号
      const processedText = coreText.replace(/~1D/g, '~D'); // 还原替换的$符号
      // text可能是html标签，依赖htmlBlock进行处理
      if (isValidScheme(processedURL)) {
        processedURL = this.urlProcessor(processedURL, 'link');
        processedURL = encodeURIOnce(processedURL);
        return `${leadingChar + extraLeadingChar}<a href="${UrlCache.set(
          processedURL,
        )}" rel="nofollow"${attrs}>${processedText}</a>`;
      }
      return `${leadingChar + extraLeadingChar}<span>${text}</span>`;
    }
    // should never happen
    return match;
  }

  toStdMarkdown(match) {
    return match;
  }

  makeHtml(str) {
    let $str = str.replace(this.RULE.reg, (match) => {
      return match.replace(/~D/g, '~1D');
    });
    if (isLookbehindSupported()) {
      $str = $str.replace(this.RULE.reg, this.toHtml.bind(this));
    } else {
      $str = replaceLookbehind($str, this.RULE.reg, this.toHtml.bind(this), true, 1);
    }
    $str = $str.replace(this.RULE.reg, (match) => {
      return match.replace(/~1D/g, '~D');
    });
    return $str;
  }

  rule() {
    // (?<protocol>\\w+:)\\/\\/
    const ret = {
      // lookbehind启用分组是为了和不兼容lookbehind的场景共用一个回调
      begin: isLookbehindSupported() ? '((?<!\\\\))' : '(^|[^\\\\])',
      content: [
        '\\[([^\\n]+?)\\]', // ?<text>
        '[ \\t]*', // any spaces
        `${
          '(?:' +
          '\\(' +
          /**
           * allow double quotes
           * e.g.
           * [link](") ⭕️ valid
           * [link]("") ⭕️ valid
           * [link](" ") ❌ invalid
           */
          '([^\\s)]+)' + // ?<link> url
          '(?:[ \\t]((?:".*?")|(?:\'.*?\')))?' + // ?<title> optional
          '\\)' +
          '|' + // or
          '\\[('
        }${NOT_ALL_WHITE_SPACES_INLINE})\\]` + // ?<ref> global ref
          ')',
        '(\\{target\\s*=\\s*(_blank|_parent|_self|_top)\\})?',
      ].join(''),
      end: '',
    };
    // let ret = {begin:'((^|[^\\\\])\\*\\*|([\\s]|^)__)',
    // end:'(\\*\\*([\\s\\S]|$)|__([\\s]|$))', content:'([^\\n]+?)'};
    ret.reg = compileRegExp(ret, 'g');
    return ret;
  }
}
