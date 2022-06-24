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
import { getTableRule, getCodeBlockRule } from '@/utils/regexp';
/**
 * 用于在表格上出现编辑区，并提供拖拽行列的功能
 */
const tableContentHander = {
  /**
   * 用来存放所有的数据
   */
  tableEditor: {
    info: {}, // 当前点击的预览区域table的相关信息
    tableCodes: [], // 编辑器内所有的表格语法
    editorDom: {}, // 编辑器容器
  },

  emit(type, event = {}, callback = () => {}) {
    switch (type) {
      case 'keyup':
        return this.$onInputChange(event);
      case 'remove':
        return this.$remove();
      case 'scroll':
        return this.$setInputOffset();
      case 'previewUpdate':
        return this.$setInputOffset();
      case 'mouseup':
        return this.$tryRemoveMe(event, callback);
    }
  },
  $tryRemoveMe(event, callback) {
    if (!/textarea/i.test(event.target.tagName)) {
      this.$remove();
      callback();
    }
  },
  /**
   * 获取目标dom的位置信息和尺寸信息
   */
  $getTdPosition() {
    const position = this.tableEditor.info.tdNode.getBoundingClientRect();
    const editorPosition = this.previewerDom.parentNode.getBoundingClientRect();
    return {
      top: position.top - editorPosition.top,
      height: position.height,
      width: position.width,
      left: position.left - editorPosition.left,
      maxHeight: editorPosition.height,
    };
  },
  $setInputOffset() {
    const tdInfo = this.$getTdPosition();
    const { inputDiv } = this.tableEditor.editorDom;
    const inputDivInfo = inputDiv.getBoundingClientRect();

    if (inputDivInfo.width !== tdInfo.width) {
      inputDiv.style.width = `${tdInfo.width}px`;
    }
    if (inputDivInfo.height !== tdInfo.height) {
      inputDiv.style.height = `${tdInfo.height}px`;
    }
    if (inputDivInfo.top !== tdInfo.top) {
      inputDiv.style.top = `${tdInfo.top}px`;
    }
    if (inputDivInfo.left !== tdInfo.left) {
      inputDiv.style.left = `${tdInfo.left}px`;
    }

    // 向上滚或向下滚动动超出边界消失
    if (tdInfo.top < 0 || tdInfo.top + tdInfo.height > tdInfo.maxHeight) {
      inputDiv.style.display = 'none';
    } else {
      inputDiv.style.display = '';
    }
  },
  $remove() {
    this.tableEditor = { info: {}, tableCodes: [], editorDom: {} };
  },
  /**
   * 收集编辑器中的表格语法，并记录表格语法的开始的offset
   */
  $collectTableCode() {
    const tableCodes = [];
    this.codeMirror
      .getValue()
      .replace(this.codeBlockReg, (whole, ...args) => {
        // 先把代码块里的表格语法关键字干掉
        return whole.replace(/\|/g, '.');
      })
      .replace(this.tableReg, function (whole, ...args) {
        const match = whole.replace(/^\n*/, '');
        const offsetBegin = args[args.length - 2] + whole.match(/^\n*/)[0].length;
        tableCodes.push({
          code: match,
          offset: offsetBegin,
        });
      });
    this.tableEditor.tableCodes = tableCodes;
  },

  /**
   * 获取预览区域被点击的table对象，并记录table的顺位
   */
  $collectTableDom() {
    const list = Array.from(this.previewerDom.querySelectorAll('table.cherry-table'));
    const tableNode = this.$getClosestNode(this.td, 'TABLE');
    if (tableNode === false) {
      return false;
    }
    this.tableEditor.info = {
      tableNode,
      tdNode: this.td,
      trNode: this.td.parentElement,
      tdIndex: Array.from(this.td.parentElement.childNodes).indexOf(this.td),
      trIndex: Array.from(this.td.parentElement.parentElement.childNodes).indexOf(this.td.parentElement),
      isTHead: this.td.parentElement.parentElement.tagName !== 'TBODY',
      totalTables: list.length,
      tableIndex: list.indexOf(tableNode),
      tableText: tableNode.textContent.replace(/[\s]/g, ''),
    };
  },

  /**
   * 选中对应单元格、所在行、所在列的内容
   * @param {Number} index
   * @param {String} type 'td': 当前单元格, 'table': 当前表格
   */
  $setSelection(index, type = 'table') {
    const tableCode = this.tableEditor.tableCodes[index];
    const whole = this.codeMirror.getValue();
    const selectTdInfo = this.tableEditor.info;
    const beginLine = whole.slice(0, tableCode.offset).match(/\n/g).length;
    const { preLine, preCh, plusCh, currentTd } = this.$getTdOffset(
      tableCode.code,
      selectTdInfo.isTHead,
      selectTdInfo.trIndex,
      selectTdInfo.tdIndex,
    );
    if (type === 'table') {
      const endLine = beginLine + tableCode.code.match(/\n/g).length;
      const endCh = tableCode.code.match(/[^\n]+\n*$/)[0].length;
      this.codeMirror.setSelection({ line: beginLine, ch: 0 }, { line: endLine, ch: endCh });
    } else {
      this.codeMirror.setSelection(
        { line: beginLine + preLine, ch: preCh },
        { line: beginLine + preLine, ch: preCh + plusCh },
      );
    }
    this.tableEditor.info.code = currentTd;
  },

  /**
   * 获取对应单元格的偏移量
   * @param {String} tableCode
   * @param {Boolean} isTHead
   * @param {Number} trIndex
   * @param {Number} tdIndex
   */
  $getTdOffset(tableCode, isTHead, trIndex, tdIndex) {
    const codes = tableCode.split(/\n/);
    const targetTr = isTHead ? 0 : trIndex + 2;
    const tds = codes[targetTr].split(/\|/);
    const needPlus1 = /^\s*$/.test(tds[0]);
    const targetTd = needPlus1 ? tdIndex + 1 : tdIndex;
    const current = tds[targetTd];
    const pre = [];
    for (let i = 0; i < targetTd; i++) {
      pre.push(tds[i]);
    }
    return {
      preLine: targetTr,
      preCh: needPlus1 ? pre.join('|').length + 1 : pre.join('|').length,
      plusCh: current.length,
      currentTd: current,
    };
  },

  /**
   * 在编辑器里找到对应的表格源码，并让编辑器选中
   */
  $findTableInEditor() {
    this.$collectTableDom();
    this.$collectTableCode();
    // 暂时不考虑代码块中包含表格、人为输入表格html语法、tapd特色表格语法的情况
    // 也就是说，出现上述情况时，表格的所见即所得编辑功能失效
    if (this.tableEditor.info.totalTables !== this.tableEditor.tableCodes.length) {
      return false;
    }
    this.$setSelection(this.tableEditor.info.tableIndex, 'td');
  },

  $initReg() {
    this.tableReg = this.tableReg ? this.tableReg : getTableRule(true);
    this.codeBlockReg = this.codeBlockReg ? this.codeBlockReg : getCodeBlockRule().reg;
  },

  showBubble(currentElement, container, previewerDom, codeMirror) {
    // if (this.$isEditing()) {
    //   return;
    // }
    this.td = currentElement;
    this.previewerDom = previewerDom;
    this.container = container;
    this.codeMirror = codeMirror;
    this.$initReg();
    this.$findTableInEditor();
    this.$drawEditor();
  },

  /**
   * 判断是否处于编辑状态
   * @returns {boolean}
   */
  $isEditing() {
    return this.tableEditor.editing;
  },

  /**
   * 把表格上的input单行文本框画出来
   */
  $drawEditor() {
    const dom = document.createElement('div');
    dom.className = 'cherry-previewer-table-content-hander__input';
    const input = document.createElement('textarea');
    dom.append(input);
    this.tableEditor.editorDom.inputDiv = dom;
    this.tableEditor.editorDom.inputDom = input;
    this.$updateEditorPosition();
    this.container.append(this.tableEditor.editorDom.inputDiv);
    this.tableEditor.editorDom.inputDom.value = this.tableEditor.info.code.replace(/<br>/g, '\n');
    this.tableEditor.editorDom.inputDom.focus();
  },

  $onInputChange(e) {
    this.codeMirror.replaceSelection(e.target.value.replace(/\n/g, '<br>'), 'around');
  },

  /**
   * 更新编辑器的位置（尺寸和位置）
   */
  $updateEditorPosition() {
    this.$setInputOffset();
    const tdStyle = getComputedStyle(this.tableEditor.info.tdNode);
    this.tableEditor.editorDom.inputDom.style.textAlign = tdStyle.textAlign || 'left';
    this.tableEditor.editorDom.inputDom.style.fontSize = tdStyle.fontSize || '16px';
    this.tableEditor.editorDom.inputDom.style.fontFamily = tdStyle.fontFamily;
    this.tableEditor.editorDom.inputDom.style.lineHeight = tdStyle.lineHeight;
    this.tableEditor.editorDom.inputDom.style.padding = tdStyle.padding;
    // 左对齐的时候，paddingRight设置成0，反之paddingLeft设置成0
    if (/left/.test(tdStyle.textAlign)) {
      this.tableEditor.editorDom.inputDom.style.paddingRight = '0px';
    }
    if (/right/.test(tdStyle.textAlign)) {
      this.tableEditor.editorDom.inputDom.style.paddingLeft = '0px';
    }
    if (/center/.test(tdStyle.textAlign)) {
      this.tableEditor.editorDom.inputDom.style.paddingLeft = '0px';
      this.tableEditor.editorDom.inputDom.style.paddingRight = '0px';
    }
    this.tableEditor.editorDom.inputDom.style.paddingBottom = '0px';
  },
  $getClosestNode(node, targetNodeName) {
    if (node.tagName === targetNodeName) {
      return node;
    }
    if (node.parentNode.tagName === 'BODY') {
      return false;
    }
    return this.$getClosestNode(node.parentNode, targetNodeName);
  },
};

export default tableContentHander;
