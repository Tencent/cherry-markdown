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
import { compileRegExp } from '@/utils/regexp';
import { calculateLinesOfParagraph } from '@/utils/lineFeed';

const ATX_HEADER = 'atx';
const SETEXT_HEADER = 'setext';
const toDashChars = /[\s\-_]/;
const alphabetic = /[A-Za-z]/;
const numeric = /[0-9]/;

export default class Header extends ParagraphBase {
  static HOOK_NAME = 'header';

  constructor({ externals, config } = { config: undefined, externals: undefined }) {
    super({ needCache: true });
    this.strict = config ? !!config.strict : true;
    this.RULE = this.rule();
    this.headerIDCache = [];
    this.headerIDCounter = {};
    this.config = config || {};
    // TODO: AllowCustomID
  }

  $parseTitleText(html = '') {
    if (typeof html !== 'string') {
      return '';
    }
    return html.replace(/<.*?>/g, '').replace(/&#60;/g, '<').replace(/&#62;/g, '>');
  }

  /**
   * refer:
   * @see https://github.com/vsch/flexmark-java/blob/8bf621924158dfed8b84120479c82704020a6927/flexmark
   * /src/main/java/com/vladsch/flexmark/html/renderer/HeaderIdGenerator.java#L90-L113
   *
   * @param {string} headerText
   * @param {boolean} [toLowerCase]
   * @returns
   */
  $generateId(headerText, toLowerCase = true) {
    const len = headerText.length;
    let id = '';
    for (let i = 0; i < len; i++) {
      const c = headerText.charAt(i);
      if (alphabetic.test(c)) {
        id += toLowerCase ? c.toLowerCase() : c;
      } else if (numeric.test(c)) {
        id += c;
      } else if (toDashChars.test(c)) {
        id += id.length < 1 || id.charAt(id.length - 1) !== '-' ? '-' : '';
      } else if (c.charCodeAt(0) > 255) {
        // unicode
        try {
          id += encodeURIComponent(c);
        } catch (error) {
          // empty
        }
      }
    }
    return id;
  }

  generateIDNoDup(headerText) {
    // 处理被引擎转换过的实体字符
    const unescapedHeaderText = headerText.replace(/&#60;/g, '<').replace(/&#62;/g, '>');
    let newId = this.$generateId(unescapedHeaderText, true);
    const idIndex = this.headerIDCache.indexOf(newId);
    if (idIndex !== -1) {
      this.headerIDCounter[idIndex] += 1;
      newId += `-${this.headerIDCounter[idIndex] + 1}`;
    } else {
      const newIndex = this.headerIDCache.push(newId);
      this.headerIDCounter[newIndex - 1] = 1;
    }
    return newId;
  }

  $wrapHeader(text, level, dataLines, sentenceMakeFunc) {
    // 需要经过一次escape
    const processedText = sentenceMakeFunc(text.trim());
    let { html } = processedText;
    // TODO: allowCustomID开关
    // let htmlAttr = this.getAttributes(html);
    // html = htmlAttr.str;
    // let attrs = htmlAttr.attrs;
    // console.log(attrs);
    const customIDRegex = /\s+\{#([A-Za-z0-9-]+)\}$/; // ?<id>
    const idMatch = html.match(customIDRegex);
    let anchorID;
    if (idMatch !== null) {
      html = html.substring(0, idMatch.index);
      [, anchorID] = idMatch;
    }
    const headerTextRaw = this.$parseTitleText(html);
    if (!anchorID) {
      const replaceFootNote = /~fn#([0-9]+)#/g;
      anchorID = this.generateIDNoDup(headerTextRaw.replace(replaceFootNote, ''));
    }
    const safeAnchorID = `safe_${anchorID}`; // transform header id to avoid being sanitized
    const sign = this.$engine.md5(`${level}-${processedText.sign}-${anchorID}-${dataLines}`);
    const result = [
      `<h${level} id="${safeAnchorID}" data-sign="${sign}" data-lines="${dataLines}">`,
      this.$getAnchor(anchorID),
      `${html}`,
      `</h${level}>`,
    ].join('');
    return { html: result, sign: `${sign}` };
  }

  $getAnchor(anchorID) {
    const anchorStyle = this.config.anchorStyle || 'default';
    if (anchorStyle === 'none') {
      return '';
    }
    return `<a class="anchor" href="#${anchorID}"></a>`;
  }

  beforeMakeHtml(str) {
    let $str = str;
    // atx 优先
    if (this.test($str, ATX_HEADER)) {
      $str = $str.replace(this.RULE[ATX_HEADER].reg, (match, lines, level, text) => {
        if (text.trim() === '') {
          return match;
        }
        return this.getCacheWithSpace(this.pushCache(match), match, true);
      });
    }
    // 按照目前的引擎，每个hook只会执行一次，所以需要并行执行替换
    if (this.test($str, SETEXT_HEADER)) {
      $str = $str.replace(this.RULE[SETEXT_HEADER].reg, (match, lines, text) => {
        if (text.trim() === '' || this.isContainsCache(text)) {
          return match;
        }
        return this.getCacheWithSpace(this.pushCache(match), match, true);
      });
    }
    return $str;
  }

  makeHtml(str, sentenceMakeFunc) {
    // 先还原
    let $str = this.restoreCache(str);
    // atx 优先
    if (this.test($str, ATX_HEADER)) {
      $str = $str.replace(this.RULE[ATX_HEADER].reg, (match, lines, level, text) => {
        // 其中有两行是beforeMake加上的
        const lineCount = calculateLinesOfParagraph(lines, this.getLineCount(match.replace(/^\n+/, '')));
        const $text = text.replace(/\s+#+\s*$/, ''); // close tag
        const { html: result, sign } = this.$wrapHeader($text, level.length, lineCount, sentenceMakeFunc);
        // 文章的开头不加换行
        return this.getCacheWithSpace(this.pushCache(result, sign, lineCount), match, true);
      });
    }
    // 按照目前的引擎，每个hook只会执行一次，所以需要并行执行替换
    if (this.test($str, SETEXT_HEADER)) {
      $str = $str.replace(this.RULE[SETEXT_HEADER].reg, (match, lines, text, level) => {
        if (this.isContainsCache(text)) {
          return match;
        }
        // 其中有两行是beforeMake加上的
        const lineCount = calculateLinesOfParagraph(lines, this.getLineCount(match.replace(/^\n+/, '')));
        const headerLevel = level[0] === '-' ? 2 : 1; // =: H1, -: H2
        const { html: result, sign } = this.$wrapHeader(text, headerLevel, lineCount, sentenceMakeFunc);
        // 文章的开头不加换行
        return this.getCacheWithSpace(this.pushCache(result, sign, lineCount), match, true);
      });
    }
    return $str;
  }

  afterMakeHtml(html) {
    const $html = super.afterMakeHtml(html);
    this.headerIDCache = [];
    this.headerIDCounter = {};
    return $html;
  }

  test(str, flavor) {
    return this.RULE[flavor].reg && this.RULE[flavor].reg.test(str);
  }

  rule() {
    // setext Header
    // TODO: 支持多行标题
    const setext = {
      begin: '(?:^|\\n)(\\n*)', // (?<lines>\\n*)
      content: [
        '(?:\\h*',
        '(.+)', // (?<text>.+)
        ')\\n',
        '(?:\\h*',
        '([=]+|[-]+)', // (?<level>[=]+|[-]+)
        ')',
      ].join(''),
      end: '(?=$|\\n)',
    };
    setext.reg = compileRegExp(setext, 'g', true);

    // atx header
    const atx = {
      begin: '(?:^|\\n)(\\n*)(?:\\h*(#{1,6}))', // (?<lines>\\n*), (?<level>#{1,6})
      content: '(.+?)', // '(?<text>.+?)'
      end: '(?=$|\\n)',
    };
    this.strict && (atx.begin += '(?=\\h+)'); // (?=\\s+) for strict mode
    atx.reg = compileRegExp(atx, 'g', true);

    return { setext, atx };
  }
}
