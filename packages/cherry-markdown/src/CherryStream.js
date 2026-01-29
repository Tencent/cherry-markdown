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
import mergeWith from 'lodash/mergeWith';
import Engine from './Engine';
import Previewer from './Previewer';
import { createElement } from './utils/dom';
import {
  customizer,
  getThemeFromLocal,
  testHasLocal,
  getCodeThemeFromLocal,
  getCodeWrapFromLocal,
  saveCodeWrapToLocal,
} from './utils/config';
import NestedError from './utils/error';
import defaultConfig from './Cherry.config';
import cloneDeep from 'lodash/cloneDeep';
import Event from './Event';
import locales from '@/locales/index';

import { urlProcessorProxy } from './UrlCache';
import { CherryStatic } from './CherryStatic';

/**
 * @typedef {import('~types/cherry').CherryOptions} CherryOptions
 */

/**
 * CherryStream - 专门用于流式渲染场景的精简版Cherry
 *
 * 特点：
 * 1. 只包含Engine（解析引擎）和Previewer（预览区），不包含Editor（编辑器）和Toolbar（工具栏）
 * 2. 不包含mermaid等大型依赖，包体积更小
 * 3. 适用于纯流式渲染场景，如AI对话、文档预览等
 */
export default class CherryStream extends CherryStatic {
  /**
   * @protected
   */
  static initialized = false;
  /**
   * @readonly
   */
  static config = {
    /** @type {CherryOptions} */
    defaults: defaultConfig,
  };

  /**
   * @param {Partial<CherryOptions>} options
   */
  constructor(options = {}) {
    super();
    CherryStream.initialized = true;
    const defaultConfigCopy = cloneDeep(CherryStream.config.defaults);

    /**
     * @property
     * @type {CherryOptions}
     */
    this.options = mergeWith({}, defaultConfigCopy, options, customizer);

    // 强制设置为纯预览模式
    this.options.isPreviewOnly = true;
    this.options.editor.defaultModel = 'previewOnly';
    this.options.toolbars.showToolbar = false;

    this.locales = locales;
    if (this.options.locales) {
      this.locales = {
        ...this.options.locales,
        ...this.locales,
      };
    }

    // loading the locale
    this.locale = this.locales[this.options.locale];

    if (typeof this.options.engine.global.urlProcessor === 'function') {
      this.options.engine.global.urlProcessor = urlProcessorProxy(this.options.engine.global.urlProcessor);
      this.options.callback.urlProcessor = this.options.engine.global.urlProcessor;
    } else {
      this.options.callback.urlProcessor = urlProcessorProxy(this.options.callback.urlProcessor);
    }

    this.status = {
      toolbar: 'hide',
      previewer: 'show',
      editor: 'hide',
    };

    /**
     * @property
     * @type {string} 实例ID
     */
    this.instanceId = `cherry-stream-${new Date().getTime()}${Math.random()}`;
    this.options.instanceId = this.instanceId;
    this.lastMarkdownText = '';
    this.$event = new Event(this.instanceId);

    if (this.options.engine.global.flowSessionCursor === 'default') {
      this.options.engine.global.flowSessionCursor = '<span class="cherry-flow-session-cursor"></span>';
    }

    /**
     * @type {import('./Engine').default}
     */
    this.engine = new Engine(this.options, this);
    this.init();
  }

  /**
   * 初始化预览区
   * @private
   */
  init() {
    let mountEl = this.options.id ? document.getElementById(this.options.id) : this.options.el;

    if (!mountEl) {
      if (!this.options.forceAppend) {
        return false;
      }
      this.noMountEl = true;
      mountEl = document.createElement('div');
      mountEl.id = this.options.id || 'cherry-markdown-stream';
      document.body.appendChild(mountEl);
    }

    if (!mountEl.style.height) {
      mountEl.style.height = this.options.editor.height;
    }
    this.cherryDom = mountEl;

    // 生成名称空间
    if (typeof this.options.themeNameSpace === 'string') {
      this.nameSpace = this.options.themeNameSpace;
    } else {
      this.nameSpace = this.options.nameSpace;
    }

    // 创建wrapper
    const wrapperDom = this.createWrapper();

    // 创建预览区
    const previewer = this.createPreviewer();

    wrapperDom.classList.add('cherry--no-toolbar');
    wrapperDom.appendChild(previewer.options.previewerDom);

    this.wrapperDom = wrapperDom;
    mountEl.appendChild(wrapperDom);

    this.$event.bindCallbacksByOptions(this.options);

    // 初始化预览区（不需要editor参数）
    previewer.initWithoutEditor();

    previewer.registerAfterUpdate(this.engine.mounted.bind(this.engine));

    // 初始化内容
    this.initText();

    this.$event.on('previewerClose', () => {
      this.status.previewer = 'hide';
    });
    this.$event.on('previewerOpen', () => {
      this.status.previewer = 'show';
    });

    // 如果配置了初始化后根据hash自动滚动
    if (this.options.autoScrollByHashAfterInit) {
      setTimeout(this.scrollByHash.bind(this));
    }
  }

