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
import { escapeHTMLSpecialCharOnce as $e, encodeURIOnce } from '@/utils/sanitize';
import { compileRegExp, EMAIL, EMAIL_INLINE, URL_INLINE_NO_SLASH, URL, URL_NO_SLASH, URL_INLINE } from '@/utils/regexp';

export default class AutoLink extends SyntaxBase {
  static HOOK_NAME = 'autoLink';

  constructor({ config, globalConfig }) {
    super({ config });
    this.urlProcessor = globalConfig.urlProcessor;
    this.openNewPage = !!config.openNewPage; // 是否支持链接新页面打开
    this.enableShortLink = !!config.enableShortLink;
    this.shortLinkLength = config.shortLinkLength;
  }

  isLinkInHtmlAttribute(str, index, linkLength) {
    const xmlTagRegex = new RegExp(
      [
        '<', // tag start
        '([a-zA-Z][a-zA-Z0-9-]*)', // tagName
        '(', // attrs start
        [
          '\\s+[a-zA-Z_:][a-zA-Z0-9_.:-]*', // attr name
          '(', // attr value start
          [
            '\\s*=\\s*',
            '(',
            [
              '([^\\s"\'=<>`]+)', // unquoted value
              "('[^']*')", // single-quoted value
              '("[^"]*")', // double-quoted value
            ].join('|'), // either is ok
            ')',
          ].join(''),
          ')?', // attr value end
        ].join(''),
        ')*', // attrs end
        '\\s*[/]?>', // tag end
      ].join(''),
      'g',
    );
    let match;
    while ((match = xmlTagRegex.exec(str)) !== null) {
      // 搜索范围超过了字符串匹配到的位置
      if (match.index > index + linkLength) {
        break;
      }
      // 正好在范围内，说明是HTML的属性，取等号是因为AutoLink的正则可能会匹配到标签的结束符号，如<img src="http://www.google.com">
      if (match.index < index && match.index + match[0].length >= index + linkLength) {
        return true;
      }
    }
    return false;
  }

  /**
   * 判断链接是否被包裹在a标签内部，如果被包裹，则不识别为自动链接
   * @param {string} str
   * @param {number} index
   * @param {number} linkLength
   */
  isLinkInATag(str, index, linkLength) {
    const aTagRegex = /<a.*>[^<]*<\/a>/g;
    let match;
    while ((match = aTagRegex.exec(str)) !== null) {
      // 搜索范围超过了字符串匹配到的位置
      if (match.index > index + linkLength) {
        break;
      }
      // 正好在范围内，说明是HTML的属性，取等号是因为AutoLink的正则可能会匹配到标签的结束符号
      // 如<a href="http://www.google.com">http://www.google.com</a>
      if (match.index < index && match.index + match[0].length >= index + linkLength) {
        return true;
      }
    }
    return false;
  }

  makeHtml(str, sentenceMakeFunc) {
    if (!(this.test(str) && (EMAIL_INLINE.test(str) || URL_INLINE_NO_SLASH.test(str)))) {
      return str;
    }
    return str.replace(this.RULE.reg, (match, left, protocol, address, right, index, str) => {
      // 数字实体字符系临时处理方法，详情参见HTMLBlock注释
      // maybe a html attr, skip it
      if (
        // ((left !== '<' || left !== '&#60;') && (right !== '>' || right !== '&#62;')) ||
        this.isLinkInHtmlAttribute(str, index, protocol.length + address.length) ||
        this.isLinkInATag(str, index, protocol.length + address.length)
      ) {
        return match;
      }
      const $protocol = protocol.toLowerCase();
      let prefix = '';
      let suffix = '';
      let isWrappedByBracket = true;
      // not a pair
      if (!((left === '<' || left === '&#60;') && (right === '>' || right === '&#62;'))) {
        prefix = left;
        suffix = right;
        isWrappedByBracket = false;
      }
      // not a valid address
      // 不被尖括号包裹，不带协议头，且不以www.开头的不识别
      if (address.trim() === '' || (!isWrappedByBracket && $protocol === '' && !/www\./.test(address))) {
        return match;
      }
      switch ($protocol) {
        case 'javascript:':
          return match;
        case 'mailto:': // email
          if (EMAIL.test(address)) {
            return `${prefix}<a href="${encodeURIOnce(`${$protocol}${address}`)}" rel="nofollow">${$e(
              address,
            )}</a>${suffix}`;
          }
          return match;
        case '': // 协议为空
          // 不被<>包裹或单边无效包裹，prefix === suffix 时都为空串
          if (prefix === suffix || !isWrappedByBracket) {
            // mailto
            if (EMAIL.test(address)) {
              return `${prefix}<a href="mailto:${encodeURIOnce(address)}" rel="nofollow">${$e(address)}</a>${suffix}`;
            }
            // 不识别无协议头的URL，且开头不应该含有斜杠
            if (URL_NO_SLASH.test(address)) {
              return `${prefix}${this.renderLink(`//${address}`, address)}${suffix}`;
            }
            // 其他的属于非法情况
            return match;
          }
          // 被<>包裹
          if (isWrappedByBracket) {
            // mailto
            if (EMAIL.test(address)) {
              return `<a href="mailto:${encodeURIOnce(address)}" rel="nofollow">${$e(address)}</a>`;
            }
            // 可识别任意协议的URL，或不以斜杠开头的URL
            if (URL.test(address) || URL_NO_SLASH.test(address)) {
              return this.renderLink(address);
            }
            // 其他非法
            return match;
          }
        default:
          // 协议头不为空时的非法URL
          if (!URL.test(address)) {
            return match;
          }
          // TODO: Url Validator
          return `${prefix}${this.renderLink(`${$protocol}${address}`)}${suffix}`;
      }
      // this should never happen
      return match;
    });
  }

  rule() {
    // (?<protocol>\\w+:)\\/\\/
    const ret = {
      // ?<left>
      begin: '(<?)',
      content: [
        // ?<protocol>
        '((?:[a-z][a-z0-9+.-]{1,31}:)?)', // protocol is any seq of 2-32 chars beginning with letter
        // '(?<slash>(?:\\/{2})?)',
        // ?<address>
        // '([^\\s\\x00-\\x1f"<>]+)',
        `((?:${URL_INLINE.source})|(?:${EMAIL_INLINE.source}))`,
        // [
        //     `(?<url>${ URL_INLINE.source })`,
        //     `(?<email>${ EMAIL_INLINE.source })`, // email
        // ].join('|'),
        // ')'
      ].join(''),
      // ?<right>
      end: '(>?)', // TODO: extend attrs e.g. {target=_blank}
    };
    ret.reg = compileRegExp(ret, 'ig');
    return ret;
  }

  /**
   * 渲染链接为a标签，返回html
   * @param {string} url src链接
   * @param {string} [text] 展示的链接文本，不传默认使用url
   * @returns 渲染的a标签
   */
  renderLink(url, text) {
    let linkText = text;
    if (typeof linkText !== 'string') {
      if (this.enableShortLink) {
        const Url = url.replace(/^https?:\/\//i, '');
        linkText = `${Url.substring(0, this.shortLinkLength)}${Url.length > this.shortLinkLength ? '...' : ''}`;
      } else {
        linkText = url;
      }
    }
    const processedURL = this.urlProcessor(url, 'autolink');
    return `<a target="${this.openNewPage ? '\\_blank' : '\\_self'}" rel="nofollow" title="${$e(url).replace(
      /_/g,
      '\\_',
    )}"  href="${encodeURIOnce(processedURL).replace(/_/g, '\\_')}">${$e(linkText).replace(/_/g, '\\_')}</a>`;
  }
}
