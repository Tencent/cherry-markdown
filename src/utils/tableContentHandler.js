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
export default class TableHandler {
  /**
   * 用来存放所有的数据
   */
  tableEditor = {
    info: {}, // 当前点击的预览区域table的相关信息
    tableCodes: [], // 编辑器内所有的表格语法
    editorDom: {}, // 编辑器容器
  };

  constructor(trigger, target, container, previewerDom, codeMirror, tableElement) {
    // 触发方式 click / hover
    this.trigger = trigger;
    this.target = target;
    this.previewerDom = previewerDom;
    this.container = container;
    this.codeMirror = codeMirror;
    this.$initReg();
    this.$findTableInEditor();
    this.tableElement = tableElement;
  }

  emit(type, event = {}, callback = () => {}) {
    switch (type) {
      case 'keyup':
        return this.trigger === 'click' && this.$onInputChange(event);
      case 'remove':
        return this.$remove();
      case 'scroll':
        return this.$refreshPosition();
      case 'previewUpdate':
        return this.$refreshPosition();
      case 'mousedown':
        // return this.trigger !== 'click' && this.$drawDrag();
        return;
      case 'mouseup':
        return this.trigger === 'click' && this.$tryRemoveMe(event, callback);
    }
  }

  $tryRemoveMe(event, callback) {
    if (!/textarea/i.test(event.target.tagName)) {
      this.$remove();
      callback();
    }
  }

  /**
   * 获取目标dom的位置信息和尺寸信息
   */
  $getPosition(node = this.tableEditor.info.tdNode) {
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

  setStyle(element, property, value) {
    const info = element.getBoundingClientRect();
    if (info[property] !== value) {
      element.style[property] = value;
    }
  }

  /**
   * TODO: 这里是分别对文本框、操作符号和选项设置偏移，应该作为一个整体来设置
   */
  $setInputOffset() {
    const tdInfo = this.$getPosition();
    const { inputDiv } = this.tableEditor.editorDom;
    // 设置文本框的偏移及大小
    this.setStyle(inputDiv, 'width', `${tdInfo.width}px`);
    this.setStyle(inputDiv, 'height', `${tdInfo.height}px`);
    this.setStyle(inputDiv, 'top', `${tdInfo.top}px`);
    this.setStyle(inputDiv, 'left', `${tdInfo.left}px`);

    // 根据是否超出边界来显示或者隐藏元素
    const isWithinBounds = tdInfo.top >= 0 && tdInfo.top + tdInfo.height <= tdInfo.maxHeight;
    this.setStyle(inputDiv, 'display', isWithinBounds ? '' : 'none');
  }

  /**
   * 刷新操作符位置
   */
  $setSymbolOffset() {
    const container = this.tableEditor.editorDom.symbolContainer;
    const { tableNode, trNode, isTHead } = this.tableEditor.info;
    const tableInfo = this.$getPosition(tableNode);
    const trInfo = this.$getPosition(trNode);
    const tdInfo = this.$getPosition();
    const previewerRect = this.previewerDom.getBoundingClientRect();
    // 设置容器宽高
    this.setStyle(this.container, 'width', `${tableInfo.width}px`);
    this.setStyle(this.container, 'height', `${tableInfo.height}px`);
    this.setStyle(this.container, 'top', `${tableInfo.top}px`);
    this.setStyle(this.container, 'left', `${tableInfo.left}px`);

    // 判断是否在预览区内
    const isWithinBounds = (symbol) => {
      const symbolRect = symbol.getBoundingClientRect();
      const boundMap = {
        top: [previewerRect.top, previewerRect.top + previewerRect.height - symbolRect.height],
        left: [previewerRect.left, previewerRect.left + previewerRect.width - symbolRect.width],
      };
      return Object.entries(boundMap).every(([key, [min, max]]) => symbolRect[key] >= min && symbolRect[key] <= max);
    };

    // 设置操作符位置与控制显隐
    container.childNodes.forEach((node) => {
      const { index, type, dir } = node.dataset;
      const propDict = {
        Row: ['left', 'right'],
        Col: ['top', 'bottom'],
      };
      const offset = {
        outer: 20,
        radius: 7,
      };
      this.setStyle(node, propDict[dir][index], `-${offset.outer}px`);
      this.setStyle(node, 'display', '');
      const refreshMap = {
        LastRow: () => this.setStyle(node, 'top', `${trInfo.top - tableInfo.top - offset.radius}px`),
        NextRow: () => this.setStyle(node, 'top', `${trInfo.top - tableInfo.top + trInfo.height - offset.radius}px`),
        LastCol: () => this.setStyle(node, 'left', `${tdInfo.left - tableInfo.left - offset.radius}px`),
        NextCol: () => this.setStyle(node, 'left', `${tdInfo.left - tableInfo.left + tdInfo.width - offset.radius}px`),
      };
      const oper = `${type}${dir}`;
      refreshMap[oper]();
      this.setStyle(node, 'display', isWithinBounds(node) ? '' : 'none');
      if (isTHead && oper === 'LastRow') {
        this.setStyle(node, 'display', 'none');
      }
    });
  }

  /**
   * 刷新定位
   */
  $refreshPosition() {
    if (this.trigger === 'click') {
      this.$setInputOffset();
      return;
    }
    this.$setSymbolOffset();
    this.$setDeleteButtonPosition();
  }

  $remove() {
    this.tableEditor = { info: {}, tableCodes: [], editorDom: {} };
  }

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
  }

