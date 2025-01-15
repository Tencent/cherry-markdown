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

import imgSizeHandler from '@/utils/imgSizeHandler';
import TableHandler from '@/utils/tableContentHandler';
import CodeHandler from '@/utils/codeBlockContentHandler';
import { drawioDialog } from '@/utils/dialog';
import { imgDrawioReg, getValueWithoutCode } from '@/utils/regexp';
import debounce from 'lodash/debounce';
import FormulaHandler from '@/utils/formulaUtilsHandler';
import ListHandler from '@/utils/listContentHandler';

/**
 * 预览区域的响应式工具栏
 */
export default class PreviewerBubble {
  /**
   *
   * @param {import('../Previewer').default} previewer
   */
  constructor(previewer) {
    /**
     * @property
     * @type {import('../Previewer').default}
     */
    this.previewer = previewer;
    /**
     * @property
     * @type {import('../Editor').default}
     */
    this.editor = previewer.editor;
    this.previewerDom = this.previewer.getDom();
    this.$cherry = previewer.$cherry;
    /**
     * @property
     * @type {{ [key: string]: HTMLDivElement}}
     */
    this.bubble = {};
    /**
     * @property
     * @type {{ [key: string]: { emit: (...args: any[]) => any, [key:string]: any }}}
     */
    this.bubbleHandler = {};
    this.init();
  }

  init() {
    // 记录cherry外层容器的overflow属性，在后续的操作中会临时修改overflow属性，所以需要先记录
    this.oldWrapperDomOverflow = this.previewer.$cherry.wrapperDom.style.overflow;
    this.previewerDom.addEventListener('click', this.$onClick.bind(this));
    this.previewerDom.addEventListener('mouseover', this.$onMouseOver.bind(this));
    // this.previewerDom.addEventListener('mouseout', this.$onMouseOut.bind(this));

    document.addEventListener('mousedown', (event) => {
      Object.values(this.bubbleHandler).forEach((handler) => handler.emit('mousedown', event));
    });
    document.addEventListener('mouseup', (event) => {
      Object.values(this.bubbleHandler).forEach((handler) =>
        handler.emit('mouseup', event, () => this.$removeAllPreviewerBubbles('click')),
      );
    });
    document.addEventListener('mousemove', (event) => {
      Object.values(this.bubbleHandler).forEach((handler) => handler.emit('mousemove', event));
    });
    document.addEventListener('keyup', (event) => {
      Object.values(this.bubbleHandler).forEach((handler) => handler.emit('keyup', event));
    });
    this.previewerDom.addEventListener(
      'scroll',
      (event) => {
        Object.values(this.bubbleHandler).forEach((handler) => handler.emit('scroll', event));
      },
      true,
    );
    this.$cherry.$event.on('previewerClose', () => this.$removeAllPreviewerBubbles());
    this.previewer.options.afterUpdateCallBack.push(() => {
      Object.values(this.bubbleHandler).forEach((handler) =>
        handler.emit('previewUpdate', () => this.$removeAllPreviewerBubbles()),
      );
    });
    this.previewerDom.addEventListener('change', this.$onChange.bind(this));
    this.removeHoverBubble = debounce(() => this.$removeAllPreviewerBubbles('hover'), 400);
  }

  /**
   * 判断是否为代码块
   * @param {HTMLElement} element
   * @returns {boolean|HTMLElement}
   */
  isCherryCodeBlock(element) {
    // 引用里的代码块先不支持所见即所得编辑
    if (this.$getClosestNode(element, 'BLOCKQUOTE') !== false) {
      return false;
    }
    if (element.nodeName === 'DIV' && element.dataset.type === 'codeBlock') {
      return element;
    }
    const container = this.$getClosestNode(element, 'DIV');
    if (container === false) {
      return false;
    }
    if (container.dataset.type === 'codeBlock') {
      return container;
    }
    return false;
  }

  /**
   * 是否为由cherry生成的表格，且不是简单表格
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  isCherryTable(element) {
    const container = this.$getClosestNode(element, 'DIV');
    if (container === false) {
      return false;
    }
    if (/simple-table/.test(container.className) || !/cherry-table-container/.test(container.className)) {
      return false;
    }
    // 引用里的表格先不支持所见即所得编辑
    if (this.$getClosestNode(element, 'BLOCKQUOTE') !== false) {
      return false;
    }
    return container;
  }

  /**
   * 是否开启了预览区操作 && 是否有编辑区
   * @returns {boolean}
   */
  $isEnableBubbleAndEditorShow() {
    if (!this.previewer.options.enablePreviewerBubble) {
      return false;
    }
    const cherryStatus = this.previewer.$cherry.getStatus();
    if (cherryStatus.editor === 'hide') {
      return false;
    }
    return true;
  }

