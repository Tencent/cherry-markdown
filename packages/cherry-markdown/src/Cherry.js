/**
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.
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
import Editor from './Editor';
import Engine from './Engine';
import Previewer from './Previewer';
import Bubble from './toolbars/Bubble';
import FloatMenu from './toolbars/FloatMenu';
import Toolbar from './toolbars/Toolbar';
import ToolbarRight from './toolbars/ToolbarRight';
import Toc from './toolbars/Toc';
import { createElement } from './utils/dom';
import Sidebar from './toolbars/Sidebar';
import HiddenToolbar from './toolbars/HiddenToolbar';
import {
  customizer,
  getThemeFromLocal,
  changeTheme,
  getCodeThemeFromLocal,
  testHasLocal,
  changeCodeTheme,
  getCodeWrapFromLocal,
  saveCodeWrapToLocal,
} from './utils/config';
import NestedError, { $expectTarget } from './utils/error';
import getPosBydiffs from './utils/recount-pos';
import defaultConfig from './Cherry.config';
import cloneDeep from 'lodash/cloneDeep';
import Event from './Event';
import locales from '@/locales/index';

import { urlProcessorProxy } from './UrlCache';
import { CherryStatic } from './CherryStatic';
import { LIST_CONTENT } from '@/utils/regexp';

/** @typedef {import('~types/cherry').CherryOptions} CherryOptions */
export default class Cherry extends CherryStatic {
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
   * @param {CherryOptions} options
   */
  constructor(options) {
    super();
    Cherry.initialized = true;
    const defaultConfigCopy = cloneDeep(Cherry.config.defaults);
    this.defaultToolbar = defaultConfigCopy.toolbars.toolbar;
    $expectTarget(options, Object);
    /**
     * @property
     * @type {CherryOptions}
     */
    this.options = mergeWith({}, defaultConfigCopy, options, customizer);

    this.storageFloatPreviewerWrapData = {
      x: 50,
      y: 58,
      width: 800,
      height: 500,
    };

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
      toolbar: 'show',
      previewer: 'show',
      editor: 'show',
    };

    if (this.options.isPreviewOnly || this.options.editor.defaultModel === 'previewOnly') {
      this.options.toolbars.showToolbar = false;
      this.options.editor.defaultModel = 'previewOnly';
      this.status.editor = 'hide';
      this.status.toolbar = 'hide';
    }