  /**
   * @private
   * @returns
   */
  createWrapper() {
    let mainTheme = '';
    let inlineCodeTheme = '';
    let codeBlockTheme = '';
    if (testHasLocal(this.nameSpace, 'theme')) {
      mainTheme = getThemeFromLocal(true, this.nameSpace);
    } else {
      mainTheme = this.options.themeSettings.mainTheme;
      mainTheme = mainTheme.replace(/theme__/g, '');
      const availableThemes = this.options.themeSettings.themeList.map((theme) => theme.className);
      if (!availableThemes.includes(mainTheme)) {
        mainTheme = 'default';
      }
      mainTheme = `theme__${mainTheme}`;
    }
    // @ts-ignore
    if (typeof this.options.engine.syntax.inlineCode.theme === 'string') {
      inlineCodeTheme =
        /** @type {{theme?: string;}} */ (this.options.engine.syntax.inlineCode).theme === 'black' ? 'black' : 'red';
    } else {
      inlineCodeTheme = this.options.themeSettings.inlineCodeTheme === 'black' ? 'black' : 'red';
    }
    // @ts-ignore
    if (typeof this.options.engine.syntax.codeBlock.theme === 'string') {
      codeBlockTheme = /** @type {{theme?: string;}} */ (this.options.engine.syntax.codeBlock).theme;
    } else {
      codeBlockTheme = this.options.themeSettings.codeBlockTheme;
    }
    if (testHasLocal(this.nameSpace, 'codeTheme')) {
      codeBlockTheme = getCodeThemeFromLocal(this.nameSpace);
    }
    if (codeBlockTheme === 'dark') codeBlockTheme = 'tomorrow-night';
    else if (codeBlockTheme === 'light') codeBlockTheme = 'solarized-light';
    // @ts-ignore
    const codeWrap = getCodeWrapFromLocal(this.nameSpace, this.options.engine.syntax.codeBlock.wrap);
    const wrapperDom = createElement('div', ['cherry', 'clearfix', mainTheme].join(' '), {
      'data-inlineCodeTheme': inlineCodeTheme,
      'data-codeBlockTheme': codeBlockTheme,
      'data-codeWrap': codeWrap === 'wrap' ? 'wrap' : 'nowrap',
    });
    this.wrapperDom = wrapperDom;
    return wrapperDom;
  }

  getCodeWrap() {
    return this.wrapperDom.dataset.codeWrap || 'wrap';
  }

  setCodeWrap(codeWrap) {
    this.wrapperDom.dataset.codeWrap = codeWrap === 'wrap' ? 'wrap' : 'nowrap';
    saveCodeWrapToLocal(this.nameSpace, codeWrap);
  }

  /**
   * @private
   * @returns {import('@/Previewer').default}
   */
  createPreviewer() {
    /** @type {HTMLDivElement} */
    let previewer;
    const anchorStyle =
      (this.options.engine.syntax.header && this.options.engine.syntax.header.anchorStyle) || 'default';
    const autonumberClass = anchorStyle === 'autonumber' ? ' head-num' : '';
    const { className, dom, enablePreviewerBubble } = this.options.previewer;
    let mainTheme = '';
    if (testHasLocal(this.nameSpace, 'theme')) {
      mainTheme = getThemeFromLocal(true, this.nameSpace);
    } else {
      mainTheme = this.options.themeSettings.mainTheme;
    }
    const previewerClassName = [
      'cherry-previewer cherry-markdown cherry-previewer--full',
      className || '',
      autonumberClass,
      mainTheme,
    ].join(' ');
    if (dom) {
      previewer = dom;
      previewer.className += ` ${previewerClassName}`;
    } else {
      previewer = createElement('div', previewerClassName);
    }

    this.previewer = new Previewer({
      $cherry: this,
      previewerDom: previewer,
      value: this.options.value || '',
      isPreviewOnly: true,
      enablePreviewerBubble: enablePreviewerBubble === true, // 流式渲染默认不开启预览区编辑功能，避免引入codemirror
      lazyLoadImg: this.options.previewer.lazyLoadImg,
    });

    return this.previewer;
  }

  /**
   * @private
   */
  initText() {
    try {
      const markdownText = this.options.value || '';
      this.lastMarkdownText = markdownText;
      const html = this.engine.makeHtml(markdownText);
      this.previewer.update(html);
      this.$event.emit('afterInit', { markdownText, html });
    } catch (e) {
      throw new NestedError(e);
    }
  }

  destroy() {
    if (this.noMountEl) {
      this.cherryDom.remove();
    } else {
      this.wrapperDom.remove();
    }
    this.$event.clearAll();
  }

