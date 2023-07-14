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
// @ts-check
import codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
// import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/gfm/gfm'; // https://codemirror.net/mode/gfm/index.html
// import 'codemirror/mode/xml/xml';
import 'codemirror/addon/edit/continuelist';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/edit/matchtags';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/display/placeholder';
import 'codemirror/keymap/sublime';

import 'cm-search-replace/src/search';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/search/matchesonscrollbar';
// import 'codemirror/addon/selection/active-line';
// import 'codemirror/addon/edit/matchbrackets';
import htmlParser from '@/utils/htmlparser';
import pasteHelper from '@/utils/pasteHelper';
import { addEvent } from './utils/event';
import Logger from '@/Logger';
import Event from '@/Event';
import { handelParams } from '@/utils/file';
import { createElement } from './utils/dom';
import { imgBase64Reg, imgDrawioXmlReg } from './utils/regexp';
import { handleNewlineIndentList } from './utils/autoindent';

/**
 * @typedef {import('~types/editor').EditorConfiguration} EditorConfiguration
 * @typedef {import('~types/editor').EditorEventCallback} EditorEventCallback
 * @typedef {import('codemirror')} CodeMirror
 */

/** @type {import('~types/editor')} */
export default class Editor {
  /**
   * @constructor
   * @param {Partial<EditorConfiguration>} options
   */
  constructor(options) {
    /**
     * @property
     * @type {EditorConfiguration}
     */
    this.options = {
      id: 'code', // textarea 的id属性值
      name: 'code', // textarea 的name属性值
      autoSave2Textarea: false,
      editorDom: document.createElement('div'),
      wrapperDom: null,
      autoScrollByCursor: true,
      convertWhenPaste: true,
      codemirror: {
        lineNumbers: false, // 显示行数
        cursorHeight: 0.85, // 光标高度，0.85好看一些
        indentUnit: 4, // 缩进单位为4
        tabSize: 4, // 一个tab转换成的空格数量
        // styleActiveLine: false, // 当前行背景高亮
        // matchBrackets: true, // 括号匹配
        mode: 'gfm', // 从markdown模式改成gfm模式，以使用默认高亮规则
        lineWrapping: true, // 自动换行
        indentWithTabs: true, // 缩进用tab表示
        autofocus: true,
        theme: 'default',
        autoCloseTags: true, // 输入html标签时自动补充闭合标签
        extraKeys: {
          Enter: handleNewlineIndentList,
        }, // 增加markdown回车自动补全
        matchTags: { bothTags: true }, // 自动高亮选中的闭合html标签
        placeholder: '',
        // 设置为 contenteditable 对输入法定位更友好
        // 但已知会影响某些悬浮菜单的定位，如粘贴选择文本或markdown模式的菜单
        // inputStyle: 'contenteditable',
        keyMap: 'sublime',
      },
      toolbars: {},
      onKeydown() {},
      onChange() {},
      onFocus() {},
      onBlur() {},
      onPaste: this.onPaste,
      onScroll: this.onScroll,
    };
    /**
     * @property
     * @private
     * @type {{ timer?: number; destinationTop?: number }}
     */
    this.animation = {};
    const { codemirror, ...restOptions } = options;
    if (codemirror) {
      Object.assign(this.options.codemirror, codemirror);
    }
    Object.assign(this.options, restOptions);
    this.$cherry = this.options.$cherry;
    this.instanceId = this.$cherry.getInstanceId();
  }

  /**
   * 处理draw.io的xml数据和图片的base64数据，对这种超大的数据增加省略号
   */
  dealBigData = () => {
    if (this.noChange) {
      this.noChange = false;
      return;
    }
    this.formatBigData2Mark(imgBase64Reg, 'cm-url base64');
    this.formatBigData2Mark(imgDrawioXmlReg, 'cm-url drawio');
  };

