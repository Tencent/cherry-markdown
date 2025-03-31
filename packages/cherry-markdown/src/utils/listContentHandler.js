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

import { getValueWithoutCode, LIST_CONTENT } from '@/utils/regexp';

export default class ListHandler {
  /** @type{HTMLElement} */
  bubbleContainer = null;

  regList = LIST_CONTENT;

  /** @type{Array.<import('codemirror').Position>} */
  range = [];

  /** @type{import('codemirror').Position} */
  position = { line: 0, ch: 0 };

  input = false;

  isCheckbox = false;

  /**
   * @param {string} trigger 触发方式
   * @param {HTMLParagraphElement} target 目标dom
   * @param {HTMLDivElement} container bubble容器
   * @param {HTMLDivElement} previewerDom 预览器dom
   * @param {import('../Editor').default} editor 编辑器实例
   */
  constructor(trigger, target, container, previewerDom, editor, options = {}) {
    this.trigger = trigger;
    this.target = target;
    this.container = container;
    this.previewerDom = previewerDom;
    this.editor = editor;
    this.insertLineBreak = false; // 是否为插入换行符
    this.handleEditablesInputBinded = this.handleEditablesInput.bind(this); // 保证this指向正确以及能够正确移除事件
    this.handleEditablesUnfocusBinded = this.handleEditablesUnfocus.bind(this);
    this.target.addEventListener('input', this.handleEditablesInputBinded, false);
    this.target.addEventListener('focusout', this.handleEditablesUnfocusBinded, false);
    this.setSelection();
  }

  /**
   * 触发事件
   * @param {string} type 事件类型
   * @param {Event} event 事件对象
   */
  emit(type, event) {
    switch (type) {
      case 'remove':
        return this.remove();
    }
  }

  remove() {
    if (this.bubbleContainer) {
      this.bubbleContainer.style.display = 'none';
      if (this.bubbleContainer.children[0] instanceof HTMLTextAreaElement) {
        this.bubbleContainer.children[0].value = ''; // 清空内容
      }
    }
    this.target.removeAttribute('contenteditable');
    this.target.removeEventListener('input', this.handleEditablesInputBinded, false);
    this.target.removeEventListener('focusout', this.handleEditablesUnfocusBinded, false);
    const cursor = this.editor.editor.getCursor(); // 获取光标位置
    this.editor.editor.setSelection(cursor, cursor); // 取消选中
  }

  setSelection() {
    const allLi = Array.from(this.previewerDom.querySelectorAll('li.cherry-list-item')); // 预览区域内所有的li
    const targetLiIdx = allLi.findIndex((li) => li === this.target.parentElement);
    if (targetLiIdx === -1) {
      return; // 没有找到li
    }
    const contents = getValueWithoutCode(this?.editor.editor.getValue())?.split('\n') ?? [];
    let contentsLiCount = 0; // 编辑器中是列表的数量
    let targetLine = -1; // 行
    let targetCh = -1; // 列
    const targetContent = []; // 当前点击的li的内容
    for (let lineIdx = 0; lineIdx < contents.length; lineIdx++) {
      const lineContent = contents[lineIdx];
      if (!lineContent || lineContent === '/n') {
        if (targetContent.length <= 0) {
          continue;
        } else {
          break;
        }
      }
      // 匹配是否符合列表的正则
      const regRes = this.regList.exec(lineContent);
      if (regRes !== null) {
        if (targetContent.length > 0) {
          break;
        }
        const [, indent, identifier, checkbox, content] = regRes;
        if (contentsLiCount === targetLiIdx && indent !== undefined) {
          targetLine = lineIdx;
          // eslint-disable-next-line prefer-destructuring
          targetContent.push(content); // 这里只取一个没必要解构
          targetCh = lineContent.indexOf(content);
          // 1. 这种需要特殊处理，需要跳过一个空格位，否则层级会错乱
          if (identifier?.endsWith('.')) {
            targetCh += 1;
          }
          // checkbox 编辑的元素内以选中的checkbox开头时需要去掉，否则会被解析
          if (checkbox) {
            this.isCheckbox = true;
          }
        }
        contentsLiCount += 1;
      } else if (targetContent.length > 0) {
        targetContent.push(lineContent);
      }
    }
    const from = { line: targetLine, ch: targetCh };
    const to = {
      line: targetLine + targetContent.length - 1,
      ch: targetCh + targetContent[targetContent.length - 1]?.length,
    };
    this.editor.editor.setSelection(from, to);
    this.range = [from, to];
    this.position = this.editor.editor.getCursor(); // 输入就获取光标位置，防止后面点到编辑器dom的时候光标位置不对
  }