  on(eventName, callback) {
    if (this.$event.Events[eventName]) {
      if (/^(afterInit|afterChange)$/.test(eventName)) {
        return this.$event.on(eventName, (msg) => {
          callback(msg.markdownText, msg.html);
        });
      }
      return this.$event.on(eventName, callback);
    }
    switch (eventName) {
      case 'urlProcessor':
        this.options.callback.urlProcessor = urlProcessorProxy(callback);
        break;
      default:
        this.options.callback[eventName] = callback;
    }
  }

  off(eventName, callback) {
    if (this.$event.Events[eventName]) {
      return this.$event.off(eventName, callback);
    }
    this.options.callback[eventName] = () => {};
  }

  /**
   * 滚动到hash位置
   */
  scrollByHash() {
    if (location.hash) {
      try {
        const { hash } = location;
        const testDom = document.getElementById(hash.replace('#', ''));
        if (testDom && this.previewer.getDomContainer().contains(testDom)) {
          location.hash = '';
          location.hash = hash;
        }
      } catch (error) {
        // empty
      }
    }
  }

  $t(str) {
    return this.locale[str] ? this.locale[str] : str;
  }

  addLocale(key, value) {
    this.locale[key] = value;
  }

  addLocales(locales) {
    this.locale = Object.assign(this.locale, locales);
  }

  getLocales() {
    return this.locale;
  }

  /**
   * 获取实例id
   * @returns {string}
   * @public
   */
  getInstanceId() {
    return this.instanceId;
  }

  /**
   * 获取编辑器状态
   * @returns {Object}
   */
  getStatus() {
    return this.status;
  }

  /**
   * 获取markdown源码内容
   * @returns {string} markdown源码内容
   */
  getValue() {
    return this.lastMarkdownText;
  }

  /**
   * 获取markdown源码内容
   * @returns {string} markdown源码内容
   */
  getMarkdown() {
    return this.getValue();
  }

  /**
   * 获取预览区内的html内容
   * @param {boolean} [wrapTheme=true] 是否在外层包裹主题class
   * @returns {string} html内容
   */
  getHtml(wrapTheme = true) {
    return this.previewer.getValue(wrapTheme);
  }

  /**
   * 获取Previewer 预览实例
   * @returns {Previewer} Previewer 预览实例
   */
  getPreviewer() {
    return this.previewer;
  }

  /**
   * 获取目录，目录由head1~6组成
   * @returns {Array} 标题head数组
   */
  getToc() {
    const str = this.getHtml();
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
   * 设置markdown内容并渲染（流式渲染核心方法）
   * @param {string} content markdown内容
   */
  setValue(content) {
    try {
      const markdownText = content || '';
      if (markdownText !== this.lastMarkdownText) {
        this.lastMarkdownText = markdownText;
        const html = this.engine.makeHtml(markdownText);
        this.previewer.update(html);
        this.$event.emit('afterChange', {
          markdownText,
          html,
        });
      }
    } catch (e) {
      throw new NestedError(e);
    }
  }

  /**
   * 设置markdown内容并渲染
   * @param {string} content markdown内容
   */
  setMarkdown(content) {
    return this.setValue(content);
  }

  /**
   * 强制重新渲染预览区域
   */
  refreshPreviewer() {
    try {
      const markdownText = this.getValue();
      const html = this.engine.makeHtml(markdownText);
      this.previewer.refresh(html);
    } catch (e) {
      throw new NestedError(e);
    }
  }

  /**
   * 导出预览区域内容
   * @public
   * @param {'pdf' | 'img' | 'markdown' | 'html'} [type='pdf']
   * @param {string} [fileName] 导出文件名
   */
  export(type = 'pdf', fileName = '') {
    this.previewer.export(type, fileName);
  }

  /**
   * 获取第一行文本
   * @param {string} defaultText 默认文本
   * @returns {string} 第一行文本
   */
  getFirstLineText(defaultText = '') {
    let innerText = '';
    if (this.status.previewer === 'show') {
      innerText = this.previewer.getDomContainer().innerText;
    } else {
      const { html } = this.previewer.options.previewerCache;
      if (html) {
        innerText = html.replace(/<\/[^>]+>/g, '\n').replace(/<[^>]+>/g, '');
      } else {
        innerText = this.getValue().replace(/[#*|$>`]/g, '');
      }
    }
    return /^\s*([^\s][^\n]*)\n/.test(innerText) ? innerText.match(/^\s*([^\s][^\n]*)\n/)[1] : defaultText;
  }

  /**
   * 清空流程会话中添加的虚拟光标
   */
  clearFlowSessionCursor() {
    if (this.options.engine.global.flowSessionCursor) {
      this.previewer.getDom().innerHTML = this.previewer
        .getDom()
        // @ts-ignore
        .innerHTML.replaceAll(this.options.engine.global.flowSessionCursor, '');
    }
  }
}
