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
import mergeWith from '@/utils/toolkit/mergeWith';
import cloneDeep from '@/utils/toolkit/cloneDeep';
import Engine from '@/Engine';
import defaultConfig from '@/Cherry.config';
import { customizer } from '@/utils/config';
import { urlProcessorProxy } from '@/UrlCache';
import SyntaxHookBase from '@/core/SyntaxBase';
import { htmlToMiniProgramBlocks, markdownToMiniProgramBlocks } from './transform';

/**
 * MiniProgramStream - data-only Cherry stream renderer for MiniProgram native components.
 */
export default class MiniProgramStream {
  /**
   * @readonly
   */
  static config = {
    defaults: defaultConfig,
  };

  /**
   * @param {Partial<import('~types/cherry').CherryOptions>} options
   */
  constructor(options = {}) {
    const defaultConfigCopy = cloneDeep(MiniProgramStream.config.defaults);
    this.options = mergeWith({}, defaultConfigCopy, options, customizer);
    this.options.isPreviewOnly = true;
    this.options.editor.defaultModel = 'previewOnly';
    this.options.toolbars.showToolbar = false;
    this.options.engine.global.flowSessionContext = this.options.engine.global.flowSessionContext !== false;
    if (this.options.engine.global.flowSessionCursor === 'default') {
      this.options.engine.global.flowSessionCursor = '<span class="cherry-flow-session-cursor"></span>';
    }

    if (typeof this.options.engine.global.urlProcessor === 'function') {
      this.options.engine.global.urlProcessor = urlProcessorProxy(this.options.engine.global.urlProcessor);
      this.options.callback.urlProcessor = this.options.engine.global.urlProcessor;
    } else {
      this.options.callback.urlProcessor = urlProcessorProxy(this.options.callback.urlProcessor);
    }

    this.lastMarkdownText = this.options.value || '';
    this.engine = new Engine(this.options, /** @type {import('@/Cherry').default} */ (/** @type {*} */ (this)));
  }

  /**
   * @param {string} markdown
   * @param {boolean} [forceNoCursor]
   * @returns {string}
   */
  makeHtml(markdown, forceNoCursor = false) {
    return /** @type {string} */ (this.engine.makeHtml(markdown || '', 'string', forceNoCursor));
  }

  /**
   * @param {string} markdown
   * @param {import('./transform').MiniProgramTransformOptions} [options]
   * @returns {import('./transform').MiniProgramBlock[]}
   */
  makeBlocks(markdown, options = {}) {
    return markdownToMiniProgramBlocks(this.engine, markdown || '', options);
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

export { SyntaxHookBase, htmlToMiniProgramBlocks, markdownToMiniProgramBlocks };
