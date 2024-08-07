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
import SyntaxBase, { HOOKS_TYPE_LIST } from './SyntaxBase';
import { prependLineFeedForParagraph } from '@/utils/lineFeed';
import { getIsClassicBrFromLocal, testKeyInLocal } from '@/utils/config';
import { blockNames } from '@/utils/sanitize';

let cacheCounter = 0;
// ~~C${cacheCounter}I${cacheIndex}$
// let cacheMap = {};

export default class ParagraphBase extends SyntaxBase {
  static HOOK_TYPE = HOOKS_TYPE_LIST.PAR;
  // 不需要排他的sign前缀，如~~C0I${IN_PARAGRAPH_CACHE_KEY_PREFIX}sign$
  static IN_PARAGRAPH_CACHE_KEY_PREFIX = '!';
  static IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX = '\\!';

  constructor({ needCache, defaultCache = {} } = { needCache: false }) {
    super({});
    this.needCache = !!needCache;
    this.sign = '';
    if (needCache) {
      this.cache = defaultCache || {};
      this.cacheKey = `~~C${cacheCounter}`;
      cacheCounter += 1;
    }
  }

  initBrReg(classicBr = false) {
    // 是否启用经典换行逻辑
    // true：一个换行会被忽略，两个以上连续换行会分割成段落，
    // false： 一个换行会转成<br>，两个连续换行会分割成段落，三个以上连续换行会转成<br>并分割段落
    this.classicBr = testKeyInLocal('classicBr') ? getIsClassicBrFromLocal() : classicBr;
    this.removeBrAfterBlock = null;
    this.removeBrBeforeBlock = null;
    this.removeNewlinesBetweenTags = null;
  }

  /**
   * 处理经典换行问题
   * @param {string} str markdown源码
   * @returns markdown源码
   */
  $cleanParagraph(str) {
    // remove leading and trailing newlines
    const trimedPar = str.replace(/^\n+/, '').replace(/\n+$/, '');
    if (this.classicBr) {
      return trimedPar;
    }
    const minifiedPar = this.joinRawHtml(trimedPar);
    return minifiedPar.replace(/\n/g, '<br>').replace(/\r/g, '\n'); // recover \n from \r
  }

  /**
   * remove all newlines in html text
   *
   * @param {string} textContainsHtml
   */
  joinRawHtml(textContainsHtml) {
    if (!this.removeBrAfterBlock) {
      // preprocess custom white list
      let customTagWhiteList = this.$engine.htmlWhiteListAppend?.split('|') ?? [];
      customTagWhiteList = customTagWhiteList
        .map((tag) => {
          if (/[a-z-]+/gi.test(tag)) {
            return tag;
          }
          return null;
        })
        .filter((tag) => tag !== null);
      // concat all white list
      const allBlockNames = customTagWhiteList.concat(blockNames).join('|');
      // 段落标签自然换行，所以去掉段落标签两边的换行符
      /**
       * remove newlines after start tag, and remove whitespaces before newline
       * e.g.
       * <p> \n  text</p> => <p>  text</p>
       *  ^^
       * $1$2
       */
      this.removeBrAfterBlock = new RegExp(`<(${allBlockNames})(>| [^>]*?>)[^\\S\\n]*?\\n`, 'ig');
      /**
       * remove newlines before end tag, and whitespaces before end tag will be preserved
       * e.g.
       * <p>  text\n  </p> => <p>  text  </p>
       *                ^
       *               $1
       */
      this.removeBrBeforeBlock = new RegExp(`\\n[^\\S\\n]*?<\\/(${allBlockNames})>[^\\S\\n]*?\\n`, 'ig');
      /**
       * remove newlines between end tag & start tag
       * e.g.
       * </p> \n  <p   foo="bar"> => </p>\r  <p foo="bar">
       *   ^    ^^ ^ ^^^^^^^^^^^^
       *  $1    $2 $3  $4
       */
      this.removeNewlinesBetweenTags = new RegExp(
        `<\\/(${allBlockNames})>[^\\S\\n]*?\\n([^\\S\\n]*?)<(${allBlockNames})(>| [^>]*?>)`,
        'ig',
      );
    }
    return textContainsHtml
      .replace(this.removeBrAfterBlock, '<$1$2')
      .replace(this.removeBrBeforeBlock, '</$1>')
      .replace(this.removeNewlinesBetweenTags, '</$1>\r$2<$3$4'); // replace \n to \r
  }

  toHtml(str, sentenceMakeFunc) {
    return str;
  }

  makeHtml(str, sentenceMakeFunc) {
    return sentenceMakeFunc(str).html;
  }

  afterMakeHtml(html) {
    return this.restoreCache(html);
  }

  isContainsCache(str, fullMatch) {
    if (fullMatch) {
      // 如果是全匹配：不能包含CherryINPRAGRAPH
      const containsParagraphCache = /^(\s*~~C\d+I\w+\$\s*)+$/g.test(str);
      const containsInParagraphCache = new RegExp(
        `~~C\\d+I${ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX}\\w+\\$`,
        'g',
      ).test(str);
      return containsParagraphCache && !containsInParagraphCache;
    }
    // 如果是局部匹配： 不能只包含CherryINPRAGRAPH
    // const containsParagraphCache = /~~C\d+I\w+\$/g.test(str);
    // const containsInParagraphCache = new RegExp(
    //    `~~C\\d+I${ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX}\\w+\\$`, 'g').test(str);
    const containsNonInParagraphCache = new RegExp(
      `~~C\\d+I(?!${ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX})\\w+\\$`,
      'g',
    ).test(str);
    return containsNonInParagraphCache;

    // return fullMatch ?
    //    /^(\s*~~C\d+I\w+\$\s*)+$/g.test(str) && !/^(\s*~~C\d+ICherryINPRAGRAPH\w+\$\s*)+$/g.test(str) :
    //    /~~C\d+I\w+\$/g.test(str) && !(/~~C\d+ICherryINPRAGRAPH\w+\$/g.test(str)
    //        && !/~~C\d+I(?!CherryINPRAGRAPH)\w+\$/g.test(str));
  }

