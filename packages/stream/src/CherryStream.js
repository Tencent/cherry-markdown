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
import CherryEngine from '@cherry-markdown/engine';
import { Previewer } from '@cherry-markdown/preview';
import { createElement, isBrowser } from './utils/dom';

/**
 * @typedef {Object} CherryStreamOptions
 * @property {string} [id] 挂载元素 id
 * @property {HTMLElement} [el] 挂载元素
 * @property {string} [value] 初始 markdown 内容
 * @property {boolean} [forceAppend] 找不到挂载元素时是否自动创建
 * @property {Object} [engine] engine 相关配置
 * @property {Object} [previewer] 预览相关配置
 * @property {Object} [previewer.lazyLoadImg] 图片懒加载配置
 */

/**
 * CherryStream - 专门用于流式渲染场景的独立包
 *
 * 特点：
 * 1. 只包含 Engine（解析引擎）和 Previewer（预览区），不包含 Editor 和 Toolbar
 * 2. 不依赖 CodeMirror，包体积更小
 * 3. 适用于纯流式渲染场景（AI 对话、文档预览等）
 *
 * 依赖：
 *  - @cherry-markdown/engine：markdown 解析与 html 渲染
 *  - @cherry-markdown/preview：纯预览渲染
 */
export default class CherryStream {
  /**
   * @param {CherryStreamOptions} options
   */
  constructor(options = {}) {
    this.options = options;

    // stream 版默认不开启下划线
    const engineOptions = {
      ...options,
    };
    if (engineOptions.engine?.syntax && typeof engineOptions.engine.syntax === 'object') {
      engineOptions.engine = {
        ...engineOptions.engine,
        syntax: { ...engineOptions.engine.syntax },
      };
    }

    /** @type {any} */
    this.engine = new CherryEngine(engineOptions);

    /** @type {string} 实例 ID */
    this.instanceId = `cherry-stream-${new Date().getTime()}${Math.random()}`;
    this.lastMarkdownText = this.options.value || '';

    this.init();
  }

  /**
   * 初始化挂载 DOM 与预览区
   * @private
   */
  init() {
    if (!isBrowser()) {
      return;
    }
    /** @type {HTMLElement|null} */
    let mountEl =
      (this.options.id && document.getElementById(this.options.id)) || this.options.el || null;

    if (!mountEl) {
      if (!this.options.forceAppend) {
        return;
      }
      mountEl = document.createElement('div');
      mountEl.id = this.options.id || 'cherry-markdown-stream';
      document.body.appendChild(mountEl);
    }

    this.cherryDom = mountEl;
    this.wrapperDom = createElement('div', ['cherry', 'clearfix', 'theme__default'].join(' '));
    this.wrapperDom.classList.add('cherry--no-toolbar');
    mountEl.appendChild(this.wrapperDom);

    this.previewerDom = createElement('div', 'cherry-previewer cherry-markdown');
    this.wrapperDom.appendChild(this.previewerDom);

    this.previewer = new Previewer({
      previewerDom: this.previewerDom,
      value: this.lastMarkdownText,
      lazyLoadImg: this.options.previewer?.lazyLoadImg,
    });

    this.initText();
  }

  /**
   * @private
   */
  initText() {
    const html = /** @type {string} */ (this.engine.makeHtml(this.lastMarkdownText));
    this.previewer.update(html);
  }

  /**
   * 获取 markdown 源码内容
   * @returns {string}
   */
  getValue() {
    return this.lastMarkdownText;
  }

  getMarkdown() {
    return this.getValue();
  }

  /**
   * 获取预览区 html 内容
   * @param {boolean} [wrapTheme=false]
   * @returns {string}
   */
  getHtml(wrapTheme = false) {
    return this.previewer ? this.previewer.getValue(wrapTheme) : '';
  }

  /**
   * 获取 Previewer 预览实例
   * @returns {Previewer}
   */
  getPreviewer() {
    return this.previewer;
  }

  /**
   * 设置 markdown 内容并渲染（流式渲染核心方法）
   * @param {string} content markdown 内容
   */
  setValue(content) {
    const markdownText = content || '';
    if (markdownText !== this.lastMarkdownText) {
      this.lastMarkdownText = markdownText;
      const html = /** @type {string} */ (this.engine.makeHtml(markdownText));
      if (this.previewer) {
        this.previewer.update(html);
      }
    }
  }

  /**
   * 设置 markdown 内容并渲染（别名）
   * @param {string} content markdown 内容
   */
  setMarkdown(content) {
    return this.setValue(content);
  }

  /**
   * 强制重新渲染预览区域
   */
  refreshPreviewer() {
    const html = /** @type {string} */ (this.engine.makeHtml(this.getValue()));
    this.previewer.refresh(html);
  }

  /**
   * 获取目录（head1~6 组成）
   * @returns {Array}
   */
  getToc() {
    const str = /** @type {string} */ (this.engine.makeHtml(this.getValue()));
    const headerList = [];
    const headerRegex = /<h([1-6])([^>]*?) id="([^"]+?)"[^>]*?>(.+?)<\/h[0-6]>/g;
    str.replace(headerRegex, (match, level, attrs, id, text) => {
      const isInBlockquote = attrs.includes('data-in-blockquote="true"');
      headerList.push({ level: +level, id, text: text.replace(/<a .+?<\/a>/, ''), isInBlockquote });
      return match;
    });
    return headerList;
  }

  /**
   * 清空流程会话中添加的虚拟光标
   */
  clearFlowSessionCursor() {
    if (this.options.engine?.global?.flowSessionCursor) {
      const html = /** @type {string} */ (this.engine.makeHtml(this.getValue(), 'string', true));
      this.previewer.update(html);
    }
  }

  destroy() {
    if (this.previewer) {
      this.previewer.destroy();
    }
    if (this.wrapperDom && this.wrapperDom.parentNode) {
      this.wrapperDom.remove();
    }
  }
}
