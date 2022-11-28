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

import { createElement } from '@/utils/dom';

const SAFE_AREA_MARGIN = 15;

/**
 * Cherry实现了将粘贴的html内容转成对应的markdown源码的功能
 * 本工具主要实现将粘贴html转成的markdown源码在编辑器中选中，并给出切换按钮
 * 可以切换为纯文本内容，或者markdown内容
 */
const pasteHelper = {
  /**
   * 核心方法，粘贴后展示切换按钮
   * 只有粘贴html时才会出现切换按钮
   * @param {Object} currentCursor 当前的光标位置
   * @param {Object} editor 编辑器对象
   * @param {string} html html里的纯文本内容
   * @param {string} md html对应的markdown源码
   * @returns
   */
  showSwitchBtnAfterPasteHtml($cherry, currentCursor, editor, html, md) {
    if (html.trim() === md.trim()) {
      return;
    }
    this.init($cherry, currentCursor, editor, html, md);
    this.setSelection();
    this.bindListener();
    this.initBubble();
    this.showBubble();
    // 默认粘贴成markdown格式，如果用户上次选择粘贴为纯文本，则需要切换为text
    if (this.getTypeFromLocalStorage() === 'text') {
      this.switchTextClick();
    }
  },

  init($cherry, currentCursor, editor, html, md) {
    this.$cherry = $cherry;
    this.html = html;
    this.md = md;
    this.codemirror = editor;
    this.currentCursor = currentCursor;
    this.locale = $cherry.locale;
  },

  /**
   * 获取缓存中的复制粘贴类型
   */
  getTypeFromLocalStorage() {
    if (typeof localStorage === 'undefined') {
      return 'md';
    }
    return localStorage.getItem('cherry-paste-type') || 'md';
  },

  /**
   * 记忆最近一次用户选择的粘贴类型
   */
  setTypeToLocalStorage(type) {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem('cherry-paste-type', type);
  },

  /**
   * 在编辑器中自动选中刚刚粘贴的内容
   */
  setSelection() {
    const { /* sticky, xRel, */ ...end } = this.codemirror.getCursor();
    const begin = this.currentCursor;
    this.codemirror.setSelection(begin, end);
  },
  /**
   * 绑定事件
   * 当编辑器选中区域改变、内容改变时，隐藏切换按钮
   * 当编辑器滚动时，实时更新切换按钮的位置
   * @returns null
   */
  bindListener() {
    if (!this.hasBindListener) {
      this.hasBindListener = true;
    } else {
      return true;
    }
    this.codemirror.on('beforeSelectionChange', (codemirror, info) => {
      this.hideBubble();
    });
    this.codemirror.on('beforeChange', (codemirror, info) => {
      this.hideBubble();
    });
    this.codemirror.on('scroll', (codemirror) => {
      this.updatePositionWhenScroll();
    });
  },

  isHidden() {
    return this.bubbleDom.style.display === 'none';
  },

  toggleBubbleDisplay() {
    if (this.isHidden()) {
      this.bubbleDom.style.display = '';
      return;
    }
    this.bubbleDom.style.display = 'none';
    return;
  },

  hideBubble() {
    if (this.noHide) {
      return true;
    }
    if (this.isHidden()) {
      return;
    }
    this.toggleBubbleDisplay();
  },

  updatePositionWhenScroll() {
    if (this.isHidden()) {
      return;
    }
    // FIXME: update position when stick to the bottom
    // const isStickToBottom = !this.bubbleDom.style.top;
    const offset = this.bubbleDom.dataset.scrollTop - this.getScrollTop();
    this.bubbleDom.style.marginTop = `${offset}px`;
  },

  getScrollTop() {
    return this.codemirror.getScrollInfo().top;
  },

  showBubble() {
    const { top } = this.getLastSelectedPosition();
    if (this.isHidden()) {
      this.toggleBubbleDisplay();
      this.bubbleDom.style.marginTop = '0';
      this.bubbleDom.dataset.scrollTop = this.getScrollTop();
    }
    /**
     * @type {HTMLDivElement}
     */
    const codemirrorWrapper = this.codemirror.getWrapperElement();
    const maxTop = codemirrorWrapper.clientHeight - this.bubbleDom.getBoundingClientRect().height - SAFE_AREA_MARGIN;

    if (top > maxTop) {
      this.bubbleDom.style.top = '';
      this.bubbleDom.style.bottom = `${SAFE_AREA_MARGIN}px`;
    } else {
      this.bubbleDom.style.top = `${top}px`;
      this.bubbleDom.style.bottom = '';
    }
  },

  initBubble() {
    if (this.bubbleDom) {
      this.bubbleDom.setAttribute('data-type', 'md');
      return true;
    }
    const dom = createElement('div', 'cherry-bubble cherry-bubble--centered cherry-switch-paste');
    dom.style.display = 'none';

    const switchText = createElement('span', 'cherry-toolbar-button cherry-text-btn', {
      title: this.locale.pastePlain,
    });
    switchText.innerText = 'TEXT';

    const switchMd = createElement('span', 'cherry-toolbar-button cherry-md-btn', {
      title: this.locale.pasteMarkdown,
    });
    switchMd.innerText = 'Markdown';

    const switchBG = createElement('span', 'switch-btn--bg');

    this.bubbleDom = dom;
    this.switchText = switchText;
    this.switchMd = switchMd;
    this.switchBG = switchBG;
    this.bubbleDom.appendChild(switchText);
    this.bubbleDom.appendChild(switchMd);
    this.bubbleDom.appendChild(switchBG);
    this.bubbleDom.setAttribute('data-type', 'md');
    this.codemirror.getWrapperElement().appendChild(this.bubbleDom);
    this.switchMd.addEventListener('click', this.switchMDClick.bind(this));
    this.switchText.addEventListener('click', this.switchTextClick.bind(this));
  },

  switchMDClick(event) {
    this.setTypeToLocalStorage('md');
    if (this.bubbleDom.getAttribute('data-type') === 'md') {
      return;
    }
    this.noHide = true;
    this.bubbleDom.setAttribute('data-type', 'md');
    this.codemirror.doc.replaceSelection(this.md);
    this.setSelection();
    this.showBubble();
    this.noHide = false;
  },
  switchTextClick(event) {
    this.setTypeToLocalStorage('text');
    if (this.bubbleDom.getAttribute('data-type') === 'text') {
      return;
    }
    this.noHide = true;
    this.bubbleDom.setAttribute('data-type', 'text');
    this.codemirror.doc.replaceSelection(this.html);
    this.setSelection();
    this.showBubble();
    this.noHide = false;
  },

  getLastSelectedPosition() {
    const selectedObjs = Array.from(this.codemirror.getWrapperElement().getElementsByClassName('CodeMirror-selected'));
    let width = 0;
    let top = 0;
    if (selectedObjs.length <= 0) {
      this.hideBubble();
      return {};
    }
    // FIXME: remove redundant width calculation
    for (let key = 0; key < selectedObjs.length; key++) {
      const item = selectedObjs[key];
      const position = item.getBoundingClientRect();
      const tmpWidth = position.left + position.width / 2;
      const tmpTop = position.top + position.height;
      if (tmpTop > top && tmpWidth >= width) {
        top = tmpTop;
      }
      if (tmpWidth > width) {
        width = tmpWidth;
      }
    }
    return { top };
  },
};

export default pasteHelper;
