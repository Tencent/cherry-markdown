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
// import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/gfm/gfm'; // https://codemirror.net/mode/gfm/index.html
import 'codemirror/mode/yaml-frontmatter/yaml-frontmatter'; // https://codemirror.net/5/mode/yaml-frontmatter/index.html
// import 'codemirror/mode/xml/xml';
import 'codemirror/addon/edit/continuelist';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/edit/matchtags';
import 'codemirror/addon/display/placeholder';
import 'codemirror/keymap/sublime';
import 'codemirror/keymap/vim';

// import 'cm-search-replace/src/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/search/matchesonscrollbar';
// import 'codemirror/addon/selection/active-line';
// import 'codemirror/addon/edit/matchbrackets';
import htmlParser from '@/utils/htmlparser';
import pasteHelper from '@/utils/pasteHelper';
import { addEvent } from './utils/event';
import Logger from '@/Logger';
import { handleFileUploadCallback } from '@/utils/file';
import { createElement } from './utils/dom';
import { longTextReg, base64Reg, imgDrawioXmlReg } from './utils/regexp';
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
      keyMap: 'sublime',
      showFullWidthMark: true,
      showSuggestList: true,
      codemirror: {
        lineNumbers: false, // 显示行数
        cursorHeight: 0.85, // 光标高度，0.85好看一些
        indentUnit: 4, // 缩进单位为4
        tabSize: 4, // 一个tab转换成的空格数量
        // styleActiveLine: false, // 当前行背景高亮
        // matchBrackets: true, // 括号匹配
        // mode: 'gfm', // 从markdown模式改成gfm模式，以使用默认高亮规则
        mode: {
          name: 'yaml-frontmatter', // yaml-frontmatter在gfm的基础上增加了对yaml的支持
          base: {
            name: 'gfm',
            gitHubSpice: false, // 修复github风格的markdown语法高亮，见[issue#925](https://github.com/Tencent/cherry-markdown/issues/925)
          },
        },
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
    this.selectAll = false;
    const { codemirror, ...restOptions } = options;
    if (codemirror) {
      Object.assign(this.options.codemirror, codemirror);
    }
    Object.assign(this.options, restOptions);
    this.options.codemirror.keyMap = this.options.keyMap;
    this.$cherry = this.options.$cherry;
    this.instanceId = this.$cherry.getInstanceId();
  }

  /**
   * 禁用快捷键
   * @param {boolean} disable 是否禁用快捷键
   */
  disableShortcut = (disable = true) => {
    if (disable) {
      this.editor.setOption('keyMap', 'default');
    } else {
      this.editor.setOption('keyMap', this.options.keyMap);
    }
  };

  /**
   * 在onChange后处理draw.io的xml数据和图片的base64数据，对这种超大的数据增加省略号，
   * 以及对全角符号进行特殊染色。
   */
  dealSpecialWords = () => {
    /**
     * 如果编辑器隐藏了，则不再处理（否则有性能问题）
     * - 性能问题出现的原因：
     *  1. 纯预览模式下，cherry的高度可能会被设置成auto（也就是没有滚动条）
     *  2. 这时候codemirror的高度也是auto，其“视窗懒加载”提升性能的手段就失效了
     *  3. 这时再大量的调用markText等api就会非常耗时
     * - 经过上述分析，最好的判断应该是判断**编辑器高度是否为auto**，但考虑到一般只有纯预览模式才大概率设置成auto，所以就只判断纯预览模式了
     */
    if (this.$cherry.status.editor === 'hide') {
      return;
    }
    this.formatBigData2Mark(base64Reg, 'cm-url base64');
    this.formatBigData2Mark(imgDrawioXmlReg, 'cm-url drawio');
    this.formatBigData2Mark(longTextReg, 'cm-url long-text');
    this.formatFullWidthMark();
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
      codemirror.markText(begin, end, { replacedWith: newSpan, atomic: true });
    }
  };

  /**
   * 高亮全角符号 ·|￥|、|：|“|”|【|】|（|）|《|》
   * full width翻译为全角
   */
  formatFullWidthMark() {
    if (!this.options.showFullWidthMark) {
      return;
    }
    const { editor } = this;
    const regex = /[·￥、：“”【】（）《》]/; // 此处以仅匹配单个全角符号
    const searcher = editor.getSearchCursor(regex);
    let oneSearch = searcher.findNext();
    // 防止出现错误的mark
    editor.getAllMarks().forEach(function (mark) {
      if (mark.className === 'cm-fullWidth') {
        const range = JSON.parse(JSON.stringify(mark.find()));
        const markedText = editor.getRange(range.from, range.to);
        if (!regex.test(markedText)) {
          mark.clear();
        }
      }
    });
    for (; oneSearch !== false; oneSearch = searcher.findNext()) {
      const target = searcher.from();
      if (!target) {
        continue;
      }
      const from = { line: target.line, ch: target.ch };
      const to = { line: target.line, ch: target.ch + 1 };
      // 当没有标记时再进行标记，判断textMaker的className必须为"cm-fullWidth"，
      // 因为cm的addon里会引入className: "CodeMirror-composing"的textMaker干扰判断
      const existMarksLength = editor.findMarks(from, to).filter((item) => {
        return item.className === 'cm-fullWidth';
      });
      if (existMarksLength.length === 0) {
        editor.markText(from, to, {
          className: 'cm-fullWidth',
          title: '按住Ctrl/Cmd点击切换成半角（Hold down Ctrl/Cmd and click to switch to half-width）',
        });
      }
    }
  }

  /**
   *
   * @param {CodeMirror.Editor} codemirror
   * @param {MouseEvent} evt
   */
  toHalfWidth(codemirror, evt) {
    const { target } = evt;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    // 针对windows用户为Ctrl按键，Mac用户为Cmd按键
    if (target.classList.contains('cm-fullWidth') && (evt.ctrlKey || evt.metaKey) && evt.buttons === 1) {
      const rect = target.getBoundingClientRect();
      // 由于是一个字符，所以肯定在一行
      const from = codemirror.coordsChar({ left: rect.left, top: rect.top });
      const to = { line: from.line, ch: from.ch + 1 };
      codemirror.setSelection(from, to);
      codemirror.replaceSelection(
        target.innerText
          .replace('·', '`')
          .replace('￥', '$')
          .replace('、', '/')
          .replace('：', ':')
          .replace('“', '"')
          .replace('”', '"')
          .replace('【', '[')
          .replace('】', ']')
          .replace('（', '(')
          .replace('）', ')')
          .replace('《', '<')
          .replace('》', '>'),
      );
    }
  }
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
    const onPasteRet = this.$cherry.options.callback.onPaste(clipboardData, this.$cherry);
    if (onPasteRet !== false && typeof onPasteRet === 'string') {
      event.preventDefault();
      codemirror.replaceSelection(onPasteRet);
      return;
    }
    let html = clipboardData.getData('Text/Html');
    const { items } = clipboardData;
    // 清空注释
    html = html.replace(/<!--[^>]+>/g, '');
    /**
     * 处理“右键复制图片”场景
     * 在这种场景下，我们希望粘贴进来的图片可以走文件上传逻辑，所以当检测到这种场景后，我们会清空html
     */
    if (
      /<body>\s*<img [^>]+>\s*<\/body>/.test(html) &&
      items[1]?.kind === 'file' &&
      items[1]?.type.match(/^image\//i)
    ) {
      html = '';
    }
    const codemirrorDoc = codemirror.getDoc();
    this.fileUploadCount = 0;
    // 只要有html内容，就不处理剪切板里的其他内容，这么做的后果是粘贴excel内容时，只会粘贴html内容，不会把excel对应的截图粘进来
    for (let i = 0; !html && i < items.length; i++) {
      const item = items[i];
      // 判断是否为图片数据
      if (item && item.kind === 'file' && item.type.match(/^image\//i)) {
        // 读取该图片
        const file = item.getAsFile();
        this.$cherry.options.callback.fileUpload(file, (url, params = {}) => {
          this.fileUploadCount += 1;
          if (typeof url !== 'string') {
            return;
          }
          const mdStr = `${this.fileUploadCount > 1 ? '\n' : ''}${handleFileUploadCallback(url, params, file)}`;
          codemirrorDoc.replaceSelection(mdStr);
          // if (this.pasterHtml) {
          //   // 如果同时粘贴了html内容和文件内容，则在文件上传完成后强制让光标处于非选中状态，以防止自动选中的html内容被文件内容替换掉
          //   const { line, ch } = codemirror.getCursor();
          //   codemirror.setSelection({ line, ch }, { line, ch });
          //   codemirrorDoc.replaceSelection(mdStr, 'end');
          // } else {
          //   codemirrorDoc.replaceSelection(mdStr);
          // }
        });
        event.preventDefault();
      }
    }

    // 复制html转换markdown
    const htmlText = clipboardData.getData('text/plain');
    if (!html || !this.options.convertWhenPaste) {
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
    this.$cherry.$event.emit('cleanAllSubMenus'); // 滚动时清除所有子菜单，这不应该在Bubble中处理，我们关注的是编辑器的滚动  add by ufec
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
    this.$cherry.$event.emit('cleanAllSubMenus'); // Bubble中处理需要考虑太多，直接在编辑器中处理可包括Bubble中所有情况，因为产生Bubble的前提是光标在编辑器中 add by ufec
    const { line: targetLine } = codemirror.getCursor();
    const top = Math.abs(evt.y - codemirror.getWrapperElement().getBoundingClientRect().y);
    this.previewer.scrollToLineNumWithOffset(targetLine + 1, top);
    this.toHalfWidth(codemirror, evt);
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
    // 以下逻辑是针对\t等空白字符的处理，似乎已经不需要了，先注释掉，等有反馈了再考虑加回来
    // editor.addOverlay({
    //   name: 'invisibles',
    //   token: function nextToken(stream) {
    //     let tokenClass;
    //     let spaces = 0;
    //     let peek = stream.peek() === ' ';
    //     if (peek) {
    //       while (peek && spaces < Number.MAX_VALUE) {
    //         spaces += 1;
    //         stream.next();
    //         peek = stream.peek() === ' ';
    //       }
    //       tokenClass = `whitespace whitespace-${spaces}`;
    //     } else {
    //       while (!stream.eol()) {
    //         stream.next();
    //       }
    //       tokenClass = '';
    //     }
    //     return tokenClass;
    //   },
    // });
    this.previewer = previewer;
    this.disableScrollListener = false;

    if (this.options.value) {
      editor.setOption('value', this.options.value);
    }

    editor.on('blur', (codemirror, evt) => {
      this.options.onBlur(evt, codemirror);
      this.$cherry.$event.emit('blur', { evt, cherry: this.$cherry });
    });

    editor.on('focus', (codemirror, evt) => {
      this.options.onFocus(evt, codemirror);
      this.$cherry.$event.emit('focus', { evt, cherry: this.$cherry });
    });

    editor.on('change', (codemirror, evt) => {
      this.options.onChange(evt, codemirror);
      this.dealSpecialWords();
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
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileType = file.type || '';
            // text格式或md格式文件，直接读取内容，不做上传文件的操作
            if (/\.(text|md)/.test(file.name) || /^text/i.test(fileType)) {
              continue;
            }
            this.$cherry.options.callback.fileUpload(file, (url, params = {}) => {
              if (typeof url !== 'string') {
                return;
              }
              // 拖拽上传文件时，强制改成没有文字选择区的状态
              codemirror.setSelection(codemirror.getCursor());
              const mdStr = handleFileUploadCallback(url, params, file);
              // 当批量上传文件时，每个被插入的文件中间需要加个换行，但单个上传文件的时候不需要加换行
              const insertValue = i > 0 ? `\n${mdStr} ` : `${mdStr} `;
              codemirror.replaceSelection(insertValue);
              this.dealSpecialWords();
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
    editor.on('beforeChange', (codemirror) => {
      this.selectAll = this.editor.getValue() === codemirror.getSelection();
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
    // 处理特殊字符，主要将base64等大文本替换成占位符，以提高可读性
    this.dealSpecialWords();

    this.domWidth = this.getEditorDom().offsetWidth;
    // 监听编辑器宽度变化
    const resizeObserver = new ResizeObserver((entries) => {
      if (this.getEditorDom().offsetWidth !== this.domWidth && this.$cherry.status.editor === 'show') {
        this.domWidth = this.getEditorDom().offsetWidth;
        this.editor.refresh();
      }
    });
    resizeObserver.observe(this.getEditorDom());
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
    if (writingStyle !== 'focus' && writingStyle !== 'typewriter') {
      return;
    }
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

  /**
   * 设置编辑器值
   */
  setValue(value = '') {
    this.editor.setOption('value', value);
  }
}
