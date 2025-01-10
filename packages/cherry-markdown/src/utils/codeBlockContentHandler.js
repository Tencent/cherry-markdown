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
import { getCodePreviewLangSelectElement } from '@/utils/code-preview-language-setting';
import { copyToClip } from '@/utils/copy';
import 'codemirror/keymap/sublime';

export default class CodeBlockHandler {
  /**
   * 用来存放所有的数据
   */
  codeBlockEditor = {
    info: {}, // 当前点击的预览区域code的相关信息
    editorDom: {}, // 编辑器容器
  };

  constructor(trigger, target, container, previewerDom, codeMirror, parent) {
    // 触发方式 click / hover
    this.trigger = trigger;
    this.target = target;
    this.previewerDom = previewerDom;
    this.container = container;
    this.codeMirror = codeMirror;
    this.$cherry = parent.previewer.$cherry;
    this.parent = parent;
    this.$initReg();
  }

  $initReg() {
    this.codeBlockReg = this.codeBlockReg ? this.codeBlockReg : getCodeBlockRule().reg;
  }

  emit(type, event = {}, callback = () => {}) {
    switch (type) {
      case 'remove':
        return this.$remove();
      case 'scroll':
        return this.$updateContainerPosition();
      case 'previewUpdate':
        this.$updateContainerPosition();
        this.editing && this.$setInputOffset();
        return;
      case 'mouseup':
        return this.$tryRemoveMe(event, callback);
    }
  }
  $remove() {
    this.codeBlockEditor = { info: {}, codeBlockCodes: [], editorDom: {} };
  }
  $tryRemoveMe(event, callback) {
    const dom = this.codeBlockEditor.editorDom.inputDiv;
    if (this.editing && dom && !dom.contains(event.target)) {
      this.editing = false;
      this.$remove();
      callback();
    }
  }
  /**
   * 定位代码块源代码在左侧Editor的位置
   */
  $findCodeInEditor(selectLang = false) {
    this.$collectCodeBlockDom();
    this.$collectCodeBlockCode();
    if (selectLang) {
      this.$setLangSelection(this.codeBlockEditor.info.codeBlockIndex);
    } else {
      this.$setBlockSelection(this.codeBlockEditor.info.codeBlockIndex);
    }
  }
  /**
   * 找到预览区被点击编辑按钮的代码块，并记录这个代码块在预览区域所有代码块中的顺位
   */
  $collectCodeBlockDom() {
    const list = Array.from(this.previewerDom.querySelectorAll('[data-type="codeBlock"]'));
    this.codeBlockEditor.info = {
      codeBlockNode: this.target,
      codeBlockIndex: list.indexOf(this.target),
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
  $setBlockSelection(index) {
    const codeBlockCode = this.codeBlockEditor.codeBlockCodes[index];
    const whole = this.codeMirror.getValue();
    const beginLine = whole.slice(0, codeBlockCode.offset).match(/\n/g)?.length ?? 0;
    const endLine = beginLine + codeBlockCode.code.match(/\n/g).length;
    const endCh = codeBlockCode.code.slice(0, -3).match(/[^\n]+\n*$/)[0].length;
    // 从下往上选中内容，这样当代码块内容很多时，选中整个代码块不会触发滚动条滚动
    this.codeBlockEditor.info.selection = [
      { line: endLine - 1, ch: endCh },
      { line: beginLine + 1, ch: 0 },
    ];
    this.codeMirror.setSelection(...this.codeBlockEditor.info.selection);
  }
  $setLangSelection(index) {
    const codeBlockCode = this.codeBlockEditor.codeBlockCodes[index];
    const whole = this.codeMirror.getValue();
    const beginLine = whole.slice(0, codeBlockCode.offset).match(/\n/g)?.length ?? 0;
    const firstLine = codeBlockCode.code.match(/```\s*[^\n]+/)[0] ?? '```';
    const beginCh = 3;
    const endLine = firstLine.length;
    this.codeBlockEditor.info.selection = [
      { line: beginLine, ch: beginCh },
      { line: beginLine, ch: endLine },
    ];
    this.codeMirror.setSelection(...this.codeBlockEditor.info.selection);
  }
  showBubble(isEnableBubbleAndEditorShow = true) {
    this.$updateContainerPosition();
    if (this.trigger === 'hover') {
      this.$showBtn(isEnableBubbleAndEditorShow);
    }
    if (this.trigger === 'click') {
      this.$showContentEditor();
    }
    /**
     * 把代码块操作相关元素上的鼠标滚动事件同步到预览区
     */
    this.container.addEventListener('wheel', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.previewerDom.scrollTop += e.deltaY / 3; // 降低滚动的速度，懒得加动画了
    });
  }
  /**
   * 展示代码块编辑区的编辑器
   */
  $showContentEditor() {
    this.editing = true;
    this.$findCodeInEditor();
    this.$drawEditor();
  }
  /**
   * 展示代码块区域的按钮
   */
  $showBtn(isEnableBubbleAndEditorShow) {
    const { changeLang, editCode, copyCode, lang, expandCode } = this.target.dataset;
    this.container.innerHTML = '';
    if (changeLang === 'true' && isEnableBubbleAndEditorShow) {
      // 添加删除btn
      this.container.innerHTML = getCodePreviewLangSelectElement(lang);
      const changeLangDom = this.container.querySelector('#code-preview-lang-select');
      this.changeLangDom = changeLangDom;
      this.changeLangDom.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.parent.$removeAllPreviewerBubbles('click');
        this.$changeLang(e.target.value || '');
      });
    }
    // 第一行的按钮的right值
    let oneLineBtnsRight = 10;
    if (editCode === 'true' && isEnableBubbleAndEditorShow) {
      // 添加编辑btn
      const editDom = document.createElement('div');
      editDom.className = 'cherry-edit-code-block';
      editDom.innerHTML = '<i class="ch-icon ch-icon-edit"></i>';
      editDom.style.right = `${oneLineBtnsRight}px`;
      this.container.appendChild(editDom);
      editDom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.$expandCodeBlock(true);
        this.$hideAllBtn();
        this.parent.$removeAllPreviewerBubbles('click');
        this.parent.showCodeBlockPreviewerBubbles('click', this.target);
      });
      this.editDom = editDom;
      oneLineBtnsRight += 8;
    }
    if (copyCode === 'true') {
      // 添加复制btn
      const copyDom = document.createElement('div');
      copyDom.className = 'cherry-copy-code-block';
      copyDom.innerHTML = '<i class="ch-icon ch-icon-copy"></i>';
      copyDom.style.right = `${oneLineBtnsRight}px`;
      this.container.appendChild(copyDom);
      copyDom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.parent.$removeAllPreviewerBubbles('click');
        this.$copyCodeBlock();
      });
      this.copyDom = copyDom;
      oneLineBtnsRight += 8;
    }
    const { customBtns } = this.$cherry.options.engine.syntax.codeBlock;
    if (customBtns) {
      this.codeBlockCustomBtns = [];
      customBtns.forEach((btn) => {
        const dom = document.createElement('div');
        dom.className = 'cherry-code-block-custom-btn';
        dom.innerHTML = btn.html;
        dom.style.right = `${oneLineBtnsRight}px`;
        this.container.appendChild(dom);
        dom.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const codeContent = this.target.querySelector('pre').innerText;
          const language = this.target.dataset.lang ?? '';
          btn.onClick(e, codeContent, language);
        });
        this.codeBlockCustomBtns.push(dom);
        oneLineBtnsRight += 8;
      });
    }
    if (expandCode === 'true') {
      const isExpand = this.target.classList.contains('cherry-code-expand');
      const maskDom = this.target.querySelector('.cherry-mask-code-block');
      // 添加缩起btn
      const unExpandDom = document.createElement('div');
      unExpandDom.className = 'cherry-unExpand-code-block';
      unExpandDom.innerHTML = '<i class="ch-icon ch-icon-unExpand"></i>';
      unExpandDom.style.right = `${oneLineBtnsRight}px`;
      if (!isExpand || !maskDom) {
        unExpandDom.classList.add('hidden');
      }
      this.container.appendChild(unExpandDom);
      unExpandDom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.parent.$removeAllPreviewerBubbles('click');
        this.$expandCodeBlock(false);
      });
      this.unExpandDom = unExpandDom;
      oneLineBtnsRight += 8;
    }
  }
  // 隐藏所有按钮（切换语言、编辑、复制）
  $hideAllBtn() {
    if (this.changeLangDom?.style?.display) {
      this.changeLangDom.style.display = 'none';
    }
    if (this.editDom?.style?.display) {
      this.editDom.style.display = 'none';
    }
    if (this.copyDom?.style?.display) {
      this.copyDom.style.display = 'none';
    }
    if (this.unExpandDom?.style?.display) {
      this.unExpandDom.style.display = 'none';
    }
  }
  /**
   * 切换代码块的语言
   */
  $changeLang(lang) {
    this.$findCodeInEditor(true);
    this.codeMirror.replaceSelection(lang, 'around');
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
      cursorHeight: 0.85, // 光标高度，0.85好看一些
      indentUnit: 4, // 缩进单位为4
      tabSize: 4, // 一个tab转换成的空格数量
      keyMap: 'sublime',
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
    // 去掉下面的逻辑，因为在代码块比较高时，强制让光标定位在最后会让页面出现跳跃的情况
    // editorInstance.setCursor(Number.MAX_VALUE, Number.MAX_VALUE); // 指针设置至CodeBlock末尾
  }

  /**
   * 处理扩展、缩起代码块的操作
   */
  $expandCodeBlock(isExpand = true) {
    if (!this.unExpandDom) {
      return;
    }
    this.target.classList.remove('cherry-code-unExpand');
    this.target.classList.remove('cherry-code-expand');
    this.unExpandDom.classList.remove('hidden');
    if (isExpand) {
      this.target.classList.add('cherry-code-expand');
    } else {
      this.unExpandDom.classList.add('hidden');
      this.target.classList.add('cherry-code-unExpand');
    }
  }
  /**
   * 处理复制代码块的操作
   */
  $copyCodeBlock() {
    const codeContent = this.target.querySelector('pre').innerText;
    const final = this.$cherry.options.callback.onCopyCode({ target: this.target }, codeContent);
    if (final === false) {
      return false;
    }
    const iconNode = this.copyDom.querySelector('i.ch-icon-copy');
    if (iconNode) {
      iconNode.className = iconNode.className.replace('copy', 'ok');
      setTimeout(() => {
        iconNode.className = iconNode.className.replace('ok', 'copy');
      }, 1000);
    }
    copyToClip(final);
  }

  /**
   * 更新代码块复制、编辑等按钮的位置
   */
  $updateContainerPosition() {
    this.codeBlockEditor.info.codeBlockNode = this.target;
    const codeBlockInfo = this.$getPosition();
    this.setStyle(this.container, 'width', `${codeBlockInfo.width}px`);
    this.setStyle(this.container, 'top', `${codeBlockInfo.top}px`);
    this.setStyle(this.container, 'left', `${codeBlockInfo.left}px`);
  }

  /**
   * 更新编辑器的位置（尺寸和位置）
   */
  $updateEditorPosition() {
    this.$setInputOffset();
    const spanStyle = getComputedStyle(this.codeBlockEditor.info.codeBlockNode);
    const editorWrapper = this.codeBlockEditor.editorDom.inputDom.getWrapperElement();
    this.setStyle(editorWrapper, 'fontSize', spanStyle.fontSize || '16px');
    this.setStyle(editorWrapper, 'fontFamily', spanStyle.fontFamily);
    this.setStyle(editorWrapper, 'lineHeight', '1.8em');
    this.setStyle(editorWrapper, 'zIndex', '1');
  }

  /**
   * 设置codemirror偏移
   */
  $setInputOffset() {
    const codeBlockInfo = this.$getPosition();
    const { inputDiv } = this.codeBlockEditor.editorDom;
    // 设置文本框的大小
    this.setStyle(inputDiv, 'width', `${codeBlockInfo.width}px`);
    this.setStyle(inputDiv, 'height', `${codeBlockInfo.height + 10}px`);
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
