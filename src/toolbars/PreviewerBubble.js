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
import tableContentHander from '@/utils/tableContentHander';
import { drawioDialog } from '@/utils/dialog';
import Event from '@/Event';
import { copyToClip } from '@/utils/copy';
import { imgDrawioReg, getCodeBlockRule } from '@/utils/regexp';
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
     * @type {{ emit: (...args: any[]) => any}}
     */
    this.bubbleHandler = { emit: () => {} };
    this.init();
  }

  init() {
    this.previewerDom.addEventListener('click', this.$onClick.bind(this));
    document.addEventListener('mousedown', (event) => {
      this.bubbleHandler.emit('mousedown', event);
    });
    document.addEventListener('mouseup', (event) => {
      this.bubbleHandler.emit('mouseup', event, () => {
        this.$removeAllPreviewerBubbles();
      });
    });
    document.addEventListener('mousemove', (event) => {
      this.bubbleHandler.emit('mousemove', event);
    });
    document.addEventListener('keyup', (event) => {
      this.bubbleHandler.emit('keyup', event);
    });
    this.previewerDom.addEventListener('scroll', (event) => {
      this.bubbleHandler.emit('scroll', event);
    });
    Event.on(this.previewer.instanceId, Event.Events.previewerClose, () => {
      this.$removeAllPreviewerBubbles();
    });
    this.previewer.options.afterUpdateCallBack.push(() => {
      this.bubbleHandler.emit('previewUpdate', () => {
        this.$removeAllPreviewerBubbles();
      });
    });
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
    this.$removeAllPreviewerBubbles();
    if (typeof target.tagName === 'undefined') {
      return;
    }
    switch (target.tagName) {
      case 'IMG':
        this.bubbleHandler = this.$showImgPreviewerBubbles(target);
        break;
      case 'TD':
      case 'TH':
        this.bubbleHandler = this.$showTablePreviewerBubbles(target);
        break;
    }
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
   */
  $removeAllPreviewerBubbles() {
    if (this.bubble) {
      this.bubble.remove();
      this.bubbleHandler.emit('remove');
      this.bubble = null;
      this.bubbleHandler = { emit: () => {} };
    }
  }

  /**
   * 为选中的table增加操作工具栏
   * @param {HTMLImageElement} htmlElement 用户点击的table dom
   */
  $showTablePreviewerBubbles(htmlElement) {
    this.$createPreviewerBubbles('table-content-hander');
    tableContentHander.showBubble(htmlElement, this.bubble, this.previewerDom, this.editor.editor);
    return tableContentHander;
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
    imgSizeHander.showBubble(htmlElement, this.bubble, this.previewerDom);
    imgSizeHander.bindChange(this.changeImgValue.bind(this));
    return imgSizeHander;
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
   */
  $createPreviewerBubbles(type = 'img-size-hander') {
    if (!this.bubble) {
      this.bubble = document.createElement('div');
      this.bubble.className = `cherry-previewer-${type}`;
      this.previewerDom.after(this.bubble);
    }
  }

  $showBorderBubbles() {}

  $showBtnBubbles() {}
}
