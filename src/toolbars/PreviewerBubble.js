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
import Event from '@/Event';
/**
 * 预览区域的响应式工具栏
 */
export default class PreviewerBubble {
  /**
   *
   * @param {import('../Previewer').default} previewer
   * @param {import('../Editor').default} editor
   */
  constructor(previewer, editor) {
    this.instanceId = `cherry-toolbar-${new Date().getTime()}`;
    /**
     * @property
     * @type {import('../Previewer').default}
     */
    this.previewer = previewer;
    /**
     * @property
     * @type {import('../Editor').default}
     */
    this.editor = editor;
    this.previewerDom = this.previewer.getDom();
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
      this.bubbleHandler.emit('mouseup', event);
    });
    document.addEventListener('mousemove', (event) => {
      this.bubbleHandler.emit('mousemove', event);
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
    this.$removeAllPreviewerBubbles();
    if (typeof target.tagName === 'undefined') {
      return;
    }
    switch (target.tagName) {
      case 'IMG':
        this.bubbleHandler = this.$showImgPreviewerBubbles(target);
        break;
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
   * 为选中的图片增加操作工具栏
   * @param {HTMLImageElement} htmlElement 用户点击的图片dom
   */
  $showImgPreviewerBubbles(htmlElement) {
    this.$creatPreviewerBubbles();
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

  beginChangeImgValue(htmlElement) {
    const content = this.editor.editor.getValue();
    const src = htmlElement.getAttribute('src');
    const imgReg = /!\[[^\n]*?\](\([^)]+\)|\[[^\]]+\])/g;
    const contentImgs = content.match(imgReg);
    const testSrc = contentImgs[this.imgIndex]
      ? contentImgs[this.imgIndex].replace(/^!\[.*?\]\((.*?)\)/, '$1').trim()
      : '';
    console.log('src', src, 'testSrc', testSrc);
    if (contentImgs.length === this.totalImgs || src === testSrc) {
      // 如果图片语法数量和预览区域的一样多
      // 暂时不需要考虑代码块和手动输入img标签的场景
      const searcher = this.editor.editor.getSearchCursor(imgReg);
      let targetSearch;
      for (let i = 0; i <= this.imgIndex; i++) {
        targetSearch = searcher.findNext()?.[0] ?? false;
      }
      const targetFrom = searcher.from();
      if (!targetFrom) {
        return false;
      }
      const targetLine = targetFrom.line;
      const imgAppendReg = /^!\[.*?#(center|right|left|float-right|float-left).*?\].*$/;
      this.imgAppend = imgAppendReg.test(targetSearch) ? targetSearch.replace(imgAppendReg, '#$1') : false;
      const targetChFrom = targetFrom.ch + targetSearch.replace(/^(!\[[^#\]]*).*$/, '$1').length;
      const targetChTo = targetChFrom + targetSearch.replace(/^(!\[[^#\]]*)([^\]]*?)\].*$/, '$2').length;
      this.editor.editor.setSelection({ line: targetLine, ch: targetChFrom }, { line: targetLine, ch: targetChTo });
      return true;
    }
    // 有代码块、行内代码、手动输入img标签的场景
    // 暂时不考虑

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

  $creatPreviewerBubbles() {
    if (!this.bubble) {
      this.bubble = document.createElement('div');
      this.bubble.className = 'cherry-previewer-img-size-hander';
      this.previewerDom.after(this.bubble);
    }
  }

  $showBorderBubbles() {}

  $showBtnBubbles() {}
}
