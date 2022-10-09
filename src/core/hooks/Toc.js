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
import { prependLineFeedForParagraph, calculateLinesOfParagraph } from '@/utils/lineFeed';

function defaultLinkProcessor(link) {
  return link;
}

const defaultOptions = {
  tocStyle: 'plain', // plain or nested
  tocNodeClass: 'toc-li',
  tocContainerClass: 'toc',
  tocTitleClass: 'toc-title',
  linkProcessor: defaultLinkProcessor,
};

const emptyLinePlaceholder = '<p data-sign="empty-toc" data-lines="1">&nbsp;</p>';

export default class Toc extends ParagraphBase {
  static HOOK_NAME = 'toc';

  tocStyle = 'nested'; // plain or nested
  tocNodeClass = 'toc-li';
  tocContainerClass = 'toc';
  tocTitleClass = 'toc-title';
  linkProcessor = defaultLinkProcessor;
  baseLevel = 1;
  /** 标记当前是否处于第一个toc，且仅渲染一个toc */
  isFirstTocToken = true;
  /** 允许渲染多个TOC */
  allowMultiToc = false;

  constructor({ externals, config }) {
    super({ needCache: true });
    Object.keys(defaultOptions).forEach((key) => {
      this[key] = config[key] || defaultOptions[key];
    });
  }

  beforeMakeHtml(str) {
    let $str = str;
    if (this.test($str, 'extend')) {
      $str = $str.replace(this.RULE.extend.reg, (match, lines, toc) => {
        if (!this.allowMultiToc && !this.isFirstTocToken) {
          // 需要补齐非捕获的\n，以及第一个分组中的\n
          return `\n${lines}${emptyLinePlaceholder}`;
        }
        const placeHolder = this.pushCache(match);
        this.isFirstTocToken = false;
        return prependLineFeedForParagraph(match, placeHolder);
      });
    }
    if (this.test($str, 'standard')) {
      $str = $str.replace(this.RULE.standard.reg, (match, lines, toc) => {
        if (!this.allowMultiToc && !this.isFirstTocToken) {
          // 需要补齐非捕获的\n，以及第一个分组中的\n
          return `\n${lines}${emptyLinePlaceholder}`;
        }
        this.isFirstTocToken = false;
        const placeHolder = this.pushCache(match);
        return prependLineFeedForParagraph(match, placeHolder);
      });
    }
    return $str;
  }

  makeHtml(str) {
    return str;
  }

  $makeLevel(num) {
    let ret = '';
    for (let i = this.baseLevel; i < num; i++) {
      ret += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    }
    return ret;
  }

  /**
   * 生成TOC节点HTML
   * @param {{ level: number; id: string; text: string }} node Toc节点对象
   * @param {boolean} prependWhitespaceIndent 是否在文本前插入缩进空格
   * @param {boolean} [closeTag=true] 是否闭合标签
   * @returns {string}
   */
  $makeTocItem(node, prependWhitespaceIndent, closeTag = true) {
    let nodePrefix = '';
    if (prependWhitespaceIndent) {
      nodePrefix = this.$makeLevel(node.level);
    }
    const tocLink = this.linkProcessor(`#${node.id}`.replace(/safe_/g, '')); // transform header id to avoid being sanitized
    return `<li class="${this.tocNodeClass}">${nodePrefix}<a href="${tocLink}" class="level-${node.level}">${
      node.text
    }</a>${closeTag ? '</li>' : ''}`;
  }

  $makePlainToc(tocNodeList) {
    // this.baseLevel = Math.min(...tocNodeList.map((node) => node.level));
    const items = tocNodeList.map((node) => this.$makeTocItem(node, true));
    return items.join('');
  }

