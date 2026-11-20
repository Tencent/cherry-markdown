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

      wholeStr = wholeStr.replace(/([^\s]+)="([^"\n]+)"/g, (all, attrName, attrValue) => {
        attrValue = attrValue.replace(/\*/g, '&#42;').replace(/_/g, '&#95;');
        return `${attrName}="${attrValue}"`;
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
    // 还原被替换的尖括号占位符：$#60; -> <, $#62; -> >
    $str = $str.replace(/\$#6([02]);/g, (_, d) => (d === '0' ? '<' : '>'));
    // 针对 \<、\>、\&#60;、\&#62; 统一转义为 &lt; / &gt;
    // 注意：\&#60; / \&#62; 必须优先于 \< / \> 匹配，交替分支从左到右尝试即可保证顺序
    $str = $str.replace(/\\(?:&#60;|&#62;|<|>)/g, (m) => {
      // 结尾字符决定方向：
      //   \<     -> 末字符 '<'  -> &lt;
      //   \>     -> 末字符 '>'  -> &gt;
      //   \&#60; -> 末字符 ';' 且倒数第二位 '0' -> &lt;
      //   \&#62; -> 末字符 ';' 且倒数第二位 '2' -> &gt;
      if (m.length === 2) {
        return m.charCodeAt(1) === 60 /* '<' */ ? '&lt;' : '&gt;';
      }
      return m.charCodeAt(m.length - 2) === 48 /* '0' */ ? '&lt;' : '&gt;';
    });
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

  /**
   * 按顶层块级边界拆分 HTML 字符串。
   * 遍历标签的同时维护嵌套深度，仅在 depth === 0 时进行切分。
   * 这样可以保证每一段都是一个完整闭合的"第一层 child"，
   * 从而让下游的分批处理与 sanitize 缓存不依赖于具体的块级标签类型
   * （p / div / blockquote / pre / h* / table ...）都能正确工作。
   * @param {string} html
   * @returns {string[]}
   */
  $splitTopLevelChildren(html) {
    // 自闭合（void）元素，不会增加嵌套深度
    const voidTags = new Set([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ]);
    // 匹配：HTML 注释 | 结束标签 | 起始标签（可带自闭合斜杠）
    // 这里使用贪婪的 [^>]* 是安全的，因为 beforeMakeHtml 已经把游离的 '<' / '>' 做过转义
    const tagRe = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)\b[^>]*?(\/)?>/g;

    const result = [];
    let depth = 0;
    let lastCut = 0;
    let match;

    while ((match = tagRe.exec(html)) !== null) {
      const whole = match[0];
      const closeName = match[1];
      const openName = match[2];
      const selfClose = match[3];
      const start = match.index;

      // 直接跳过 HTML 注释（不作为切分点，也不影响 depth）
      if (whole.charCodeAt(0) === 60 && whole.charCodeAt(1) === 33) {
        continue;
      }

      if (openName) {
        // 遇到顶层起始标签时，标志着一个新的 child 切片开始
        if (depth === 0 && start > lastCut) {
          result.push(html.slice(lastCut, start));
          lastCut = start;
        }
        // 自闭合标签或 void 元素不增加嵌套深度
        if (!selfClose && !voidTags.has(openName.toLowerCase())) {
          depth += 1;
        }
      } else if (closeName) {
        if (!voidTags.has(closeName.toLowerCase())) {
          depth = depth > 0 ? depth - 1 : 0;
        }
      }
    }

    // 收尾：把剩余部分作为最后一段
    if (lastCut < html.length) {
      result.push(html.slice(lastCut));
    }
    // 兜底：如果一个标签都没匹配到（例如纯文本），则整个字符串作为单个切片返回
    if (result.length === 0 && html.length > 0) {
      result.push(html);
    }
    return result;
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

    const $strArr = this.$splitTopLevelChildren($str);
    // 如果内容很大，则分批处理，用空间换sanitizer.sanitize消耗的时间
    const batch = 50;
    // 最大缓存容量（冗余20%）
    const maxCacheLength = Math.max(20, Math.round((1.2 * $strArr.length) / batch));
    const cacheMap = {};
    if ($strArr.length > batch) {
      const ret = [];
      for (let i = 0; i < $strArr.length; i += batch) {
        const batchStr = $strArr.slice(i, i + batch).join('');
        const cacheKey = this.$engine.hashHex(batchStr);
        cacheMap[cacheKey] = batchStr;
        ret.push(
          this.cacheAndGetData(
            cacheKey,
            (cacheKey) => sanitizer.sanitize(cacheMap[cacheKey], config),
            maxCacheLength,
            -1 * Math.round(maxCacheLength / 10),
          ),
        );
      }
      return ret.join('');
    }
    return sanitizer.sanitize($str, config);
  }
}
