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
import { createElement } from './utils/dom';
import Sidebar from './toolbars/Sidebar';
import { customizer } from './utils/config';
import NestedError, { $expectTarget } from './utils/error';
import getPosBydiffs from './utils/recount-pos';
import defaultConfig from './Cherry.config';
import './sass/cherry.scss';
import cloneDeep from 'lodash/cloneDeep';

import { urlProcessorProxy } from './UrlCache';
import { CherryStatic } from './CherryStatic';

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
    /** @type {Partial<CherryOptions>} */
    defaults: defaultConfig,
  };

  /**
   * @param {Partial<CherryOptions>} options
   */
  constructor(options) {
    super();
    Cherry.initialized = true;
    const defaultConfigCopy = cloneDeep(Cherry.config.defaults);
    this.defaultToolbar = defaultConfigCopy.toolbars.toolbar;
    $expectTarget(options, Object);
    /**
     * @property
     * @type {Partial<CherryOptions>}
     */
    this.options = mergeWith({}, defaultConfigCopy, options, customizer);

    if (typeof this.options.engine.global.urlProcessor === 'function') {
      this.options.engine.global.urlProcessor = urlProcessorProxy(this.options.engine.global.urlProcessor);
    }

    if (this.options.isPreviewOnly) {
      this.options.toolbars.showToolbar = false;
      this.options.editor.defaultModel = 'previewOnly';
    }

    /**
     * @private
     * @type {Engine}
     */
    this.engine = new Engine(this.options, this);
    this.init();
  }

  /**
   * 初始化工具栏、编辑区、预览区等
   * @private
   */
  init() {
    let mountEl = document.getElementById(this.options.id);

    if (!mountEl) {
      if (!this.options.forceAppend) {
        return false;
      }
      mountEl = document.createElement('div');
      mountEl.id = this.options.id || 'cherry-markdown';
      document.body.appendChild(mountEl);
    }

    if (!mountEl.style.height) {
      mountEl.style.height = this.options.editor.height;
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
      this.options.toolbars.toolbar = this.defaultToolbar;
    }
    $expectTarget(this.options.toolbars.toolbar, Array);
    // 创建顶部工具栏
    this.toolbar = this.createToolbar(editor);
    // 创建预览区域的侧边工具栏
    this.sidebar = this.createSidebar(editor);

    const wrapperFragment = document.createDocumentFragment();
    wrapperFragment.appendChild(this.toolbar.options.dom);
    wrapperFragment.appendChild(editor.options.editorDom);
    wrapperFragment.appendChild(this.sidebar.options.dom);
    if (!this.options.previewer.dom) {
      wrapperFragment.appendChild(previewer.options.previewerDom);
    }
    wrapperFragment.appendChild(previewer.options.virtualDragLineDom);
    wrapperFragment.appendChild(previewer.options.editorMaskDom);
    wrapperFragment.appendChild(previewer.options.previewerMaskDom);

    wrapperDom.appendChild(wrapperFragment);
    mountEl.appendChild(wrapperDom);

    editor.init(previewer);
    // 创建bubble工具栏，所谓bubble工具栏，是指在编辑区选中文本时悬浮出现的工具栏
    this.createBubble(editor);
    // 创建float工具栏，所谓float工具栏，是指当编辑区光标处于新行时，在行内联想出的工具栏
    this.createFloatMenu(editor);
    previewer.init(editor);

    previewer.registerAfterUpdate(this.engine.mounted.bind(this.engine));

    // default value init
    this.initText(editor.editor);

    // 切换模式，有纯预览模式、纯编辑模式、双栏编辑模式
    this.switchModel(this.options.editor.defaultModel);
  }

  /**
   * 切换编辑模式
   * @param {'edit&preview'|'editOnly'|'previewOnly'} model 模式类型
   * 一般纯预览模式和纯编辑模式适合在屏幕较小的终端使用，比如手机移动端
   *
   * @returns
   */
  switchModel(model = 'edit&preview') {
    switch (model) {
      case 'edit&preview':
        if (this.previewer) {
          this.previewer.editOnly(true);
          this.previewer.recoverPreviewer();
        }
        if (this.toolbar) {
          this.toolbar.showToolbar();
        }
        break;
      case 'editOnly':
        if (!this.previewer.isPreviewerHidden()) {
          this.previewer.editOnly(true);
        }
        if (this.toolbar) {
          this.toolbar.showToolbar();
        }
        break;
      case 'previewOnly':
        this.previewer.previewOnly();
        this.toolbar && this.toolbar.previewOnly();
        break;
    }
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
   * @returns markdown源码内容
   */
  getMarkdown() {
    return this.getValue();
  }

  /**
   * 获取CodeMirror实例
   * @returns CodeMirror实例
   */
  getCodeMirror() {
    return this.editor.editor;
  }

  /**
   * 获取预览区内的html内容
   * @param {boolean} wrapTheme 是否在外层包裹主题class
   * @returns html内容
   */
  getHtml(wrapTheme = true) {
    // 默认包裹theme
    const html = this.previewer.isPreviewerHidden()
      ? this.previewer.options.previewerCache.html
      : this.previewer.getValue();
    if (!wrapTheme) return html;
    const inlineCodeTheme = document.querySelector('.cherry').getAttribute('data-inline-code-theme');
    const codeBlockTheme = document.querySelector('.cherry').getAttribute('data-code-block-theme');
    return `<div data-inline-code-theme="${inlineCodeTheme}" data-code-block-theme="${codeBlockTheme}">${html}</div>`;
  }

  getPreviewer() {
    return this.previewer;
  }

  /**
   * 获取目录，目录由head1~6组成
   * @returns 标题head数组
   */
  getToc() {
    const str = this.getHtml();
    /** @type {({level: number;id: string;text: string})[]} */
    const headerList = [];
    const headerRegex = /<h([1-6]).*?id="([^"]+?)".*?>(.+?)<\/h[0-6]>/g;
    str.replace(headerRegex, (match, level, id, text) => {
      headerList.push({ level: +level, id, text });
      return match;
    });
    return headerList;
  }

  /**
   * 覆盖编辑区的内容
   * @param {string} content markdown内容
   * @param {boolean} keepCursor 是否保持光标位置
   * @returns
   */
  setValue(content, keepCursor = false) {
    if (keepCursor === false) {
      return this.editor.editor.setValue(content);
    }
    const codemirror = this.editor.editor;
    const old = this.getValue();
    const pos = codemirror.getDoc().indexFromPos(codemirror.getCursor());
    const newPos = getPosBydiffs(pos, old, content);
    const ret = codemirror.setValue(content);
    const cursor = codemirror.getDoc().posFromIndex(newPos);
    codemirror.setCursor(cursor);
    return ret;
  }

  /**
   * 在光标处或者指定行+偏移量插入内容
   * @param {string} content 被插入的文本
   * @param {boolean} [isSelect=false] 是否选中刚插入的内容
   * @param {[number, number]|false} [anchor=false] [x,y] 代表x+1行，y+1字符偏移量，默认false 会从光标处插入
   * @param {boolean} [focus=true] 保持编辑器处于focus状态
   * @returns
   */
  insert(content, isSelect = false, anchor = false, focus = true) {
    if (anchor) {
      this.editor.editor.setSelection({ line: anchor[0], ch: anchor[1] }, { line: anchor[0], ch: anchor[1] });
    }
    const ret = this.editor.editor.replaceSelection(content, isSelect ? 'around' : 'end');
    focus && this.editor.editor.focus();
    return ret;
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
   * 覆盖编辑区的内容
   * @param {string} content markdown内容
   * @param {boolean} keepCursor 是否保持光标位置
   * @returns
   */
  setMarkdown(content, keepCursor = false) {
    return this.setValue(content, keepCursor);
  }

  /**
   * @private
   * @returns
   */
  createWrapper() {
    const toolbarTheme = this.options.toolbars.theme === 'dark' ? 'dark' : '';
    // TODO: 完善类型
    const inlineCodeTheme = /** @type {{theme?: string;}} */ (this.options.engine.syntax.inlineCode).theme;
    let codeBlockTheme = /** @type {{theme?: string;}} */ (this.options.engine.syntax.codeBlock).theme;
    if (codeBlockTheme === 'dark') codeBlockTheme = 'tomorrow-night';
    else if (codeBlockTheme === 'light') codeBlockTheme = 'solarized-light';
    const wrapperDom = createElement('div', 'cherry clearfix', {
      'data-toolbarTheme': toolbarTheme,
      'data-inlineCodeTheme': inlineCodeTheme,
      'data-codeBlockTheme': codeBlockTheme,
    });
    this.wrapperDom = wrapperDom;
    return wrapperDom;
  }

  /**
   * @private
   * @param {import('@/Editor').default} editor
   * @returns
   */
  createToolbar(editor) {
    const dom = createElement('div', 'cherry-toolbar');
    this.toolbar = new Toolbar({
      dom,
      editor,
      buttonConfig: this.options.toolbars.toolbar,
      customMenu: this.options.toolbars.customMenu,
      engine: this.engine,
    });
    return this.toolbar;
  }

  /**
   * @private
   * @param {import('@/Editor').default} editor
   * @returns
   */
  createSidebar(editor) {
    const externalClass = this.options.toolbars.theme === 'dark' ? 'dark' : '';
    const dom = createElement('div', `cherry-sidebar ${externalClass}`);
    this.sidebar = new Sidebar({
      dom,
      editor,
      buttonConfig: this.options.toolbars.sidebar,
      customMenu: this.options.toolbars.customMenu,
      engine: this.engine,
      previewer: this.previewer,
    });
    return this.sidebar;
  }

  /**
   * @private
   * @param {import('@/Editor').default} editor
   * @returns
   */
  createFloatMenu(editor) {
    const dom = createElement('div', 'cherry-floatmenu');
    if (this.options.toolbars.float) {
      $expectTarget(this.options.toolbars.float, Array);
      this.floatMenu = new FloatMenu({
        dom,
        editor,
        buttonConfig: this.options.toolbars.float,
        engine: this.engine,
      });
    }
  }

  /**
   * @private
   * @param {import('@/Editor').default} editor
   * @returns
   */
  createBubble(editor) {
    const dom = createElement('div', 'cherry-bubble');
    if (this.options.toolbars.bubble) {
      $expectTarget(this.options.toolbars.bubble, Array);
      this.bubble = new Bubble({
        dom,
        editor,
        buttonConfig: this.options.toolbars.bubble,
        engine: this.engine,
      });
    }
  }

  /**
   * @private
   * @returns {import('@/Editor').default}
   */
  createEditor() {
    const textArea = createElement('textarea', '', { id: 'code', name: 'code' });
    textArea.textContent = this.options.value;
    const editor = createElement('div', 'cherry-editor');
    editor.appendChild(textArea);

    this.editor = new Editor({
      editorDom: editor,
      wrapperDom: this.wrapperDom,
      value: this.options.value,
      onKeydown: this.fireShortcutKey.bind(this),
      onChange: this.editText.bind(this),
      toolbars: this.options.toolbars,
      fileUpload: this.options.fileUpload,
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
    const { className, dom } = this.options.previewer;
    const previewerClassName = ['cherry-previewer', className || '', autonumberClass].join(' ');
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
      virtualDragLineDom: virtualDragLine,
      editorMaskDom: editorMask,
      previewerMaskDom: previewerMask,
      previewerDom: previewer,
      value: this.options.value,
      isPreviewOnly: this.options.isPreviewOnly,
    });

    return this.previewer;
  }

  /**
   * @private
   * @param {import('codemirror').Editor} codemirror
   */
  initText(codemirror) {
    try {
      const markdownText = codemirror.getValue();
      const html = this.engine.makeHtml(markdownText);
      this.previewer.update(html);
      if (this.options.callback.afterInit) {
        this.options.callback.afterInit(markdownText, html);
      }
    } catch (e) {
      throw new NestedError(e);
    }
  }

  /**
   * @private
   * @param {Event} evt
   * @param {import('codemirror').Editor} codemirror
   */
  editText(evt, codemirror) {
    try {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.timer = setTimeout(() => {
        const markdownText = codemirror.getValue();
        const html = this.engine.makeHtml(markdownText);
        this.previewer.update(html);
        if (this.options.callback.afterChange) {
          this.options.callback.afterChange(markdownText, html);
        }
      }, 50);
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
   * @param {*} evt
   * @param {*} codemirror
   */
  fireShortcutKey(evt, codemirror) {
    if (this.toolbar.matchShortcutKey(evt)) {
      // 快捷键
      evt.preventDefault();
      this.toolbar.fireShortcutKey(evt, codemirror);
    }
  }

  /**
   * 导出预览区域内容
   * @public
   * @param {String} type 'pdf'：导出成pdf文件; 'img'：导出成图片
   */
  export(type = 'pdf') {
    this.previewer.export(type);
  }
}
