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

import { createMiniProgramEngine } from './engine';
import { markdownToMiniProgramView } from './renderer';

/**
 * @typedef {{ markdown: string; blocks: import('./view').MiniProgramViewBlock[]; streaming: boolean; done: boolean }} MiniProgramStreamState
 * @typedef {{
 *   stream?: { setMarkdownView(markdown: string, options?: Record<string, any>): import('./view').MiniProgramViewBlock[] };
 *   value?: string;
 *   viewOptions?: import('./transform').MiniProgramTransformOptions & import('./view').MiniProgramViewOptions;
 *   imagePlaceholderText?: string;
 * }} MiniProgramStreamAdapterOptions
 */

function normalizeChunk(chunk) {
  if (chunk === null || chunk === undefined) {
    return '';
  }
  return String(chunk);
}

function getPayloadContent(data) {
  if (!data) {
    return '';
  }

  try {
    const payload = JSON.parse(data);
    return normalizeChunk(payload.content ?? payload.delta ?? payload.text ?? '');
  } catch {
    return normalizeChunk(data);
  }
}

/**
 * Data-only stream adapter that mirrors CherryStream's flow behavior for MiniProgram pages.
 * Consumers feed chunks and render the returned state with setData.
 */
export class MiniProgramStreamAdapter {
  /**
   * @param {MiniProgramStreamAdapterOptions} [options]
   */
  constructor(options = {}) {
    this.stream = options.stream || null;
    this.viewOptions = options.viewOptions || {};
    this.imagePlaceholderText = options.imagePlaceholderText || '图片将在流式结束后加载';
    this.markdown = options.value || '';
    this.engine =
      options.engine ||
      createMiniProgramEngine({
        engine: {
          global: {
            flowSessionContext: true,
          },
        },
      });
    this.streaming = false;
    this.done = false;
  }

  /**
   * @private
   * @param {boolean} streaming
   * @param {import('./transform').MiniProgramTransformOptions & import('./view').MiniProgramViewOptions} [options]
   * @returns {MiniProgramStreamState}
   */
  render(streaming, options = {}) {
    const viewOptions = {
      ...this.viewOptions,
      imagePlaceholderText: this.imagePlaceholderText,
      deferImages: false,
      forceNoCursor: !streaming,
      ...options,
    };
    return {
      markdown: this.markdown,
      blocks: this.stream
        ? this.stream.setMarkdownView(this.markdown, viewOptions)
        : markdownToMiniProgramView(this.engine, this.markdown, viewOptions),
      streaming,
      done: !streaming && this.done,
    };
  }

  /**
   * @param {string} markdown
   * @param {import('./transform').MiniProgramTransformOptions & import('./view').MiniProgramViewOptions} [options]
   * @returns {MiniProgramStreamState}
   */
  setMarkdown(markdown, options = {}) {
    this.markdown = normalizeChunk(markdown);
    this.streaming = false;
    this.done = true;
    return this.render(false, { deferImages: false, forceNoCursor: true, ...options });
  }

  /**
   * @param {string} chunk
   * @param {import('./transform').MiniProgramTransformOptions & import('./view').MiniProgramViewOptions} [options]
   * @returns {MiniProgramStreamState}
   */
  append(chunk, options = {}) {
    this.markdown += normalizeChunk(chunk);
    this.streaming = true;
    this.done = false;
    return this.render(true, options);
  }

  /**
   * @param {{ data?: string }} event
   * @param {import('./transform').MiniProgramTransformOptions & import('./view').MiniProgramViewOptions} [options]
   * @returns {MiniProgramStreamState | null}
   */
  appendSseEvent(event, options = {}) {
    const chunk = getPayloadContent(event?.data || '');
    if (!chunk) {
      return null;
    }
    return this.append(chunk, options);
  }

  /**
   * @param {import('./transform').MiniProgramTransformOptions & import('./view').MiniProgramViewOptions} [options]
   * @returns {MiniProgramStreamState}
   */
  finish(options = {}) {
    this.streaming = false;
    this.done = true;
    return this.render(false, { deferImages: false, forceNoCursor: true, ...options });
  }

  /**
   * @param {string} [markdown]
   * @returns {MiniProgramStreamState}
   */
  reset(markdown = '') {
    this.markdown = normalizeChunk(markdown);
    this.streaming = false;
    this.done = false;
    return this.render(false, { deferImages: false, forceNoCursor: true });
  }

  /**
   * @returns {MiniProgramStreamState}
   */
  getState() {
    return this.render(this.streaming);
  }
}

/**
 * @param {MiniProgramStreamAdapterOptions} [options]
 * @returns {MiniProgramStreamAdapter}
 */
export function createMiniProgramStreamAdapter(options = {}) {
  return new MiniProgramStreamAdapter(options);
}