  $onMouseOver(e) {
    /** @type {Event} */
    const { target } = e;
    // 这里要用Element，而不是HTMLElement
    if (!(target instanceof Element) || typeof target.tagName === 'undefined') {
      return;
    }
    switch (target.tagName) {
      case 'TD':
      case 'TH':
        if (!this.$isEnableBubbleAndEditorShow()) {
          return;
        }
        // eslint-disable-next-line no-case-declarations
        const table = this.isCherryTable(e.target);
        if (false === table) {
          return;
        }
        this.removeHoverBubble.cancel();
        this.$removeAllPreviewerBubbles('hover');
        // @ts-ignore
        this.$showTablePreviewerBubbles('hover', e.target, table);
        return;
      case 'PRE':
      case 'CODE':
      case 'SPAN':
      case 'DIV':
        // eslint-disable-next-line no-case-declarations
        const codeBlock = this.isCherryCodeBlock(e.target);
        if (codeBlock === false) {
          return;
        }
        this.showCodeBlockPreviewerBubbles('hover', codeBlock);
        return;
    }
    this.removeHoverBubble();
  }

  $onMouseOut() {
    if (!this.previewer.options.enablePreviewerBubble) {
      return;
    }
    const cherryStatus = this.previewer.$cherry.getStatus();
    // 左侧编辑器被隐藏时不再提供后续功能
    if (cherryStatus.editor === 'hide') {
      return;
    }
    // this.removeHoverBubble();
  }

  $dealCheckboxClick(e) {
    const { target } = e;
    // 先计算是previewer中第几个checkbox
    const list = Array.from(this.previewerDom.querySelectorAll('.ch-icon-square, .ch-icon-check'));
    this.checkboxIdx = list.indexOf(target);

    // 然后找到Editor中对应的`- []`或者`- [ ]`进行修改
    const contents = getValueWithoutCode(this.editor.editor.getValue()).split('\n');

    let editorCheckboxCount = 0;
    // [ ]中的空格，或者[x]中的x的位置
    let targetLine = -1;
    let targetCh = -1;
    contents.forEach((lineContent, lineIdx) => {
      const tmp = lineContent.trim(); // 去掉句首的空格和制表符
      if (tmp.startsWith('- [ ]') || tmp.startsWith('- [x]')) {
        // 如果是个checkbox
        if (editorCheckboxCount === this.checkboxIdx) {
          targetLine = lineIdx;
          targetCh = lineContent.indexOf('- [') + 3;
        }
        editorCheckboxCount += 1;
      }
    });
    if (targetLine === -1) {
      // 无法找到对应的checkbox
      return;
    }
    this.editor.editor.setSelection({ line: targetLine, ch: targetCh }, { line: targetLine, ch: targetCh + 1 });
    this.editor.editor.replaceSelection(this.editor.editor.getSelection() === ' ' ? 'x' : ' ', 'around');
  }

