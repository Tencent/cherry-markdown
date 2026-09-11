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
import SyntaxBase from '@/core/SyntaxBase';
import { escapeHTMLSpecialChar as e, isValidScheme, encodeURIOnce } from '@/utils/sanitize';
import { getLinkRule, isLookbehindSupported } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';
import UrlCache from '@/UrlCache';

/**
 * 根据链接配置生成 target 属性字符串
 * @param {{ target?: string, openNewPage?: boolean }} config
 * @returns {string}
 */
function resolveLinkTarget(config) {
  if (config.target) {
    return `target="${config.target}"`;
  }
  if (config.openNewPage) {
    return 'target="_blank"';
  }
  return '';
}

export default class Link extends SyntaxBase {
  static HOOK_NAME = 'link';

  constructor({ config, globalConfig }) {
    super({ config });
    this.target = resolveLinkTarget(config);
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
   * @param {string} link 正则分组三：链接URL
   * @param {string|undefined} title 正则分组四：链接title
   * @param {string|undefined} target 正则分组五：新窗口打开
   * @returns
   */
  toHtml(match, leadingChar, text, link, title, target) {
    const { isValid, coreText, extraLeadingChar } = this.checkBrackets(text);
    if (!isValid) return match;
    let attrs = title && title.trim() !== '' ? ` title="${e(title.replace(/["']/g, ''))}"` : '';
    if (target) {
      attrs += ` target="${target.replace(/{target\s*=\s*(.*?)}/, '$1')}"`;
    } else if (this.target) {
      attrs += ` ${this.target}`;
    }
    // 链接内的 ~D / \[ / \] / \( / \) 已由 LinkFormatter 在段落阶段做过预转义并会在 afterMakeHtml 还原，
    // 因此此处 link 与 coreText 拿到的都是原始待渲染内容，直接使用即可。
    let processedURL = link.trim();
    const processedText = coreText;
    // text可能是html标签，依赖htmlBlock进行处理
    if (isValidScheme(processedURL)) {
      processedURL = this.$engine.urlProcessor(processedURL, 'link');
      processedURL = encodeURIOnce(processedURL);
      const customAttrs =
        // @ts-ignore
        this.$engine.$cherry.options.engine.syntax.link.attrRender(processedText, processedURL) ?? '';
      return `${leadingChar + extraLeadingChar}<a href="${UrlCache.set(processedURL)}" ${
        typeof customAttrs === 'string' ? customAttrs : ''
      } ${this.rel} ${attrs}>${processedText}</a>`;
    }
    return `${leadingChar + extraLeadingChar}<span>${text}</span>`;
  }

  toStdMarkdown(match) {
    return match;
  }

  makeHtml(str) {
    if (isLookbehindSupported()) {
      return str.replace(this.RULE.reg, this.toHtml.bind(this));
    }
    return replaceLookbehind(str, this.RULE.reg, this.toHtml.bind(this), true, 1);
  }

  rule() {
    return getLinkRule();
  }
}
