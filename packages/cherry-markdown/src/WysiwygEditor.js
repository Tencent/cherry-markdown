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
import Logger from './Logger';

/**
 * WysiwygEditor - Milkdown Crepe 编辑器的包装类
 * 提供与 Cherry 集成所需的统一接口
 */
export default class WysiwygEditor {
  /**
   * @param {object} options
   * @param {import('./Cherry').default} options.$cherry Cherry 实例
   * @param {HTMLElement} options.editorDom WYSIWYG 编辑器挂载的 DOM 容器
   * @param {string} [options.value] 初始 markdown 内容
   */
  constructor(options) {
    this.$cherry = options.$cherry;
    this.editorDom = options.editorDom;
    this.value = options.value || '';
    /** @type {import('@milkdown/crepe').Crepe | null} */
    this.crepe = null;
    this.initialized = false;
    this.lastMarkdownText = '';
  }

  /**
   * 初始化 Milkdown Crepe 编辑器
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      return;
    }

    const wysiwygConfig = this.$cherry.options.wysiwyg;
    if (!wysiwygConfig?.Crepe) {
      Logger.error('WYSIWYG mode requires Milkdown Crepe. Use Cherry.usePlugin(MilkdownWysiwygPlugin, { Crepe }).');
      return;
    }

    const CrepeClass = wysiwygConfig.Crepe;
    const crepeOptions = wysiwygConfig.crepeOptions || {};

    this.crepe = new CrepeClass({
      root: this.editorDom,
      defaultValue: this.value,
      ...crepeOptions,
    });

    // 注册内容变化监听
    this.crepe.on((listener) => {
      listener.markdownUpdated((ctx, markdown) => {
        if (markdown !== this.lastMarkdownText) {
          this.lastMarkdownText = markdown;
          const html = this.$cherry.engine.makeHtml(markdown);
          this.$cherry.$event.emit('afterChange', { markdownText: markdown, html });
        }
      });
    });

    await this.crepe.create();
    this.initialized = true;
    this.lastMarkdownText = this.value;
  }

  /**
   * 获取当前 markdown 内容
   * @returns {string}
   */
  getValue() {
    if (!this.crepe || !this.initialized) {
      return this.value;
    }
    return this.crepe.getMarkdown();
  }

  /**
   * 设置 markdown 内容（用于模式切换时同步内容）
   * @param {string} markdown
   */
  setValue(markdown) {
    this.value = markdown;
    this.lastMarkdownText = markdown;
    if (this.crepe && this.initialized) {
      const { replaceAll } = this.$cherry.options.wysiwyg;
      if (typeof replaceAll === 'function') {
        this.crepe.editor.action(replaceAll(markdown));
      } else {
        Logger.warn('replaceAll not provided, recreating Crepe editor to update content.');
        this.destroy();
        this.editorDom.innerHTML = '';
        this.init();
      }
    }
  }

  /**
   * 销毁 Milkdown 实例
   */
  destroy() {
    if (this.crepe) {
      this.crepe.destroy();
      this.crepe = null;
      this.initialized = false;
    }
  }
}
