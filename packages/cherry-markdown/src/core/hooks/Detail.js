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
import { prependLineFeedForParagraph } from '@/utils/lineFeed';
import { getDetailRule } from '@/utils/regexp';
import { parseDetails } from '@/utils/details';
import { blockNames } from '@/utils/sanitize';

/**
 * @typedef {import('@/utils/details').DetailNode} DetailNode
 * @typedef {import('@/utils/details').DetailSection} DetailSection
 * @typedef {(markdown: string) => { html: string, sign: string }} SentenceRenderer
 */

/**
 * +++(-) 点击查看详情
 * body
 * body
 * ++ 标题（默认收起内容）
 * 内容
 * ++- 标题（默认展开内容）
 * 内容2
 * +++
 */
export default class Detail extends ParagraphBase {
  static HOOK_NAME = 'detail';

  constructor() {
    super({ needCache: true });
    this.hasDetails = false;
  }

  beforeMakeHtml(str) {
    this.hasDetails = false;
    return str;
  }

  afterMakeHtml(str) {
    if (!this.hasDetails) return super.afterMakeHtml(str);
    // A detail can be hidden in a panel/quote cache, and itself contain cached
    // blocks. Restore the entire cache dependency chain before document passes
    // such as TOC generation run. Only folding documents need this extra pass.
    let html = str;
    let previous;
    do {
      previous = html;
      for (const hook of this.$engine.hooks.paragraph) {
        if (hook instanceof ParagraphBase) html = hook.restoreCache(html);
      }
    } while (html !== previous);
    return html;
  }

  makeHtml(str, sentenceMakeFunc) {
    let cursor = 0;
    let result = '';
    for (const node of parseDetails(str)) {
      this.hasDetails = true;
      const match = str.slice(node.start, node.end);
      const sign = this.$engine.hash(match);
      const lineCount = this.getLineCount(match, node.preLines);
      // Revisit child hooks on every render: document-level heading IDs and
      // other state must also account for bodies whose text has not changed.
      const cached = this.pushCache(this.$renderNode(node, str, sentenceMakeFunc), sign, lineCount);
      result += str.slice(cursor, node.start) + prependLineFeedForParagraph(match, cached);
      cursor = node.end;
    }
    return result + str.slice(cursor);
  }

  /**
   * @param {DetailNode} node
   * @param {string} source
   * @param {SentenceRenderer} sentenceMakeFunc
   * @param {boolean} [nested]
   */
  $renderNode(node, source, sentenceMakeFunc, nested = false) {
    const type = node.sections.length > 1 ? 'multiple' : 'single';
    // Nested single sections need only their native details/summary structure.
    // Extra wrappers triple DOM depth and make browsers flatten valid HTML.
    const needsWrapper = !nested || type === 'multiple';
    const html = this.$renderSections(node, source, sentenceMakeFunc, needsWrapper);
    if (!needsWrapper) return html;
    const raw = source.slice(node.start, node.end);
    const sign = this.$engine.hash(raw);
    const lines = this.getLineCount(raw, node.preLines);
    return `<div class="cherry-detail cherry-detail__${type}" data-sign="${sign}" data-lines="${lines}" >${html}</div>`;
  }

  /**
   * @param {DetailNode} node
   * @param {string} source
   * @param {SentenceRenderer} sentenceMakeFunc
   * @param {boolean} [bodyWrapper]
   */
  $renderSections(node, source, sentenceMakeFunc, bodyWrapper = true) {
    let html = '';
    for (const section of node.sections) {
      let { start } = section;
      let bodyHtml = '';
      for (const child of section.children) {
        bodyHtml += this.$renderBody(source.slice(start, child.start), sentenceMakeFunc);
        bodyHtml += this.$renderNode(child, source, sentenceMakeFunc, true);
        start = child.end;
      }
      bodyHtml += this.$renderBody(source.slice(start, section.end), sentenceMakeFunc);
      html += this.$renderSection(section, bodyHtml, sentenceMakeFunc, bodyWrapper);
    }
    return html;
  }

  // Legacy helper: delegate syntax parsing to the same parser used by makeHtml.
  $getDetailInfo(isOpen, title, str, sentenceMakeFunc) {
    const source = `+++${isOpen} ${title}\n${str}\n+++`;
    const [node] = parseDetails(source);
    if (!node) {
      return { type: 'single', html: this.$getDetailHtml(isOpen === '-', title, str, sentenceMakeFunc) };
    }
    return {
      type: node.sections.length > 1 ? 'multiple' : 'single',
      html: this.$renderSections(node, source, sentenceMakeFunc),
    };
  }

  $renderBody(str, sentenceMakeFunc) {
    if (str.trim() === '') return '';
    const paragraphProcessor = (str) => {
      if (str.trim() === '') {
        return '';
      }
      // 调用行内语法，获得段落的签名和对应html内容
      const { html } = sentenceMakeFunc(str);
      let domName = 'p';
      // 如果包含html块级标签（比如div、blockquote等），则当前段落外层用div包裹，反之用p包裹
      const isContainBlockTest = new RegExp(`<(${blockNames})[^>]*>`, 'i');
      if (isContainBlockTest.test(html)) {
        domName = 'div';
      }
      return `<${domName}>${this.$cleanParagraph(html)}</${domName}>`;
    };
    const paragraphs = (body) =>
      this.isContainsCache(body) ? this.makeExcludingCached(body, paragraphProcessor) : paragraphProcessor(body);
    return this.$engine.makeHtmlForDetail(str, paragraphs);
  }

  // Legacy helper: adapt its arguments to the same normalized section renderer.
  $getDetailHtml(defaultOpen, title, str, sentenceMakeFunc) {
    const section = {
      opening: `<details ${defaultOpen ? 'open' : ''}>`,
      summaryOpening: '<summary>',
      title,
    };
    return this.$renderSection(section, this.$renderBody(str, sentenceMakeFunc), sentenceMakeFunc);
  }

  /**
   * @param {Pick<DetailSection, 'opening' | 'summaryOpening' | 'title'>} section
   * @param {string} body
   * @param {SentenceRenderer} sentenceMakeFunc
   * @param {boolean} [bodyWrapper]
   */
  $renderSection(section, body, sentenceMakeFunc, bodyWrapper = true) {
    let ret = section.opening;
    if (section.summaryOpening) {
      ret += `${section.summaryOpening}${sentenceMakeFunc(section.title).html}</summary>`;
    }
    ret += bodyWrapper ? `<div class="cherry-detail-body">${body}</div>` : body;
    return `${ret}</details>`;
  }

  rule() {
    return getDetailRule();
  }
}
