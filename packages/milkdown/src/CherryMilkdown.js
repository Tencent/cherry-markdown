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
export default class CherryMilkdown {
  /**
   * @param {Object} options
   * @param {HTMLElement} [options.el] 编辑器挂载元素
   * @param {string} [options.value] 初始 markdown 内容
   * @param {Function} [options.onChange] markdown 变化回调
   */
  constructor(options = {}) {
    this.options = options;
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
      .use(listener())
      .create();

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
    return this.editor.action((ctx) => {
      /** @type {any} */
      const manager = ctx.get(listenerCtx);
      return manager.markdown;
    });
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
