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
 * hover 到脚注标号时用来展示悬浮弹窗
 */
export default class FootnoteHoverHandler {
  /**
   * 用来存放所有的数据
   */
  bubbleCard = {
    refNum: 0, // 角标的序号
    refTitle: '', // 角标的标题
    content: '', // 弹窗的内容
  };

  constructor(trigger, target, container, cherry, bubbleConfig) {
    this.trigger = trigger;
    this.target = target;
    this.previewerDom = cherry.previewer.getDomContainer();
    this.container = container;
    this.$cherry = cherry;
    this.bubbleConfig = bubbleConfig;
  }

  emit(type, event = {}, callback = () => {}) {
    switch (type) {
      case 'remove':
        return this.$remove();
      case 'scroll':
        return this.$refreshPosition();
      case 'previewUpdate':
        return this.$refreshPosition();
    }
  }

  /**
   * 刷新定位
   */
  $refreshPosition() {
    if (!this.isShowBubble) {
      return;
    }
    const { top, left, width, height, maxLeft } = this.$getPosition();
    const bubble = this.container;
    const bubbleWidth = bubble.offsetWidth;
    const bubbleHeight = bubble.offsetHeight;
    let bubbleTop = top - bubbleHeight - 5;
    if (bubbleTop < 0) {
      bubbleTop = top + height + 5;
    }
    const bubbleLeft = Math.min(Math.max(0, left + width / 2 - bubbleWidth / 2), maxLeft - bubbleWidth - 5);
    this.setStyle(bubble, 'top', `${bubbleTop}px`);
    this.setStyle(bubble, 'left', `${bubbleLeft}px`);
  }

  showBubble() {
    this.isShowBubble = true;
    this.bubbleCard.refNum = this.target.getAttribute('data-index');
    this.bubbleCard.refTitle = this.target.getAttribute('data-key');
    this.bubbleCard.content =
      this.previewerDom.querySelector(`.one-footnote[data-index="${this.bubbleCard.refNum}"]`).innerHTML ?? '';
    const themeClass = this.previewerDom.className.match(/theme__[^\s]+/)[0] ?? '';
    this.container.className = `${this.container.className.replace(/(^|\s)theme__[^\s]+/g, '')} ${themeClass}`;
    const customContent =
      this.bubbleConfig?.render(
        this.bubbleCard.refNum,
        this.bubbleCard.refTitle,
        this.bubbleCard.content.replace(/<a class="footnote-ref[^>]+?>[^<]+<\/a>/, ''),
      ) ?? '';
    if (customContent) {
      this.container.innerHTML = customContent;
    } else {
      this.container.innerHTML = this.$render();
    }
    this.$refreshPosition();
  }

  $render() {
    const { refNum, refTitle, content } = this.bubbleCard;
    return `
      <div class="cherry-ref-bubble-card__title">${refNum}. ${refTitle}</div>
      <div class="cherry-ref-bubble-card__content">${content}</div>
      <div class="cherry-ref-bubble-card__foot"></div>
    `;
  }

  $tryRemoveMe(event, callback) {
    if (!/textarea/i.test(event.target.tagName)) {
      this.$remove();
      callback();
    }
  }

  /**
   * 获取目标dom的位置信息
   */
  $getPosition() {
    const position = this.target.getBoundingClientRect();
    const editorPosition = this.previewerDom.parentNode.getBoundingClientRect();
    return {
      top: position.top - editorPosition.top,
      left: position.left - editorPosition.left,
      width: position.width,
      height: position.height,
      maxLeft: editorPosition.width + editorPosition.left,
    };
  }

  setStyle(element, property, value) {
    const info = element.getBoundingClientRect();
    if (info[property] !== value) {
      element.style[property] = value;
    }
  }

  $remove() {
    
  }
}