  /**
   * 把大字符串变成省略号
   * @param {*} reg 正则
   * @param {*} className 利用codemirror的MarkText生成的新元素的class
   */
  formatBigData2Mark = (reg, className) => {
    const codemirror = this.editor;
    const searcher = codemirror.getSearchCursor(reg);

    let oneSearch = searcher.findNext();
    for (; oneSearch !== false; oneSearch = searcher.findNext()) {
      const target = searcher.from();
      if (!target) {
        continue;
      }
      const bigString = oneSearch[2] ?? '';
      const targetChFrom = target.ch + oneSearch[1]?.length;
      const targetChTo = targetChFrom + bigString.length;
      const targetLine = target.line;
      const begin = { line: targetLine, ch: targetChFrom };
      const end = { line: targetLine, ch: targetChTo };
      // 如果所在区域已经有mark了，则不再增加mark
      if (codemirror.findMarks(begin, end).length > 0) {
        continue;
      }
      const newSpan = createElement('span', `cm-string ${className}`, { title: bigString });
      newSpan.textContent = bigString;
      this.noChange = true;
      codemirror.markText(begin, end, { replacedWith: newSpan, atomic: true });
    }
  };

  /**
   *
   * @param {KeyboardEvent} e
   * @param {CodeMirror.Editor} codemirror
   */
  onKeyup = (e, codemirror) => {
    const { line: targetLine } = codemirror.getCursor();
    this.previewer.highlightLine(targetLine + 1);
  };

  /**
   *
   * @param {ClipboardEvent} e
   * @param {CodeMirror.Editor} codemirror
   */
  onPaste(e, codemirror) {
    let { clipboardData } = e;
    if (clipboardData) {
      this.handlePaste(e, clipboardData, codemirror);
    } else {
      ({ clipboardData } = window);
      this.handlePaste(e, clipboardData, codemirror);
    }
  }

  /**
   *
   * @param {ClipboardEvent} event
   * @param {ClipboardEvent['clipboardData']} clipboardData
   * @param {CodeMirror.Editor} codemirror
   * @returns {boolean | void}
   */
  handlePaste(event, clipboardData, codemirror) {
    const { items } = clipboardData;
    const types = clipboardData.types || [];
    const codemirrorDoc = codemirror.getDoc();
    for (let i = 0; i < types.length; i++) {
      const item = items[i];
      // 判断是否为图片数据
      if (item && item.kind === 'file' && item.type.match(/^image\//i)) {
        // 读取该图片
        const file = item.getAsFile();
        this.options.fileUpload(file, (url) => {
          if (typeof url !== 'string') {
            return;
          }
          codemirrorDoc.replaceSelection(`![enter image description here](${url})`);
        });
        event.preventDefault();
      }
    }

    // 复制html转换markdown
    const htmlText = clipboardData.getData('text/plain');
    let html = clipboardData.getData('Text/Html');
    if (!html || !this.options.convertWhenPaste) {
      return true;
    }
    /**
     * 这里需要处理一个特殊逻辑：
     *    从excel中复制而来的内容，剪切板里会有一张图片（一个<img>元素）和一段纯文本，在这种场景下，需要丢掉图片，直接粘贴纯文本
     * 与此同时，当剪切板里有图片和其他html标签时（从web页面上复制的内容），则需要走下面的html转md的逻辑
     * 基于上述两个场景，才有了下面四行奇葩的代码
     */
    const test = html.replace(/<(html|head|body|!)/g, '');
    if (test.match(/<[a-zA-Z]/g)?.length <= 1 && /<img/.test(test)) {
      return true;
    }
    let divObj = document.createElement('DIV');
    divObj.innerHTML = html;
    html = divObj.innerHTML;
    const mdText = htmlParser.run(html);
    if (typeof mdText === 'string' && mdText.trim().length > 0) {
      const range = codemirror.listSelections();
      if (codemirror.getSelections().length <= 1 && range[0] && range[0].anchor) {
        const currentCursor = {};
        currentCursor.line = range[0].anchor.line;
        currentCursor.ch = range[0].anchor.ch;
        codemirrorDoc.replaceSelection(mdText);
        pasteHelper.showSwitchBtnAfterPasteHtml(this.$cherry, currentCursor, codemirror, htmlText, mdText);
      } else {
        codemirrorDoc.replaceSelection(mdText);
      }
      event.preventDefault();
    }
    divObj = null;
  }

  /**
   *
   * @param {CodeMirror.Editor} codemirror
   */
  onScroll = (codemirror) => {
    Event.emit(this.instanceId, Event.Events.cleanAllSubMenus); // 滚动时清除所有子菜单，这不应该在Bubble中处理，我们关注的是编辑器的滚动  add by ufec
    if (this.disableScrollListener) {
      this.disableScrollListener = false;
      return;
    }
    const scroller = codemirror.getScrollerElement();
    if (scroller.scrollTop <= 0) {
      this.previewer.scrollToLineNum(0);
      return;
    }
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 20) {
      this.previewer.scrollToLineNum(null); // 滚动到底
      return;
    }
    const currentTop = codemirror.getScrollInfo().top;
    const targetLine = codemirror.lineAtHeight(currentTop, 'local');
    const lineRect = codemirror.charCoords({ line: targetLine, ch: 0 }, 'local');
    const lineHeight = codemirror.getLineHandle(targetLine).height;
    const lineTop = lineRect.bottom - lineHeight; // 直接用lineRect.top在自动折行时计算的是最后一行的top
    const percent = (100 * (currentTop - lineTop)) / lineHeight / 100;
    // console.log(percent);
    // codemirror中行号以0开始，所以需要+1
    this.previewer.scrollToLineNum(targetLine + 1, percent);
  };