  /**
   * 点击预览区域的事件处理
   * @param {MouseEvent} e
   * @returns
   */
  $onClick(e) {
    const { target } = e;
    if (!(target instanceof Element)) {
      return;
    }

    // 编辑draw.io不受previewer.options.enablePreviewerBubble配置的影响
    if (target instanceof HTMLImageElement) {
      if (
        target.tagName === 'IMG' &&
        target.getAttribute('data-type') === 'drawio' &&
        this.$cherry.status.editor === 'show'
      ) {
        if (!this.beginChangeDrawioImg(target)) {
          return;
        }
        const xmlData = decodeURI(target.getAttribute('data-xml'));
        drawioDialog(
          this.previewer.$cherry.options.drawioIframeUrl,
          this.previewer.$cherry.options.drawioIframeStyle,
          xmlData,
          (newData) => {
            const { xmlData, base64 } = newData;
            this.editor.editor.replaceSelection(
              `(${base64}){data-type=drawio data-xml=${encodeURI(xmlData)}}`,
              'around',
            );
          },
        );
        return;
      }
    }

    // 点击展开代码块操作
    if (target.className === 'expand-btn ' || target.className === 'ch-icon ch-icon-expand') {
      const expandBtnDom = this.$getClosestNode(target, 'DIV');
      expandBtnDom.parentNode.parentNode.classList.remove('cherry-code-unExpand');
      expandBtnDom.parentNode.parentNode.classList.add('cherry-code-expand');
      if (this.bubbleHandler?.hover?.unExpandDom) {
        this.bubbleHandler.hover.unExpandDom.classList.remove('hidden');
      }
    }

    if (!this.previewer.options.enablePreviewerBubble) {
      return;
    }
    // 只有双栏编辑模式才出现下面的功能
    // checkbox所见即所得编辑操作
    if (target.className === 'ch-icon ch-icon-square' || target.className === 'ch-icon ch-icon-check') {
      this.$dealCheckboxClick(e);
    }
    this.$removeAllPreviewerBubbles('click');
    if (typeof target.tagName === 'undefined') {
      return;
    }

    switch (target.tagName) {
      case 'IMG':
        if (target instanceof HTMLImageElement) {
          this.$showImgPreviewerBubbles(target);
        }
        break;
      case 'TD':
      case 'TH':
        if (target instanceof HTMLElement) {
          const table = this.isCherryTable(target);
          if (false === table) {
            return;
          }
          // @ts-ignore
          this.$showTablePreviewerBubbles('click', target, table);
        }
        break;
      case 'svg':
        if (target?.parentElement?.tagName === 'MJX-CONTAINER') {
          this.$showFormulaPreviewerBubbles('click', target, { x: e.pageX, y: e.pageY });
        }
        break;
      case 'A':
        e.stopPropagation(); // 阻止冒泡，避免触发预览区域的点击事件
        break;
      case 'P':
        if (
          target instanceof HTMLParagraphElement &&
          target.parentElement instanceof HTMLLIElement &&
          // 引用里的列表先不支持所见即所得编辑
          this.$getClosestNode(target, 'BLOCKQUOTE') === false
        ) {
          if (target.children.length !== 0) {
            // 富文本
            e.preventDefault();
            e.stopPropagation();
          }
          // 鼠标点击在列表的某项上时，为target增加contenteditable属性，使其可编辑
          target.setAttribute('contenteditable', 'true');
          target.focus();
          this.$showListPreviewerBubbles('click', target);
        }
        break;
    }
  }

  $onChange(e) {
    return;
  }

  $getClosestNode(node, targetNodeName) {
    if (!node || !node.tagName) {
      return false;
    }
    if (node.tagName === targetNodeName) {
      return node;
    }
    if (node.parentNode.tagName === 'BODY') {
      return false;
    }
    return this.$getClosestNode(node.parentNode, targetNodeName);
  }

  /**
   * 隐藏预览区域已经激活的工具栏
   * @param {string} trigger 移除指定的触发方式，不传默认全部移除
   */
  $removeAllPreviewerBubbles(trigger = '') {
    Object.entries(this.bubble)
      .filter(([key]) => !trigger || trigger === key)
      .forEach(([key, value]) => {
        value.remove();
        delete this.bubble[key];
      });
    Object.entries(this.bubbleHandler)
      .filter(([key]) => !trigger || trigger === key)
      .forEach(([key, value]) => {
        value.emit('remove');
        delete this.bubbleHandler[key];
      });
    if (Object.keys(this.bubbleHandler).length <= 0) {
      this.previewer.$cherry.wrapperDom.style.overflow = this.oldWrapperDomOverflow || '';
    }
  }

  /**
   * 为触发的table增加操作工具栏
   * @param {string} trigger 触发方式
   * @param {HTMLElement} htmlElement 用户触发的table dom
   */
  $showTablePreviewerBubbles(trigger, htmlElement, tableElement) {
    if (this.bubbleHandler[trigger]) {
      if (this.bubbleHandler[trigger].tableElement === tableElement) {
        // 已经存在相同的target，直接返回
        this.bubbleHandler[trigger].showBubble();
        return;
      }
    }
    this.$createPreviewerBubbles(trigger, trigger === 'click' ? 'table-content-handler' : 'table-hover-handler');
    const handler = new TableHandler(
      trigger,
      htmlElement,
      this.bubble[trigger],
      this.previewerDom,
      this.editor.editor,
      tableElement,
      this.previewer.$cherry,
    );
    handler.showBubble();
    this.bubbleHandler[trigger] = handler;
  }