  /**
   * 生成嵌套的TOC列表，算法思路参考flexmark
   * @see https://github.com/vsch/flexmark-java/blob/master/flexmark-ext-toc/
   * src/main/java/com/vladsch/flexmark/ext/toc/TocUtils.java#L140-L227
   *
   * @param {{ level:number; id:string; text:string }[]} nodeList 节点列表
   * @returns {string}
   */
  $makeNestedToc(nodeList) {
    let lastLevel = 0;
    const unclosedItem = new Array(7).fill(false);
    const unclosedList = new Array(7).fill(false);
    // lists nodes for debug
    // const lists = [];
    // const nodes = [];
    let html = '';
    nodeList.forEach((node) => {
      const { level: nodeLevel } = node;
      if (lastLevel === 0) {
        for (let i = nodeLevel; i >= this.baseLevel; i--) {
          html += '<ul>';
          // lists.push('ul');
          // nodes.push(null);
          unclosedList[i] = true;
        }
        html += this.$makeTocItem(node, false, false);
        // lists.push('li');
        // nodes.push(node);
        unclosedItem[nodeLevel] = true;
        lastLevel = nodeLevel;
        return;
      }
      if (nodeLevel < lastLevel) {
        // 减少层级
        for (let i = lastLevel; i >= nodeLevel; i--) {
          if (unclosedItem[i]) {
            html += '</li>';
            // lists.push('/li');
            // nodes.push(null);
            unclosedItem[i] = false;
          }
          // 减少层级时，不闭合当前层级的列表，只闭合同层级的列表项
          if (unclosedList[i] && i > nodeLevel) {
            html += '</ul>';
            // lists.push('/ul');
            // nodes.push(null);
            unclosedList[i] = false;
          }
        }
        unclosedItem[nodeLevel] = true;
        html += this.$makeTocItem(node, false, false);
        // lists.push('li');
        // nodes.push(node);
        lastLevel = nodeLevel;
      } else if (nodeLevel === lastLevel) {
        if (unclosedItem[lastLevel]) {
          html += '</li>';
          // lists.push('/li');
          // nodes.push(null);
        }
        html += this.$makeTocItem(node, false, false);
        // lists.push('li');
        // nodes.push(node);
        unclosedItem[nodeLevel] = true;
        unclosedList[nodeLevel] = true;
      } else {
        // 增加层级
        for (let i = lastLevel + 1; i <= nodeLevel; i++) {
          html += '<ul>';
          // lists.push('ul');
          // nodes.push(null);
          unclosedList[i] = true;
        }
        unclosedItem[nodeLevel] = true;
        html += this.$makeTocItem(node, false, false);
        // lists.push('li');
        // nodes.push(node);
        lastLevel = nodeLevel;
      }
    });
    for (let i = lastLevel; i >= this.baseLevel; i--) {
      if (unclosedItem[i]) {
        html += '</li>';
        // lists.push('/li');
        // nodes.push(null);
        unclosedItem[i] = false;
      }
      if (unclosedList[i]) {
        html += '</ul>';
        // lists.push('/ul');
        // nodes.push(null);
        unclosedList[i] = false;
      }
    }
    // console.log(lists, nodes);
    // console.log(html);
    return html;
  }

  $makeToc(arr, dataSign, preLinesMatch) {
    const lines = calculateLinesOfParagraph(preLinesMatch, 1);
    let ret = `<dir class="${this.tocContainerClass}" data-sign="${dataSign}-${lines}" data-lines="${lines}">`;
    ret += `<p class="${this.tocTitleClass}">目录</p>`;
    if (arr.length <= 0) {
      return '';
    }
    this.baseLevel = Math.min(...arr.map((node) => node.level));
    if (this.tocStyle === 'nested') {
      ret += this.$makeNestedToc(arr);
    } else {
      ret += this.$makePlainToc(arr);
    }
    ret += '</dir>';
    return ret;
  }

  afterMakeHtml(str) {
    let $str = super.afterMakeHtml(str);
    const headerList = [];
    const headerRegex = /<h([1-6])[^>]*? id="([^"]+?)"[^>]*?>(?:<a[^/]+?\/a>|)(.+?)<\/h\1>/g;
    let str2Md5 = '';
    $str.replace(headerRegex, (match, level, id, text) => {
      const $text = text.replace(/~fn#[0-9]+#/g, '');
      headerList.push({ level: +level, id, text: $text });
      str2Md5 += `${level}${id}`;
    });
    str2Md5 = this.$engine.md5(str2Md5);
    $str = $str.replace(/(?:^|\n)(\[\[|\[|【【)(toc|TOC)(\]\]|\]|】】)([<~])/, (match) =>
      match.replace(/(\]\]|\]|】】)([<~])/, '$1\n$2'),
    );
    // 首先识别扩展语法
    $str = $str.replace(this.RULE.extend.reg, (match, preLinesMatch) =>
      this.$makeToc(headerList, str2Md5, preLinesMatch),
    );
    // 处理标准语法
    $str = $str.replace(this.RULE.standard.reg, (match, preLinesMatch) =>
      this.$makeToc(headerList, str2Md5, preLinesMatch),
    );
    // 重置toc状态
    this.isFirstTocToken = true;
    return $str;
  }

  test(str, flavor) {
    return this.RULE[flavor].reg ? this.RULE[flavor].reg.test(str) : false;
  }

  rule() {
    const extend = {
      begin: '(?:^|\\n)(\\n*)',
      end: '(?=$|\\n)',
      content: '[ ]*((?:【【|\\[\\[)(?:toc|TOC)(?:\\]\\]|】】))[ ]*',
    };
    extend.reg = new RegExp(extend.begin + extend.content + extend.end, 'g');
    const standard = { begin: '(?:^|\\n)(\\n*)', end: '(?=$|\\n)', content: '[ ]*(\\[(?:toc|TOC)\\])[ ]*' };
    standard.reg = new RegExp(standard.begin + standard.content + standard.end, 'g');
    return { extend, standard };
  }
}
