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
import Toolbar from './Toolbar';
/**
 * 当光标处于编辑器新行起始位置时出现的浮动工具栏
 */
export default class FloatMenu extends Toolbar {
  // constructor(options) {
  //     super(options);
  // }

  init() {
    this.editor = this.$cherry.editor;
    this.editorDom = this.editor.getEditorDom();
    this.editorDom.querySelector('.CodeMirror-scroll').appendChild(this.options.dom);
    this.initAction();
  }

  initAction() {
    const self = this;
    this.editor.addListener('cursorActivity', (codemirror, evt) => {
      // 当编辑区光标位置改变时触发
      self.cursorActivity(evt, codemirror);
    });

    this.editor.addListener('update', (codemirror, evt) => {
      // 当编辑区内容改变时触发
      self.cursorActivity(evt, codemirror);
    });

    this.editor.addListener('refresh', (codemirror, evt) => {
      // 当编辑器刷新时触发
      setTimeout(() => {
        self.cursorActivity(evt, codemirror);
      }, 0);
    });
  }

  update(evt, codeMirror) {
    const pos = codeMirror.getCursor();
    if (this.isHidden(pos.line, codeMirror)) {
      this.options.dom.style.display = 'none';
      return false;
    }
    this.options.dom.style.display = 'inline-block';
  }

  /**
   * 当光标激活时触发，当光标处于行起始位置时展示float工具栏；反之隐藏
   * @param {Event} evt
   * @param {CodeMirror.Editor} codeMirror
   * @returns
   */
  cursorActivity(evt, codeMirror) {
    const pos = codeMirror.getCursor();
    const codeMirrorLines = document.querySelector('.cherry-editor .CodeMirror-lines');
    if (!codeMirrorLines) {
      return false;
    }
    const computedLinesStyle = getComputedStyle(codeMirrorLines);
    const codeWrapPaddingLeft = parseFloat(computedLinesStyle.paddingLeft);
    const codeWrapPaddingTop = parseFloat(computedLinesStyle.paddingTop);
    // const cursorHandle = codeMirror.getLineHandle(pos.line);
    // const verticalMiddle = cursorHandle.height * 1 / 2;

    if (this.isHidden(pos.line, codeMirror)) {
      this.options.dom.style.display = 'none';
      return false;
    }
    this.options.dom.style.display = 'inline-block';
    this.options.dom.style.left = `${codeWrapPaddingLeft}px`;
    this.options.dom.style.top = `${this.getLineHeight(pos.line, codeMirror) + codeWrapPaddingTop}px`;
  }

  /**
   * 判断是否需要隐藏Float工具栏
   * 有选中内容，或者光标所在行有内容时隐藏float 工具栏
   * @param {number} line
   * @param {CodeMirror.Editor} codeMirror
   * @returns {boolean} 是否需要隐藏float工具栏，true：需要隐藏
   */
  isHidden(line, codeMirror) {
    const selections = codeMirror.getSelections();
    if (selections.length > 1) {
      return true;
    }
    const selection = codeMirror.getSelection();
    if (selection.length > 0) {
      return true;
    }
    if (codeMirror.getLine(line)) {
      return true;
    }
    return false;
  }

  /**
   * 获取对应行的行高度，用来让float 工具栏在该行保持垂直居中
   * @param {number} line
   * @param {CodeMirror.Editor} codeMirror
   * @returns
   */
  getLineHeight(line, codeMirror) {
    let height = 0;
    codeMirror.getDoc().eachLine(0, line, (line) => {
      height += line.height;
    });

    return height;
  }
}
