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
 * 当光标处于编辑器新行起始位置时出现的浮动工具栏
 */
export default class FloatMenu extends Toolbar {
  init() {
    this.editor = this.$cherry.editor;
    this.editorDom = this.editor.getEditorDom();
    // 添加空值检查，确保 .cm-scroller 存在
    const cmScroller = this.editorDom.querySelector('.cm-scroller');
    if (cmScroller) {
      cmScroller.appendChild(this.options.dom);
    } else {
      Logger.warn('FloatMenu: .cm-scroller not found, appending to editorDom instead');
      this.editorDom.appendChild(this.options.dom);
    }
    this.initAction();
    Object.entries(this.shortcutKeyMap).forEach(([key, value]) => {
      this.$cherry.toolbar.shortcutKeyMap[key] = value;
    });
  }

  appendMenusToDom(menus) {
    this.options.dom.appendChild(menus);
  }

  initAction() {
    // 绑定事件处理方法，保存引用以便后续注销
    this.boundHandleSelectionChange = this.handleSelectionChange.bind(this);
    this.boundHandleContentChange = this.handleContentChange.bind(this);
    this.boundHandleBeforeSelectionChange = this.handleBeforeSelectionChange.bind(this);

    // 监听选区变化事件
    this.$cherry.$event.on('selectionChange', this.boundHandleSelectionChange);

    // 监听编辑器内容变化事件
    this.$cherry.$event.on('afterChange', this.boundHandleContentChange);

    // 监听beforeSelectionChange事件（这个事件在Editor.js中已经触发）
    this.$cherry.$event.on('beforeSelectionChange', this.boundHandleBeforeSelectionChange);
  }

  /**
   * 处理选区变化
   * @param {Object} event 选区变化事件
   */
  handleSelectionChange(event) {
    if (this.editor && this.editor.editor) {
      // 创建兼容的 CodeMirror 对象
      const compatCodeMirror = this.createCompatCodeMirror();
      this.cursorActivity(null, compatCodeMirror);
    }
  }

  /**
   * 处理内容变化
   */
  handleContentChange() {
    if (this.editor && this.editor.editor) {
      const compatCodeMirror = this.createCompatCodeMirror();
      this.cursorActivity(null, compatCodeMirror);
    }
  }

  /**
   * 处理beforeSelectionChange事件
   * @param {Object} selection 选区对象
   */
  handleBeforeSelectionChange({ selection }) {
    if (this.editor && this.editor.editor) {
      const compatCodeMirror = this.createCompatCodeMirror();
      this.cursorActivity(null, compatCodeMirror);
    }
  }

  /**
   * 创建兼容的 CodeMirror 对象
   * @returns {Object} 兼容的 CodeMirror 对象
   */
  createCompatCodeMirror() {
    if (!this.editor || !this.editor.editor) {
      return null;
    }

    const editorAdapter = this.editor.editor;
    // 兼容 CM6Adapter,获取真正的 EditorView
    const view = editorAdapter.view || editorAdapter;
    const { state } = view;
    const selection = state.selection.main;
    const line = state.doc.lineAt(selection.head);

    return {
      view,
      state,
      getCursor: () => ({ line: line.number - 1 }),
      getLine: (lineNum) => {
        try {
          return state.doc.line(lineNum + 1).text;
        } catch (e) {
          return '';
        }
      },
      getSelections: () => {
        return state.selection.ranges.map((range) => state.doc.sliceString(range.from, range.to));
      },
      getSelection: () => {
        return state.doc.sliceString(selection.from, selection.to);
      },
      getDoc: () => ({
        eachLine: (start, end, callback) => {
          for (let i = start; i < end && i < state.doc.lines; i++) {
            try {
              const docLine = state.doc.line(i + 1);
              // 尝试使用 coordsAtPos 获取更精确的行高
              let lineHeight = 20; // 默认行高
              try {
                const startCoords = view.coordsAtPos(docLine.from);
                const endCoords = view.coordsAtPos(docLine.to);
                if (startCoords && endCoords) {
                  lineHeight = Math.max(startCoords.bottom - startCoords.top, 20);
                }
              } catch (coordsError) {
                // 如果 coordsAtPos 失败，使用默认行高
                console.warn('Failed to get coords for line height:', coordsError);
              }
              callback({ height: lineHeight });
            } catch (e) {
              break;
            }
          }
        },
      }),
      // 添加对 coordsAtPos 的支持
      coordsAtPos: (pos) => {
        try {
          return view.coordsAtPos(pos);
        } catch (e) {
          return null;
        }
      },
    };
  }

  /**
   * 隐藏浮动菜单
   */
  hideFloatMenu() {
    if (this.options.dom) {
      this.options.dom.style.display = 'none';
    }
  }

  /**
   * 清理事件监听器
   */
  destroy() {
    // 移除 Cherry 事件监听 - 使用绑定的方法引用以确保正确注销
    this.$cherry.$event.off('selectionChange', this.boundHandleSelectionChange);
    this.$cherry.$event.off('afterChange', this.boundHandleContentChange);
    this.$cherry.$event.off('beforeSelectionChange', this.boundHandleBeforeSelectionChange);
  }

  update(evt, codeMirror) {
    const { state } = codeMirror;
    const cursorOffset = state.selection.main.head;
    const line = state.doc.lineAt(cursorOffset).number - 1;
    if (this.isHidden(line, codeMirror)) {
      this.options.dom.style.display = 'none';
      return false;
    }
    this.options.dom.style.display = 'inline-block';
  }

