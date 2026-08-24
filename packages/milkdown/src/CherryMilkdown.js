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
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { nord } from '@milkdown/theme-nord';
import { getMarkdown, replaceAll } from '@milkdown/utils';
import CherryEngine from '@cherry-markdown/engine';
import EditorAdapter from './EditorAdapter';

export class MarkdownRoundTripError extends Error {
  constructor(source, output) {
    super('[CherryMilkdown] Markdown round-trip changed unsupported syntax');
    this.name = 'MarkdownRoundTripError';
    this.code = 'CHERRY_MARKDOWN_UNSUPPORTED_SYNTAX';
    this.source = source;
    this.output = output;
  }
}

const normalizeMarkdown = (markdown) =>
  (markdown || '')
    .replace(/\r\n?/g, '\n')
    .replace(/^(\s*)[-+*]\s+/gm, '$1* ')
    .replace(/\n+$/, '');

/**
 * CherryMilkdown - 基于 Milkdown 的所见即所得（WYSIWYG）实验包
 *
 * 第一阶段定位：独立验证所见即所得编辑能力，不进入 cherry-markdown 默认依赖。
 * 验证重点：Markdown round-trip、中文 IME、Selection/撤销重做、表格/列表/代码块等。
 *
 * 依赖：
 *  - @cherry-markdown/engine：保持 Cherry 的 Markdown 语义一致性
 *  - Milkdown / Prosemirror：所见即所得编辑
 *
 * @example
 *   const editor = new CherryMilkdown({
 *     el: document.querySelector('#editor'),
 *     value: '# Hello',
 *     onChange: (markdown) => console.log(markdown),
 *   });
 *   await editor.create();
 */
export default class CherryMilkdown extends EditorAdapter {
  /**
   * @param {Object} options
   * @param {HTMLElement} [options.el] 编辑器挂载元素
   * @param {string} [options.value] 初始 markdown 内容
   * @param {Function} [options.onChange] markdown 变化回调
   * @param {Object} [options.engine] Cherry Engine options
   * @param {Object} [options.engineInstance] existing Cherry Engine instance
   * @param {boolean} [options.strictRoundTrip=true] reject syntax Milkdown cannot preserve
   */
  constructor(options = {}) {
    super();
    this.options = options;
    this.engine = options.engineInstance || new CherryEngine(options.engine || {});
    this.strictRoundTrip = options.strictRoundTrip !== false;
    /** @type {import('@milkdown/core').Editor|null} */
    this.editor = null;
  }

  /**
   * 创建 Milkdown 编辑器实例
   * @returns {Promise<import('@milkdown/core').Editor>}
   */
  async create() {
    const { el, value = '', onChange } = this.options;
    if (!el) {
      throw new Error('[CherryMilkdown] options.el is required');
    }
    this.editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, el);
        ctx.set(defaultValueCtx, value);
      })
      // @ts-ignore milkdown 主题/插件类型在不同版本存在差异，实验包放宽类型
      .use(nord)
      .use(commonmark)
      // @ts-ignore listener 插件类型
      .use(listener)
      .create();

    this.assertRoundTrip(value, await this.getMarkdown());

    // 在创建完成后配置 markdown 变化监听
    if (onChange) {
      /** @type {any} */
      const runner = this.editor.action((ctx) => ctx);
      runner.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
        onChange(markdown, prevMarkdown);
      });
    }

    return this.editor;
  }

  /**
   * 获取当前 markdown 内容
   * @returns {Promise<string>}
   */
  async getMarkdown() {
    if (!this.editor) {
      throw new Error('[CherryMilkdown] editor not created, call create() first');
    }
    return this.editor.action(getMarkdown());
  }

  /**
   * Replace the complete Markdown document.
   * @param {string} markdown
   */
  async setMarkdown(markdown) {
    if (!this.editor) {
      throw new Error('[CherryMilkdown] editor not created, call create() first');
    }
    this.editor.action(replaceAll(markdown || ''));
    this.assertRoundTrip(markdown, await this.getMarkdown());
  }

  assertRoundTrip(source, output) {
    if (this.strictRoundTrip && normalizeMarkdown(source) !== normalizeMarkdown(output)) {
      throw new MarkdownRoundTripError(source, output);
    }
    return output;
  }

  /** Render the persisted Markdown with Cherry Engine for parity checks. */
  async getEngineHtml() {
    return this.engine.makeHtml(await this.getMarkdown());
  }

  /**
   * 获取当前编辑器实例
   * @returns {import('@milkdown/core').Editor|null}
   */
  getEditor() {
    return this.editor;
  }

  /**
   * 销毁编辑器
   */
  async destroy() {
    if (this.editor) {
      await this.editor.destroy();
      this.editor = null;
    }
  }
}