  /**
   *
   * @param {string} html
   * @return
   */
  $splitHtmlByCache(html) {
    // ~~C0I(?!prefix)sign$
    const regex = new RegExp(`\\n*~~C\\d+I(?!${ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX})\\w+\\$\\n?`, 'g');
    return {
      caches: html.match(regex),
      contents: html.split(regex),
    };
  }

  makeExcludingCached(content, processor) {
    const { caches, contents } = this.$splitHtmlByCache(content);
    const paragraphs = contents.map(processor);
    let ret = '';
    for (let i = 0; i < paragraphs.length; i++) {
      ret += paragraphs[i];
      if (caches && caches[i]) {
        ret += caches[i].trim();
      }
    }
    return ret;
  }

  /**
   * 获取非捕获匹配丢掉的换行，适用于能被【嵌套】的段落语法
   *
   * @param {string} cache 需要返回的cache
   * @param {string} md 原始的md字符串
   * @param {boolean} alwaysAlone 是否能被【嵌套】，true：不能被嵌套，如标题、注释等；false：能被嵌套，如代码块、有序列表等
   * @return {string} str
   */
  getCacheWithSpace(cache, md, alwaysAlone = false) {
    const preSpace = md.match(/^\n+/)?.[0] ?? '';
    const afterSpace = md.match(/\n+$/)?.[0] ?? '';
    if (alwaysAlone) {
      return prependLineFeedForParagraph(md, cache);
    }
    return `${preSpace}${cache}${afterSpace}`;
  }

  /**
   * 获取行号，只负责向上计算\n
   * 会计算cache的行号
   *
   * @param {string} md md内容
   * @param {string} preSpace 前置换行
   * @return {number} 行数
   */
  getLineCount(md, preSpace = '') {
    let content = md;
    /**
     * 前置换行个数，【注意】：前置换行个数不包括上文的最后一个\n
     *    例：
     *      - aa\n
     *      - bb\n
     *      \n
     *      cc\n
     *
     *    cc的前置换行个数为 1，bb后的\n不计算在内
     *    cc的正则为：/(?:^|\n)(\n*)xxxxxx/
     */
    let preLineCount = preSpace.match(/^\n+/g)?.[0]?.length ?? 0;
    preLineCount = preLineCount === 1 ? 1 : 0; // 前置换行超过2个就交给BR进行渲染
    content = content.replace(/^\n+/g, '');

    const regex = new RegExp(
      `\n*~~C\\d+I(?:${ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX})?\\w+?_L(\\d+)\\$`,
      'g',
    );
    let cacheLineCount = 0;
    content = content.replace(regex, (match, lineCount) => {
      cacheLineCount += parseInt(lineCount, 10);
      return match.replace(/^\n+/g, '');
    });
    return preLineCount + cacheLineCount + (content.match(/\n/g) || []).length + 1; // 实际内容所占行数，至少为1行
  }

  /**
   *
   * @param {string} str 渲染后的内容
   * @param {string} sign 签名
   * @param {number} lineCount md原文的行数
   * @return {string} cacheKey ~~C0I0_L1$
   */
  pushCache(str, sign = '', lineCount = 0) {
    if (!this.needCache) {
      return;
    }
    const $sign = sign || this.$engine.md5(str);
    this.cache[$sign] = {
      content: str,
      using: true,
    };
    return `${this.cacheKey}I${$sign}_L${lineCount}$`;
  }

  popCache(sign) {
    if (!this.needCache) {
      return;
    }
    return this.cache[sign].content || '';
  }

  resetCache() {
    if (!this.needCache) {
      return;
    }
    for (const key of Object.keys(this.cache)) {
      if (!this.cache[key].using) delete this.cache[key];
    }
    for (const key of Object.keys(this.cache)) {
      this.cache[key].using = false;
    }
  }

  restoreCache(html) {
    // restore cached content
    if (!this.needCache) {
      return html;
    }
    const regex = new RegExp(
      `${this.cacheKey}I((?:${ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX})?\\w+)\\$`,
      'g',
    );
    const $html = html.replace(regex, (match, cacheSign) => this.popCache(cacheSign.replace(/_L\d+$/, '')));
    this.resetCache();
    return $html;
  }

  /**
   *
   * @param {string} wholeMatch whole match
   */
  checkCache(wholeMatch, sentenceMakeFunc, lineCount = 0) {
    this.sign = this.$engine.md5(wholeMatch);
    // miss cache
    if (!this.cache[this.sign]) {
      return this.toHtml(wholeMatch, sentenceMakeFunc);
    }
    // hit & mark cache
    this.cache[this.sign].using = true;
    return `${this.cacheKey}I${this.sign}_L${lineCount}$`;
  }

  mounted() {
    // console.log('base mounted');
  }

  signWithCache(html) {
    return false;
  }
}