  /**
   * 当光标激活时触发，当光标处于行起始位置时展示float工具栏；反之隐藏
   * @param {Event} evt
   * @param {Object} codeMirror 兼容的 CodeMirror 对象
   * @returns
   */
  cursorActivity(evt, codeMirror) {
    const { state } = codeMirror;
    const cursorOffset = state.selection.main.head;
    const line = state.doc.lineAt(cursorOffset).number - 1;
    // CM6 使用 .cm-content 作为内容区域，限定在当前实例的 editorDom 范围内查找
    const codeMirrorLines = this.editorDom.querySelector('.cm-content');
    if (!codeMirrorLines || !(codeMirrorLines instanceof HTMLElement)) {
      return false;
    }
    const computedLinesStyle = getComputedStyle(codeMirrorLines);
    const parsedPaddingLeft = Number.parseFloat(computedLinesStyle.paddingLeft);
    const codeWrapPaddingLeft = Number.isFinite(parsedPaddingLeft) ? parsedPaddingLeft : 0;

    if (this.isHidden(line, codeMirror)) {
      this.options.dom.style.display = 'none';
      return false;
    }
    this.options.dom.style.display = 'inline-block';
    this.options.dom.style.left = `${codeWrapPaddingLeft}px`;

    // 当配置 codemirror.placeholder 时，测量 placeholder 中文本的范围
    // 将浮动工具栏定位到 placeholder 文本后面
    // CM6 使用 .cm-placeholder 类名
    const placeholderEl = codeMirrorLines.querySelector('.cm-placeholder');
    const topOffset = this.getLineHeight(line, codeMirror);
    if (placeholderEl instanceof HTMLElement && placeholderEl.offsetParent !== null) {
      const linesRect = codeMirrorLines.getBoundingClientRect();
      const textNode = Array.from(placeholderEl.childNodes).find(
        (n) => n.nodeType === Node.TEXT_NODE && n.nodeValue && n.nodeValue.trim() !== '',
      );
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.nodeValue.length);
        const rects = range.getClientRects();
        const lastRect = rects[rects.length - 1];
        const placeholderRightRelative = Math.max(0, lastRect.right - linesRect.left);
        this.options.dom.style.left = `${placeholderRightRelative + codeWrapPaddingLeft - 80}px`;
      }
    }
    this.options.dom.style.top = `${topOffset}px`;
  }

  /**
   * 判断是否需要隐藏Float工具栏
   * 有选中内容，或者光标所在行有内容时隐藏float 工具栏
   * @param {number} line
   * @param {Object} codeMirror 兼容的 CodeMirror 对象
   * @returns {boolean} 是否需要隐藏float工具栏，true：需要隐藏
   */
  isHidden(line, codeMirror) {
    const selections = codeMirror.getSelections();
    if (selections.length > 1) {
      return true;
    }
    const { state } = codeMirror;
    const selection = state.doc.sliceString(state.selection.main.from, state.selection.main.to);
    if (selection.length > 0) {
      return true;
    }
    // line 是 0-indexed，CM6 的 doc.line() 是 1-indexed
    if (line >= 0 && line < state.doc.lines) {
      const lineContent = state.doc.line(line + 1).text;
      if (lineContent) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取对应行的顶部偏移量，用来定位 float 工具栏
   * @param {number} line 0-indexed 行号
   * @param {Object} codeMirror 兼容的 CodeMirror 对象
   * @returns {number}
   */
  getLineHeight(line, codeMirror) {
    // CodeMirror 6 中需要重新实现行高计算
    const editorAdapter = this.editor.editor;
    if (!editorAdapter) {
      return line * 20; // 默认行高
    }

    // 兼容 CM6Adapter,获取真正的 EditorView
    const editorView = editorAdapter.view || editorAdapter;

    try {
      // line 是 0-indexed，doc.line 需要 1-indexed
      const docLine = editorView.state.doc.line(line + 1);

      // 使用 coordsAtPos 获取行的顶部坐标
      const topCoords = editorView.coordsAtPos(docLine.from);

      // 添加空值检查：当编辑器不在视口中时，coordsAtPos 可能返回 null
      if (!topCoords) {
        // 降级方案：使用 lineBlockAt 获取行信息
        try {
          const lineBlock = editorView.lineBlockAt(docLine.from);
          if (lineBlock) {
            return lineBlock.top;
          }
        } catch (blockError) {
          // 静默处理，降级到默认行高
        }
        return line * 20;
      }

      const scrollerRect = editorView.scrollDOM.getBoundingClientRect();
      const { scrollTop } = editorView.scrollDOM;

      // 计算行顶部相对于 .cm-scroller 的位置（因为浮动菜单是挂载在 .cm-scroller 下）
      const lineTop = topCoords.top - scrollerRect.top + scrollTop;

      // 获取行的实际高度
      const lineHeight = topCoords.bottom - topCoords.top;

      // 获取浮动菜单的高度
      const menuHeight = this.options.dom ? this.options.dom.offsetHeight : 26;

      // 返回垂直居中的位置：行顶部 + (行高 - 菜单高度) / 2
      return lineTop + (lineHeight - menuHeight) / 2;
    } catch (error) {
      console.warn('Error getting line height:', error);
    }

    // 降级方案：使用默认行高
    return line * 20;
  }
}