  /**
   * 获取预览区域被点击的table对象，并记录table的顺位
   */
  $collectTableDom() {
    const list = Array.from(this.previewerDom.querySelectorAll('table.cherry-table'));
    const tableNode = this.$getClosestNode(this.target, 'TABLE');
    if (tableNode === false) {
      return false;
    }
    const columns = Array.from(this.target.parentElement.childNodes).filter((child) => {
      // 计算列数
      return child.tagName.toLowerCase() === 'td';
    }).length;

    this.tableEditor.info = {
      tableNode,
      tdNode: this.target,
      trNode: this.target.parentElement,
      tdIndex: Array.from(this.target.parentElement.childNodes).indexOf(this.target),
      trIndex: Array.from(this.target.parentElement.parentElement.childNodes).indexOf(this.target.parentElement),
      isTHead: this.target.parentElement.parentElement.tagName !== 'TBODY',
      totalTables: list.length,
      tableIndex: list.indexOf(tableNode),
      tableText: tableNode.textContent.replace(/[\s]/g, ''),
      columns,
    };
  }

  /**
   * 选中对应单元格、所在行、所在列的内容
   * @param {Number} index
   * @param {String} type 'td': 当前单元格, 'table': 当前表格
   * @param {Boolean} select 是否选中编辑器中的代码
   */
  $setSelection(index, type = 'table', select = true) {
    const tableCode = this.tableEditor.tableCodes[index];
    const whole = this.codeMirror.getValue();
    const selectTdInfo = this.tableEditor.info;
    const beginLine = whole.slice(0, tableCode.offset).match(/\n/g)?.length ?? 0;
    const { preLine, preCh, plusCh, currentTd } = this.$getTdOffset(
      tableCode.code,
      selectTdInfo.isTHead,
      selectTdInfo.trIndex,
      selectTdInfo.tdIndex,
    );
    if (type === 'table') {
      const endLine = beginLine + tableCode.code.match(/\n/g).length;
      const endCh = tableCode.code.match(/[^\n]+\n*$/)[0].length;
      this.tableEditor.info.selection = [
        { line: beginLine, ch: 0 },
        { line: endLine, ch: endCh },
      ];
    } else {
      this.tableEditor.info.selection = [
        { line: beginLine + preLine, ch: preCh },
        { line: beginLine + preLine, ch: preCh + plusCh },
      ];
    }
    select && this.codeMirror.setSelection(...this.tableEditor.info.selection);
    this.tableEditor.info.code = currentTd;
  }

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
  }

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
    this.$setSelection(this.tableEditor.info.tableIndex, 'td', this.trigger === 'click');
  }

  $initReg() {
    this.tableReg = this.tableReg ? this.tableReg : getTableRule(true);
    this.codeBlockReg = this.codeBlockReg ? this.codeBlockReg : getCodeBlockRule().reg;
  }

  showBubble() {
    if (this.trigger === 'click') {
      this.$drawEditor();
      return;
    }
    this.$drawSymbol();
    this.$drawDelete();
  }

  /**
   * 判断是否处于编辑状态
   * @returns {boolean}
   */
  $isEditing() {
    return this.tableEditor.editing;
  }

  /**
   * 把表格上的input单行文本框和操作符号画出来
   */
  $drawEditor() {
    const dom = document.createElement('div');
    dom.className = 'cherry-previewer-table-content-handler__input';
    const input = document.createElement('textarea');
    dom.appendChild(input);
    this.tableEditor.editorDom.inputDiv = dom;
    this.tableEditor.editorDom.inputDom = input;
    this.$updateEditorPosition();
    this.container.appendChild(this.tableEditor.editorDom.inputDiv);
    this.tableEditor.editorDom.inputDom.value = this.tableEditor.info.code.replace(/<br>/g, '\n');
    this.tableEditor.editorDom.inputDom.focus();
  }

  $onInputChange(e) {
    if (e.target.tagName !== 'TEXTAREA') {
      return;
    }
    this.codeMirror.replaceSelection(e.target.value.replace(/\n/g, '<br>'), 'around');
  }

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
  }

  $getClosestNode(node, targetNodeName) {
    if (node.tagName === targetNodeName) {
      return node;
    }
    if (node.parentNode.tagName === 'BODY') {
      return false;
    }
    return this.$getClosestNode(node.parentNode, targetNodeName);
  }

  /**
   * 绘制操作符号
   */
  $drawSymbol() {
    const types = ['Last', 'Next'];
    const dirs = ['Row', 'Col'];
    const textDict = {
      Row: '行',
      Col: '列',
    };
    const symbols = dirs.map((_, index) => types.map((type) => dirs.map((dir) => [`${index}`, type, dir]))).flat(2);
    const container = document.createElement('ul');
    container.className = 'cherry-previewer-table-hover-handler-container';
    symbols.forEach(([index, type, dir]) => {
      const li = document.createElement('li');
      li.setAttribute('data-index', index);
      li.setAttribute('data-type', type);
      li.setAttribute('data-dir', dir);
      li.className = 'cherry-previewer-table-hover-handler__symbol';
      li.title = `添加${textDict[dir]}`;
      li.innerHTML = '+';
      li.addEventListener('click', (e) => {
        const { target } = e;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const { type, dir } = target.dataset;
        this[`$add${type}${dir}`]();
      });
      container.appendChild(li);
    }, true);
    this.tableEditor.editorDom.symbolContainer = container;
    this.container.appendChild(this.tableEditor.editorDom.symbolContainer);
    this.$setSymbolOffset();
  }

  /**
   * 添加上一行
   */
  $addLastRow() {
    const [{ line }] = this.tableEditor.info.selection;
    const newRow = `${'|'.repeat(this.tableEditor.info.columns)}\n`;
    this.codeMirror.replaceRange(newRow, { line, ch: 0 });
    this.$findTableInEditor();
    this.$setSelection(this.tableEditor.info.tableIndex, 'td');
  }

  /**
   * 添加下一行
   */
  $addNextRow() {
    const [, { line }] = this.tableEditor.info.selection;
    const newRow = `${'|'.repeat(this.tableEditor.info.columns)}\n`;
    this.codeMirror.replaceRange(newRow, { line: line + 1, ch: 0 });
    this.$findTableInEditor();
    this.$setSelection(this.tableEditor.info.tableIndex, 'td');
  }

  /**
   * 添加上一列
   */
  $addLastCol() {
    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
    const selection = this.codeMirror.getSelection();
    const lines = selection.split('\n');
    const newLines = lines.map((line, index) => {
      const cells = line.split('|');
      const replaceItem = 1 === index ? ':-:' : '';
      cells.splice(this.tableEditor.info.tdIndex + 1, 0, replaceItem);
      return cells.join('|');
    });
    const newText = newLines.join('\n');
    this.codeMirror.replaceSelection(newText);
    this.$findTableInEditor();
    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
  }

  /**
   * 添加下一列
   */
  $addNextCol() {
    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
    const selection = this.codeMirror.getSelection();
    const lines = selection.split('\n');
    const newLines = lines.map((line, index) => {
      const cells = line.split('|');
      const replaceItem = 1 === index ? ':-:' : '';
      cells.splice(this.tableEditor.info.tdIndex + 2, 0, replaceItem);
      return cells.join('|');
    });
    const newText = newLines.join('\n');
    this.codeMirror.replaceSelection(newText);
    this.$findTableInEditor();
    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
  }

  /**
   * 添加删除按钮
   */
  $drawDelete() {
    const types = ['top', 'bottom'];
    const buttons = types.map((type) => [type]);
    const container = document.createElement('div');
    container.className = 'cherry-previewer-table-hover-handler-delete-container';
    buttons.forEach(([type]) => {
      const button = document.createElement('button');
      button.setAttribute('data-type', type);
      button.className = 'cherry-previewer-table-hover-handler__delete';
      button.innerHTML = '删除';
      button.title = '删除当前列';
      button.addEventListener('click', (e) => {
        // this.$deleteCurrentColumn();
      });
      container.appendChild(button);
    });
    this.tableEditor.editorDom.deleteContainer = container;
    this.container.appendChild(this.tableEditor.editorDom.deleteContainer);
    this.$setDeleteButtonPosition();
  }

  /**
   * 设置删除按钮的位置
   */
  $setDeleteButtonPosition() {
    const container = this.tableEditor.editorDom.deleteContainer;
    const { tableNode, tdNode } = this.tableEditor.info;
    const tableInfo = this.$getPosition(tableNode);
    const tdInfo = this.$getPosition(tdNode);
    // 设置容器宽高
    this.setStyle(this.container, 'width', `${tableInfo.width}px`);
    this.setStyle(this.container, 'height', `${tableInfo.height}px`);
    this.setStyle(this.container, 'top', `${tableInfo.top}px`);
    this.setStyle(this.container, 'left', `${tableInfo.left}px`);

    // 设置删除按钮位置
    container.childNodes.forEach((node) => {
      const { type } = node.dataset;
      const offset = {
        outer: 20,
      };
      this.setStyle(node, `${type}`, `-${offset.outer}px`);
      this.setStyle(node, 'left', `${tdInfo.left - tableInfo.left + tdInfo.width / 2 - node.offsetWidth / 2}px`);
    });
  }

  /**
   * 拖拽
   */
  $drawDrag() {
    const { isTHead } = this.tableEditor.info;
    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
    if (isTHead) {
      this.$dragCol();
    } else {
      this.$dragLine();
    }
  }

  /**
   * 拖拽列
   */
  $dragCol() {
    const oldTdIndex = this.tableEditor.info.tdIndex;
    const thNode = this.target.parentElement;
    const lines = this.codeMirror.getSelection().split(/\n/);
    const { tdNode } = this.tableEditor.info;
    const that = this;
    tdNode.setAttribute('draggable', true);

    // 离开需要还原边框
    thNode.addEventListener('dragleave', function (event) {
      that.setStyle(event.target, 'border', '1px solid #dfe6ee');
    });
    // 改变将要放到的位置边框的颜色
    thNode.addEventListener('dragover', function (event) {
      event.preventDefault();
      const tdIndex = Array.from(event.target.parentElement.childNodes).indexOf(event.target);
      that.$dragSymbol(event.target, oldTdIndex, tdIndex);
    });
    thNode.addEventListener('drop', function (event) {
      event.preventDefault();
      const tdIndex = Array.from(event.target.parentElement.childNodes).indexOf(event.target);
      const newLines = lines.map((line, index) => {
        const cells = line.split('|').filter((item, i) => item !== '');
        return `|${that.$operateLines(oldTdIndex, tdIndex, cells).join('|')}|`;
      });
      const newText = newLines.join('\n');
      that.codeMirror.replaceSelection(newText);
      that.setStyle(event.target, 'border', '1px solid #dfe6ee');
      that.$findTableInEditor();
      that.$setSelection(that.tableEditor.info.tableIndex, 'table');
    });
  }

  /**
   * 拖拽行
   */
  $dragLine() {
    const { trNode } = this.tableEditor.info;
    trNode.setAttribute('draggable', true);
    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
    const oldTrIndex = this.tableEditor.info.trIndex + 2;
    const tBody = trNode.parentElement;
    const lines = this.codeMirror.getSelection().split(/\n/);
    const that = this;

    tBody.addEventListener('dragleave', function (event) {
      that.setStyle(event.target.parentElement, 'border', '1px solid #dfe6ee');
    });
    tBody.addEventListener('dragover', function (event) {
      // 默认元素不可放置，这里取消默认，将放置目标修改为可放置的
      event.preventDefault();
      const trIndex =
        Array.from(event.target.parentElement.parentElement.childNodes).indexOf(event.target.parentElement) + 2;
      that.$dragSymbol(event.target, oldTrIndex, trIndex);
    });
    tBody.addEventListener('drop', function (event) {
      event.preventDefault();
      const trIndex =
        Array.from(event.target.parentElement.parentElement.childNodes).indexOf(event.target.parentElement) + 2;
      const newText = that.$operateLines(oldTrIndex, trIndex, lines).join('\n');
      that.codeMirror.replaceSelection(newText);

      that.$findTableInEditor();
      that.$setSelection(that.tableEditor.info.tableIndex, 'table');
      that.setStyle(event.target.parentElement, 'border', '1px solid #dfe6ee');
    });
  }

  $dragSymbol(objTarget, oldIndex, index) {
    const { target } = this;
    if (target !== objTarget && oldIndex !== index) {
      if (target.tagName === 'TH') {
        if (oldIndex < index) {
          this.setStyle(objTarget, 'border', `1px solid #dfe6ee`);
          this.setStyle(objTarget, 'border-right', `2px solid #6897bb`);
        } else if (oldIndex > index) {
          this.setStyle(objTarget, 'border', `1px solid #dfe6ee`);
          this.setStyle(objTarget, 'border-left', `2px solid #6897bb`);
        }
      } else if (target.tagName === 'TD') {
        if (oldIndex < index) {
          this.setStyle(objTarget.parentElement, 'border', `1px solid #dfe6ee`);
          this.setStyle(objTarget.parentElement, 'border-bottom', `2px solid #6897bb`);
        } else if (oldIndex > index) {
          this.setStyle(objTarget.parentElement, 'border', `1px solid #dfe6ee`);
          this.setStyle(objTarget.parentElement, 'border-top', `2px solid #6897bb`);
        }
      }
    }
  }

  $operateLines(oldIndex, index, lines) {
    if (oldIndex < index) {
      lines.splice(index + 1, 0, lines[oldIndex]);
      lines.splice(oldIndex, 1);
    } else if (oldIndex > index) {
      const line = lines[oldIndex];
      lines.splice(oldIndex, 1);
      lines.splice(index, 0, line);
    }
    return lines;
  }
}
