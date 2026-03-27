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
import Logger from '@/Logger';
import Toolbar from './Toolbar';
/**
 * 在编辑区域选中文本时浮现的bubble工具栏
 */
export default class Bubble extends Toolbar {
  /**
   * @type {'flex' | 'block'}
   */
  static displayType = 'flex';

  set visible(visible) {
    const bubbleStyle = window.getComputedStyle(this.bubbleDom);
    if (visible) {
      bubbleStyle.display === 'none' && (this.bubbleDom.style.display = Bubble.displayType);
      // bubbleStyle.visibility !== 'visible' && (this.bubbleBottom.style.visibility = 'visible');
    } else {
      bubbleStyle.display !== 'none' && (this.bubbleDom.style.display = 'none');
      // bubbleStyle.visibility !== 'hidden' && (this.bubbleBottom.style.visibility = 'hidden');
    }
  }

  get visible() {
    const bubbleStyle = window.getComputedStyle(this.bubbleDom);
    return bubbleStyle.display !== 'none' && bubbleStyle.visibility !== 'hidden';
  }

  init() {
    this.options.editor = this.$cherry.editor;
    this.addSelectionChangeListener();
    this.bubbleDom = this.options.dom;
    this.editorDom = this.options.editor.getEditorDom();
    this.initBubbleDom();
    // 添加空值检查，确保 .cm-editor 存在
    const cmEditor = this.editorDom.querySelector('.cm-editor');
    if (cmEditor) {
      cmEditor.appendChild(this.bubbleDom);
    } else {
      Logger.warn('Bubble: .cm-editor not found, appending to editorDom instead');
      this.editorDom.appendChild(this.bubbleDom);
    }
    Object.entries(this.shortcutKeyMap).forEach(([key, value]) => {
      this.$cherry.toolbar.shortcutKeyMap[key] = value;
    });
  }

  appendMenusToDom(menus) {
    this.options.dom.appendChild(menus);
  }

  /**
   * 计算编辑区域的偏移量
   * @returns {number} 编辑区域的滚动区域
   */
  getScrollTop() {
    const editorAdapter = this.options.editor.editor;
    if (!editorAdapter) {
      return 0;
    }
    const view = editorAdapter.view || editorAdapter;
    return view.scrollDOM ? view.scrollDOM.scrollTop : 0;
  }

  /**
   * 当编辑区域滚动的时候自动隐藏bubble工具栏和子工具栏
   */
  updatePositionWhenScroll() {
    if (this.bubbleDom.style.display === Bubble.displayType) {
      this.bubbleDom.style.marginTop = `${parseFloat(this.bubbleDom.dataset.scrollTop) - this.getScrollTop()}px`;
    }
  }

  /**
   * 根据高度计算bubble工具栏出现的位置的高度
   * 根据宽度计算bubble工具栏出现的位置的left值，以及bubble工具栏三角箭头的left值
   * @param {number} top 高度
   * @param {number} width 选中文本内容的宽度
   */
  showBubble(top, width) {
    if (!this.visible) {
      this.visible = true;
      this.bubbleDom.style.marginTop = '0';
      this.bubbleDom.dataset.scrollTop = String(this.getScrollTop());
    }
    // 获取编辑器内容区域的边界，添加空值检查
    const lineWrapping = this.editorDom.querySelector('.cm-lineWrapping');
    const contentElement = lineWrapping?.firstChild;
    if (!contentElement) {
      // 如果编辑器 DOM 结构不符合预期，使用编辑器本身作为边界
      Logger.warn('Bubble: .cm-lineWrapping or its firstChild not found');
      return;
    }
    const positionLimit = contentElement.getBoundingClientRect();
    const editorPosition = this.editorDom.getBoundingClientRect();
    const minLeft = positionLimit.left - editorPosition.left;
    const maxLeft = positionLimit.width + minLeft;
    const minTop = this.bubbleDom.offsetHeight * 2;
    let $top = top;
    if ($top < minTop) {
      // 如果高度小于编辑器的顶部，则让bubble工具栏出现在选中文本的下放
      $top += this.bubbleDom.offsetHeight - this.bubbleTop.getBoundingClientRect().height;
      this.bubbleTop.style.display = 'block';
      this.bubbleBottom.style.display = 'none';
    } else {
      // 反之出现在选中文本内容的上方
      $top -= this.bubbleDom.offsetHeight + this.bubbleBottom.getBoundingClientRect().height;
      this.bubbleTop.style.display = 'none';
      this.bubbleBottom.style.display = 'block';
    }
    this.bubbleDom.style.top = `${$top}px`;
    let left = width - this.bubbleDom.offsetWidth / 2;
    if (left < minLeft) {
      // 如果位置超过了编辑器的最左边，则控制bubble工具栏不超出编辑器最左边
      // 同时bubble工具栏上的箭头尽量指向选中文本内容的中间位置
      left = minLeft;
      this.$setBubbleCursorPosition(`${width - minLeft}px`);
    } else if (left + this.bubbleDom.offsetWidth > maxLeft) {
      // 如果位置超过了编辑器的最右边，则控制bubble工具栏不超出编辑器最右边
      // 同时bubble工具栏上的箭头尽量指向选中文本内容的中间位置
      left = maxLeft - this.bubbleDom.offsetWidth;
      this.$setBubbleCursorPosition(`${width - left}px`);
    } else {
      // 让bubble工具栏的箭头处于工具栏的中间位置
      this.$setBubbleCursorPosition('50%');
    }
    // 安全边距 20px
    this.bubbleDom.style.left = `${Math.max(20, left)}px`;
  }