  /**
   *
   * @param {CodeMirror.Editor} codemirror
   * @param {MouseEvent} evt
   */
  onMouseDown = (codemirror, evt) => {
    Event.emit(this.instanceId, Event.Events.cleanAllSubMenus); // Bubble中处理需要考虑太多，直接在编辑器中处理可包括Bubble中所有情况，因为产生Bubble的前提是光标在编辑器中 add by ufec
    const { line: targetLine } = codemirror.getCursor();
    const top = Math.abs(evt.y - codemirror.getWrapperElement().getBoundingClientRect().y);
    this.previewer.scrollToLineNumWithOffset(targetLine + 1, top);
  };

  /**
   * 光标变化事件
   */
  onCursorActivity = () => {
    this.refreshWritingStatus();
  };

  /**
   *
   * @param {*} previewer
   */
  init(previewer) {
    const textArea = this.options.editorDom.querySelector(`#${this.options.id}`);
    if (!(textArea instanceof HTMLTextAreaElement)) {
      throw new Error('The specific element is not a textarea.');
    }
    const editor = codemirror.fromTextArea(textArea, this.options.codemirror);
    editor.addOverlay({
      name: 'invisibles',
      token: function nextToken(stream) {
        let tokenClass;
        let spaces = 0;
        let peek = stream.peek() === ' ';
        if (peek) {
          while (peek && spaces < Number.MAX_VALUE) {
            spaces += 1;
            stream.next();
            peek = stream.peek() === ' ';
          }
          tokenClass = `whitespace whitespace-${spaces}`;
        } else {
          while (!stream.eol()) {
            stream.next();
          }
          tokenClass = '';
        }
        return tokenClass;
      },
    });
    this.previewer = previewer;
    this.disableScrollListener = false;

    if (this.options.value) {
      editor.setOption('value', this.options.value);
    }

    editor.on('blur', (codemirror, evt) => {
      this.options.onBlur(evt, codemirror);
    });

    editor.on('focus', (codemirror, evt) => {
      this.options.onFocus(evt, codemirror);
    });

    editor.on('change', (codemirror, evt) => {
      this.options.onChange(evt, codemirror);
      this.dealBigData();
      if (this.options.autoSave2Textarea) {
        // @ts-ignore
        // 将codemirror里的内容回写到textarea里
        codemirror.save();
      }
    });

    editor.on('keydown', (codemirror, evt) => {
      this.options.onKeydown(evt, codemirror);
    });

    editor.on('keyup', (codemirror, evt) => {
      this.onKeyup(evt, codemirror);
    });

    editor.on('paste', (codemirror, evt) => {
      this.options.onPaste.call(this, evt, codemirror);
    });

    if (this.options.autoScrollByCursor) {
      editor.on('mousedown', (codemirror, evt) => {
        setTimeout(() => {
          this.onMouseDown(codemirror, evt);
        });
      });
    }

    editor.on('drop', (codemirror, evt) => {
      const files = evt.dataTransfer.files || [];
      if (files && files.length > 0) {
        // 增加延时，让drop的位置变成codemirror的光标位置
        setTimeout(() => {
          for (let i = 0, needBr = false; i < files.length; i++) {
            const file = files[i];
            const fileType = file.type || '';
            // 文本类型或者无类型的，直接读取内容，不做上传文件的操作
            if (fileType === '' || /^text/i.test(fileType)) {
              continue;
            }
            this.options.fileUpload(file, (url, params = {}) => {
              if (typeof url !== 'string') {
                return;
              }
              // 拖拽上传文件时，强制改成没有文字选择区的状态
              codemirror.setSelection(codemirror.getCursor());
              const name = params.name ? params.name : file.name;
              let type = '';
              let poster = '';
              if (/video/i.test(file.type)) {
                type = '!video';
                poster = params.poster ? `{poster=${params.poster}}` : '';
              }
              if (/audio/i.test(file.type)) {
                type = '!audio';
              }
              if (/image/i.test(file.type)) {
                type = '!';
              }
              const style = type ? handelParams(params) : '';
              type = needBr ? `\n${type}` : type;
              const insertValue = `${type}[${name}${style}](${url})${poster}`;
              // 当批量上传文件时，每个被插入的文件中间需要加个换行，但单个上传文件的时候不需要加换行
              needBr = true;
              codemirror.replaceSelection(insertValue);
            });
          }
        }, 50);
      }
    });

    editor.on('scroll', (codemirror) => {
      this.options.onScroll(codemirror);
      this.options.writingStyle === 'focus' && this.refreshWritingStatus();
    });

    editor.on('cursorActivity', () => {
      this.onCursorActivity();
    });

    addEvent(
      this.getEditorDom(),
      'wheel',
      () => {
        // 鼠标滚轮滚动时，强制监听滚动事件
        this.disableScrollListener = false;
        // 打断滚动动画
        cancelAnimationFrame(this.animation.timer);
        this.animation.timer = 0;
      },
      false,
    );

    /**
     * @property
     * @type {CodeMirror.Editor}
     */
    this.editor = editor;

    if (this.options.writingStyle !== 'normal') {
      this.initWritingStyle();
    }
  }

