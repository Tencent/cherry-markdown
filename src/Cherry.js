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
import Event from './Event';

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
     * @type {string} ??????ID
     */
    this.instanceId = `cherry-${new Date().getTime()}${Math.random()}`;
    this.options.instanceId = this.instanceId;

    /**
     * @private
     * @type {Engine}
     */
    this.engine = new Engine(this.options, this);
    this.init();
  }

  /**
   * ?????????????????????????????????????????????
   * @private
   */
  init() {
    let mountEl = this.options.id ? document.getElementById(this.options.id) : this.options.el;

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
    this.cherryDom = mountEl;

    // ??????dom????????????????????????&??????????????????????????????
    const wrapperDom = this.createWrapper();
    // ???????????????
    const editor = this.createEditor();
    // ???????????????
    const previewer = this.createPreviewer();

    if (this.options.toolbars.showToolbar === false || this.options.toolbars.toolbar === false) {
      // ???????????????????????????????????????????????????????????????????????????hook
      wrapperDom.classList.add('cherry--no-toolbar');
      this.options.toolbars.toolbar = this.defaultToolbar;
    }
    $expectTarget(this.options.toolbars.toolbar, Array);
    // ?????????????????????
    this.toolbar = this.createToolbar(editor);
    // ????????????????????????????????????
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
    // ??????bubble??????????????????bubble?????????????????????????????????????????????????????????????????????
    this.createBubble(editor);
    // ??????float??????????????????float????????????????????????????????????????????????????????????????????????????????????
    this.createFloatMenu(editor);
    previewer.init(editor);

    previewer.registerAfterUpdate(this.engine.mounted.bind(this.engine));

    // default value init
    this.initText(editor.editor);

    // ????????????????????????????????????????????????????????????????????????
    this.switchModel(this.options.editor.defaultModel);

    this.cherryDomResize();
    Event.on(this.instanceId, Event.Events.toolbarHide, () => {
      this.status.toolbar = 'hide';
    });
    Event.on(this.instanceId, Event.Events.toolbarShow, () => {
      this.status.toolbar = 'show';
    });
    Event.on(this.instanceId, Event.Events.previewerClose, () => {
      this.status.previewer = 'hide';
    });
    Event.on(this.instanceId, Event.Events.previewerOpen, () => {
      this.status.previewer = 'show';
    });
    Event.on(this.instanceId, Event.Events.editorClose, () => {
      this.status.editor = 'hide';
    });
    Event.on(this.instanceId, Event.Events.editorOpen, () => {
      this.status.editor = 'show';
    });
  }

  /**
   *  ?????? cherry ????????????????????????????????? codemirror ????????????
   * @private
   */
  cherryDomResize() {
    const observer = new ResizeObserver((entries) => {
      for (const {} of entries) {
        setTimeout(() => this.editor.editor.refresh(), 10);
      }
    });

    observer.observe(this.cherryDom);

    this.cherryDomReiszeObserver = observer;
  }

  /**
   * ??????????????????
   * @param {'edit&preview'|'editOnly'|'previewOnly'} model ????????????
   * ???????????????????????????????????????????????????????????????????????????????????????????????????
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
   * ????????????id
   * @returns {string}
   * @public
   */
  getInstanceId() {
    return this.instanceId;
  }

  /**
   * ?????????????????????
   * @returns  {Object}
   */
  getStatus() {
    return this.status;
  }

  /**
   * ?????????????????????markdown????????????
   * @returns markdown????????????
   */
  getValue() {
    return this.editor.editor.getValue();
  }

  /**
   * ?????????????????????markdown????????????
   * @returns markdown????????????
   */
  getMarkdown() {
    return this.getValue();
  }

  /**
   * ??????CodeMirror??????
   * @returns CodeMirror??????
   */
  getCodeMirror() {
    return this.editor.editor;
  }

  /**
   * ?????????????????????html??????
   * @param {boolean} wrapTheme ???????????????????????????class
   * @returns html??????
   */
  getHtml(wrapTheme = true) {
    // ????????????theme
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
   * ????????????????????????head1~6??????
   * @returns ??????head??????
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
   * ????????????????????????
   * @param {string} content markdown??????
   * @param {boolean} keepCursor ????????????????????????
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
   * ???????????????????????????+?????????????????????
   * @param {string} content ??????????????????
   * @param {boolean} [isSelect=false] ??????????????????????????????
   * @param {[number, number]|false} [anchor=false] [x,y] ??????x+1??????y+1????????????????????????false ?????????????????????
   * @param {boolean} [focus=true] ?????????????????????focus??????
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
   * ???????????????????????????+?????????????????????
   * @param {string} content ??????????????????
   * @param {boolean} [isSelect=false] ??????????????????????????????
   * @param {[number, number]|false} [anchor=false] [x,y] ??????x+1??????y+1????????????????????????false ?????????????????????
   * @param {boolean} [focus=true] ?????????????????????focus??????
   * @returns
   */
  insertValue(content, isSelect = false, anchor = false, focus = true) {
    return this.insert(content, isSelect, anchor, focus);
  }

  /**
   * ????????????????????????
   * @param {string} content markdown??????
   * @param {boolean} keepCursor ????????????????????????
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
    // TODO: ????????????
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
      $cherry: this,
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
    const { className, dom, enablePreviewerBubble } = this.options.previewer;
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
      $cherry: this,
      virtualDragLineDom: virtualDragLine,
      editorMaskDom: editorMask,
      previewerMaskDom: previewerMask,
      previewerDom: previewer,
      value: this.options.value,
      isPreviewOnly: this.options.isPreviewOnly,
      enablePreviewerBubble,
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
   * @param {Event} _evt
   * @param {import('codemirror').Editor} codemirror
   */
  editText(_evt, codemirror) {
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
        // ???????????????????????????undo???redo?????????????????????????????????????????????
        codemirror.scrollIntoView(null);
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
        markdown: codeMirror.getValue(), // ????????????????????????html???????????????
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
      // ?????????
      evt.preventDefault();
      this.toolbar.fireShortcutKey(evt, codemirror);
    }
  }

  /**
   * ????????????????????????
   * @public
   * @param {String} type 'pdf'????????????pdf??????; 'img'??????????????????
   */
  export(type = 'pdf') {
    this.previewer.export(type);
  }
}