  /**
   * 处理contenteditable元素的输入事件
   * @param {InputEvent} event
   */
  handleEditablesInput(event) {
    this.input = true;
    event.stopPropagation();
    event.preventDefault();
    /** @typedef {'insertText'|'insertFromPaste'|'insertParagraph'|'insertLineBreak'|'deleteContentBackward'|'deleteContentForward'|'deleteByCut'|'deleteContentForward'|'deleteWordBackward'} InputType*/
    if (event.target instanceof HTMLParagraphElement) {
      if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak') {
        this.insertLineBreak = true;
        this.handleInsertLineBreak(event);
      }
    }
  }

  /**
   * 处理contenteditable元素的失去焦点事件
   * @param {FocusEvent} event
   */
  handleEditablesUnfocus(event) {
    event.stopPropagation();
    event.preventDefault();
    if (event.target instanceof HTMLParagraphElement) {
      if (this.input) {
        if (!this.insertLineBreak) {
          const replaceHtml = !this.isCheckbox
            ? event.target.innerHTML
            : event.target.innerHTML.replace(/<span class="ch-icon ch-icon-(square|check)"><\/span>/, '');
          const md = this.editor.$cherry.engine.makeMarkdown(replaceHtml);
          const [from, to] = this.range;
          this.editor.editor.replaceRange(md, from, to);
        }
        this.isCheckbox = false;
        this.input = false;
        this.insertLineBreak = false;
      }
      this.remove();
    }
  }

  /**
   * @param {InputEvent} event
   */
  handleInsertLineBreak(event) {
    /** @type {Array<string>} */
    let splitInnerText = [];
    // @ts-ignore
    if ('innerText' in event.target && typeof event.target.innerText === 'string') {
      // @ts-ignore
      splitInnerText = event.target.innerText.split('\n');
    }
    // 只有第一段是换行，后面的换行都应该认为是另一行
    const [before, ...after] = splitInnerText;
    // 获取当前光标位置
    const cursor = this.editor.editor.getCursor();
    // 获取光标行的内容
    const lineContent = this.editor.editor.getLine(cursor.line);
    const regRes = this.regList.exec(lineContent);
    let insertContent = '\n- ';
    if (regRes !== null) {
      // 存在选中的checkbox则替换为未选中的checkbox，其他的保持原样
      insertContent = `\n${regRes[1]}${regRes[2]?.replace('[x]', '[ ] ')}`;
    }
    insertContent += after?.join('') ?? '';
    // 把当前行内容剪掉
    this.editor.editor.replaceRange(
      before,
      {
        line: cursor.line,
        ch: regRes[2]?.length ?? 0,
      },
      {
        line: cursor.line,
        ch: lineContent.length,
      },
    );
    // 在当前行的末尾插入一个换行符，这会创建一个新行
    this.editor.editor.replaceRange(insertContent, {
      line: cursor.line,
      ch: lineContent.length,
    });
    // 将光标移动到新行
    this.editor.editor.setCursor({ line: cursor.line + 1, ch: insertContent.length + 1 });
    // 将光标聚焦到编辑器上
    this.editor.editor.focus();
    this.remove();
  }
}
