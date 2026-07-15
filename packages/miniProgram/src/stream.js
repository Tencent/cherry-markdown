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
import { markdownToHtml } from './miniMarkdown';
import { htmlToMiniProgramBlocks, markdownToMiniProgramBlocks } from './transform';

class SyntaxHookBase {}

/**
 * MiniProgramStream - data-only Cherry stream renderer for MiniProgram native components.
 */
export default class MiniProgramStream {
  /**
   * @readonly
   */
  static config = {
    defaults: {},
  };

  /**
   * @param {Partial<import('~types/cherry').CherryOptions>} options
   */
  constructor(options = {}) {
    this.options = options;
    this.lastMarkdownText = this.options.value || '';
  }

  /**
   * @param {string} markdown
   * @param {boolean} [forceNoCursor]
   * @returns {string}
   */
  makeHtml(markdown, forceNoCursor = false) {
    const html = markdownToHtml(markdown || '');
    if (forceNoCursor) {
      return html;
    }
    return html.replace(/<\/p>$/, '<span class="cherry-flow-session-cursor"></span></p>');
  }

  /**
   * @param {string} markdown
   * @param {import('./transform').MiniProgramTransformOptions} [options]
   * @returns {import('./transform').MiniProgramBlock[]}
   */
  makeBlocks(markdown, options = {}) {
    const forceNoCursor = options.forceNoCursor !== false;
    return htmlToMiniProgramBlocks(this.makeHtml(markdown || '', forceNoCursor), { ...options, forceNoCursor });
  }

  /**
   * @param {string} content
   * @param {import('./transform').MiniProgramTransformOptions} [options]
   * @returns {import('./transform').MiniProgramBlock[]}
   */
  setMarkdown(content, options = {}) {
    this.lastMarkdownText = content || '';
    return this.makeBlocks(this.lastMarkdownText, options);
  }

  /**
   * @returns {string}
   */
  getMarkdown() {
    return this.lastMarkdownText;
  }

  /**
   * Data-only runtime. MiniProgram consumers own throttled cursor updates.
   */
  clearFlowSessionCursor() {}
}

export { SyntaxHookBase, htmlToMiniProgramBlocks, markdownToHtml, markdownToMiniProgramBlocks };
