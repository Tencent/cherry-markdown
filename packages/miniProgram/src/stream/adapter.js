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

import { createMiniProgramEngine } from '../shared/engine';
import { markdownToMiniProgramView } from '../shared/renderer';
import { createSseChunkParser } from './sse';

/**
 * @typedef {{ markdown: string; blocks: import('../shared/view').MiniProgramViewBlock[]; streaming: boolean; done: boolean }} MiniProgramStreamState
 * @typedef {{
 *   stream?: { setMarkdownView(markdown: string, options?: Record<string, any>): import('../shared/view').MiniProgramViewBlock[] };
 *   value?: string;
 *   viewOptions?: import('../shared/transform').MiniProgramTransformOptions & import('../shared/view').MiniProgramViewOptions;
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
    this.sseParser = createSseChunkParser();
  }

  /**
   * @private
   * @param {boolean} streaming
   * @param {import('../shared/transform').MiniProgramTransformOptions & import('../shared/view').MiniProgramViewOptions} [options]
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
   * @param {import('../shared/transform').MiniProgramTransformOptions & import('../shared/view').MiniProgramViewOptions} [options]
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
   * @param {import('../shared/transform').MiniProgramTransformOptions & import('../shared/view').MiniProgramViewOptions} [options]
   * @returns {MiniProgramStreamState}
   */
  append(chunk, options = {}) {
    this.markdown += normalizeChunk(chunk);
    this.streaming = true;
    this.done = false;
    return this.render(true, options);
  }

  /**
   * Accepts raw SSE transport chunks and returns the updated Markdown view state.
   * SSE framing, UTF-8 boundaries, JSON payload extraction, and [DONE] are internal.
   * @param {string | ArrayBuffer} chunk
   * @param {import('../shared/transform').MiniProgramTransformOptions & import('../shared/view').MiniProgramViewOptions} [options]
   * @returns {MiniProgramStreamState | null}
   */
  appendSseChunk(chunk, options = {}) {
    let state = null;
    this.sseParser.push(chunk).forEach((event) => {
      if (event.done) {
        state = this.complete(options);
        return;
      }
      const content = getPayloadContent(event.data);
      if (content) {
        state = this.append(content, options);
      }
    });
    return state;
  }

  /**
   * Flushes a pending SSE frame, then completes the Markdown stream.
   * @param {import('../shared/transform').MiniProgramTransformOptions & import('../shared/view').MiniProgramViewOptions} [options]
   * @returns {MiniProgramStreamState}
   */
  complete(options = {}) {
    this.sseParser.end().forEach((event) => {
      if (!event.done) {
        const content = getPayloadContent(event.data);
        if (content) {
          this.append(content, options);
        }
      }
    });
    this.streaming = false;
    this.done = true;
    return this.render(false, { deferImages: false, forceNoCursor: true, ...options });
  }

  /**
   * @param {import('../shared/transform').MiniProgramTransformOptions & import('../shared/view').MiniProgramViewOptions} [options]
   * @returns {MiniProgramStreamState}
   */
  finish(options = {}) {
    return this.complete(options);
  }

  /**
   * @param {string} [markdown]
   * @returns {MiniProgramStreamState}
   */
  reset(markdown = '') {
    this.markdown = normalizeChunk(markdown);
    this.streaming = false;
    this.done = false;
    this.sseParser.reset();
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