  hideBubble() {
    this.visible = false;
  }

  /**
   * 控制bubble工具栏的箭头的位置
   * @param {string} left 左偏移量
   */
  $setBubbleCursorPosition(left = '50%') {
    if (left === '50%') {
      this.bubbleTop.style.left = '50%';
      this.bubbleBottom.style.left = '50%';
    } else {
      const $left = parseFloat(left) < 10 ? '10px' : left;
      this.bubbleTop.style.left = $left;
      this.bubbleBottom.style.left = $left;
    }
  }

  initBubbleDom() {
    const top = document.createElement('div');
    top.className = 'cherry-bubble-top';
    const bottom = document.createElement('div');
    bottom.className = 'cherry-bubble-bottom';
    this.bubbleTop = top;
    this.bubbleBottom = bottom;
    this.bubbleDom.appendChild(top);
    this.bubbleDom.appendChild(bottom);
    // 默认不可见
    this.visible = false;
  }

  getBubbleDom() {
    return this.bubbleDom;
  }

  addSelectionChangeListener() {
    // 绑定事件处理方法，保存引用以便后续注销
    this.boundHandleAfterChange = () => {
      // 当编辑区内容变更时自动隐藏bubble工具栏
      this.hideBubble();
    };
    this.boundHandleLayoutChange = () => {
      // 当编辑区布局刷新时自动隐藏bubble工具栏
      this.hideBubble();
    };
    this.boundHandleScroll = () => {
      // 当编辑区滚动时，需要实时同步bubble工具栏的位置
      this.updatePositionWhenScroll();
    };
    this.boundHandleBeforeSelectionChange = ({ selection, isUserInteraction }) => {
      const { from, to } = selection;
      if (Math.abs(from - to) === 0) {
        this.hideBubble();
        return;
      }
      const editorView = this.options.editor.editor.view;
      const { doc } = editorView.state;

      const beginLine = doc.lineAt(from).number;
      const endLine = doc.lineAt(to).number;
      const sameLine = beginLine === endLine;
      const fromLineLastChar = doc.line(beginLine).from + doc.line(beginLine).length;

      const fromCoords = editorView.coordsAtPos(from);
      const fromLineLastCharCoords = editorView.coordsAtPos(fromLineLastChar);
      const toCoords = editorView.coordsAtPos(to);

      const targetToCoords = sameLine ? toCoords : fromLineLastCharCoords;
      const editorPosition = this.editorDom.getBoundingClientRect();
      const top = fromCoords.top - editorPosition.top;
      const width = fromCoords.left - editorPosition.left + (targetToCoords.left - fromCoords.left) / 2;
      this.showBubble(top, width);
    };

    this.$cherry.$event.on('afterChange', this.boundHandleAfterChange);
    // CM6Adapter.refresh() 不会触发 refresh 事件，改为监听 layoutChange 事件
    this.$cherry.$event.on('layoutChange', this.boundHandleLayoutChange);
    this.$cherry.$event.on('onScroll', this.boundHandleScroll);
    this.$cherry.$event.on('beforeSelectionChange', this.boundHandleBeforeSelectionChange);
  }

  /**
   * 销毁 Bubble 实例，清理事件监听器
   * 必须调用此方法以避免内存泄漏
   */
  destroy() {
    // 移除 Cherry 事件监听 - 使用绑定的方法引用以确保正确注销
    if (this.$cherry && this.$cherry.$event) {
      this.$cherry.$event.off('afterChange', this.boundHandleAfterChange);
      this.$cherry.$event.off('layoutChange', this.boundHandleLayoutChange);
      this.$cherry.$event.off('onScroll', this.boundHandleScroll);
      this.$cherry.$event.off('beforeSelectionChange', this.boundHandleBeforeSelectionChange);
    }
    // 清理 DOM 引用
    this.bubbleDom = null;
    this.editorDom = null;
    this.bubbleTop = null;
    this.bubbleBottom = null;
  }
}
