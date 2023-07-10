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

import imgSizeHander from '@/utils/imgSizeHander';
import TableHandler from '@/utils/tableContentHander';
import { drawioDialog } from '@/utils/dialog';
import Event from '@/Event';
import { copyToClip } from '@/utils/copy';
import { imgDrawioReg, getCodeBlockRule } from '@/utils/regexp';
import { CODE_PREVIEWER_LANG_SELECT_CLASS_NAME } from '@/utils/code-preview-language-setting';
import debounce from 'lodash/debounce';
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
    this.enablePreviewerBubble = this.previewer.options.enablePreviewerBubble;
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
    this.previewerDom.addEventListener('click', this.$onClick.bind(this));
    this.previewerDom.addEventListener('mouseover', this.$onMouseOver.bind(this));
    this.previewerDom.addEventListener('mouseout', this.$onMouseOut.bind(this));

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
    Event.on(this.previewer.instanceId, Event.Events.previewerClose, () => this.$removeAllPreviewerBubbles());
    this.previewer.options.afterUpdateCallBack.push(() => {
      Object.values(this.bubbleHandler).forEach((handler) =>
        handler.emit('previewUpdate', () => this.$removeAllPreviewerBubbles()),
      );
    });
    this.previewerDom.addEventListener('change', this.$onChange.bind(this));
    this.removeHoverBubble = debounce(() => this.$removeAllPreviewerBubbles('hover'), 400);
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
    return true;
  }

  $onMouseOver(e) {
    if (!this.enablePreviewerBubble) {
      return;
    }
    const { target } = e;
    if (typeof target.tagName === 'undefined') {
      return;
    }
    switch (target.tagName) {
      case 'TD':
      case 'TH':
        if (!this.isCherryTable(e.target)) {
          return;
        }
        this.removeHoverBubble.cancel();
        this.$removeAllPreviewerBubbles('hover');
        this.$showTablePreviewerBubbles('hover', e.target);
        return;
    }
  }

  $onMouseOut() {
    if (!this.enablePreviewerBubble) {
      return;
    }
    this.removeHoverBubble();
  }

  $dealCheckboxClick(e) {
    const { target } = e;
    // 先计算是previewer中第几个checkbox
    const list = Array.from(this.previewerDom.querySelectorAll('.ch-icon-square, .ch-icon-check'));
    this.checkboxIdx = list.indexOf(target);

    // 然后找到Editor中对应的`- []`或者`- [ ]`进行修改
    const contents = this.getValueWithoutCode().split('\n');

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

  $onClick(e) {
    const { target } = e;
    // 复制代码块操作不关心编辑器的状态
    this.$dealCopyCodeBlock(e);
    const cherryStatus = this.previewer.$cherry.getStatus();
    // 纯预览模式下，支持点击放大图片功能（以回调的形式实现，需要业务侧实现图片放大功能）
    if (cherryStatus.editor === 'hide') {
      if (cherryStatus.previewer === 'show') {
        this.previewer.$cherry.options.callback.onClickPreview &&
          this.previewer.$cherry.options.callback.onClickPreview(e);
      }
      return;
    }

    // 编辑draw.io不受enablePreviewerBubble配置的影响
    if (target.tagName === 'IMG' && target.getAttribute('data-type') === 'drawio') {
      if (!this.beginChangeDrawioImg(target)) {
        return;
      }
      const xmlData = decodeURI(target.getAttribute('data-xml'));
      drawioDialog(this.previewer.$cherry.options.drawioIframeUrl, xmlData, (newData) => {
        const { xmlData, base64 } = newData;
        this.editor.editor.replaceSelection(`(${base64}){data-type=drawio data-xml=${encodeURI(xmlData)}}`, 'around');
      });
      return;
    }

    if (!this.enablePreviewerBubble) {
      return;
    }
    // 只有双栏编辑模式才出现下面的功能
    // checkbox所见即所得编辑操作
    if (target.className === 'ch-icon ch-icon-square' || target.className === 'ch-icon ch-icon-check') {
      this.$dealCheckboxClick(e);
    }
    this.$removeAllPreviewerBubbles();
    if (typeof target.tagName === 'undefined') {
      return;
    }
    switch (target.tagName) {
      case 'IMG':
        this.$showImgPreviewerBubbles(target);
        break;
      case 'TD':
      case 'TH':
        if (!this.isCherryTable(e.target)) {
          return;
        }
        this.$showTablePreviewerBubbles('click', e.target);
        break;
    }
  }

  $onChange(e) {
    const { target } = e;
    // code预览区域，修改语言设置项事件处理
    if (target.className === CODE_PREVIEWER_LANG_SELECT_CLASS_NAME) {
      this.$codePreviewLangSelectEventHandler(e);
    }
  }

  $getClosestNode(node, targetNodeName) {
    if (node.tagName === targetNodeName) {
      return node;
    }
    if (node.parentNode.tagName === 'BODY') {
      return false;
    }
    return this.$getClosestNode(node.parentNode, targetNodeName);
  }

  /**
   * 处理复制代码块的操作
   */
  $dealCopyCodeBlock(e) {
    const { target } = e;
    if (target.className === 'cherry-copy-code-block' || target.parentNode?.className === 'cherry-copy-code-block') {
      const parentNode =
        target.className === 'cherry-copy-code-block' ? target.parentNode : target.parentNode.parentNode;
      const codeContent = parentNode.innerText;
      const final = this.previewer.$cherry.options.callback.onCopyCode(e, codeContent);
      if (final === false) {
        return false;
      }
      const iconNode = parentNode.querySelector('i.ch-icon-copy');
      if (iconNode) {
        iconNode.className = iconNode.className.replace('copy', 'ok');
        setTimeout(() => {
          iconNode.className = iconNode.className.replace('ok', 'copy');
        }, 1500);
      }
      copyToClip(final);
    }
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
  }

  /**
   * 为触发的table增加操作工具栏
   * @param {string} trigger 触发方式
   * @param {HTMLElement} htmlElement 用户触发的table dom
   */
  $showTablePreviewerBubbles(trigger, htmlElement) {
    this.$createPreviewerBubbles(trigger, trigger === 'click' ? 'table-content-hander' : 'table-hover-handler');
    const handler = new TableHandler(trigger, htmlElement, this.bubble[trigger], this.previewerDom, this.editor.editor);
    handler.showBubble();
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
    imgSizeHander.showBubble(htmlElement, this.bubble.click, this.previewerDom);
    imgSizeHander.bindChange(this.changeImgValue.bind(this));
    this.bubbleHandler.click = imgSizeHander;
  }

  getValueWithoutCode() {
    return this.editor.editor
      .getValue()
      .replace(getCodeBlockRule().reg, (whole) => {
        // 把代码块里的内容干掉
        return whole.replace(/^.*$/gm, '/n');
      })
      .replace(/(`+)(.+?(?:\n.+?)*?)\1/g, (whole) => {
        // 把行内代码的符号去掉
        return whole.replace(/[![\]()]/g, '.');
      });
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
    const content = this.getValueWithoutCode();
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
            this.editor.dealBigData();
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
    const content = this.getValueWithoutCode();
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
  $createPreviewerBubbles(trigger = 'click', type = 'img-size-hander') {
    if (!this.bubble[trigger]) {
      this.bubble[trigger] = document.createElement('div');
      this.bubble[trigger].className = `cherry-previewer-${type}`;
      this.previewerDom.after(this.bubble[trigger]);

      if (trigger === 'hover') {
        this.bubble[trigger].addEventListener('mouseover', this.removeHoverBubble.cancel);
        this.bubble[trigger].addEventListener('mouseout', this.removeHoverBubble);
      }
    }
  }

  $showBorderBubbles() {}

  $showBtnBubbles() {}

  /**
   * 修改预览区域代码语言设置的回调
   */
  $codePreviewLangSelectEventHandler(event) {
    const list = Array.from(this.previewerDom.querySelectorAll(`.${CODE_PREVIEWER_LANG_SELECT_CLASS_NAME}`));
    const codePreviewIndex = list.indexOf(event.target);
    const contentList = this.editor.editor.getValue().split('\n');
    let targetCodePreviewSelectLine = -1;
    let findCodeArea = -1;
    // 相互匹配的`的数量
    let matchedSignalNum = 0;
    // 查找选择设置的代码块在哪一行:
    let left = 0;
    while (left < contentList.length) {
      if (findCodeArea >= codePreviewIndex) {
        break;
      }
      let right = left + 1;
      if (/^`{3,}[\s\S]*$/.test(contentList[left])) {
        // 起始的`的数量
        const topSignalNum = contentList[left].match(/^(`*)/g)?.[0].length ?? 0;
        while (right < contentList.length) {
          let isMatched = false;
          const bottomSignalNum = contentList[right].match(/^(`*)/g)?.[0].length ?? 0;
          // 支持: 3个及以上的`的相互匹配
          if (/^`{3,}$/.test(contentList[right]) && bottomSignalNum === topSignalNum) {
            isMatched = true;
            findCodeArea = findCodeArea + 1;
            if (findCodeArea === codePreviewIndex) {
              targetCodePreviewSelectLine = left;
              matchedSignalNum = topSignalNum;
            }
          }
          right = right + 1;
          if (isMatched) {
            break;
          }
        }
      }
      left = right;
    }
    // 只有匹配了代码块才进行替换
    if (matchedSignalNum) {
      this.editor.editor.setSelection(
        { line: targetCodePreviewSelectLine, ch: matchedSignalNum },
        { line: targetCodePreviewSelectLine, ch: contentList[targetCodePreviewSelectLine].length },
      );
      this.editor.editor.replaceSelection(event.target.value || '');
    }
  }
}
