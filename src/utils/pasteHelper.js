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
  showSwitchBtnAfterPasteHtml(currentCursor, editor, html, md) {
    if (html.trim() === md.trim()) {
      return;
    }
    this.init(currentCursor, editor, html, md);
    this.setSelection();
    this.bindListener();
    this.initBubble();
    this.showBubble();
    // 默认粘贴成markdown格式，如果用户上次选择粘贴为纯文本，则需要切换为text
    if (this.getTypeFromLocalStorage() === 'text') {
      this.switchTextClick();
    }
  },

  init(currentCursor, editor, html, md) {
    this.html = html;
    this.md = md;
    this.codemirror = editor;
    this.currentCursor = currentCursor;
  },

  /**
   * 获取缓存中的复制粘贴类型
   */
  getTypeFromLocalStorage() {
    if (!!!localStorage) {
      return 'md';
    }
    return localStorage.getItem('cherry-paste-type') || 'md';
  },

  /**
   * 记忆最近一次用户选择的粘贴类型
   */
  setTypeToLocalStorage(type) {
    if (!!!localStorage) {
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

  hideBubble() {
    if (this.noHide) {
      return true;
    }
    if (this.bubbleDom.style.display !== 'none') {
      this.bubbleDom.style.display = 'none';
    }
  },

  updatePositionWhenScroll() {
    if (this.bubbleDom.style.display === 'block') {
      this.bubbleDom.style.marginTop = `${this.bubbleDom.dataset.scrollTop - this.getScrollTop()}px`;
    }
  },

  getScrollTop() {
    return this.codemirror.getScrollInfo().top;
  },

  showBubble() {
    const { width, top } = this.getLastSelectedPosition();
    if (this.bubbleDom.style.display !== 'block') {
      this.bubbleDom.style.display = 'block';
      this.bubbleDom.style.marginTop = '0';
      this.bubbleDom.dataset.scrollTop = this.getScrollTop();
    }
    const positionLimit = this.codemirror
      .getWrapperElement()
      .querySelector('.CodeMirror-lines')
      .firstChild.getBoundingClientRect();
    const minLeft = positionLimit.left;
    const maxLeft = positionLimit.width + minLeft;

    // top += this.bubbleDom.offsetHeight;
    this.bubbleDom.style.top = `${top}px`;

    let left = width - this.bubbleDom.offsetWidth / 2;
    if (left < minLeft) {
      left = minLeft;
    } else if (left + this.bubbleDom.offsetWidth > maxLeft) {
      left = maxLeft - this.bubbleDom.offsetWidth;
    }
  },

  initBubble() {
    if (this.bubbleDom) {
      this.bubbleDom.setAttribute('data-type', 'md');
      return true;
    }
    const dom = document.createElement('div');
    dom.className = 'cherry-bubble cherry-switch-paste';

    const switchText = document.createElement('span');
    switchText.innerText = 'TEXT';
    switchText.title = '粘贴为纯文本格式';
    switchText.className = 'cherry-toolbar-button cherry-text-btn';

    const switchMd = document.createElement('span');
    switchMd.innerText = 'Markdown';
    switchMd.title = '粘贴为markdown格式';
    switchMd.className = 'cherry-toolbar-button cherry-md-btn';

    const switchBG = document.createElement('span');
    switchBG.className = 'switch-btn--bg';

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
    const selectedObjs = this.codemirror.getWrapperElement().getElementsByClassName('CodeMirror-selected');
    let width = 0;
    let top = 0;
    if (typeof selectedObjs !== 'object' || selectedObjs.length <= 0) {
      this.hideBubble();
      return {};
    }
    for (let key = 0; key < selectedObjs.length; key++) {
      const one = selectedObjs[key];
      const position = one.getBoundingClientRect();
      const tmpWidth = position.left + position.width / 2;
      const tmpTop = position.top + position.height;
      if (tmpTop > top && tmpWidth >= width) {
        top = tmpTop;
      }
      if (tmpWidth > width) {
        width = tmpWidth;
      }
    }
    return { width, top };
  },
};

export default pasteHelper;