  /**
   *
   * @param {number | null} beginLine 起始行，传入null时跳转到文档尾部
   * @param {number} [endLine] 终止行
   * @param {number} [percent] 百分比，取值0~1
   */
  jumpToLine(beginLine, endLine, percent) {
    if (beginLine === null) {
      cancelAnimationFrame(this.animation.timer);
      this.disableScrollListener = true;
      this.editor.scrollIntoView({
        line: this.editor.lineCount() - 1,
        ch: 1,
      });
      this.animation.timer = 0;
      return;
    }
    const position = this.editor.charCoords({ line: beginLine, ch: 0 }, 'local');
    let { top } = position;
    const positionEnd = this.editor.charCoords({ line: beginLine + endLine, ch: 0 }, 'local');
    const height = positionEnd.top - position.top;
    top += height * percent;
    this.animation.destinationTop = Math.ceil(top - 15);
    if (this.animation.timer) {
      return;
    }
    const animationHandler = () => {
      const currentTop = this.editor.getScrollInfo().top;
      const delta = this.animation.destinationTop - currentTop;
      // 100毫秒内完成动画
      const move = Math.ceil(Math.min(Math.abs(delta), Math.max(1, Math.abs(delta) / (100 / 16.7))));
      // console.log('should scroll: ', move, delta, currentTop, this.animation.destinationTop);
      if (delta > 0) {
        if (currentTop >= this.animation.destinationTop) {
          this.animation.timer = 0;
          return;
        }
        this.disableScrollListener = true;
        this.editor.scrollTo(null, currentTop + move);
      } else if (delta < 0) {
        if (currentTop <= this.animation.destinationTop || currentTop <= 0) {
          this.animation.timer = 0;
          return;
        }
        this.disableScrollListener = true;
        this.editor.scrollTo(null, currentTop - move);
      } else {
        this.animation.timer = 0;
        return;
      }
      // 无法再继续滚动
      if (currentTop === this.editor.getScrollInfo().top || move >= Math.abs(delta)) {
        this.animation.timer = 0;
        return;
      }
      this.animation.timer = requestAnimationFrame(animationHandler);
    };
    this.animation.timer = requestAnimationFrame(animationHandler);
  }

