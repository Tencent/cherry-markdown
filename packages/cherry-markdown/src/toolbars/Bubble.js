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
import Toolbar from './Toolbar';
/**
 * 在编辑区域选中文本时浮现的bubble工具栏
 */
export default class Bubble extends Toolbar {
  /**
   * @type {'flex' | 'block'}
   */
  static displayType = 'flex';
  // constructor(options) {
  //     super(options);
  // }

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
    this.editorDom.querySelector('.cm-editor').appendChild(this.bubbleDom);
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
    // 兼容 CM6Adapter,获取真正的 EditorView
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
    const positionLimit = this.editorDom.querySelector('.cm-lineWrapping').firstChild.getBoundingClientRect();
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
    this.$cherry.$event.on('afterChange', () => {
      // 当编辑区内容变更时自动隐藏bubble工具栏
      this.hideBubble();
    });
    this.options.editor.addListener('refresh', () => {
      // 当编辑区内容刷新时自动隐藏bubble工具栏
      this.hideBubble();
    });
    this.$cherry.$event.on('onScroll', () => {
      // 当编辑区滚动时，需要实时同步bubble工具栏的位置
      this.updatePositionWhenScroll();
    });
    this.$cherry.$event.on('beforeSelectionChange', ({ selection, isUserInteraction }) => {
      const { from, to } = selection;
      setTimeout(() => {
        const editorAdapter = this.options.editor.editor;
        if (!editorAdapter) {
          return;
        }
        // 兼容 CM6Adapter,获取真正的 EditorView
        const view = editorAdapter.view || editorAdapter;
        const editorState = view.state;
        const selections = editorState.selection.ranges.map((range) =>
          editorState.doc.sliceString(range.from, range.to),
        );
        const selectionStr = selections.join('');
        if (selectionStr !== this.lastSelectionsStr && (selectionStr || this.lastSelectionsStr)) {
          this.lastSelections = !this.lastSelections ? [] : this.lastSelections;
          this.$cherry.$event.emit('selectionChange', { selections, lastSelections: this.lastSelections });
          this.lastSelections = selections;
          this.lastSelectionsStr = selectionStr;
        }
      }, 10);
      // 当编辑区选中内容改变时，需要展示/隐藏bubble工具栏，并计算工具栏位置
      // 如果是用户手动选中，则展示bubble工具栏，如果是自动选中，则不需要展示
      if (!isUserInteraction) {
        return true;
      }
      const { anchor, head } = selection;
      let direction = 'asc';
      if (anchor > head) {
        direction = 'desc';
      }
      setTimeout(() => {
        if (Math.abs(from - to) === 0) {
          this.hideBubble();
          return;
        }
        try {
          const editorAdapter = this.options.editor.editor;
          if (!editorAdapter) {
            this.hideBubble();
            return;
          }
          // 兼容 CM6Adapter,获取真正的 EditorView
          const editorView = editorAdapter.view || editorAdapter;

          const fromCoords = editorView.coordsAtPos(from);
          const toCoords = editorView.coordsAtPos(to);

          if (!fromCoords || !toCoords) {
            this.hideBubble();
            return;
          }

          const editorPosition = this.editorDom.getBoundingClientRect();

          let top;
          let width;

          const isMultiLine = fromCoords.top !== toCoords.top;

          if (isMultiLine) {
            if (direction === 'asc') {
              top = toCoords.top - editorPosition.top;
              width = toCoords.left - editorPosition.left + (toCoords.right - toCoords.left) / 2;
            } else {
              top = fromCoords.top - editorPosition.top;
              width = fromCoords.left - editorPosition.left + (fromCoords.right - fromCoords.left) / 2;
            }
          } else {
            top = fromCoords.top - editorPosition.top;
            width = fromCoords.left - editorPosition.left + (toCoords.left - fromCoords.left) / 2;
          }

          this.showBubble(top, width);
        } catch (error) {
          console.warn('Error calculating bubble position:', error);
          this.hideBubble();
        }
      }, 10);
    });
  }
}