  showCodeBlockPreviewerBubbles(trigger, htmlElement) {
    if (this.bubbleHandler[trigger]) {
      if (this.bubbleHandler[trigger].target === htmlElement) {
        // 已经存在相同的target，直接返回
        this.removeHoverBubble.cancel();
        return;
      }
    }
    this.$removeAllPreviewerBubbles('hover');
    this.$createPreviewerBubbles(trigger, `codeBlock-${trigger}-handler`);
    const handler = new CodeHandler(
      trigger,
      htmlElement,
      this.bubble[trigger],
      this.previewerDom,
      this.editor.editor,
      this,
    );
    handler.showBubble(this.$isEnableBubbleAndEditorShow());
    this.bubbleHandler[trigger] = handler;
  }

  /**
   * 为选中的图片增加操作工具栏
   * @param {HTMLImageElement} htmlElement 用户点击的图片dom
   */
  $showImgPreviewerBubbles(htmlElement) {
    this.$createPreviewerBubbles();
    const list = Array.from(this.previewerDom.querySelectorAll('img'));
    this.totalImgs = list.length;
    this.imgIndex = list.indexOf(htmlElement);
    if (!this.beginChangeImgValue(htmlElement)) {
      return { emit: () => {} };
    }
    imgSizeHandler.showBubble(htmlElement, this.bubble.click, this.previewerDom);
    imgSizeHandler.bindChange(this.changeImgValue.bind(this));
    this.bubbleHandler.click = imgSizeHandler;
  }

  /**
   * 为触发的公式增加操作工具栏
   * @param {string} trigger 触发方式
   * @param {Element} target 用户触发的公式dom
   * @param {{x?: number, y?: number}} options 额外参数
   */
  $showFormulaPreviewerBubbles(trigger, target, options = {}) {
    this.$createPreviewerBubbles(trigger, 'formula-hover-handler');
    const formulaHandler = new FormulaHandler(trigger, target, this.bubble[trigger], this.previewerDom, this.editor);
    formulaHandler.showBubble(options?.x || 0, options?.y || 0);
    this.bubbleHandler[trigger] = formulaHandler;
  }

  /**
   * 为触发的列表增加操作工具栏
   * @param {string} trigger 触发方式
   * @param {HTMLParagraphElement} target 用户触发的列表dom
   */
  $showListPreviewerBubbles(trigger, target, options = {}) {
    this.$createPreviewerBubbles(trigger, 'list-hover-handler');
    const listHandler = new ListHandler(trigger, target, this.bubble[trigger], this.previewerDom, this.editor);
    this.bubbleHandler[trigger] = listHandler;
  }

