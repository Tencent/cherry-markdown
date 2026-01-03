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

import { getValueWithoutCode, LIST_CONTENT } from '@/utils/regexp';
import { Transaction } from '@codemirror/state';

export default class ListHandler {
  /** @type{HTMLElement} */
  bubbleContainer = null;

  regList = LIST_CONTENT;

  /** @type{Array.<number>} */
  range = [];

  /** @type{number} */
  position = 0;

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
    const cursor = this.editor.editor.view.state.selection.main.head; // 获取光标位置
    this.editor.editor.view.dispatch({
      selection: { anchor: cursor, head: cursor },
      annotations: Transaction.userEvent.of('list.edit'),
    }); // 取消选中
  }

  setSelection() {
    const allLi = Array.from(this.previewerDom.querySelectorAll('li.cherry-list-item')); // 预览区域内所有的li
    const targetLiIdx = allLi.findIndex((li) => li === this.target.parentElement);
    if (targetLiIdx === -1) {
      return; // 没有找到li
    }
    const { doc } = this.editor.editor.view.state;
    const contents = getValueWithoutCode(doc.toString())?.split('\n') ?? [];
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

    // 将行列位置转换为绝对位置
    const fromPos = doc.line(targetLine + 1).from + targetCh;
    const toLineEnd = targetLine + targetContent.length;
    const toPos = doc.line(toLineEnd).from + targetCh + (targetContent[targetContent.length - 1]?.length || 0);

    this.editor.editor.view.dispatch({
      selection: { anchor: fromPos, head: toPos },
      annotations: Transaction.userEvent.of('list.edit'),
    });
    this.range = [fromPos, toPos];
    this.position = this.editor.editor.view.state.selection.main.head; // 输入就获取光标位置，防止后面点到编辑器dom的时候光标位置不对
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
          this.editor.editor.view.dispatch({
            changes: { from, to, insert: md },
            annotations: Transaction.userEvent.of('list.edit'),
          });
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
    // 只有第一段是换行,后面的换行都应该认为是另一行
    const [before, ...after] = splitInnerText;
    // 获取当前光标位置
    const cursor = this.editor.editor.view.state.selection.main.head;
    const { doc } = this.editor.editor.view.state;
    const cursorLine = doc.lineAt(cursor);
    const lineContent = cursorLine.text;
    const regRes = this.regList.exec(lineContent);
    let insertContent = '\n- ';
    if (regRes !== null) {
      // 存在选中的checkbox则替换为未选中的checkbox，其他的保持原样
      insertContent = `\n${regRes[1]}${regRes[2]?.replace('[x]', '[ ] ')}`;
    }
    insertContent += after?.join('') ?? '';

    // 计算替换范围
    const lineStart = cursorLine.from;
    const replaceFrom = lineStart + (regRes[2]?.length ?? 0);
    const replaceTo = lineStart + lineContent.length;

    // 执行替换操作
    this.editor.editor.view.dispatch({
      changes: [
        { from: replaceFrom, to: replaceTo, insert: before },
        { from: replaceTo, insert: insertContent },
      ],
      selection: {
        anchor: replaceTo + insertContent.length,
        head: replaceTo + insertContent.length,
      },
      annotations: Transaction.userEvent.of('list.edit'),
    });

    // 将光标聚焦到编辑器上
    this.editor.editor.view.focus();
    this.remove();
  }
}