    /**
     * @property
     * @type {string} 实例ID
     */
    this.instanceId = `cherry-${new Date().getTime()}${Math.random()}`;
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
   * 初始化工具栏、编辑区、预览区等
   * @private
   */
  init() {
    this.storeDocumentScroll();
    let mountEl = this.options.id ? document.getElementById(this.options.id) : this.options.el;

    if (!mountEl) {
      if (!this.options.forceAppend) {
        return false;
      }
      this.noMountEl = true;
      mountEl = document.createElement('div');
      mountEl.id = this.options.id || 'cherry-markdown';
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

    // 蒙层dom，用来拖拽编辑区&预览区宽度时展示蒙层
    const wrapperDom = this.createWrapper();
    // 创建编辑区
    const editor = this.createEditor();
    // 创建预览区
    const previewer = this.createPreviewer();

    if (this.options.toolbars.showToolbar === false || this.options.toolbars.toolbar === false) {
      // 即便配置了不展示工具栏，也要让工具栏加载对应的语法hook
      wrapperDom.classList.add('cherry--no-toolbar');
      this.options.toolbars.toolbar = this.options.toolbars.toolbar
        ? this.options.toolbars.toolbar
        : this.defaultToolbar;
    }
    $expectTarget(this.options.toolbars.toolbar, Array);
    // 创建顶部工具栏
    this.createToolbar();
    this.createToolbarRight();

    const wrapperFragment = document.createDocumentFragment();
    wrapperFragment.appendChild(this.toolbar.options.dom);
    wrapperFragment.appendChild(editor.options.editorDom);
    if (!this.options.previewer.dom) {
      wrapperFragment.appendChild(previewer.options.previewerDom);
    }
    wrapperFragment.appendChild(previewer.options.virtualDragLineDom);
    wrapperFragment.appendChild(previewer.options.editorMaskDom);
    wrapperFragment.appendChild(previewer.options.previewerMaskDom);

    wrapperDom.appendChild(wrapperFragment);
    this.wrapperDom = wrapperDom;
    // 创建预览区域的侧边工具栏
    this.createSidebar();
    this.createHiddenToolbar();
    mountEl.appendChild(wrapperDom);

    editor.init(previewer);
    // 创建bubble工具栏，所谓bubble工具栏，是指在编辑区选中文本时悬浮出现的工具栏
    this.createBubble();
    // 创建float工具栏，所谓float工具栏，是指当编辑区光标处于新行时，在行内联想出的工具栏
    this.createFloatMenu();
    previewer.init(editor);

    previewer.registerAfterUpdate(this.engine.mounted.bind(this.engine));

    // default value init
    this.initText(editor.editor);

    this.$event.on('toolbarHide', () => {
      this.status.toolbar = 'hide';
    });
    this.$event.on('toolbarShow', () => {
      this.status.toolbar = 'show';
    });
    this.$event.on('previewerClose', () => {
      this.status.previewer = 'hide';
    });
    this.$event.on('previewerOpen', () => {
      this.status.previewer = 'show';
    });
    this.$event.on('editorClose', () => {
      this.status.editor = 'hide';
      // 关闭编辑区时，需要清除所有高亮
      this.previewer.highlightLine(0);
    });
    this.$event.on('editorOpen', () => {
      this.status.editor = 'show';
    });

    // 切换模式，有纯预览模式、纯编辑模式、双栏编辑模式
    this.switchModel(this.options.editor.defaultModel, this.options.toolbars.showToolbar);

    // 如果配置了初始化后根据hash自动滚动
    if (this.options.autoScrollByHashAfterInit) {
      setTimeout(this.scrollByHash.bind(this));
    }
    // 强制进行一次渲染 // 不记得为啥要强制渲染了，先屏蔽了
    // this.editText(null, this.editor.editor);
    this.createToc();
    this.$event.bindCallbacksByOptions(this.options);
    this.restoreDocumentScroll();
  }

  /**
   * 记忆页面的滚动高度，在cherry初始化后恢复到这个高度
   */
  storeDocumentScroll() {
    if (!this.options.editor.keepDocumentScrollAfterInit) {
      return;
    }
    this.needRestoreDocumentScroll = true;
    this.documentElementScrollTop = document.documentElement.scrollTop;
    this.documentElementScrollLeft = document.documentElement.scrollLeft;
  }

  /**
   * 在cherry初始化后恢复到这个高度
   */
  restoreDocumentScroll() {
    if (!this.options.editor.keepDocumentScrollAfterInit || !this.needRestoreDocumentScroll) {
      return;
    }
    this.needRestoreDocumentScroll = false;
    window.scrollTo(this.documentElementScrollLeft, this.documentElementScrollTop);
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
        // 做特殊处理
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

  createToc() {
    if (this.options.toolbars.toc === false) {
      this.toc = false;
      return;
    }
    this.toc = new Toc({
      $cherry: this,
      // @ts-ignore
      updateLocationHash: this.options.toolbars.toc.updateLocationHash ?? true,
      // @ts-ignore
      position: this.options.toolbars.toc.position ?? 'absolute',
      // @ts-ignore
      cssText: this.options.toolbars.toc.cssText ?? '',
      // @ts-ignore
      defaultModel: this.options.toolbars.toc.defaultModel ?? 'pure',
      // @ts-ignore
      showAutoNumber: this.options.toolbars.toc.showAutoNumber ?? false,
    });
  }

  /**
   * 滚动到hash位置，实际上就是通过修改location.hash来触发hashChange事件，剩下的就交给浏览器了
   */
  scrollByHash() {
    if (location.hash) {
      try {
        const { hash } = location;
        // 检查是否有对应id的元素
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
   * 切换编辑模式
   * @param {'edit&preview'|'editOnly'|'previewOnly'} [model=edit&preview] 模式类型
   * 一般纯预览模式和纯编辑模式适合在屏幕较小的终端使用，比如手机移动端
   */
  switchModel(model = 'edit&preview', showToolbar = true) {
    switch (model) {
      case 'edit&preview':
        if (this.previewer) {
          this.previewer.editOnly(true);
          this.previewer.recoverPreviewer();
        }
        if (this.toolbar && showToolbar) {
          this.toolbar.showToolbar();
        }
        if (showToolbar) {
          this.wrapperDom.classList.remove('cherry--no-toolbar');
        } else {
          this.wrapperDom.classList.add('cherry--no-toolbar');
        }
        break;
      case 'editOnly':
        if (!this.previewer.isPreviewerHidden()) {
          this.previewer.editOnly(true);
        }
        if (this.toolbar && showToolbar) {
          this.toolbar.showToolbar();
        }
        if (showToolbar) {
          this.wrapperDom.classList.remove('cherry--no-toolbar');
        } else {
          this.wrapperDom.classList.add('cherry--no-toolbar');
        }
        break;
      case 'previewOnly':
        this.previewer.previewOnly();
        this.toolbar && this.toolbar.previewOnly();
        this.wrapperDom.classList.add('cherry--no-toolbar');
        break;
    }
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
   * @returns  {Object}
   */
  getStatus() {
    return this.status;
  }

  /**
   * 获取编辑区内的markdown源码内容
   * @returns markdown源码内容
   */
  getValue() {
    return this.editor.editor.getValue();
  }

  /**
   * 获取编辑区内的markdown源码内容
   * @returns {string} markdown源码内容
   */
  getMarkdown() {
    return this.getValue();
  }

  /**
   * 获取CodeMirror 实例
   * @returns { CodeMirror.Editor } CodeMirror实例
   */
  getCodeMirror() {
    return this.editor.editor;
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
   * @typedef {{
   *  level: number;
   * id: string;
   * text: string;
   * }[]} HeaderList
   * 获取目录，目录由head1~6组成
   * @returns {HeaderList} 标题head数组
   */
  getToc() {
    const str = this.getHtml();
    /** @type {({level: number;id: string;text: string})[]} */
    const headerList = [];
    const headerRegex = /<h([1-6]).*?id="([^"]+?)".*?>(.+?)<\/h[0-6]>/g;
    str.replace(headerRegex, (match, level, id, text) => {
      headerList.push({ level: +level, id, text: text.replace(/<a .+?<\/a>/, '') });
      return match;
    });
    return headerList;
  }

  /**
   * 覆盖编辑区的内容
   * @param {string} content markdown内容
   * @param {boolean} keepCursor 是否保持光标位置
   */
  setValue(content, keepCursor = false) {
    if (keepCursor === false) {
      return this.editor.editor.setValue(content);
    }
    const codemirror = this.editor.editor;
    const old = this.getValue();
    const pos = codemirror.getDoc().indexFromPos(codemirror.getCursor());
    const newPos = getPosBydiffs(pos, old, content);
    codemirror.setValue(content);
    const cursor = codemirror.getDoc().posFromIndex(newPos);
    codemirror.setCursor(cursor);
    this.editor.dealSpecialWords();
  }

  /**
   * 在光标处或者指定行+偏移量插入内容
   * @param {string} content 被插入的文本
   * @param {boolean} [isSelect=false] 是否选中刚插入的内容
   * @param {[number, number]|false} [anchor=false] [x,y] 代表x+1行，y+1字符偏移量，默认false 会从光标处插入
   * @param {boolean} [focus=true] 保持编辑器处于focus状态
   */
  insert(content, isSelect = false, anchor = false, focus = true) {
    if (anchor) {
      this.editor.editor.setSelection({ line: anchor[0], ch: anchor[1] }, { line: anchor[0], ch: anchor[1] });
    }
    this.editor.editor.replaceSelection(content, isSelect ? 'around' : 'end');
    focus && this.editor.editor.focus();
  }

  /**
   * 在光标处或者指定行+偏移量插入内容
   * @param {string} content 被插入的文本
   * @param {boolean} [isSelect=false] 是否选中刚插入的内容
   * @param {[number, number]|false} [anchor=false] [x,y] 代表x+1行，y+1字符偏移量，默认false 会从光标处插入
   * @param {boolean} [focus=true] 保持编辑器处于focus状态
   * @returns
   */
  insertValue(content, isSelect = false, anchor = false, focus = true) {
    return this.insert(content, isSelect, anchor, focus);
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
   * 覆盖编辑区的内容
   * @param {string} content markdown内容
   * @param {boolean} [keepCursor=false] 是否保持光标位置
   */
  setMarkdown(content, keepCursor = false) {
    return this.setValue(content, keepCursor);
  }

  /**
   * @private
   * @returns
   */
  createWrapper() {
    let mainTheme = '';
    let toolbarTheme = '';
    let inlineCodeTheme = '';
    let codeBlockTheme = '';
    if (testHasLocal(this.nameSpace, 'theme')) {
      mainTheme = getThemeFromLocal(true, this.nameSpace);
    } else {
      mainTheme = this.options.themeSettings.mainTheme;
      mainTheme = mainTheme.replace(/theme__/g, '');
      mainTheme = `theme__${mainTheme}`;
    }
    if (typeof this.options.toolbars.theme === 'string') {
      toolbarTheme = this.options.toolbars.theme === 'dark' ? 'dark' : 'light';
    } else {
      toolbarTheme = this.options.themeSettings.toolbarTheme === 'dark' ? 'dark' : 'light';
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
      'data-toolbarTheme': toolbarTheme,
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
   * @returns {Toolbar}
   */
  createToolbar() {
    if (!this.toolbarContainer) {
      const dom = createElement('div', 'cherry-toolbar');
      this.toolbarContainer = dom;
    }
    if (this.options.toolbars.shortcutKey && Object.keys(this.options.toolbars.shortcutKey).length > 0) {
      console.warn(
        'options.shortcutKey is deprecated, please use shortcutKeySettings.shortcutKeyMap instead, get more info at https://github.com/Tencent/cherry-markdown/wiki',
      );
    }
    this.toolbar = new Toolbar({
      dom: this.toolbarContainer,
      $cherry: this,
      buttonConfig: this.options.toolbars.toolbar,
      customMenu: this.options.toolbars.customMenu,
    });
    return this.toolbar;
  }

  /**
   * 动态重置工具栏配置
   * @public
   * @param {'toolbar'|'toolbarRight'|'sidebar'|'bubble'|'float'} [type] 修改工具栏的类型
   * @param {Array} [toolbar] 要重置的对应工具栏配置
   * @returns {Boolean}
   */
  resetToolbar(type, toolbar) {
    const $type = /(toolbar|toolbarRight|sidebar|bubble|float|toc)/.test(type) ? type : false;
    if ($type === false) {
      return false;
    }
    if (this.toolbarContainer) {
      this.toolbarContainer.innerHTML = '';
    }
    if (this.toolbarFloatContainer) {
      this.toolbarFloatContainer.innerHTML = '';
    }
    if (this.toolbarBubbleContainer) {
      this.toolbarBubbleContainer.innerHTML = '';
    }
    if (this.sidebarDom) {
      this.sidebarDom.innerHTML = '';
    }
    if (this.toc) {
      // @ts-ignore
      this.toc.tocDom.remove();
    }
    this.cherryDom.querySelectorAll('.cherry-dropdown').forEach((item) => {
      item.remove();
    });
    this.options.toolbars[type] = toolbar;
    this.createToolbar();
    this.createToolbarRight();
    this.createBubble();
    this.createFloatMenu();
    this.createSidebar();
    this.createHiddenToolbar();
    this.createToc();
    return true;
  }

  /**
   * @private
   * @returns {Toolbar}
   */
  createToolbarRight() {
    this.toolbarRight = new ToolbarRight({
      dom: this.toolbarContainer,
      $cherry: this,
      buttonConfig: this.options.toolbars.toolbarRight,
      customMenu: this.options.toolbars.customMenu,
    });
    this.toolbar.collectMenuInfo(this.toolbarRight);
    return this.toolbarRight;
  }

  /**
   * @private
   * @returns
   */
  createSidebar() {
    if (this.options.toolbars.sidebar) {
      $expectTarget(this.options.toolbars.sidebar, Array);
      let init = false;
      if (!this.sidebarDom) {
        init = true;
        const externalClass = this.options.toolbars.theme === 'dark' ? 'dark' : '';
        const dom = createElement('div', `cherry-sidebar ${externalClass}`);
        this.sidebarDom = dom;
      }
      this.sidebar = new Sidebar({
        dom: this.sidebarDom,
        $cherry: this,
        buttonConfig: this.options.toolbars.sidebar,
        customMenu: this.options.toolbars.customMenu,
      });
      this.toolbar.collectMenuInfo(this.sidebar);
      if (init === true) {
        this.wrapperDom.appendChild(this.sidebarDom);
      }
    }
  }

  createHiddenToolbar() {
    if (this.options.toolbars.hiddenToolbar) {
      $expectTarget(this.options.toolbars.hiddenToolbar, Array);
      this.hiddenToolbar = new HiddenToolbar({
        $cherry: this,
        buttonConfig: this.options.toolbars.hiddenToolbar,
        customMenu: this.options.toolbars.customMenu,
      });
      this.toolbar.collectMenuInfo(this.hiddenToolbar);
    }
  }

  /**
   * @private
   * @returns
   */
  createFloatMenu() {
    if (this.options.toolbars.float) {
      if (!this.toolbarFloatContainer) {
        const dom = createElement('div', 'cherry-floatmenu');
        this.toolbarFloatContainer = dom;
      }
      $expectTarget(this.options.toolbars.float, Array);
      this.floatMenu = new FloatMenu({
        dom: this.toolbarFloatContainer,
        $cherry: this,
        buttonConfig: this.options.toolbars.float,
        customMenu: this.options.toolbars.customMenu,
      });
      this.toolbar.collectMenuInfo(this.floatMenu);
    }
  }

  /**
   * @private
   * @returns
   */
  createBubble() {
    if (this.options.toolbars.bubble) {
      if (!this.toolbarBubbleContainer) {
        const dom = createElement('div', 'cherry-bubble');
        this.toolbarBubbleContainer = dom;
      }
      $expectTarget(this.options.toolbars.bubble, Array);
      this.bubble = new Bubble({
        dom: this.toolbarBubbleContainer,
        $cherry: this,
        buttonConfig: this.options.toolbars.bubble,
        customMenu: this.options.toolbars.customMenu,
        engine: this.engine,
      });
      this.toolbar.collectMenuInfo(this.bubble);
    }
  }

  /**
   * @private
   * @returns {import('@/Editor').default}
   */
  createEditor() {
    const textArea = createElement('textarea', '', {
      id: this.options.editor.id ?? 'code',
      name: this.options.editor.name ?? 'code',
    });
    textArea.textContent = this.options.value;
    const editor = createElement('div', 'cherry-editor');
    editor.appendChild(textArea);

    if (typeof this.options.fileUpload === 'function') {
      this.options.callback.fileUpload = this.options.fileUpload;
    }

    this.editor = new Editor({
      $cherry: this,
      editorDom: editor,
      wrapperDom: this.wrapperDom,
      value: this.options.value,
      onKeydown: this.fireShortcutKey.bind(this),
      onChange: this.editText.bind(this),
      toolbars: this.options.toolbars,
      autoScrollByCursor: this.options.autoScrollByCursor,
      ...this.options.editor,
    });
    return this.editor;
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
    const { className, dom, enablePreviewerBubble, floatWhenClosePreviewer } = this.options.previewer;
    let mainTheme = '';
    if (testHasLocal(this.nameSpace, 'theme')) {
      mainTheme = getThemeFromLocal(true, this.nameSpace);
    } else {
      mainTheme = this.options.themeSettings.mainTheme;
    }
    const previewerClassName = ['cherry-previewer cherry-markdown', className || '', autonumberClass, mainTheme].join(
      ' ',
    );
    if (dom) {
      previewer = dom;
      previewer.className += ` ${previewerClassName}`;
    } else {
      previewer = createElement('div', previewerClassName);
    }
    const virtualDragLine = createElement('div', 'cherry-drag');
    const editorMask = createElement('div', 'cherry-editor-mask');
    const previewerMask = createElement('div', 'cherry-previewer-mask');

    this.previewer = new Previewer({
      $cherry: this,
      virtualDragLineDom: virtualDragLine,
      editorMaskDom: editorMask,
      previewerMaskDom: previewerMask,
      previewerDom: previewer,
      value: this.options.value,
      isPreviewOnly: this.options.isPreviewOnly,
      enablePreviewerBubble,
      floatWhenClosePreviewer,
      lazyLoadImg: this.options.previewer.lazyLoadImg,
    });

    return this.previewer;
  }

  clearFloatPreviewer() {
    this.wrapperDom.appendChild(this.previewer.getDom());
    this.storageFloatPreviewerWrapData = {
      x: this.floatPreviewerWrapDom.offsetLeft,
      y: this.floatPreviewerWrapDom.offsetTop,
      height: this.floatPreviewerWrapDom.offsetHeight,
      width: this.floatPreviewerWrapDom.offsetWidth,
    };
    this.floatPreviewerWrapDom.remove();
    this.removeFloatPreviewerListener();
  }

  handleFloatPreviewerMouseDown = (evt) => {
    if (evt.target !== this.floatPreviewerHeaderDom) return;
    evt.preventDefault();
    this.floatPreviewerInitOffsetX = evt.offsetX;
    this.floatPreviewerInitOffsetY = evt.offsetY;
    this.floatPreviewerWrapDom.classList.add('float-previewer-dragging');
  };

  handleFloatPreviewerMouseMove = (evt) => {
    if (!this.floatPreviewerWrapDom.classList.contains('float-previewer-dragging')) return;
    evt.preventDefault();
    const { clientX, clientY } = evt;
    let newRight = clientX - this.floatPreviewerInitOffsetX;
    let newTop = clientY - this.floatPreviewerInitOffsetY;
    if (newRight < 0) {
      newRight = 0;
    }
    if (newTop < 0) {
      newTop = 0;
    }
    if (newRight + this.floatPreviewerWrapDom.offsetWidth > this.pageWidth) {
      newRight = this.pageWidth - this.floatPreviewerWrapDom.offsetWidth;
    }
    if (newTop + this.floatPreviewerWrapDom.offsetHeight > this.pageHeight) {
      newTop = this.pageHeight - this.floatPreviewerWrapDom.offsetHeight;
    }
    requestAnimationFrame(() => {
      this.floatPreviewerWrapDom.style.left = `${newRight}px`;
      this.floatPreviewerWrapDom.style.top = `${newTop}px`;
    });
  };

  handleFloatPreviewerMouseUp = (evt) => {
    this.floatPreviewerWrapDom.classList.remove('float-previewer-dragging');
  };

  createFloatPreviewerListener() {
    document.addEventListener('mousedown', this.handleFloatPreviewerMouseDown);
    document.addEventListener('mousemove', this.handleFloatPreviewerMouseMove);
    document.addEventListener('mouseup', this.handleFloatPreviewerMouseUp);
  }

  removeFloatPreviewerListener() {
    document.removeEventListener('mousedown', this.handleFloatPreviewerMouseDown);
    document.removeEventListener('mousemove', this.handleFloatPreviewerMouseMove);
    document.removeEventListener('mouseup', this.handleFloatPreviewerMouseUp);
  }

  createFloatPreviewer() {
    const floatPreviewerWrap = createElement('div', 'float-previewer-wrap');
    const floatPreviewerHeader = createElement('div', 'float-previewer-header');
    const floatPreviewerTitle = createElement('div', 'float-previewer-title');
    floatPreviewerTitle.innerHTML = '预览';
    floatPreviewerWrap.style.left = `${this.storageFloatPreviewerWrapData.x}px`;
    floatPreviewerWrap.style.top = `${this.storageFloatPreviewerWrapData.y}px`;
    floatPreviewerWrap.style.height = `${this.storageFloatPreviewerWrapData.height}px`;
    floatPreviewerWrap.style.width = `${this.storageFloatPreviewerWrapData.width}px`;
    floatPreviewerHeader.appendChild(floatPreviewerTitle);
    floatPreviewerWrap.appendChild(floatPreviewerHeader);
    floatPreviewerWrap.appendChild(this.previewer.getDom());
    this.wrapperDom.appendChild(floatPreviewerWrap);

    this.floatPreviewerHeaderDom = floatPreviewerHeader;
    this.floatPreviewerWrapDom = floatPreviewerWrap;
    this.pageWidth = document.body.clientWidth;
    this.pageHeight = document.body.clientHeight;

    this.createFloatPreviewerListener();
  }

  /**
   * @private
   * @param {import('codemirror').Editor} codemirror
   */
  initText(codemirror) {
    try {
      const markdownText = codemirror.getValue();
      this.lastMarkdownText = markdownText;
      const html = this.engine.makeHtml(markdownText);
      this.previewer.update(html);
      this.$event.emit('afterInit', { markdownText, html });
    } catch (e) {
      throw new NestedError(e);
    }
  }

  /**
   * @private
   * @param {Event} _evt
   * @param {import('codemirror').Editor} codemirror
   */
  editText(_evt, codemirror) {
    try {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      const interval = this.options.engine.global.flowSessionContext ? 10 : 50;
      this.timer = setTimeout(() => {
        const markdownText = codemirror.getValue();
        if (markdownText !== this.lastMarkdownText) {
          this.lastMarkdownText = markdownText;
          const html = this.engine.makeHtml(markdownText);
          this.previewer.update(html);
          this.$event.emit('afterChange', {
            markdownText,
            html,
          });
        }
        // 强制每次编辑（包括undo、redo）编辑器都会自动滚动到光标位置
        if (!this.options.editor.keepDocumentScrollAfterInit) {
          codemirror.scrollIntoView(null);
        }
      }, interval);
    } catch (e) {
      throw new NestedError(e);
    }
  }

  /**
   * @private
   * @param {any} cb
   */
  onChange(cb) {
    this.editor.editor.on('change', (codeMirror) => {
      cb({
        markdown: codeMirror.getValue(), // 后续可以按需增加html或其他状态
      });
    });
  }

  /**
   * @private
   * @param {KeyboardEvent} evt
   */
  fireShortcutKey(evt) {
    const cursor = this.editor.editor.getCursor();
    const lineContent = this.editor.editor.getLine(cursor.line);
    // shift + tab 已经被绑定为缩进，所以这里不做处理
    if (!evt.shiftKey && evt.key === 'Tab' && LIST_CONTENT.test(lineContent)) {
      // 每按一次Tab，如果当前光标在行首或者行尾，就在行首加一个\t
      if (cursor.ch === 0 || cursor.ch === lineContent.length || cursor.ch === lineContent.length + 1) {
        evt.preventDefault();
        this.editor.editor.setSelection({ line: cursor.line, ch: 0 }, { line: cursor.line, ch: lineContent.length });
        this.editor.editor.replaceSelection(`\t${lineContent}`, 'around');
        const newCursor = this.editor.editor.getCursor();
        this.editor.editor.setSelection(newCursor, newCursor);
      }
    }
    if (this.toolbar.matchShortcutKey(evt)) {
      // 快捷键
      const needPreventDefault = this.toolbar.fireShortcutKey(evt);
      if (needPreventDefault) {
        evt.preventDefault();
      }
    }
  }

  /**
   * 导出预览区域内容
   * @public
   * @param {'pdf' | 'img' | 'markdown' | 'html'} [type='pdf']
   * 'pdf'：导出成pdf文件; 'img'：导出成png图片; 'markdown'：导出成markdown文件; 'html'：导出成html文件;
   * @param {string} [fileName] 导出文件名(默认为当前第一行内容|'cherry-export')
   */
  export(type = 'pdf', fileName = '') {
    this.previewer.export(type, fileName);
  }

  /**
   * 修改主题
   * @param {string} theme option.themeSettings.themeList 里的className
   */
  setTheme(theme = 'default') {
    this.$event.emit('changeMainTheme', theme);
    changeTheme(this, theme);
  }

  /**
   * 修改代码块主题
   * @param {string} theme option.themeSettings.codeBlockTheme
   */
  setCodeBlockTheme(theme = 'default') {
    this.$event.emit('changeCodeBlockTheme', theme);
    changeCodeTheme(this, theme);
  }

  /**
   * 修改书写风格
   * @param {string} writingStyle normal 普通 | typewriter 打字机 | focus 专注
   */
  setWritingStyle(writingStyle) {
    this.editor.setWritingStyle(writingStyle);
  }

  /**
   * 修改语言
   * @param {string} locale
   * @returns {boolean} false: 修改失败，因为没有对应的语言；true: 修改成功
   */
  setLocale(locale) {
    if (!this.locales[locale]) {
      return false;
    }
    this.options.locale = locale;
    this.locale = this.locales[locale];
    this.$event.emit('afterChangeLocale', locale);
    this.resetToolbar('toolbar', this.options.toolbars.toolbar || []);
    return true;
  }

  /**
   * 切换TOC的模式（极简 or 展开）
   * @param {'full'|'pure'|''} focusModel 是否强制切换模式，如果为空，则根据当前模式切换
   */
  toggleToc(focusModel = '') {
    if (!this.toc) {
      return;
    }
    let targetModel = 'full';
    if (focusModel === '') {
      // @ts-ignore
      const { model } = this.toc;
      targetModel = model === 'full' ? 'pure' : 'full';
    } else {
      targetModel = focusModel;
    }
    // @ts-ignore
    this.toc.$switchModel(targetModel);
    // @ts-ignore
    this.toc.setModelToLocalStorage(targetModel);
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