  /**
   * TODO: beginChangeDrawioImg 和 beginChangeImgValue 代码高度重合，后面有时间重构下，抽成一个可以复用的，可以避开代码块、行内代码影响的通用方法
   * 修改draw.io图片时选中编辑区域的对应文本
   * @param {*} htmlElement 图片node
   */
  beginChangeDrawioImg(htmlElement) {
    const allDrawioImgs = Array.from(this.previewerDom.querySelectorAll('img[data-type="drawio"]'));
    const totalDrawioImgs = allDrawioImgs.length;
    const drawioImgIndex = allDrawioImgs.indexOf(htmlElement);
    const content = getValueWithoutCode(this.editor.editor.getValue());
    const drawioImgsCode = content.match(imgDrawioReg);
    const testSrc = drawioImgsCode[drawioImgIndex]
      ? drawioImgsCode[drawioImgIndex].replace(/^!\[.*?\]\((.*?)\)/, '$1').trim()
      : '';
    if (drawioImgsCode.length === totalDrawioImgs || htmlElement.getAttribute('src') === testSrc) {
      // 如果drawio语法数量和预览区域的一样多
      const totalValue = content.split(imgDrawioReg);
      let line = 0;
      let beginCh = 0;
      let endCh = 0;
      let testIndex = 0;
      for (let i = 0; i < totalValue.length; i++) {
        const targetString = totalValue[i];
        if (targetString === drawioImgsCode[testIndex]) {
          // 如果找到目标代码
          if (testIndex === drawioImgIndex) {
            endCh = beginCh + targetString.length;
            beginCh += targetString.replace(/^(!\[[^\]]*])[^\n]*$/, '$1').length;
            this.editor.editor.setSelection({ line, ch: beginCh }, { line, ch: endCh });
            // 更新后需要再调用一次markText机制
            this.editor.dealSpecialWords();
            return true;
          }
          testIndex += 1;
        } else {
          line += targetString.match(/\n/g)?.length ?? 0;
          if (/\n/.test(targetString)) {
            // 如果有换行，则开始位置的字符计数从最后一个换行开始计数
            beginCh = targetString.replace(/^[\w\W]*\n([^\n]*)$/, '$1').length;
          } else {
            // 如果没有换行，则继续按上次的beginCh为起始开始计数
            beginCh += targetString.length;
          }
        }
      }
    }
    return false;
  }

  /**
   * 选中图片对应的MD语法
   * @param {*} htmlElement 图片node
   * @returns {boolean}
   */
  beginChangeImgValue(htmlElement) {
    const content = getValueWithoutCode(this.editor.editor.getValue());
    const src = htmlElement.getAttribute('src');
    const imgReg = /(!\[[^\n]*?\]\([^)]+\))/g;
    const contentImgs = content.match(imgReg);
    const testSrc = contentImgs[this.imgIndex]
      ? contentImgs[this.imgIndex].replace(/^!\[.*?\]\((.*?)\)/, '$1').trim()
      : '';
    if (contentImgs.length === this.totalImgs || src === testSrc) {
      // 如果图片语法数量和预览区域的一样多
      // 暂时不需要考虑手动输入img标签的场景 和 引用图片的场景
      const totalValue = content.split(imgReg);
      const imgAppendReg =
        /^!\[.*?((?:#center|#right|#left|#float-right|#float-left|#border|#B|#shadow|#S|#radius|#R)+).*?\].*$/;
      let line = 0;
      let beginCh = 0;
      let endCh = 0;
      let testIndex = 0;
      for (let i = 0; i < totalValue.length; i++) {
        const targetString = totalValue[i];
        if (targetString === contentImgs[testIndex]) {
          // 如果找到目标代码
          if (testIndex === this.imgIndex) {
            this.imgAppend = imgAppendReg.test(targetString) ? targetString.replace(imgAppendReg, '$1') : false;
            beginCh += targetString.replace(/^(!\[[^#\]]*).*$/, '$1').length;
            endCh = beginCh + targetString.replace(/^(!\[[^#\]]*)([^\]]*?)\].*$/, '$2').length;
            this.editor.editor.setSelection({ line, ch: beginCh }, { line, ch: endCh });
            return true;
          }
          testIndex += 1;
        }
        line += targetString.match(/\n/g)?.length ?? 0;
        if (/\n/.test(targetString)) {
          // 如果有换行，则开始位置的字符计数从最后一个换行开始计数
          beginCh = targetString.replace(/^[\w\W]*\n([^\n]*)$/, '$1').length;
        } else {
          // 如果没有换行，则继续按上次的beginCh为起始开始计数
          beginCh += targetString.length;
        }
      }
    }
    return false;
  }

  /**
   * 修改图片尺寸时的回调
   * @param {HTMLElement} htmlElement 被拖拽的图片标签
   * @param {Object} style 图片的属性（宽高、对齐方式）
   */
  changeImgValue(htmlElement, style) {
    const append = this.imgAppend ? ` ${this.imgAppend}` : '';
    this.editor.editor.replaceSelection(
      `#${Math.round(style.width)}px #${Math.round(style.height)}px${append}`,
      'around',
    );
  }

  /**
   * 预览区域编辑器的容器
   * @param {string} trigger 触发方式
   * @param {string} type 容器类型（用作样式名：cherry-previewer-{type}）
   */
  $createPreviewerBubbles(trigger = 'click', type = 'img-size-handler') {
    if (!this.bubble[trigger]) {
      this.bubble[trigger] = document.createElement('div');
      this.bubble[trigger].className = `cherry-previewer-${type}`;
      this.previewerDom.after(this.bubble[trigger]);

      if (trigger === 'hover') {
        this.bubble[trigger].addEventListener('mouseover', this.removeHoverBubble.cancel);
        this.bubble[trigger].addEventListener('mouseout', this.removeHoverBubble);
      }
      // 暂时让最上层容器的overflow变成hidden
      this.previewer.$cherry.wrapperDom.style.overflow = 'hidden';
    }
  }

  $showBorderBubbles() {}

  $showBtnBubbles() {}
}
