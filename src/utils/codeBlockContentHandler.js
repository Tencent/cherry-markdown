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
import { getCodeBlockRule } from '@/utils/regexp';
import codemirror from 'codemirror';

export default class CodeBlockHandler {
  /**
   * 用来存放所有的数据
   */
  codeBlockEditor = {
    info: {}, // 当前点击的预览区域code的相关信息
    editorDom: {}, // 编辑器容器
  };

  constructor(trigger, target, container, previewerDom, codeMirror) {
    // 触发方式 click / hover
    this.trigger = trigger;
    this.target = target;
    this.previewerDom = previewerDom;
    this.container = container;
    this.codeMirror = codeMirror;
    this.$initReg();
    this.$findCodeInEditor();
  }

  $initReg() {
    this.codeBlockReg = this.codeBlockReg ? this.codeBlockReg : getCodeBlockRule().reg;
  }

  emit(type, event = {}, callback = () => {}) {
    switch (type) {
      case 'remove':
        return this.$remove();
      case 'scroll':
        return this.$refreshPosition();
      case 'previewUpdate':
        return this.$refreshPosition();
      case 'mouseup':
        return this.trigger === 'click' && this.$tryRemoveMe(event, callback);
    }
  }
  $remove() {
    this.codeBlockEditor = { info: {}, codeBlockCodes: [], editorDom: {} };
  }
  /**
   * 刷新定位
   */
  $refreshPosition() {
    if (this.trigger === 'click') {
      this.$setInputOffset();
    }
  }
  $tryRemoveMe(event, callback) {
    const dom = document.querySelector('.cherry-previewer-codeBlock-content-handler__input');
    if (!dom.contains(event.target)) {
      this.$remove();
      callback();
    }
  }
  /**
   * 定位代码块源代码在左侧Editor的位置
   */
  $findCodeInEditor() {
    this.$collectCodeBlockDom();
    this.$collectCodeBlockCode();
    this.$setSelection(this.codeBlockEditor.info.codeBlockIndex, 'code', this.trigger === 'click');
  }
  /**
   * 找到预览区被点击编辑按钮的代码块，并记录这个代码块在预览区域所有代码块中的顺位
   */
  $collectCodeBlockDom() {
    const list = Array.from(this.previewerDom.querySelectorAll('[data-type="codeBlock"]'));
    const { target } = this;
    const codeBlockNode =
      target.className === 'cherry-edit-code-block' ? target.parentNode : target.parentNode.parentNode;
    this.codeBlockEditor.info = {
      codeBlockNode,
      codeBlockIndex: list.indexOf(codeBlockNode),
    };
  }
  $collectCodeBlockCode() {
    const codeBlockCodes = [];
    this.codeMirror.getValue().replace(this.codeBlockReg, function (whole, ...args) {
      const match = whole.replace(/^\n*/, '');
      const offsetBegin = args[args.length - 2] + whole.match(/^\n*/)[0].length;
      if (!match.startsWith('```mermaid')) {
        codeBlockCodes.push({
          code: match,
          offset: offsetBegin,
        });
      }
    });
    this.codeBlockEditor.codeBlockCodes = codeBlockCodes;
  }
  $setSelection(index, type = 'code', select = true) {
    const codeBlockCode = this.codeBlockEditor.codeBlockCodes[index];
    // console.log('选中代码块: ');
    // console.log(codeBlockCode);
    const whole = this.codeMirror.getValue();
    const beginLine = whole.slice(0, codeBlockCode.offset).match(/\n/g)?.length ?? 0;
    const endLine = beginLine + codeBlockCode.code.match(/\n/g).length;
    const endCh = codeBlockCode.code.slice(0, -3).match(/[^\n]+\n*$/)[0].length;
    this.codeBlockEditor.info.selection = [
      { line: beginLine + 1, ch: 0 },
      { line: endLine - 1, ch: endCh },
    ];
    select && this.codeMirror.setSelection(...this.codeBlockEditor.info.selection);
  }
  showBubble() {
    if (this.trigger === 'click') {
      this.$drawEditor();
    }
  }
  $drawEditor() {
    const dom = document.createElement('div');
    dom.className = 'cherry-previewer-codeBlock-content-handler__input';
    const input = document.createElement('textarea');
    input.id = 'codeMirrorEditor';
    dom.appendChild(input);
    const editorInstance = codemirror.fromTextArea(input, {
      mode: '',
      theme: 'default',
      scrollbarStyle: 'null', // 取消滚动动画
      lineNumbers: true, // 显示行号
      autofocus: true, // 自动对焦
      lineWrapping: true, // 自动换行
    });
    const editor = this.codeMirror;
    editorInstance.on('change', () => {
      editor.replaceSelection(editorInstance.getValue(), 'around');
    });
    this.codeBlockEditor.editorDom.inputDiv = dom;
    this.codeBlockEditor.editorDom.inputDom = editorInstance;
    this.$updateEditorPosition();
    this.container.appendChild(this.codeBlockEditor.editorDom.inputDiv);
    this.codeBlockEditor.editorDom.inputDom.focus();
    this.codeBlockEditor.editorDom.inputDom.refresh();
    editorInstance.setValue(this.codeMirror.getSelection());
    editorInstance.setCursor(Number.MAX_VALUE, Number.MAX_VALUE); // 指针设置至CodeBlock末尾
  }

  /**
   * 更新编辑器的位置（尺寸和位置）
   */
  $updateEditorPosition() {
    this.$setInputOffset();
    const spanStyle = getComputedStyle(this.codeBlockEditor.info.codeBlockNode);
    this.codeBlockEditor.editorDom.inputDom.getWrapperElement().style.fontSize = spanStyle.fontSize || '16px';
    this.codeBlockEditor.editorDom.inputDom.getWrapperElement().style.fontFamily = spanStyle.fontFamily;
    this.codeBlockEditor.editorDom.inputDom.getWrapperElement().style.lineHeight = spanStyle.lineHeight;
    this.codeBlockEditor.editorDom.inputDom.getWrapperElement().style.padding = spanStyle.padding;
    this.codeBlockEditor.editorDom.inputDom.getWrapperElement().style.paddingBottom = '0px';
    this.codeBlockEditor.editorDom.inputDom.getWrapperElement().style.zIndex = '1';
  }

  /**
   * 设置codemirror偏移
   */
  $setInputOffset() {
    const codeBlockInfo = this.$getPosition();
    const { inputDiv } = this.codeBlockEditor.editorDom;
    // 设置文本框的偏移及大小
    this.setStyle(inputDiv, 'width', `${codeBlockInfo.width}px`);
    this.setStyle(inputDiv, 'height', `${codeBlockInfo.height}px`);
    this.setStyle(inputDiv, 'top', `${codeBlockInfo.top}px`);
    this.setStyle(inputDiv, 'left', `${codeBlockInfo.left}px`);
  }

  setStyle(element, property, value) {
    const info = element.getBoundingClientRect();
    if (info[property] !== value) {
      element.style[property] = value;
    }
  }

  $getPosition() {
    const node = this.codeBlockEditor.info.codeBlockNode;
    const position = node.getBoundingClientRect();
    const editorPosition = this.previewerDom.parentNode.getBoundingClientRect();
    return {
      top: position.top - editorPosition.top,
      height: position.height,
      width: position.width,
      left: position.left - editorPosition.left,
      maxHeight: editorPosition.height,
    };
  }
}
