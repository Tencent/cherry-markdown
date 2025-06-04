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
import { compileRegExp, isLookbehindSupported } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';
import UrlCache from '@/UrlCache';

export default class Link extends SyntaxBase {
  static HOOK_NAME = 'link';

  constructor({ config, globalConfig }) {
    super({ config });
    // eslint-disable-next-line no-nested-ternary
    this.target = config.target ? `target="${config.target}"` : !!config.openNewPage ? 'target="_blank"' : '';
    this.rel = config.rel ? `rel="${config.rel}"` : '';
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
   * @param {string|undefined} target 正则分组四：新窗口打开
   * @returns
   */
  toHtml(match, leadingChar, text, link, target) {
    let attrs = '';

    // 检查链接文本中的方括号是否配对
    const { isValid, coreText, extraLeadingChar } = this.checkBrackets(text);
    if (!isValid) return match;

    // 检查是否是引用式链接
    const refMatch = link && link.match(/^\[(.+?)\]$/);
    if (refMatch) {
      // 是引用式链接，返回原始匹配供后续处理
      return match;
    }

    // 处理target
    if (target) {
      attrs += ` target="${target.replace(/{target\s*=\s*(.*?)}/, '$1')}"`;
    } else if (this.target) {
      attrs += ` ${this.target}`;
    }

    let processedURL = link.trim().replace(/~1D/g, '~D');
    const processedText = coreText.replace(/~1D/g, '~D');

    // 处理title：如果URL中包含引号括起来的部分，作为title
    const titleMatch = processedURL.match(/^(.*?)(?:\s+["'](.+?)["'])?$/);
    if (titleMatch) {
      processedURL = titleMatch[1]; // 实际的URL
      if (titleMatch[2]) {
        // 如果有title
        attrs += ` title="${_e(titleMatch[2])}"`;
      }
    }

    // 检查URL协议是否安全
    if (!isValidScheme(processedURL)) {
      return `${leadingChar + extraLeadingChar}<span>${text}</span>`;
    }

    // 处理URL
    processedURL = this.$engine.urlProcessor(processedURL, 'link');

    // URL编码，但不编码#和其后的内容
    if (processedURL.includes('#')) {
      const [baseURL, hash] = processedURL.split('#', 2);
      processedURL = `${encodeURIOnce(baseURL)}#${hash}`;
    } else {
      processedURL = encodeURIOnce(processedURL);
    }

    return `${leadingChar + extraLeadingChar}<a href="${UrlCache.set(processedURL)}" ${
      this.rel
    } ${attrs}>${processedText}</a>`;
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
    const ret = {
      begin: isLookbehindSupported() ? '((?<!\\\\))' : '(^|[^\\\\])',
      content: [
        // 1. 链接文本部分：匹配方括号内的任意字符，包括嵌套的方括号
        '\\[((?:\\[[^\\]]*\\]|[^\\]])*?)\\]',

        // 2. 链接部分：匹配圆括号内的任意字符，包括方括号
        '\\(([^\\(\\)]*(?:\\([^\\(\\)]*\\)[^\\(\\)]*)*?)\\)',

        // 3. target部分：可选的target设置
        '(?:\\{target\\s*=\\s*([^\\}]+)\\})?',
      ].join(''),
      end: '',
    };
    ret.reg = compileRegExp(ret, 'g');
    return ret;
  }
}
