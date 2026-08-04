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
import { escapeHTMLSpecialCharOnce as $e, encodeURIOnce } from '@/utils/sanitize';
import { compileRegExp, EMAIL, EMAIL_INLINE, URL_INLINE_NO_SLASH, URL, URL_NO_SLASH, URL_INLINE } from '@/utils/regexp';

/**
 * 内置的中文全角符号预设，当 breakChars 数组中包含 'full-width' 时启用
 * 用于在autoLink识别时，遇到这些中文全角符号时中断URL的识别
 */
const FULL_WIDTH_BREAK_CHARS = '，。！？；：、（）【】《》「」“”‘’·～｜…—';

/**
 * 将breakChars配置数组解析为一个用于中断URL识别的字符集合字符串
 * @param {Array<string>|undefined} breakChars
 * @returns {string} 需要中断的字符集合，若不启用则返回空字符串
 */
function resolveBreakChars(breakChars) {
  if (!Array.isArray(breakChars) || breakChars.length === 0) {
    return '';
  }
  const chars = new Set();
  breakChars.forEach((item) => {
    if (typeof item !== 'string' || item.length === 0) {
      return;
    }
    if (item === 'full-width') {
      for (const ch of FULL_WIDTH_BREAK_CHARS) {
        chars.add(ch);
      }
      return;
    }
    // 其他情况：把字符串里的每个字符都作为中断字符
    for (const ch of item) {
      chars.add(ch);
    }
  });
  return Array.from(chars).join('');
}

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

export default class AutoLink extends SyntaxBase {
  static HOOK_NAME = 'autoLink';

  static escapePreservedSymbol = (text) => {
    // _ prevent conflict with emphasis
    // _ => 0x5f
    // * => 0x2a
    return text.replace(/_/g, '&#x5f;').replace(/\*/g, '&#x2a;');
  };

  constructor({ config, globalConfig }) {
    super({ config });
    this.enableShortLink = !!config.enableShortLink;
    this.shortLinkLength = config.shortLinkLength;
    this.target = resolveLinkTarget(config);
    this.rel = config.rel ? `rel="${config.rel}"` : '';
    // 中断字符集合：命中这些字符时，会将其从URL尾部剥离，不作为URL的一部分
    this.breakChars = resolveBreakChars(config.breakChars);
  }

  /**
   * 根据 breakChars 配置，将出现在 address 中的中断字符（及其之后的内容）从 URL 中剥离
   * 剥离出的部分会作为普通文本返回，跟在生成的<a>标签之后
   * @param {string} address
   * @returns {{ address: string, trailing: string }}
   */
  stripBreakChars(address) {
    if (!this.breakChars || typeof address !== 'string' || address.length === 0) {
      return { address, trailing: '' };
    }
    for (let i = 0; i < address.length; i++) {
      if (this.breakChars.indexOf(address[i]) !== -1) {
        return { address: address.slice(0, i), trailing: address.slice(i) };
      }
    }
    return { address, trailing: '' };
  }

  /**
   * 检查指定位置和长度的字符串是否位于HTML标签的属性值中
   * @param {string} str - 要检查的完整字符串
   * @param {number} index - 链接字符串的起始位置
   * @param {number} linkLength - 链接字符串的长度
   * @returns {boolean} 如果链接位于HTML属性值中则返回true，否则返回false
   */
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
    const aTagRegex = /<a\s+[^>]*>[^<]*<\/a>/gi;
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

  /**
   * 将字符串中的URL或电子邮件地址转换为HTML链接
   * @param {string} str - 包含可能URL或电子邮件地址的原始字符串
   * @param {Function} [sentenceMakeFunc] - 可选的回调函数，用于处理句子生成
   * @returns {string} 转换后的HTML字符串，其中URL和电子邮件地址被替换为<a>标签
   * @throws {Error} 如果输入不是字符串可能会抛出错误
   */
  makeHtml(str, sentenceMakeFunc) {
    if (!(this.test(str) && (EMAIL_INLINE.test(str) || URL_INLINE_NO_SLASH.test(str)))) {
      return str;
    }
    return str.replace(this.RULE.reg, (match, left, protocol, _address, right, index, str) => {
      // 数字实体字符系临时处理方法，详情参见HTMLBlock注释
      // maybe a html attr, skip it
      let address = _address?.replace(/CHERRYFLOWSESSIONCURSOR/g, '');
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
      // 根据 breakChars 配置，把中断字符及其后内容从URL尾部剥离，作为普通文本追加到<a>标签之后
      // 仅在URL无<>包裹时启用（<>包裹属于显式指定URL边界，不应被中断）
      let breakTrailing = '';
      if (!isWrappedByBracket) {
        const stripped = this.stripBreakChars(address);
        address = stripped.address;
        breakTrailing = stripped.trailing;
        // 剥离后地址为空，则不识别
        if (address === '') {
          return match;
        }
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
            return `${prefix}<a href="${encodeURIOnce(`${$protocol}${address}`)}" ${this.target} ${this.rel}>${$e(
              address,
            )}</a>${suffix}${breakTrailing}`;
          }
          return match;
        case '': // 协议为空
          // 不被<>包裹或单边无效包裹，prefix === suffix 时都为空串
          if (prefix === suffix || !isWrappedByBracket) {
            // mailto
            if (EMAIL.test(address)) {
              return `${prefix}<a href="mailto:${encodeURIOnce(address)}" ${this.target} ${this.rel}>${$e(
                address,
              )}</a>${suffix}${breakTrailing}`;
            }
            // 不识别无协议头的URL，且开头不应该含有斜杠
            if (URL_NO_SLASH.test(address)) {
              return `${prefix}${this.renderLink(`//${address}`, address)}${suffix}${breakTrailing}`;
            }
            // 其他的属于非法情况
            return match;
          }
          // 被<>包裹
          if (isWrappedByBracket) {
            // mailto
            if (EMAIL.test(address)) {
              return `<a href="mailto:${encodeURIOnce(address)}" ${this.target} ${this.rel}>${$e(address)}</a>`;
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
          return `${prefix}${this.renderLink(`${$protocol}${address}`)}${suffix}${breakTrailing}`;
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
    let linkText = text?.replace(/CHERRYFLOWSESSIONCURSOR/g, '');
    if (typeof linkText !== 'string') {
      if (this.enableShortLink) {
        const Url = url.replace(/^https?:\/\//i, '');
        linkText = `${Url.substring(0, this.shortLinkLength)}${Url.length > this.shortLinkLength ? '...' : ''}`;
      } else {
        linkText = url;
      }
    }
    const processedURL = this.$engine.urlProcessor(url, 'autolink');
    const safeUri = encodeURIOnce(processedURL);
    const displayUri = $e(linkText);
    const additionalAttrs = [this.target, this.rel].filter(Boolean).join(' ');
    const customAttrs =
      // @ts-ignore
      this.$engine.$cherry.options.engine.syntax.autoLink.attrRender(processedURL, processedURL) ?? '';
    return `<a href="${AutoLink.escapePreservedSymbol(safeUri)}" title="${AutoLink.escapePreservedSymbol($e(url))}" ${
      typeof customAttrs === 'string' ? customAttrs : ''
    }  ${additionalAttrs}>${AutoLink.escapePreservedSymbol(displayUri)}</a>`;
  }
}