  /**
   *
   * @param {number | null} lineNum
   * @param {number} [endLine]
   * @param {number} [percent]
   */
  scrollToLineNum(lineNum, endLine, percent) {
    if (lineNum === null) {
      this.jumpToLine(null);
      return;
    }
    const $lineNum = Math.max(0, lineNum);
    this.jumpToLine($lineNum, endLine, percent);
    Logger.log('滚动预览区域，左侧应scroll to ', $lineNum);
  }

  /**
   *
   * @returns {HTMLElement}
   */
  getEditorDom() {
    return this.options.editorDom;
  }

  /**
   *
   * @param {string} event 事件名
   * @param {EditorEventCallback} callback 回调函数
   */
  addListener(event, callback) {
    this.editor.on(event, callback);
  }

  /**
   * 初始化书写风格
   */
  initWritingStyle() {
    const { writingStyle } = this.options;
    const className = `cherry-editor-writing-style--${writingStyle}`;
    const editorDom = this.getEditorDom();
    // 重置状态
    Array.from(editorDom.classList)
      .filter((className) => className.startsWith('cherry-editor-writing-style--'))
      .forEach((className) => editorDom.classList.remove(className));
    if (writingStyle === 'normal') {
      return;
    }
    editorDom.classList.add(className);
    this.refreshWritingStatus();
  }

  /**
   * 刷新书写状态
   */
  refreshWritingStatus() {
    const { writingStyle } = this.options;
    const className = `cherry-editor-writing-style--${writingStyle}`;
    /**
     * @type {HTMLStyleElement}
     */
    const style = document.querySelector('#cherry-editor-writing-style') || document.createElement('style');
    style.id = 'cherry-editor-writing-style';
    Array.from(document.head.childNodes).find((node) => node === style) || document.head.appendChild(style);
    const { sheet } = style;
    Array.from(Array(sheet.cssRules.length)).forEach(() => sheet.deleteRule(0));
    if (writingStyle === 'focus') {
      const editorDomRect = this.getEditorDom().getBoundingClientRect();
      // 获取光标所在位置
      const { top, bottom } = this.editor.charCoords(this.editor.getCursor());
      // 光标上部距离编辑器顶部距离（不包含菜单）
      const topHeight = top - editorDomRect.top;
      // 光标下部距离编辑器底部距离
      const bottomHeight = editorDomRect.height - (bottom - editorDomRect.top);
      sheet.insertRule(`.${className}::before { height: ${topHeight > 0 ? topHeight : 0}px; }`, 0);
      sheet.insertRule(`.${className}::after { height: ${bottomHeight > 0 ? bottomHeight : 0}px; }`, 0);
    }
    if (writingStyle === 'typewriter') {
      // 编辑器顶/底部填充的空白高度 (用于内容不足时使光标所在行滚动到编辑器中央)
      const height = this.editor.getScrollInfo().clientHeight / 2;
      sheet.insertRule(`.${className} .CodeMirror-lines::before { height: ${height}px; }`, 0);
      sheet.insertRule(`.${className} .CodeMirror-lines::after { height: ${height}px; }`, 0);
      this.editor.scrollTo(null, this.editor.cursorCoords(null, 'local').top - height);
    }
  }

  /**
   * 修改书写风格
   */
  setWritingStyle(writingStyle) {
    this.options.writingStyle = writingStyle;
    this.initWritingStyle();
  }
}
