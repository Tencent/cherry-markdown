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

import imgSizeHandler from '@/utils/imgSizeHandler';
import imgToolHandler from '@/utils/imgToolHandler';
import TableHandler from '@/utils/tableContentHandler';
import FootnoteHoverHandler from '@/utils/footnoteHoverHandler';
import CodeHandler from '@/utils/codeBlockContentHandler';
import { drawioDialog } from '@/utils/dialog';
import { imgDrawioReg, getValueWithoutCode } from '@/utils/regexp';
import debounce from 'lodash/debounce';
import FormulaHandler from '@/utils/formulaUtilsHandler';
import ListHandler from '@/utils/listContentHandler';
import { Transaction } from '@codemirror/state';

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
     * @type {import('../Editor').default|null}
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

    // 保存事件监听器引用，便于销毁时移除
    this.$bindedOnClick = this.$onClick.bind(this);
    this.$bindedOnMouseOver = this.$onMouseOver.bind(this);
    this.$bindedOnMouseDown = (event) => {
      Object.values(this.bubbleHandler).forEach((handler) => handler.emit('mousedown', event));
    };
    this.$bindedOnMouseUp = (event) => {
      Object.values(this.bubbleHandler).forEach((handler) =>
        handler.emit('mouseup', event, () => this.$removeAllPreviewerBubbles('click')),
      );
    };
    this.$bindedOnMouseMove = (event) => {
      Object.values(this.bubbleHandler).forEach((handler) => handler.emit('mousemove', event));
    };
    this.$bindedOnKeyUp = (event) => {
      Object.values(this.bubbleHandler).forEach((handler) => handler.emit('keyup', event));
    };
    this.$bindedOnScroll = (event) => {
      Object.values(this.bubbleHandler).forEach((handler) => handler.emit('scroll', event));
    };
    this.$bindedOnChange = this.$onChange.bind(this);
    this.$bindedOnEditorSizeChange = () => {
      Object.values(this.bubbleHandler).forEach((handler) => handler.emit('resize', {}));
    };

    this.previewerDom.addEventListener('click', this.$bindedOnClick);
    this.previewerDom.addEventListener('mouseover', this.$bindedOnMouseOver);
    // this.previewerDom.addEventListener('mouseout', this.$onMouseOut.bind(this));

    document.addEventListener('mousedown', this.$bindedOnMouseDown);
    document.addEventListener('mouseup', this.$bindedOnMouseUp);
    document.addEventListener('mousemove', this.$bindedOnMouseMove);
    document.addEventListener('keyup', this.$bindedOnKeyUp);

    this.$cherry.$event.on('editor.size.change', this.$bindedOnEditorSizeChange);

    this.previewerDom.addEventListener('scroll', this.$bindedOnScroll, true);
    this.$cherry.$event.on('previewerClose', () => this.$removeAllPreviewerBubbles());
    this.previewer.options.afterUpdateCallBack.push(() => {
      // 检查表格处理器是否需要重新创建
      this.$checkAndRecreateTableHandlers();

      Object.values(this.bubbleHandler).forEach((handler) =>
        handler.emit('previewUpdate', () => this.$removeAllPreviewerBubbles()),
      );
    });
    this.previewerDom.addEventListener('change', this.$bindedOnChange);
    this.removeHoverBubble = debounce(() => this.$removeAllPreviewerBubbles('hover'), 400);

    // 销毁标志
    this.isDestroyed = false;
  }

  /**
   * 判断是否为代码块
   * @param {HTMLElement} element
   * @returns {boolean|Element}
   */
  isCherryCodeBlock(element) {
    if (!Element.prototype.closest) {
      Element.prototype.closest = function (selector) {
        let el = this;
        while (el) {
          if (el.matches(selector)) {
            return el;
          }
          el = el.parentElement;
        }
        return null;
      };
    }
    // 引用里的代码块先不支持所见即所得编辑
    if (this.$getClosestNode(element, 'BLOCKQUOTE') !== false) {
      return false;
    }
    const container = element.closest('div[data-type="codeBlock"]');
    if (!container) {
      return false;
    }
    return container;
  }

  /**
   * 是否为由cherry生成的表格，且不是简单表格
   * 现在也支持 HTML 表格语法
   * @param {HTMLElement} element
   * @returns {boolean|HTMLElement}
   */
  isCherryTable(element) {
    // 获取最近的表格元素
    const table = this.$getClosestNode(element, 'TABLE');
    if (!table) {
      return false;
    }

    // 排除简单表格
    const container = this.$getClosestNode(element, 'DIV');
    if (container && /simple-table/.test(container.className)) {
      return false;
    }

    return table;
  }

  /**
   * 检测编辑器是否可用
   * 用于流式渲染场景下的读写分离判断
   * @returns {boolean}
   */
  $hasEditor() {
    return !!(this.editor && this.editor.editor);
  }

  /**
   * 是否开启了预览区操作 && 是否有编辑区
   * @returns {boolean}
   */
  $isEnableBubbleAndEditorShow() {
    if (!this.previewer.options.enablePreviewerBubble) {
      return false;
    }
    // 流式渲染场景下没有 editor，但仍可使用只读功能
    if (!this.$hasEditor()) {
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
      case 'A':
        // @ts-ignore
        // eslint-disable-next-line no-case-declarations
        const bubbleCard = this.previewer?.$cherry?.options?.engine?.syntax?.footnote?.bubbleCard || false;
        if (bubbleCard !== false && /cherry-show-bubble-card/.test(e.target.className)) {
          this.removeHoverBubble.cancel();
          this.$removeAllPreviewerBubbles('hover');
          this.$showFootNoteBubbleCardPreviewerBubbles('hover', e.target, bubbleCard);
          return;
        }
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
    // 无编辑器时跳过 checkbox 编辑功能
    if (!this.$hasEditor()) {
      return;
    }
    const { target } = e;
    // 先计算是previewer中第几个checkbox
    const list = Array.from(this.previewerDom.querySelectorAll('.ch-icon-square, .ch-icon-check'));
    this.checkboxIdx = list.indexOf(target);

    // 然后找到Editor中对应的`- []`或者`- [ ]`进行修改
    const contents = getValueWithoutCode(this.editor.editor.view.state.doc.toString()).split('\n');

    let editorCheckboxCount = 0;
    // [ ]中的空格，或者[x]中的x的位置
    let targetLine = -1;
    let targetCh = -1;
    contents.forEach((lineContent, lineIdx) => {
      const tmp = lineContent.trim(); // 去掉句首的空格和制表符
      if (/^-\s+\[[ x]\]/i.test(tmp)) {
        // 如果是个checkbox
        if (editorCheckboxCount === this.checkboxIdx) {
          targetLine = lineIdx;
          targetCh = lineContent.indexOf('[') + 1;
        }
        editorCheckboxCount += 1;
      }
    });
    if (targetLine === -1) {
      // 无法找到对应的checkbox
      return;
    }
    // CodeMirror 6 中设置选区需要使用 dispatch
    // 添加 userEvent 注解标记这是程序触发的操作，避免显示 bubble 菜单
    const { view } = this.editor.editor;
    const { doc } = view.state;
    const fromPos = doc.line(targetLine + 1).from + targetCh;
    const toPos = doc.line(targetLine + 1).from + targetCh + 1;
    view.dispatch({
      selection: { anchor: fromPos, head: toPos },
      annotations: Transaction.userEvent.of('checklist.toggle'),
    });

    // CodeMirror 6 中替换选中内容
    const selection = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(selection.from, selection.to);
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: selectedText === ' ' ? 'x' : ' ',
      },
      annotations: Transaction.userEvent.of('checklist.toggle'),
    });
  }

  /**
   * 点击预览区域的事件处理
   * 基础交互功能（代码块展开/复制、链接跳转、脚注等）始终可用
   * enablePreviewerBubble 配置只控制是否显示编辑工具栏（图片、表格、列表等）
   * @param {MouseEvent} e
   * @returns
   */
  $onClick(e) {
    // 如果有自定义的onClickPreview回调函数，则先执行；返回false时中断后续处理
    if (this.previewer.$cherry.options.callback?.onClickPreview?.(e) === false) {
      return false;
    }

    const { target } = e;
    if (!(target instanceof Element)) {
      return;
    }

    // 编辑draw.io不受previewer.options.enablePreviewerBubble配置的影响
    if (target instanceof HTMLImageElement) {
      if (
        target.tagName === 'IMG' &&
        target.getAttribute('data-type') === 'drawio' &&
        this.$cherry.status.editor === 'show' &&
        this.$hasEditor() // 流式渲染场景下没有 editor，跳过 drawio 编辑
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
            // CodeMirror 6 中替换选中内容
            const editorView = this.editor.editor.view;
            const selection = editorView.state.selection.main;
            // 使用 encodeURIComponent 而不是 encodeURI，确保属性上下文中的特殊字符被正确转义
            const escapedXmlData = encodeURIComponent(xmlData);
            editorView.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: `(${base64}){data-type=drawio data-xml=${escapedXmlData}}`,
              },
            });
          },
        );
        return;
      }
    }

    // ========== 以下是基础交互功能，不受 enablePreviewerBubble 配置影响 ==========

    // 点击展开代码块操作
    if (target.className === 'expand-btn ' || target.className === 'ch-icon ch-icon-expand') {
      const expandBtnDom = this.$getClosestNode(target, 'DIV');
      expandBtnDom.parentNode.parentNode.classList.remove('cherry-code-unExpand');
      expandBtnDom.parentNode.parentNode.classList.add('cherry-code-expand');
      if (this.$cherry.options.callback.onExpandCode) {
        const codeContent = expandBtnDom.parentNode.parentNode.innerText;
        this.$cherry.options.callback.onUnExpandCode(e, codeContent);
      }
      if (this.bubbleHandler?.hover?.unExpandDom) {
        this.bubbleHandler.hover.unExpandDom.classList.remove('hidden');
      }
    }

    // 基础链接和脚注功能，不受 enablePreviewerBubble 配置影响
    switch (target.tagName) {
      case 'A':
        // 如果配置了点击toc目录不更新location hash
        // @ts-ignore
        if (this.previewer.$cherry.options.toolbars.toc?.updateLocationHash === false) {
          if (target instanceof Element && target.nodeName === 'A' && /level-\d+/.test(target.className)) {
            const liNode = target.parentElement;
            const index = Array.from(liNode.parentElement.children).indexOf(liNode) - 1;
            this.previewer.scrollToHeadByIndex(index);
            e.stopPropagation();
            e.preventDefault();
          }
        }
        // 如果点击的是脚注
        if (target instanceof Element && target.nodeName === 'A' && /(footnote|footnote-ref)/.test(target.className)) {
          if (
            target.classList.contains('footnote') &&
            // @ts-ignore
            this.previewer.$cherry.options.engine?.syntax?.footnote?.refNumber?.clickRefNumberCallback
          ) {
            const refNum = target.getAttribute('data-index');
            const refTitle = target.getAttribute('data-key');
            const content =
              this.previewer.getDomContainer().querySelector(`.one-footnote[data-index="${refNum}"]`).innerHTML ?? '';
            // 如果有自定义的clickRefNumberCallback回调函数，则先执行
            // @ts-ignore
            const ret = this.previewer.$cherry.options.engine.syntax.footnote.refNumber.clickRefNumberCallback(
              e,
              refNum,
              refTitle,
              content,
            );
            // @ts-ignore
            if (ret === false) {
              e.stopPropagation();
              e.preventDefault();
              return ret;
            }
          }
          /** 增加个潜规则逻辑，脚注跳转时是否更新location hash也跟随options.toolbars.toc.updateLocationHash 的配置 */
          // @ts-ignore
          if (this.previewer.$cherry.options.toolbars.toc?.updateLocationHash === false) {
            const id = target.getAttribute('href');
            this.previewer.scrollToId(id);
            e.stopPropagation();
            e.preventDefault();
          }
        }
        break;
    }

    // ========== 以下是只读交互功能，不受 enablePreviewerBubble 配置影响 ==========
    // 公式工具栏（输出图片/代码等是只读功能，不需要编辑器）
    if (target.tagName === 'svg' && target?.parentElement?.tagName === 'MJX-CONTAINER') {
      this.$removeAllPreviewerBubbles('click'); // 先移除旧的 click bubble
      this.$showFormulaPreviewerBubbles('click', target, { x: e.pageX, y: e.pageY });
      return; // 公式工具栏是只读功能，不需要进入编辑工具栏逻辑
    }

    // ========== 以下是编辑工具栏功能 ==========
    // 需要同时满足两个条件：
    // 1. enablePreviewerBubble=true（开启预览区操作）
    // 2. 有编辑器可用（Stream 模式下没有编辑器，自动跳过）
    if (!this.$isEnableBubbleAndEditorShow()) {
      return;
    }

    // checkbox 所见即所得编辑操作
    if (target.className === 'ch-icon ch-icon-square' || target.className === 'ch-icon ch-icon-check') {
      this.$dealCheckboxClick(e);
    }

    this.$removeAllPreviewerBubbles('click');
    if (typeof target.tagName === 'undefined') {
      return;
    }

    switch (target.tagName) {
      case 'IMG':
        // 图片编辑功能
        if (target instanceof HTMLImageElement) {
          this.$showImgPreviewerBubbles(target, e);
        }
        break;
      case 'TD':
      case 'TH':
        // 表格编辑功能
        if (target instanceof HTMLElement) {
          const table = this.isCherryTable(target);
          if (false === table) {
            return;
          }
          // @ts-ignore
          this.$showTablePreviewerBubbles('click', target, table);
        }
        break;
      case 'P':
        // 列表所见即所得编辑
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
      default: {
        // 处理点击 mermaid 图表（可能点击到 svg 内部的 g/rect/text/path 等子元素）
        const mermaidFigure = this.$getMermaidFigure(target);
        if (mermaidFigure) {
          this.$showMermaidPreviewerBubbles(mermaidFigure, e);
        } else {
          const katexNode = target.closest ? target.closest('.katex') : null;
          if (katexNode) {
            this.$showFormulaPreviewerBubbles('click', katexNode, { x: e.pageX, y: e.pageY });
          }
        }
        break;
      }
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
    if (Object.keys(this.bubbleHandler).length <= 0 && this.previewer?.$cherry?.wrapperDom) {
      this.previewer.$cherry.wrapperDom.style.overflow = this.oldWrapperDomOverflow || '';
    }
  }

  /**
   * 检查并重新创建表格处理器
   * 当表格结构发生变化时，需要重新创建处理器以避免位置异常
   */
  $checkAndRecreateTableHandlers() {
    // 检查所有表格处理器
    Object.entries(this.bubbleHandler).forEach(([trigger, handler]) => {
      if (handler instanceof TableHandler) {
        // 检查表格是否仍然存在且有效
        if (!this.$isTableHandlerValid(handler)) {
          // 表格已不存在或无效，移除处理器
          this.$removePreviewerBubble(trigger);
        }
      }
    });
  }

  /**
   * 检查表格处理器是否仍然有效
   * @param {TableHandler} handler 表格处理器实例
   * @returns {boolean} 是否有效
   */
  $isTableHandlerValid(handler) {
    // 检查目标元素是否仍然存在
    if (!handler.target || !document.contains(handler.target)) {
      return false;
    }

    // 检查表格节点是否仍然存在
    const tableNode = handler.$getClosestNode(handler.target, 'TABLE');
    if (tableNode === false) {
      return false;
    }

    // 检查表格是否仍然在预览区域中
    if (!this.previewerDom.contains(tableNode)) {
      return false;
    }

    // 检查表格是否有有效的内容
    if (!tableNode.textContent || tableNode.textContent.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * 移除指定的预览气泡
   * @param {string} trigger 触发方式
   */
  $removePreviewerBubble(trigger) {
    if (this.bubble[trigger]) {
      this.bubble[trigger].remove();
      delete this.bubble[trigger];
    }
    if (this.bubbleHandler[trigger]) {
      this.bubbleHandler[trigger].emit('remove');
      delete this.bubbleHandler[trigger];
    }
    if (Object.keys(this.bubbleHandler).length <= 0 && this.previewer?.$cherry?.wrapperDom) {
      this.previewer.$cherry.wrapperDom.style.overflow = this.oldWrapperDomOverflow || '';
    }
  }

  /**
   * hover到脚注的数字角标时展示悬浮卡片
   * @param {string} trigger 触发方式
   * @param {HTMLElement} htmlElement 触发的角标
   * @param {object} bubbleConfig 悬浮卡片的配置
   */
  $showFootNoteBubbleCardPreviewerBubbles(trigger, htmlElement, bubbleConfig) {
    if (this.bubbleHandler[trigger]) {
      if (this.bubbleHandler[trigger]?.aElement === htmlElement) {
        // 已经存在相同的target，直接返回
        this.bubbleHandler[trigger].showBubble();
        return;
      }
    }
    this.$createPreviewerBubbles(
      trigger,
      `footnote-ref-hover-handler cherry-markdown ${bubbleConfig.appendClass ?? ''}`,
    );
    const handler = new FootnoteHoverHandler(
      trigger,
      htmlElement,
      this.bubble[trigger],
      this.previewer.$cherry,
      bubbleConfig,
    );
    handler.showBubble();
    this.bubbleHandler[trigger] = handler;
  }

  /**
   * 为触发的table增加操作工具栏
   * @param {string} trigger 触发方式
   * @param {HTMLElement} htmlElement 用户触发的table dom
   */
  $showTablePreviewerBubbles(trigger, htmlElement, tableElement) {
    // 表格编辑需要编辑器支持
    if (!this.$hasEditor()) {
      return;
    }
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
    // CM6: 传入 CM6Adapter 实例（stream 模式下 editor 可能不存在）
    const codeMirror = this.editor?.editor ?? null;
    const handler = new CodeHandler(trigger, htmlElement, this.bubble[trigger], this.previewerDom, codeMirror, this);
    handler.showBubble(this.$isEnableBubbleAndEditorShow());
    this.bubbleHandler[trigger] = handler;
  }

  /**
   * 为选中的图片增加操作工具栏
   * @param {HTMLImageElement} htmlElement 用户点击的图片dom
   */
  $showImgPreviewerBubbles(htmlElement, event) {
    // 图片编辑功能需要编辑器支持
    if (!this.$hasEditor()) {
      return;
    }
    this.$createPreviewerBubbles('click', 'img-handler');
    const list = Array.from(this.previewerDom.querySelectorAll('img'));
    this.totalImgs = list.length;
    this.imgIndex = list.indexOf(htmlElement);
    if (!this.beginChangeImgValue(htmlElement)) {
      return { emit: () => {} };
    }

    const imgSizeDiv = document.createElement('div');
    imgSizeDiv.className = 'cherry-previewer-img-size-handler';
    this.bubble.click.appendChild(imgSizeDiv);
    imgSizeHandler.showBubble(htmlElement, imgSizeDiv, this.previewerDom);
    imgSizeHandler.bindChange(this.changeImgSize.bind(this));

    const imgToolDiv = document.createElement('div');
    imgToolDiv.className = 'cherry-previewer-img-tool-handler';
    this.bubble.click.appendChild(imgToolDiv);
    imgToolHandler.showBubble(htmlElement, imgToolDiv, this.previewerDom, event, this.previewer.$cherry.getLocales());
    imgToolHandler.bindChange(this.changeImgStyle.bind(this));

    // 订阅编辑器大小变化事件
    const updateHandler = imgSizeHandler.updatePosition.bind(imgSizeHandler);
    this.$cherry.$event.on('editor.size.change', updateHandler);
    // 保存原始的remove方法
    const originalRemove = imgSizeHandler.remove;
    imgSizeHandler.remove = () => {
      this.$cherry.$event.off('editor.size.change', updateHandler);
      // 调用原始的remove方法
      return originalRemove.call(imgSizeHandler);
    };
    this.bubbleHandler.click = imgSizeHandler;
    this.bubbleHandler.imgTool = imgToolHandler;
  }

  /**
   * 为触发的公式增加操作工具栏
   * @param {string} trigger 触发方式
   * @param {Element} target 用户触发的公式dom
   * @param {{x?: number, y?: number}} options 额外参数
   */
  $showFormulaPreviewerBubbles(trigger, target, options = {}) {
    this.$createPreviewerBubbles(trigger, 'formula-hover-handler');
    const formulaHandler = new FormulaHandler(trigger, target, this.bubble[trigger], this.previewerDom, this.$cherry);
    formulaHandler.showBubble(options?.x || 0, options?.y || 0);
    this.bubbleHandler[trigger] = formulaHandler;
  }

  /**
   * 为触发的列表增加操作工具栏
   * @param {string} trigger 触发方式
   * @param {HTMLParagraphElement} target 用户触发的列表dom
   */
  $showListPreviewerBubbles(trigger, target, options = {}) {
    // 列表所见即所得编辑需要编辑器支持
    if (!this.$hasEditor()) {
      return;
    }
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
    const content = getValueWithoutCode(this.editor.editor.view.state.doc.toString());
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
            // CodeMirror 6 中设置选区
            const { doc } = this.editor.editor.view.state;
            const fromPos = doc.line(line + 1).from + beginCh;
            const toPos = doc.line(line + 1).from + endCh;
            this.editor.editor.view.dispatch({
              selection: { anchor: fromPos, head: toPos },
            });
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
    const content = getValueWithoutCode(this.editor.editor.view.state.doc.toString());
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
      const imgDecoReg = /(#border|#B|#shadow|#S|#radius|#R)/g;
      const imgAlignReg = /(#center|#right|#left|#float-right|#float-left)/g;
      const imgSizeReg = /^!\[.*?((?:(?:#[0-9]+(px|em|pt|pc|in|mm|cm|ex|%)|auto) *)+).*?\].*$/;
      let line = 0;
      let beginCh = 0;
      let endCh = 0;
      let testIndex = 0;
      for (let i = 0; i < totalValue.length; i++) {
        const targetString = totalValue[i];
        if (targetString === contentImgs[testIndex]) {
          // 如果找到目标代码
          if (testIndex === this.imgIndex) {
            this.imgDeco = imgDecoReg.test(targetString) ? targetString.match(imgDecoReg).join(' ') : '';
            this.imgAlign = imgAlignReg.test(targetString) ? targetString.match(imgAlignReg).join(' ') : '';
            this.imgSize = imgSizeReg.test(targetString) ? targetString.replace(imgSizeReg, '$1') : '';
            beginCh += targetString.replace(/^(!\[[^#\]]*).*$/, '$1').length;
            endCh = beginCh + targetString.replace(/^(!\[[^#\]]*)([^\]]*?)\].*$/, '$2').length;
            // CodeMirror 6 中设置选区
            const { doc } = this.editor.editor.view.state;
            const fromPos = doc.line(line + 1).from + beginCh;
            const toPos = doc.line(line + 1).from + endCh;
            this.editor.editor.view.dispatch({
              selection: { anchor: fromPos, head: toPos },
            });
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
   * @param {Object} style 图片的属性（宽高）
   */
  changeImgSize(htmlElement, style) {
    this.imgSize = `#${Math.round(style.width)}px #${Math.round(style.height)}px`;
    this.changeImgValue();
  }

  /**
   * 修改图片样式时的回调
   * @param {HTMLElement} htmlElement 被修改演示的图片标签
   * @param {Object} type 图片的属性（边框、阴影、圆角、对齐方式）
   */
  changeImgStyle(htmlElement, type) {
    switch (type) {
      case 'border':
      case 'shadow':
      case 'radius':
        this.changeImgDecorationStyle(htmlElement, type);
        break;
      case 'left':
      case 'right':
      case 'center':
      case 'float-left':
      case 'float-right':
      case 'clear-align':
        this.changeImgAlignmentStyle(htmlElement, type);
        break;
    }
  }

  /**
   * 修改图片装饰样式
   * @param {HTMLElement} htmlElement 被修改演示的图片标签
   * @param {Object} type 图片的属性（边框、阴影、圆角）
   */
  changeImgDecorationStyle(htmlElement, type) {
    const typeProp = {
      border: { reg: /#(border|B) */g, v: 'B' },
      shadow: { reg: /#(shadow|S) */g, v: 'S' },
      radius: { reg: /#(radius|R) */g, v: 'R' },
    };
    const typeReg = typeProp[type].reg;
    if (typeReg.test(this.imgDeco)) {
      this.imgDeco = this.imgDeco.replaceAll(typeReg, '');
    } else {
      this.imgDeco += `#${typeProp[type].v}`;
    }
    this.changeImgValue();
  }

  /**
   * 修改图片装饰样式
   * @param {HTMLElement} htmlElement 被修改演示的图片标签
   * @param {Object} type 图片的属性（左对齐、居中、右对齐、左浮动、右浮动）
   */
  changeImgAlignmentStyle(htmlElement, type) {
    this.imgAlign = type === 'clear-align' ? '' : `#${type}`;
    this.changeImgValue();
  }

  changeImgValue() {
    // CodeMirror 6 中替换选中内容
    const selection = this.editor.editor.view.state.selection.main;
    this.editor.editor.view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: [this.imgSize, this.imgDeco, this.imgAlign].filter((v) => v).join(' '),
      },
    });
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

  /**
   * 判断目标元素是否为 mermaid 图表或其子元素
   * @param {Element} element
   * @returns {HTMLElement|false}
   */
  $getMermaidFigure(element) {
    let el = element;
    while (el && el !== this.previewerDom) {
      if (el.tagName === 'FIGURE' && el.getAttribute('data-type') === 'mermaid') {
        return /** @type {HTMLElement} */ (el);
      }
      el = el.parentElement;
    }
    return false;
  }

  /**
   * 为选中的 mermaid 图表增加尺寸调整工具
   * @param {HTMLElement} figureElement mermaid 图表的 figure DOM
   */
  $showMermaidPreviewerBubbles(figureElement, event) {
    if (!this.$isEnableBubbleAndEditorShow()) {
      return;
    }
    this.$createPreviewerBubbles('click', 'img-handler');

    this.mermaidFigure = figureElement;
    if (!this.beginChangeMermaidValue(figureElement)) {
      return;
    }

    const imgSizeDiv = document.createElement('div');
    imgSizeDiv.className = 'cherry-previewer-img-size-handler';
    this.bubble.click.appendChild(imgSizeDiv);
    imgSizeHandler.showBubble(figureElement, imgSizeDiv, this.previewerDom, { isMermaid: true });
    imgSizeHandler.bindChange(this.changeMermaidSize.bind(this));

    // 添加对齐工具面板（仅对齐按钮，不含装饰按钮）
    const imgToolDiv = document.createElement('div');
    imgToolDiv.className = 'cherry-previewer-img-tool-handler';
    this.bubble.click.appendChild(imgToolDiv);
    imgToolHandler.showBubble(
      figureElement,
      imgToolDiv,
      this.previewerDom,
      event,
      this.previewer.$cherry.getLocales(),
      { isMermaid: true },
    );
    imgToolHandler.bindChange(this.changeMermaidStyle.bind(this));

    const updateHandler = imgSizeHandler.updatePosition.bind(imgSizeHandler);
    this.$cherry.$event.on('editor.size.change', updateHandler);
    const originalRemove = imgSizeHandler.remove;
    imgSizeHandler.remove = () => {
      this.$cherry.$event.off('editor.size.change', updateHandler);
      return originalRemove.call(imgSizeHandler);
    };
    this.bubbleHandler.click = imgSizeHandler;
    this.bubbleHandler.imgTool = imgToolHandler;
  }

  /**
   * 选中 mermaid 代码块语法的语言行中的扩展参数部分（尺寸 + 对齐）
   * @param {HTMLElement} figureElement mermaid figure DOM
   * @returns {boolean}
   */
  beginChangeMermaidValue(figureElement) {
    // 找到预览区中所有 mermaid 图表，确定当前点击的是第几个
    const allMermaidFigures = Array.from(this.previewerDom.querySelectorAll('figure[data-type="mermaid"]'));
    const mermaidIndex = allMermaidFigures.indexOf(figureElement);
    if (mermaidIndex < 0) {
      return false;
    }

    const rawContent = this.editor.editor.view.state.doc.toString();
    // 在编辑器原始内容中按顺序找到所有 mermaid 代码块
    const codeBlockReg = /(?:^|\n)(\n*(?:>[\t ]*)*(?:[^\S\n]*))(`{3,})([^`]*?)\n([\w\W]*?)\n\s*\2[ \t]*(?=$|\n)/g;
    let match;
    let currentMermaidIdx = -1;

    while ((match = codeBlockReg.exec(rawContent)) !== null) {
      const langLine = match[3].trim().toLowerCase();
      const langPure = langLine
        .replace(/#([0-9]+(px|em|pt|pc|in|mm|cm|ex|%)|auto)/gi, '')
        .replace(/#(center|right|left|float-right|float-left)/gi, '')
        .trim();

      // 判断是否为 mermaid 类型的代码块
      if (langPure !== 'mermaid' && !/^flow([ ](td|lr))?$/i.test(langPure) && langPure !== 'seq') {
        continue;
      }
      currentMermaidIdx += 1;
      if (currentMermaidIdx !== mermaidIndex) {
        continue;
      }

      // 找到了对应的代码块，定位语言行
      const fullMatchStart = match.index;
      const leadingContent = match[1] || '';
      const backtickPos = rawContent.indexOf(match[2], fullMatchStart + leadingContent.length);
      const beforeBacktick = rawContent.substring(0, backtickPos);
      const langLineNum = (beforeBacktick.match(/\n/g) || []).length;

      // 获取该行的完整内容
      const allLines = rawContent.split('\n');
      const fullLangLine = allLines[langLineNum] || '';

      // 匹配所有扩展参数（尺寸 + 对齐），如 "#400px #300px #center"
      const extendRegex =
        /((?:\s*#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto|center|right|left|float-right|float-left))+)\s*$/i;
      const extendMatch = fullLangLine.match(extendRegex);

      // 提取当前的尺寸和对齐信息
      const sizeRegex = /#([0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto)/gi;
      const alignRegex = /#(center|right|left|float-right|float-left)/i;
      const sizeMatches = fullLangLine.match(sizeRegex);
      const alignMatch = fullLangLine.match(alignRegex);

      this.mermaidSize = sizeMatches ? sizeMatches.join(' ') : '';
      this.mermaidAlign = alignMatch ? alignMatch[0] : '';

      // CM6: 计算扩展参数的文档偏移量
      const { doc } = this.editor.editor.view.state;
      const lineStart = doc.line(langLineNum + 1).from;

      if (extendMatch) {
        const extendStart = fullLangLine.indexOf(extendMatch[1]);
        this.mermaidExtendFrom = lineStart + extendStart;
        this.mermaidExtendTo = this.mermaidExtendFrom + extendMatch[1].length;
        this.editor.editor.setSelection(this.mermaidExtendFrom, this.mermaidExtendTo);
      } else {
        this.mermaidExtendFrom = lineStart + fullLangLine.length;
        this.mermaidExtendTo = this.mermaidExtendFrom;
        this.editor.editor.setSelection(this.mermaidExtendFrom, this.mermaidExtendFrom);
      }

      this.mermaidLangLineNum = langLineNum;
      this.mermaidHasExtend = !!extendMatch;
      return true;
    }
    return false;
  }

  /**
   * 拼接 mermaid 扩展参数并替换编辑器中的选中文本
   */
  changeMermaidValue() {
    const value = [this.mermaidSize, this.mermaidAlign].filter((v) => v).join(' ');

    if (this.mermaidHasExtend) {
      this.editor.editor.setSelection(this.mermaidExtendFrom, this.mermaidExtendTo);
      this.editor.editor.replaceSelection(value, 'around');
      this.mermaidExtendTo = this.mermaidExtendFrom + value.length;
    } else if (value) {
      this.editor.editor.setSelection(this.mermaidExtendFrom, this.mermaidExtendFrom);
      this.editor.editor.replaceSelection(` ${value}`, 'around');
      this.mermaidExtendFrom += 1;
      this.mermaidExtendTo = this.mermaidExtendFrom + value.length;
      this.mermaidHasExtend = true;
    }
  }

  /**
   * 修改 mermaid 图表尺寸时的回调
   * @param {HTMLElement} htmlElement mermaid figure 元素
   * @param {Object} style 图表的属性（宽高）
   */
  changeMermaidSize(htmlElement, style) {
    this.mermaidSize = `#${Math.round(style.width)}px #${Math.round(style.height)}px`;
    this.changeMermaidValue();
  }

  /**
   * 修改 mermaid 图表对齐方式时的回调
   * @param {HTMLElement} htmlElement mermaid figure 元素
   * @param {string} type 对齐方式
   */
  changeMermaidStyle(htmlElement, type) {
    switch (type) {
      case 'left':
      case 'right':
      case 'center':
      case 'float-left':
      case 'float-right':
        this.mermaidAlign = `#${type}`;
        break;
      case 'clear-align':
        this.mermaidAlign = '';
        break;
      default:
        return;
    }
    this.changeMermaidValue();
  }

  $showBorderBubbles() {}

  $showBtnBubbles() {}

  /**
   * 销毁 PreviewerBubble 实例，清理事件监听器和引用
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    // 移除所有气泡
    this.$removeAllPreviewerBubbles();

    // 取消防抖定时器
    if (this.removeHoverBubble && this.removeHoverBubble.cancel) {
      this.removeHoverBubble.cancel();
    }

    // 移除 previewerDom 上的事件监听器
    if (this.previewerDom) {
      this.previewerDom.removeEventListener('click', this.$bindedOnClick);
      this.previewerDom.removeEventListener('mouseover', this.$bindedOnMouseOver);
      this.previewerDom.removeEventListener('scroll', this.$bindedOnScroll, true);
      this.previewerDom.removeEventListener('change', this.$bindedOnChange);
    }

    // 移除 document 上的事件监听器
    document.removeEventListener('mousedown', this.$bindedOnMouseDown);
    document.removeEventListener('mouseup', this.$bindedOnMouseUp);
    document.removeEventListener('mousemove', this.$bindedOnMouseMove);
    document.removeEventListener('keyup', this.$bindedOnKeyUp);

    // 移除自定义事件监听器
    if (this.$cherry && this.$cherry.$event) {
      this.$cherry.$event.off('editor.size.change', this.$bindedOnEditorSizeChange);
    }

    // 清理引用
    this.$bindedOnClick = null;
    this.$bindedOnMouseOver = null;
    this.$bindedOnMouseDown = null;
    this.$bindedOnMouseUp = null;
    this.$bindedOnMouseMove = null;
    this.$bindedOnKeyUp = null;
    this.$bindedOnScroll = null;
    this.$bindedOnChange = null;
    this.$bindedOnEditorSizeChange = null;

    this.bubble = {};
    this.bubbleHandler = {};
    this.previewer = null;
    this.editor = null;
    this.previewerDom = null;
    this.$cherry = null;
  }
}
