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
import { parseDocument } from 'htmlparser2';
import { createMiniProgramEngine } from '../shared/engine';
import { markdownToMiniProgramView } from '../shared/renderer';
import { markdownToMiniProgramBlocks } from '../shared/transform';

export function markdownToHtml(markdown, options = {}) {
  return createMiniProgramEngine({
    ...options,
    engine: {
      ...(options.engine || {}),
      global: {
        ...(options.engine?.global || {}),
        flowSessionContext: options.engine?.global?.flowSessionContext ?? true,
      },
    },
  }).makeHtml(markdown || '', 'string', true);
}

/**
 * CherryStream - data-only Cherry stream renderer for MiniProgram native components.
 */
export default class CherryStream {
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
    this.options = {
      ...options,
      engine: {
        ...(options.engine || {}),
        global: {
          ...(options.engine?.global || {}),
          flowSessionContext: options.engine?.global?.flowSessionContext ?? true,
        },
      },
    };
    this.lastMarkdownText = this.options.value || '';
    this.engine = createMiniProgramEngine(this.options);
  }

  /**
   * @param {string} markdown
   * @param {boolean} [forceNoCursor]
   * @returns {string}
   */
  makeHtml(markdown, returnType = 'string', forceNoCursor = true) {
    const html = this.engine.makeHtml(markdown || '', 'string', true);
    if (returnType === 'object') {
      return parseDocument(html.replace(/\n/g, ''));
    }
    if (returnType === 'miniProgramBlocks') {
      return this.makeBlocks(markdown || '', { forceNoCursor });
    }
    return html;
  }

  /**
   * @param {string} markdown
   * @param {import('../shared/transform').MiniProgramTransformOptions} [options]
   * @returns {import('../shared/transform').MiniProgramBlock[]}
   */
  makeBlocks(markdown, options = {}) {
    const forceNoCursor = options.forceNoCursor !== false;
    return markdownToMiniProgramBlocks(this.engine, markdown || '', { ...options, forceNoCursor });
  }

  /**
   * @param {string} content
   * @param {import('../shared/transform').MiniProgramTransformOptions} [options]
   * @returns {import('../shared/transform').MiniProgramBlock[]}
   */
  setMarkdown(content, options = {}) {
    this.lastMarkdownText = content || '';
    return this.makeView(this.lastMarkdownText, options);
  }

  setMarkdownView(content, options = {}) {
    return this.setMarkdown(content, options);
  }

  /**
   * @param {string} markdown
   * @param {import('../shared/transform').MiniProgramTransformOptions & import('../shared/view').MiniProgramViewOptions} [options]
   * @returns {import('../shared/view').MiniProgramViewBlock[]}
   */
  makeView(markdown, options = {}) {
    return markdownToMiniProgramView(this.engine, markdown || '', options);
  }

  /**
   * @param {string} content
   * @param {import('../shared/transform').MiniProgramTransformOptions & import('../shared/view').MiniProgramViewOptions} [options]
   * @returns {import('../shared/view').MiniProgramViewBlock[]}
   */
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
