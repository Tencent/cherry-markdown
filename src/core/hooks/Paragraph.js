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
import ParagraphBase from '@/core/ParagraphBase';
import { blockNames } from '@/utils/sanitize';
import { getIsClassicBrFromLocal, testKeyInLocal } from '@/utils/config';
/**
 * 段落级语法
 * 段落级语法可以具备以下特性：
 *  1、排他性，可以排除将当前语法之后的所有段落语法
 *  2、可排序，在../HooksConfig.js里设置排序，顺序在前面的段落语法先渲染
 *  3、可嵌套行内语法
 *
 * 段落级语法有以下义务：
 *  1、维护签名，签名用来实现预览区域的局部更新功能
 *  2、维护行号，行号用来实现编辑区和预览区同步滚动
 *     每个段落语法负责计算上文的行号，上文行号不是0就是1，大于1会由BR语法计算行号
 */
export default class Paragraph extends ParagraphBase {
  static HOOK_NAME = 'normalParagraph';

  constructor(options) {
    super();
    // 是否启用经典换行逻辑
    // true：一个换行会被忽略，两个以上连续换行会分割成段落，
    // false： 一个换行会转成<br>，两个连续换行会分割成段落，三个以上连续换行会转成<br>并分割段落
    this.classicBr = testKeyInLocal('classicBr') ? getIsClassicBrFromLocal() : options.globalConfig.classicBr;
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

  /**
   * 段落语法的核心渲染函数
   * @param {string} str markdown源码
   * @param {Function} sentenceMakeFunc 行内语法渲染器
   * @returns {string} html内容
   */
  makeHtml(str, sentenceMakeFunc) {
    if (!this.test(str)) {
      return str;
    }
    return str.replace(this.RULE.reg, (match, preLines, content) => {
      if (this.isContainsCache(match, true)) {
        return match;
      }
      // 判断当前内容里是否包含段落渲染引擎暂存缓存关键字
      const cacheMixedInMatches = this.isContainsCache(content);
      const processor = (p) => {
        if (p.trim() === '') {
          return '';
        }
        // 调用行内语法，获得段落的签名和对应html内容
        const { sign, html } = sentenceMakeFunc(p);
        let domName = 'p';
        // 如果包含html块级标签（比如div、blockquote等），则当前段落外层用div包裹，反之用p包裹
        const isContainBlockTest = new RegExp(`<(${blockNames})[^>]*>`, 'i');
        if (isContainBlockTest.test(html)) {
          domName = 'div';
        }
        // 计算行号
        const lines = this.getLineCount(p, p);
        return `<${domName} data-sign="${sign}${lines}" data-type="${domName}" data-lines="${lines}">${this.$cleanParagraph(
          html,
        )}</${domName}>`;
      };
      if (cacheMixedInMatches) {
        return this.makeExcludingCached(`${preLines}${content}`, processor);
      }
      return processor(`${preLines}${content}`);
    });
  }

  rule() {
    const ret = { begin: '(?:^|\\n)(\\n*)', end: '(?=\\s*$|\\n\\n)', content: '([\\s\\S]+?)' };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
