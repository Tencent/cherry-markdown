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
import {
  whiteList,
  convertHTMLNumberToName,
  // isValidScheme, encodeURIOnce,
  escapeHTMLEntitiesWithoutSemicolon,
} from '@/utils/sanitize';
import { sanitizer } from '@/Sanitizer';
import { isBrowser } from '@/utils/env';

/**
 * encode unsafe link-related attributes
 */
const unsafeAttributes = ['href', 'src'];

sanitizer.addHook('afterSanitizeAttributes', (node) => {
  unsafeAttributes.forEach((attr) => {
    if (!node.hasAttribute(attr)) {
      return;
    }
    const value = node.getAttribute(attr);
    // encode unsafe backslash in link attributes
    node.setAttribute(attr, value.replace(/\\/g, '%5c'));
  });
});

export default class HtmlBlock extends ParagraphBase {
  static HOOK_NAME = 'htmlBlock';
  constructor({ config }) {
    super({ needCache: true });
    this.filterStyle = config.filterStyle || false;
    this.removeTrailingNewline = config.removeTrailingNewline || false;
  }

  // ref: http://www.vfmd.org/vfmd-spec/specification/#procedure-for-detecting-automatic-links
  isAutoLinkTag(tagMatch) {
    const REGEX_GROUP = [
      /^<([a-z][a-z0-9+.-]{1,31}:\/\/[^<> `]+)>$/i,
      /^<(mailto:[^<> `]+)>$/i,
      /^<([^()<>[\]:'@\\,"\s`]+@[^()<>[\]:'@\\,"\s`.]+\.[^()<>[\]:'@\\,"\s`]+)>$/i,
    ];
    return REGEX_GROUP.some((regex) => regex.test(tagMatch));
  }

  isHtmlComment(match) {
    const htmlComment = /^<!--.*?-->$/;
    return htmlComment.test(match);
  }

  beforeMakeHtml(str, sentenceMakeFunc) {
    if (this.$engine.htmlWhiteListAppend) {
      /**
       * @property
       * @type {false | RegExp}
       */
      this.htmlWhiteListAppend = new RegExp(`^(${this.$engine.htmlWhiteListAppend})( |$|/)`, 'i');
      /**
       * @property
       * @type {string[]}
       */
      this.htmlWhiteList = this.$engine.htmlWhiteListAppend.split('|');
    } else {
      this.htmlWhiteListAppend = false;
      this.htmlWhiteList = [];
    }
    let htmlBlackList = /^[ ]+/i;
    if (this.$engine.htmlBlackList) {
      htmlBlackList = /\*/.test(this.$engine.htmlBlackList)
        ? /^[^ ]+( |$|\/)/i
        : new RegExp(`^(${this.$engine.htmlBlackList})( |$|/)`, 'i');
    }

    let $str = str;
    $str = convertHTMLNumberToName($str);
    $str = escapeHTMLEntitiesWithoutSemicolon($str);
    $str = $str.replace(/<[/]?([^<]*?)>/g, (whole, m1) => {
      if (htmlBlackList && htmlBlackList.test(m1) && !this.isAutoLinkTag(whole) && !this.isHtmlComment(whole)) {
        if (/\n[\t ]*$/.test(m1)) {
          return whole.replace(/</g, '&#60;');
        }
        return whole.replace(/</g, '&#60;').replace(/>/g, '&#62;');
      }
      // 匹配到非白名单且非AutoLink语法的尖括号会被转义
      // 如果是HTML注释，放行
      if (!whiteList.test(m1) && !this.isAutoLinkTag(whole) && !this.isHtmlComment(whole)) {
        if (this.htmlWhiteListAppend === false || !this.htmlWhiteListAppend.test(m1)) {
          if (/\n[\t ]*$/.test(m1)) {
            return whole.replace(/</g, '&#60;');
          }
          return whole.replace(/</g, '&#60;').replace(/>/g, '&#62;');
        }
      }
      let wholeStr = whole;
      // 识别<a>和<img>标签的href和src属性，并触发urlProcessor回调
      m1.replace(/^a .*? href="([^"]+)"/, (all, href) => {
        const processedURL = this.$engine.urlProcessor(href, 'link');
        wholeStr = wholeStr.replace(/ href="[^"]+"/, ` href="${processedURL}"`);
      });
      m1.replace(/^a href="([^"]+)"/, (all, href) => {
        const processedURL = this.$engine.urlProcessor(href, 'link');
        wholeStr = wholeStr.replace(/ href="[^"]+"/, ` href="${processedURL}"`);
      });
      m1.replace(/^img .*? src="([^"]+)"/, (all, src) => {
        const processedURL = this.$engine.urlProcessor(src, 'image');
        wholeStr = wholeStr.replace(/ src="[^"]+"/, ` src="${processedURL}"`);
      });
      m1.replace(/^img src="([^"]+)"/, (all, src) => {
        const processedURL = this.$engine.urlProcessor(src, 'image');
        wholeStr = wholeStr.replace(/ src="[^"]+"/, ` src="${processedURL}"`);
      });

      // 到达此分支的包含被尖括号包裹的AutoLink语法以及在白名单内的HTML标签
      // 没有被AutoLink解析并渲染的标签会被DOMPurify过滤掉，正常情况下不会出现遗漏
      // 临时替换完整的HTML标签首尾为$#60;和$#62;，供下一步剔除损坏的HTML标签
      return wholeStr.replace(/</g, '$#60;').replace(/>/g, '$#62;');
    });
    // 替换所有形如「<abcd」的左尖括号
    $str = $str.replace(/<(?=(\w|\n|$))/g, '&#60;');
    // 替换所有形如「</」的左尖括号
    $str = $str.replace(/<\//g, '&#60;/');
    // 还原被替换的尖括号
    $str = $str.replace(/\$#60;/g, '<').replace(/\$#62;/g, '>');
    // 针对 \< 和 \> 进行转义
    $str = $str
      .replace(/\\&#60;/g, '&lt;')
      .replace(/\\&#62;/g, '&gt;')
      .replace(/\\</g, '&lt;')
      .replace(/\\>/g, '&gt;');
    // 过滤HTML标签的style属性
    if (this.filterStyle) {
      $str = $str.replace(/<([^/][^>]+?) style="[^>\n]+?"([^>\n]*)>/gi, '<$1$2>');
      $str = $str.replace(/<([^/][^>]+?) style='[^>\n]+?'([^>\n]*)>/gi, '<$1$2>');
    }
    // 对于闭合标签</xxx>后的连续换行符，替换为一个换行符
    if (this.removeTrailingNewline) {
      $str = $str.replace(/(<\/[^>\n]+>)\s*\n\s*\n+/g, '$1\n');
    }
    return $str;
  }

  // beforeMakeHtml(str) {
  //     return str;
  // }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  afterMakeHtml(str) {
    let $str = str;
    const config = {
      ALLOW_UNKNOWN_PROTOCOLS: true,
      ADD_ATTR: ['target'],
    };
    const { htmlAttrWhiteList } = this.$engine.$cherry.options.engine.global;
    config.ADD_ATTR = config.ADD_ATTR.concat(htmlAttrWhiteList?.split(/[;,|]/) ?? []);
    if (this.htmlWhiteListAppend !== false) {
      config.ADD_TAGS = this.htmlWhiteList;
      if (this.htmlWhiteListAppend.test('style') || this.htmlWhiteListAppend.test('ALL')) {
        $str = $str.replace(/<style(>| [^>]*>).*?<\/style>/gi, (match) => {
          return match.replace(/<br>/gi, '');
        });
      }
      if (this.htmlWhiteListAppend.test('iframe') || this.htmlWhiteListAppend.test('ALL')) {
        config.ADD_ATTR = config.ADD_ATTR.concat([
          'align',
          'frameborder',
          'height',
          'longdesc',
          'marginheight',
          'marginwidth',
          'name',
          'sandbox',
          'scrolling',
          'seamless',
          'src',
          'srcdoc',
          'width',
        ]);
        config.SANITIZE_DOM = false;
        $str = $str.replace(/<iframe(>| [^>]*>).*?<\/iframe>/gi, (match) => {
          return match.replace(/<br>/gi, '').replace(/\n/g, '');
        });
      }
      if (this.htmlWhiteListAppend.test('script') || this.htmlWhiteListAppend.test('ALL')) {
        // 如果允许script或者输入了ALL，则不做任何过滤了
        $str = $str.replace(/<script(>| [^>]*>).*?<\/script>/gi, (match) => {
          return match.replace(/<br>/gi, '');
        });
        return $str;
      }
    }
    // node 环境下不输出sign和lines
    if (!isBrowser()) {
      config.FORBID_ATTR = ['data-sign', 'data-lines'];
    }

    // 解决 foreignObject 被清除导致渲染错误 https://github.com/cure53/DOMPurify/issues/1002
    if (!config.ADD_TAGS) {
      config.ADD_TAGS = [];
    }
    if (typeof config.ADD_TAGS === 'string') {
      config.ADD_TAGS += '|foreignObject';
    } else if (Array.isArray(config.ADD_TAGS)) {
      config.ADD_TAGS.push('foreignObject');
    }
    if (!config.HTML_INTEGRATION_POINTS) {
      config.HTML_INTEGRATION_POINTS = {};
    }
    config.HTML_INTEGRATION_POINTS.foreignobject = true;

    const $strArr = $str.split(/(?=<p data-sign=)/);
    // 分批缓存只用于内容较大（>50 段）的文档：未变化的分批可以跨渲染复用，只有尾部变更时重 sanitize。
    // ≤50 段只有一个批次（slice(i, i + batch) 即整篇），不存在分批复用价值；缓存整篇在真实编辑
    // （每次渲染内容都不同）下必然 miss，反而白付一次全文 hash 与 map 开销，故保持上游直通路径。
    const batch = 50;
    if ($strArr.length > batch) {
      // 缓存容量按当前文档的分段数缩放（冗余 30%，下限 200，上限 4000），
      // 长会话流式增长下缓存保持有界，不会因容量过小频繁淘汰前缀批次。
      const maxCacheLength = Math.min(4000, Math.max(200, Math.ceil(1.3 * Math.ceil($strArr.length / batch))));
      const cacheMap = {};
      const ret = [];
      for (let i = 0; i < $strArr.length; i += batch) {
        const batchStr = $strArr.slice(i, i + batch).join('');
        // 缓存 key 指纹的是分批后的输入文本（纯内容）。假设同一 Engine 实例内 sanitize 配置恒定：
        // htmlWhiteListAppend 在 Engine 构造时固化，config 其余项亦由该 hook 的实例配置决定。
        // 若运行期变更白名单/属性配置，需重建 Engine 或 clearEngineCache 后再渲染，
        // 否则可能复用旧配置产出的 sanitize 结果。
        const cacheKey = this.$engine.hashHex(batchStr);
        cacheMap[cacheKey] = batchStr;
        ret.push(
          this.cacheAndGetData(
            cacheKey,
            (cacheKey) => sanitizer.sanitize(cacheMap[cacheKey], config),
            maxCacheLength,
            // 负数契约：超容量时从「最新插入」的一端淘汰（语义见 ParagraphBase.cacheAndGetData），
            // 保留最早插入的稳定前缀批次——流式/续写场景 md 变更集中在尾部，
            // 尾部条目是下一轮即被覆盖的瞬态，而前缀批次每轮渲染都会被命中。
            // 淘汰量沿用原实现 -1 * round(maxCacheLength / 10)：容量下限 200 时该值恒 ≥20，
            // 不会出现 round 到 0 触发 splice(-0)=splice(0) 清空整批缓存的情况。
            -1 * Math.round(maxCacheLength / 10),
          ),
        );
      }
      return ret.join('');
    }
    return sanitizer.sanitize($str, config);
  }
}
