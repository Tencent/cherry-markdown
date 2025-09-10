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
import { getTableRule, getCodeBlockRule } from '@/utils/regexp';
/**
 * 用于在表格上出现编辑区，并提供拖拽行列的功能
 */
export default class TableHandler {
  /**
   * 用来存放所有的数据
   */
  tableEditor;

  constructor(trigger, target, container, previewerDom, codeMirror, tableElement, cherry) {
    this.tableEditor = {
      info: {}, // 当前点击的预览区域table的相关信息
      tableCodes: [], // 编辑器内所有的表格语法
      footnoteTableCodes: [], // 编辑器内所有的脚注表格语法
      editorDom: {}, // 编辑器容器
    };
    // 触发方式 click / hover
    this.trigger = trigger;
    this.target = target;
    this.previewerDom = previewerDom;
    this.container = container;
    this.codeMirror = codeMirror;
    this.$initReg();
    this.$findTableInEditor();
    this.tableElement = tableElement;
    this.$cherry = cherry;
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
    this.$setMenuButtonPosition();
  }

  $remove() {
    this.tableEditor = { info: {}, tableCodes: [], editorDom: {}, footnoteTableCodes: [] };
  }

  /**
   * 收集编辑器中的表格语法，并记录表格语法的开始的offset
   * 支持markdown表格语法和HTML table标签
   */
  $collectTableCode() {
    const tableCodes = [];
    const footnoteTableCodes = [];
    const editorValue = this.codeMirror.getValue();

    // 首先收集所有脚注的位置信息
    const footnoteRanges = [];
    const footnoteReg = /(^|\n)[ \t]*\[\^([^\]]+?)\]:[ \t]*([\s\S]+?)(?=\s*$|\n\n)/g;
    let footnoteMatch;
    while ((footnoteMatch = footnoteReg.exec(editorValue)) !== null) {
      const start = footnoteMatch.index;
      const end = footnoteMatch.index + footnoteMatch[0].length;
      footnoteRanges.push({
        start,
        end,
        id: footnoteMatch[2],
        content: footnoteMatch[3],
        fullMatch: footnoteMatch[0], // 完整匹配
      });
    }

    // 判断给定位置是否在脚注中
    const isInFootnote = (offset) => {
      return footnoteRanges.some((range) => offset >= range.start && offset < range.end);
    };

    // 处理markdown表格语法
    editorValue
      .replace(this.codeBlockReg, (whole, ...args) => {
        // 先把代码块里的表格语法关键字干掉
        return whole.replace(/\|/g, '.');
      })
      .replace(this.tableReg, function (whole, ...args) {
        const match = whole.replace(/^\n*/, '');
        const offsetBegin = args[args.length - 2] + whole.match(/^\n*/)[0].length;
        const info = {
          code: match,
          offset: offsetBegin,
          type: 'markdown',
        };
        if (isInFootnote(offsetBegin)) {
          footnoteTableCodes.push(info);
        } else {
          tableCodes.push(info);
        }
        return whole.replace(/\|/g, '.');
      });
    // 增强功能：处理引用语法中的表格
    // 匹配引用块中的表格语法，支持多层嵌套引用
    const blockquoteTableReg =
      /(^|\n)(>\s*)+\|[^\n]+\|[^\n]*\n(>\s*)+\|\s*:?[-]+:?[^\n]*\n((>\s*)+\|[^\n]+\|[^\n]*\n?)*/gm;
    let blockquoteMatch;
    while ((blockquoteMatch = blockquoteTableReg.exec(editorValue)) !== null) {
      const match = blockquoteMatch[0];
      const offsetBegin = blockquoteMatch.index + (blockquoteMatch[1] ? blockquoteMatch[1].length : 0);
      tableCodes.push({
        code: match,
        offset: offsetBegin,
        type: 'blockquote-markdown',
      });
    }
    // 处理HTML table标签
    this.$collectHtmlTableCode(editorValue, tableCodes, footnoteTableCodes, isInFootnote);
    // 按offset排序，确保顺序正确
    tableCodes.sort((a, b) => a.offset - b.offset);
    footnoteTableCodes.sort((a, b) => a.offset - b.offset);
    this.tableEditor.tableCodes = tableCodes;
    this.tableEditor.footnoteTableCodes = footnoteTableCodes;
  }

  /**
   * 获取预览区域被点击的table对象，并记录table的顺位
   * 支持cherry-table类的表格和原生HTML table标签
   */
  $collectTableDom() {
    const tableNode = this.$getClosestNode(this.target, 'TABLE');
    if (tableNode === false) {
      return false;
    }
    const footnoteTables = Array.from(this.previewerDom.querySelectorAll('div.one-footnote table'));
    const isInFootnote = footnoteTables.includes(tableNode);
    let allTables = [];
    // 获取所有表格，包括cherry-table和原生HTML table
    if (!isInFootnote) {
      // 排除掉脚注中的表格
      allTables = Array.from(this.previewerDom.querySelectorAll('table')).filter(
        (table) => !footnoteTables.includes(table),
      );
    } else {
      /**
       * **TODO**:
       * 这里认为脚注dom的顺序和编辑器中的顺序是一致的，但实际并不一定
       * 这里需要找到一个更好的方式来判断表格在编辑器中的顺序
       */
      allTables = footnoteTables;
    }

    const rowCells = Array.from(this.target.parentElement.childNodes).filter((child) => {
      // 计算列数
      return child.tagName && (child.tagName.toLowerCase() === 'td' || child.tagName.toLowerCase() === 'th');
    });

    const columns = rowCells.length;
    const tdIndex = rowCells.indexOf(this.target);

    // 判断表格类型
    const isHtmlTable = !tableNode.classList.contains('cherry-table');
    this.tableEditor.info = {
      tableNode,
      tdNode: this.target,
      trNode: this.target.parentElement,
      tdIndex,
      trIndex: Array.from(this.target.parentElement.parentElement.childNodes).indexOf(this.target.parentElement),
      isTHead: this.target.parentElement.parentElement.tagName !== 'TBODY',
      totalTables: allTables.length,
      tableIndex: allTables.indexOf(tableNode),
      tableText: tableNode.textContent.replace(/[\s]/g, ''),
      columns,
      isHtmlTable, // 标记是否为HTML表格
      isInFootnote,
    };
  }

  /**
   * 选中对应单元格、所在行、所在列的内容
   * @param {Number} index
   * @param {String} type 'td': 当前单元格, 'table': 当前表格
   * @param {Boolean} select 是否选中编辑器中的代码
   */
  $setSelection(index, type = 'table', select = true) {
    const selectTdInfo = this.tableEditor.info;
    const { isInFootnote } = selectTdInfo;
    const tableCode = isInFootnote ? this.tableEditor.footnoteTableCodes[index] : this.tableEditor.tableCodes[index];
    const whole = this.codeMirror.getValue();
    const beginLine = whole.slice(0, tableCode.offset).match(/\n/g)?.length ?? 0;
    // 根据表格类型选择不同的处理方式
    let offsetInfo;
    if (tableCode.type === 'html') {
      offsetInfo = this.$getHtmlTdOffset(tableCode.code, selectTdInfo.trIndex, selectTdInfo.tdIndex);
    } else if (tableCode.type === 'blockquote-html') {
      // 处理引用语法中的HTML表格
      offsetInfo = this.$getBlockquoteHtmlTdOffset(tableCode.code, selectTdInfo.trIndex, selectTdInfo.tdIndex);
    } else if (tableCode.type === 'blockquote-markdown') {
      // 处理引用语法中的表格
      offsetInfo = this.$getBlockquoteTdOffset(
        tableCode.code,
        selectTdInfo.isTHead,
        selectTdInfo.trIndex,
        selectTdInfo.tdIndex,
      );
    } else {
      offsetInfo = this.$getTdOffset(tableCode.code, selectTdInfo.isTHead, selectTdInfo.trIndex, selectTdInfo.tdIndex);
    }
    const { preLine, preCh, plusCh, currentTd } = offsetInfo;
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
   * @param {Boolean} isInBlock
   */
  $getTdOffset(tableCode, isTHead, trIndex, tdIndex, isInBlock = false) {
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
    // 计算单元格内容的实际位置（去除前后空格）
    const trimmedContent = current.trim();
    const leadingSpaces = current.match(/^\s*/)[0].length;
    const basePreCh = needPlus1 ? pre.join('|').length + 1 : pre.join('|').length;
    const actualPreCh = basePreCh + leadingSpaces;
    return {
      preLine: targetTr,
      preCh: actualPreCh,
      plusCh: trimmedContent.length,
      currentTd: trimmedContent,
    };
  }

  /**
   * 获取引用语法中表格对应单元格的偏移量
   * @param {String} tableCode
   * @param {Boolean} isTHead
   * @param {Number} trIndex
   * @param {Number} tdIndex
   */
  $getBlockquoteTdOffset(tableCode, isTHead, trIndex, tdIndex) {
    const codes = tableCode.split(/\n/);
    const targetTr = isTHead ? 0 : trIndex + 2;
    if (targetTr >= codes.length) {
      console.error('Debug: targetTr out of bounds:', targetTr, 'codes.length:', codes.length);
      return { preLine: 0, preCh: 0, plusCh: 0, currentTd: '' };
    }
    // 获取下一行的内容和引用符号
    const nextLineIndex = targetTr + 1;
    let originalLine;
    let cleanLine;
    let tds;
    let quoteMatch;
    if (nextLineIndex < codes.length) {
      // 使用下一行的数据
      originalLine = codes[nextLineIndex];
      quoteMatch = originalLine.match(/^(?:>+\s*)+/);
      cleanLine = originalLine.replace(/^(?:>+\s*)+/, '');
      tds = cleanLine.split(/\|/);
    } else {
      // 如果没有下一行，使用当前行的数据
      originalLine = codes[targetTr];
      quoteMatch = originalLine.match(/^(?:>+\s*)+/);
      cleanLine = originalLine.replace(/^(?:>+\s*)+/, '');
      tds = cleanLine.split(/\|/);
    }
    const needPlus1 = /^\s*$/.test(tds[0]);
    const targetTd = needPlus1 ? tdIndex + 1 : tdIndex;
    if (targetTd >= tds.length) {
      console.error('Debug: targetTd out of bounds:', targetTd, 'tds.length:', tds.length);
      return { preLine: targetTr, preCh: 0, plusCh: 0, currentTd: '' };
    }
    const current = tds[targetTd];
    // 计算引用符号的长度
    const quoteLength = quoteMatch ? quoteMatch[0].length : 0;
    // 计算目标单元格之前的字符数（包括管道符）
    let preCh = quoteLength;
    // 如果表格以|开头，需要先加上第一个管道符
    if (needPlus1) {
      preCh += 1; // 第一个管道符
    }
    // 计算目标单元格之前所有单元格的长度和管道符
    for (let i = needPlus1 ? 1 : 0; i < targetTd; i++) {
      preCh += tds[i].length;
      preCh += 1; // 每个单元格后面的管道符
    }
    // 计算单元格内容的实际位置（去除前后空格）
    const trimmedContent = current.trim();
    const leadingSpaces = current.match(/^\s*/)[0].length;
    const actualPreCh = preCh + leadingSpaces;
    const result = {
      preLine: (nextLineIndex < codes.length ? nextLineIndex : targetTr) - 1,
      preCh: actualPreCh,
      plusCh: trimmedContent.length,
      currentTd: trimmedContent,
    };
    return result;
  }

  /**
   * 获取HTML表格中对应单元格的偏移量
   * @param {String} tableCode HTML表格代码
   * @param {Number} trIndex 行索引
   * @param {Number} tdIndex 列索引
   */
  $getHtmlTdOffset(tableCode, trIndex, tdIndex) {
    /**
     * **TODO**:
     * 这里假设HTML表格的每一行都是完整的<tr>标签，没有跨行、所有html标签挤在一行的情况
     * 如果有跨行的情况，需要修改这里的逻辑
     */
    const lines = tableCode.split(/\n/);
    let foundTr = 0;
    let foundTd = 0;
    // 解析HTML表格，找到目标单元格的位置
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 查找<tr>标签
      const trMatches = line.match(/<tr[^>]*>/gi);
      if (trMatches) {
        if (foundTr === trIndex) {
          // 在目标行中查找<td>或<th>标签
          const tdRegex = /<(td|th)[^>]*>([\s\S]*?)<\/(td|th)>/gi;
          let tdMatch;
          while ((tdMatch = tdRegex.exec(line)) !== null && foundTd <= tdIndex) {
            if (foundTd === tdIndex) {
              // 找到目标单元格
              const cellContent = tdMatch[2] || '';
              return {
                preLine: i,
                preCh: tdMatch.index + tdMatch[0].indexOf('>') + 1,
                plusCh: cellContent.length,
                currentTd: cellContent,
              };
            }
            foundTd += 1;
          }
          break;
        }
        foundTr += 1;
      }
    }
    // 如果没有找到，返回整个表格的选择
    return {
      preLine: 0,
      preCh: 0,
      plusCh: tableCode.length,
      currentTd: '',
    };
  }

  /**
   * 在编辑器里找到对应的表格源码，并让编辑器选中
   * 支持markdown表格语法和HTML table标签的定位
   */
  $findTableInEditor() {
    this.$collectTableDom();
    this.$collectTableCode();
    // 如果表格总数与代码中的表格数量不匹配，尝试智能匹配
    if (this.tableEditor.info.totalTables !== this.tableEditor.tableCodes.length) {
      // 尝试基于表格内容进行匹配
      const matchedIndex = this.$findTableByContent();
      if (matchedIndex !== -1) {
        this.$setSelection(matchedIndex, 'td', this.trigger === 'click');
        return true;
      }
      return false;
    }
    this.$setSelection(this.tableEditor.info.tableIndex, 'td', this.trigger === 'click');
    return true;
  }

  $initReg() {
    this.tableReg = this.tableReg ? this.tableReg : getTableRule(true);
    this.codeBlockReg = this.codeBlockReg ? this.codeBlockReg : getCodeBlockRule().reg;
    // HTML table标签的正则表达式
    this.htmlTableReg = /<table[^>]*>[\s\S]*?<\/table>/gi;
    // 引用块中的HTML table标签的正则表达式（匹配每行都有引用符号的HTML表格）
    this.blockquoteHtmlTableReg = /(^>\s*<table[\s\S]*?^>\s*<\/table>)/gim;
  }

  /**
   * 收集HTML table标签
   */
  $collectHtmlTableCode(editorValue, tableCodes, footnoteTableCodes, isInFootnote) {
    let match;
    this.htmlTableReg.lastIndex = 0; // 重置正则表达式的lastIndex
    while ((match = this.htmlTableReg.exec(editorValue)) !== null) {
      const info = {
        code: match[0],
        offset: match.index,
        type: 'html',
      };
      if (isInFootnote(match.index)) {
        footnoteTableCodes.push(info);
      } else {
        tableCodes.push(info);
      }
    }
    // 收集引用块中的HTML表格
    this.blockquoteHtmlTableReg.lastIndex = 0;
    while ((match = this.blockquoteHtmlTableReg.exec(editorValue)) !== null) {
      tableCodes.push({
        code: match[0],
        offset: match.index,
        type: 'blockquote-html',
      });
    }
  }

  /**
   * 基于表格内容进行智能匹配
   */
  $findTableByContent() {
    const targetTableText = this.tableEditor.info.tableText;
    // 遍历所有收集到的表格代码，寻找内容匹配的表格
    for (let i = 0; i < this.tableEditor.tableCodes.length; i++) {
      const tableCode = this.tableEditor.tableCodes[i];
      let codeText = '';
      if (tableCode.type === 'html') {
        // 对于HTML表格，提取文本内容
        codeText = this.$extractHtmlTableText(tableCode.code);
      } else if (tableCode.type === 'blockquote-html') {
        // 对于引用中的HTML表格，提取文本内容
        const cleanHtml = tableCode.code.replace(/^>\s*/gm, '');
        codeText = this.$extractHtmlTableText(cleanHtml);
      } else if (tableCode.type === 'blockquote-markdown') {
        // 对于引用中的markdown表格，需要去除引用符号
        codeText = tableCode.code
          .replace(/^>\s*/gm, '') // 去除行首的引用符号
          .replace(/[\s|\-:]/g, ''); // 去除空白字符、表格分隔符等
      } else {
        // 对于普通markdown表格，直接处理文本
        codeText = tableCode.code.replace(/[\s|\-:]/g, '');
      }
      // 比较文本内容（去除空白字符）
      if (codeText === targetTableText) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 从HTML表格代码中提取纯文本内容
   */
  $extractHtmlTableText(htmlCode) {
    // 创建临时DOM元素来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlCode;
    const table = tempDiv.querySelector('table');
    if (table) {
      return table.textContent.replace(/[\s]/g, '');
    }
    return '';
  }

  /**
   * 获取引用语法中HTML表格对应单元格的偏移量
   * @param {String} tableCode 引用块中的HTML表格代码
   * @param {Number} trIndex 行索引
   * @param {Number} tdIndex 列索引
   */
  $getBlockquoteHtmlTdOffset(tableCode, trIndex, tdIndex) {
    const lines = tableCode.split(/\n/);
    // 将所有行的内容合并，去除引用符号，用于查找HTML标签
    const cleanContent = lines.map((line) => line.replace(/^>\s*/, '')).join('\n');
    // 查找所有<tr>标签
    const trRegex = /<tr[^>]*>/gi;
    let trMatch;
    const trPositions = [];
    while ((trMatch = trRegex.exec(cleanContent)) !== null) {
      trPositions.push({
        index: trMatch.index,
        match: trMatch[0],
      });
    }
    if (trIndex >= trPositions.length) {
      return {
        preLine: 0,
        preCh: 0,
        plusCh: tableCode.length,
        currentTd: '',
      };
    }
    // 从目标<tr>开始查找<td>或<th>标签
    const targetTrStart = trPositions[trIndex].index;
    const nextTrStart = trIndex + 1 < trPositions.length ? trPositions[trIndex + 1].index : cleanContent.length;
    const trContent = cleanContent.substring(targetTrStart, nextTrStart);
    const tdRegex = /<(td|th)[^>]*>([\s\S]*?)<\/(td|th)>/gi;
    let tdMatch;
    let currentTdIndex = 0;
    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      if (currentTdIndex === tdIndex) {
        const cellContent = tdMatch[2] || '';
        const absolutePosition = targetTrStart + tdMatch.index + tdMatch[0].indexOf('>') + 1;
        // 将绝对位置转换为行列位置
        let charCount = 0;
        let targetLine = 0;
        let targetCh = 0;
        for (let i = 0; i < lines.length; i++) {
          const cleanLine = lines[i].replace(/^>\s*/, '');
          if (charCount + cleanLine.length + 1 > absolutePosition) {
            targetLine = i;
            const quoteMatch = lines[i].match(/^>\s*/);
            const quoteLength = quoteMatch ? quoteMatch[0].length : 0;
            targetCh = quoteLength + (absolutePosition - charCount);
            break;
          }
          charCount += cleanLine.length + 1; // +1 for newline
        }
        return {
          preLine: targetLine,
          preCh: targetCh,
          plusCh: cellContent.length,
          currentTd: cellContent,
        };
      }
      currentTdIndex += 1;
    }
    // 如果没有找到，返回整个表格的选择
    return {
      preLine: 0,
      preCh: 0,
      plusCh: tableCode.length,
      currentTd: '',
    };
  }

  showBubble() {
    if (this.trigger === 'click') {
      this.$drawEditor();
      return;
    }
    this.$drawSymbol();
    this.$drawMenu();
    this.$drawColumnResize();
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
    if (!node || !node.tagName) {
      return false;
    }
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
      Row: 'Row',
      Col: 'Col',
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
      li.title = this.$cherry.locale[`add${textDict[dir]}`];
      li.innerHTML = '+';
      li.addEventListener('click', (e) => {
        const { target } = e;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const { type, dir } = target.dataset;
        this[`$add${type}${dir}`]();
      });
      li.addEventListener('mouseover', (e) => {
        const { target } = e;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const currentRow = this.tableEditor.info.trNode;
        const { tdIndex } = this.tableEditor.info;
        const tds = currentRow.querySelectorAll('td');
        const dataType = target.getAttribute('data-type');
        const dataDir = target.getAttribute('data-dir');
        if (dataType === 'Last' && dataDir === 'Row') {
          tds.forEach((td) => {
            td.classList.add('table-highlight-border-add-top');
          });
        } else if (dataType === 'Next' && dataDir === 'Row') {
          tds.forEach((td) => {
            td.classList.add('table-highlight-border-add-bottom');
          });
        } else if (dataType === 'Last' && dataDir === 'Col') {
          this.$hightLightColumnCellsDOM(tdIndex, 'left');
        } else if (dataType === 'Next' && dataDir === 'Col') {
          this.$hightLightColumnCellsDOM(tdIndex, 'right');
        }
      });
      // 取消边界
      li.addEventListener('mouseout', (e) => {
        this.$clearAllBorders();
      });
      container.appendChild(li);
    }, true);
    this.tableEditor.editorDom.symbolContainer = container;
    this.container.appendChild(this.tableEditor.editorDom.symbolContainer);
    this.$setSymbolOffset();
  }

  $setBorderForElements(elements, property, value) {
    elements.forEach((element) => {
      element.style[property] = value;
    });
  }

  /**
   * 高亮一列的单元格的单边框
   * @param {number} columnIndex
   * @param {string} position // left | right | top | bottom
   * @returns
   */
  $hightLightColumnCellsDOM(columnIndex = this.tableEditor.info.tdIndex, position) {
    // 获取当前操作的表格
    const table = this.tableEditor.info.tableNode;
    const { rows } = table;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].cells[columnIndex]) {
        const cell = rows[i].cells[columnIndex];
        if (position === 'left') {
          cell.classList.add('table-highlight-border-add-left');
        } else if (position === 'right') {
          cell.classList.add('table-highlight-border-add-right');
        } else if (position === 'top') {
          cell.classList.add('table-highlight-border-add-top');
        } else if (position === 'bottom') {
          cell.classList.add('table-highlight-border-add-bottom');
        }
      }
    }
  }

  /**
   * 清除所有高光效果（包括边框和背景）
   */
  $clearAllBorders() {
    // 清除所有表格的高光效果
    const allTables = document.querySelectorAll('table');
    allTables.forEach((table) => {
      this.$clearTableHighlights(table);
    });
  }

  /**
   * 清除指定表格的所有高光效果
   * @param {HTMLTableElement} table - 表格元素
   */
  $clearTableHighlights(table) {
    if (!table) return;

    // 清除所有单元格的高光类
    const allCells = table.querySelectorAll('td, th');
    allCells.forEach((cell) => {
      // 清除背景高光
      cell.classList.remove('table-sort-active');

      // 清除边框高光
      cell.classList.remove(
        'table-highlight-border-add-right',
        'table-highlight-border-add-left',
        'table-highlight-border-add-top',
        'table-highlight-border-add-bottom',
      );

      // 清除内联样式
      if (cell instanceof HTMLElement) {
        cell.style.border = '';
        cell.style.borderLeft = '';
        cell.style.borderRight = '';
        cell.style.borderTop = '';
        cell.style.borderBottom = '';
        cell.style.background = '';
      }
    });

    // 清除行的边框高光
    const allRows = table.querySelectorAll('tr');
    allRows.forEach((row) => {
      row.classList.remove(
        'table-highlight-border-add-right',
        'table-highlight-border-add-left',
        'table-highlight-border-add-top',
        'table-highlight-border-add-bottom',
      );
      if (row instanceof HTMLElement) {
        row.style.border = '';
        row.style.background = '';
      }
    });
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
    const { isTHead, columns } = this.tableEditor.info;
    const newRow = `${'|'.repeat(columns)}\n`;
    const insertLine = isTHead ? line + 2 : line + 1;
    this.codeMirror.replaceRange(newRow, { line: insertLine, ch: 0 });
    this.$findTableInEditor();
    this.$setSelection(this.tableEditor.info.tableIndex, 'td');
  }

  /**
   * 获取单元格对齐方式
   * @param {*} cells 单元格数组
   * @param {*} index 单元格索引
   * @returns {string|false} 单元格对齐方式，如果是false则表示不生成对齐方式
   */
  $getTdAlign(cells, index, cellsIndex) {
    if (index !== 1) {
      return '';
    }
    if (typeof cells[cellsIndex] === 'string') {
      return cells[cellsIndex];
    }
    return false;
  }

  /**
   * 添加上一列
   */
  $addLastCol() {
    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
    const selection = this.codeMirror.getSelection();
    const lines = selection.split('\n');
    const cellsIndex = this.tableEditor.info.tdIndex < 2 ? 1 : this.tableEditor.info.tdIndex - 1;
    const newLines = lines.map((line, index) => {
      const cells = line.split('|');
      const replaceItem = this.$getTdAlign(cells, index, cellsIndex);
      if (replaceItem === false) {
        return line;
      }
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
      const replaceItem = this.$getTdAlign(cells, index, this.tableEditor.info.tdIndex + 1);
      if (replaceItem === false) {
        return line;
      }
      cells.splice(this.tableEditor.info.tdIndex + 2, 0, replaceItem);
      return cells.join('|');
    });
    const newText = newLines.join('\n');
    this.codeMirror.replaceSelection(newText);
    this.$findTableInEditor();
    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
  }

  /**
   * 高亮当前列
   */
  $highlightColumn() {
    const { tableNode, tdIndex } = this.tableEditor.info;
    const { rows } = tableNode;
    rows[0].cells[tdIndex].style.borderTop = '1px solid red';
    rows[rows.length - 1].cells[tdIndex].style.borderBottom = '1px solid red';
    for (let i = 0; i < rows.length; i++) {
      const { cells } = rows[i];
      if (cells[tdIndex]) {
        if (tdIndex === 0) cells[tdIndex].style.borderLeft = '1px solid red';
        else cells[tdIndex - 1].style.borderRight = '1px solid red';
        cells[tdIndex].style.borderRight = '1px solid red';
        cells[tdIndex].style.backgroundColor = 'rgba(255, 100, 100, 0.1)';
      }
    }
  }

  /**
   * 取消高亮当前列
   */
  $cancelHighlightColumn() {
    const { tableNode, tdIndex } = this.tableEditor.info;
    if (tableNode) {
      const { rows } = tableNode;
      for (let i = 0; i < rows.length; i++) {
        const { cells } = rows[i];
        if (cells[tdIndex]) {
          if (tdIndex !== 0) cells[tdIndex - 1].style.border = '';
          cells[tdIndex].style.border = ''; // 恢复原始边框
          cells[tdIndex].style.backgroundColor = '';
        }
      }
    }
  }

  /**
   * 高亮当前行
   */
  $highlightRow() {
    this.$doHighlightRow('1px solid red', 'rgba(255, 100, 100, 0.1)');
  }

  /**
   * 取消高亮当前行
   */
  $cancelHighlightRow() {
    this.$doHighlightRow('');
  }

  $doHighlightRow(style = '', backgroundColor = '') {
    const { trNode, tableNode } = this.tableEditor.info;
    const tds = trNode.cells;
    const preTds = trNode.previousElementSibling?.cells || tableNode.tHead.firstChild.cells;
    for (let i = 0; i < tds.length; i++) {
      if (preTds[i]) preTds[i].style.borderBottom = style;
      tds[i].style.borderBottom = style;
      if (backgroundColor) {
        tds[i].style.backgroundColor = backgroundColor;
      } else {
        tds[i].style.backgroundColor = '';
      }
    }
    tds[0].style.borderLeft = style;
    tds[tds.length - 1].style.borderRight = style;
  }

  /**
   * 添加菜单按钮
   */
  $drawMenu() {
    const types = ['top', 'right'];
    const buttons = types.map((type) => [type]);
    const container = document.createElement('div');
    container.className = 'cherry-previewer-table-hover-handler-menu-container';
    buttons.forEach(([type]) => {
      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('data-type', type);
      button.className = 'cherry-previewer-table-hover-handler__menu ch-icon ch-icon-menu';
      button.title = '菜单';

      // 创建菜单气泡
      const menuBubble = this.$createMenuBubble(type);
      button.appendChild(menuBubble);

      // 点击显示/隐藏菜单
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.$toggleMenuBubble(button, menuBubble);
      });

      // 为菜单按钮添加拖拽功能
      this.$addDragFunctionalityToMenuButton(button, type);

      container.appendChild(button);
    });
    this.tableEditor.editorDom.menuContainer = container;
    this.container.appendChild(this.tableEditor.editorDom.menuContainer);
    this.$setMenuButtonPosition();
  }

  /**
   * 为菜单按钮添加拖拽功能
   * @param {HTMLElement} button - 菜单按钮元素
   * @param {string} type - 按钮类型 ('top', 'right')
   */
  $addDragFunctionalityToMenuButton(button, type) {
    if (type === 'right') {
      this.$addRowDragFunctionality(button);
    } else if (type === 'top') {
      this.$addColumnDragFunctionality(button);
    }
  }

  /**
   * 为按钮添加行拖拽功能
   * @param {HTMLElement} button - 菜单按钮元素
   */
  $addRowDragFunctionality(button) {
    button.draggable = true;
    button.title = '拖拽移动行';

    // 鼠标悬停时高亮当前行
    button.addEventListener('mouseover', () => {
      this.$highlightCurrentRow();
    });

    button.addEventListener('mouseleave', () => {
      this.$unhighlightCurrentRow();
    });

    // 拖拽开始
    button.addEventListener('mousedown', (e) => {
      this.$setSelection(this.tableEditor.info.tableIndex, 'table');
      this.$dragLine();
    });
  }

  /**
   * 为顶部按钮添加列拖拽功能
   * @param {HTMLElement} button - 菜单按钮元素
   */
  $addColumnDragFunctionality(button) {
    button.draggable = true;
    button.title = '拖拽移动列';

    const highLightTrDom = [];

    // 鼠标悬停时高亮当前列
    button.addEventListener('mouseover', () => {
      this.$highlightCurrentColumn(highLightTrDom);
    });

    button.addEventListener('mouseleave', () => {
      this.$unhighlightCurrentColumn(highLightTrDom);
    });

    // 拖拽开始
    button.addEventListener('mousedown', (e) => {
      this.$setSelection(this.tableEditor.info.tableIndex, 'table');
      this.$dragCol();
    });
  }

  /**
   * 高亮当前行
   */
  $highlightCurrentRow() {
    const { tdNode } = this.tableEditor.info;
    if (!tdNode) return;

    this.$clearAllBorders();
    tdNode.draggable = true;
    tdNode.parentNode.classList.add('table-sort-active');
  }

  /**
   * 取消高亮当前行
   */
  $unhighlightCurrentRow() {
    const { tdNode } = this.tableEditor.info;
    if (!tdNode) return;

    tdNode.draggable = false;

    // 清除所有高光效果
    this.$clearAllBorders();
  }

  /**
   * 高亮当前列
   * @param {Array} highLightTrDom - 存储高亮元素的数组
   */
  $highlightCurrentColumn(highLightTrDom) {
    const { tdNode } = this.tableEditor.info;
    if (!tdNode) return;

    this.$clearAllBorders();
    tdNode.draggable = true;

    const index = Array.from(tdNode.parentNode.children).indexOf(tdNode);
    if (index === -1) return;

    highLightTrDom.length = 0;

    const tableNode = tdNode.closest('table');
    if (!tableNode) return;

    const allRows = tableNode.querySelectorAll('tr');
    allRows.forEach((tr) => {
      highLightTrDom.push(tr);
    });

    // 为当前列的所有单元格添加高亮
    highLightTrDom.forEach((tr) => {
      const cells = tr.querySelectorAll('td, th');
      if (cells[index]) {
        cells[index].classList.add('table-sort-active');
      }
    });
  }

  /**
   * 取消高亮当前列
   * @param {Array} highLightTrDom - 存储高亮元素的数组
   */
  $unhighlightCurrentColumn(highLightTrDom) {
    const { tdNode } = this.tableEditor.info;
    if (!tdNode) return;

    tdNode.draggable = false;

    // 清除所有高光效果
    this.$clearAllBorders();
  }

  /**
   * 设置菜单按钮的位置
   */
  $setMenuButtonPosition() {
    const container = this.tableEditor.editorDom.menuContainer;
    const { tableNode, tdNode, isTHead } = this.tableEditor.info;
    const tableInfo = this.$getPosition(tableNode);
    const tdInfo = this.$getPosition(tdNode);
    // 设置容器宽高
    this.setStyle(this.container, 'width', `${tableInfo.width}px`);
    this.setStyle(this.container, 'height', `${tableInfo.height}px`);
    this.setStyle(this.container, 'top', `${tableInfo.top}px`);
    this.setStyle(this.container, 'left', `${tableInfo.left}px`);

    // 设置菜单按钮位置
    container.childNodes.forEach((node) => {
      const { type } = node.dataset;
      const offset = {
        outer: 5,
      };
      if (type === 'right') {
        if (isTHead) {
          this.setStyle(node, 'display', 'none');
        }
        this.setStyle(node, 'top', `${tdInfo.top - tableInfo.top + tdInfo.height / 2 - node.offsetHeight / 2}px`);
        this.setStyle(node, 'right', `-${node.offsetWidth}px`);
      } else if (type === 'top') {
        this.setStyle(node, 'top', `-${offset.outer}px`);
        this.setStyle(node, 'left', `${tdInfo.left - tableInfo.left + tdInfo.width / 2 - node.offsetWidth / 2}px`);
      }
    });
  }

  /**
   * 创建菜单气泡
   */
  $createMenuBubble(type) {
    const bubble = document.createElement('div');
    const isRowControl = type === 'right';
    const bubbleClass = isRowControl
      ? 'cherry-previewer-table-menu-bubble cherry-previewer-table-menu-bubble--vertical cherry-previewer-table-menu-bubble--hidden'
      : 'cherry-previewer-table-menu-bubble cherry-previewer-table-menu-bubble--horizontal cherry-previewer-table-menu-bubble--hidden';

    bubble.className = bubbleClass;

    // 获取菜单配置
    const menuConfig = this.$getMenuConfig(type);

    // 创建菜单选项
    menuConfig.forEach((config) => {
      const option = this.$createMenuOption(config, type);
      bubble.appendChild(option);
    });

    return bubble;
  }

  /**
   * 获取表格菜单配置
   */
  $getMenuConfig(type) {
    const isRowControl = type === 'right';

    const baseConfig = [
      {
        id: 'delete',
        icon: 'ch-icon-cherry-table-delete',
        title: isRowControl ? this.$cherry.locale.deleteRow : this.$cherry.locale.deleteColumn,
        action: isRowControl ? 'deleteRow' : 'deleteColumn',
        highlight: isRowControl ? 'row' : 'column',
        showIn: ['row', 'column'],
      },
      {
        id: 'align-left',
        icon: 'ch-icon-alignLeft',
        title: '左对齐',
        action: 'alignLeft',
        showIn: ['column'],
      },
      {
        id: 'align-center',
        icon: 'ch-icon-alignCenter',
        title: '居中',
        action: 'alignCenter',
        showIn: ['column'],
      },
      {
        id: 'align-right',
        icon: 'ch-icon-alignRight',
        title: '右对齐',
        action: 'alignRight',
        showIn: ['column'],
      },
      {
        id: 'insert-row-above',
        icon: 'ch-icon-cherry-table-insert-top',
        title: '在上方插入行',
        action: 'insertRowAbove',
        showIn: ['row'],
      },
      {
        id: 'insert-row-below',
        icon: 'ch-icon-cherry-table-insert-bottom',
        title: '在下方插入行',
        action: 'insertRowBelow',
        showIn: ['row'],
      },
    ];

    // 根据控制类型过滤菜单项
    const currentControlType = isRowControl ? 'row' : 'column';
    const filteredConfig = baseConfig.filter((config) => {
      return config.showIn.includes(currentControlType);
    });

    return filteredConfig;

    // 使用说明：
    // showIn 配置选项：
    // - ['row']: 只在行控制中显示（右侧按钮）
    // - ['column']: 只在列控制中显示（顶部按钮）
    // - ['row', 'column']: 在行控制和列控制中都显示
    //
    // 示例：添加新功能
    // {
    //   id: 'new-feature',
    //   icon: 'ch-icon-new-feature',
    //   title: '新功能',
    //   action: 'newFeature',
    //   showIn: ['row'] // 只在行控制中显示
    // }
  }

  /**
   * 创建菜单选项
   */
  $createMenuOption(config, type) {
    const option = document.createElement('div');
    option.className = 'cherry-previewer-table-menu-option';
    option.setAttribute('data-action', config.action);
    option.title = config.title;

    const iconSpan = document.createElement('span');
    iconSpan.className = `ch-icon ${config.icon}`;
    option.appendChild(iconSpan);

    option.addEventListener('click', () => {
      this.$executeMenuAction(config.action, type);
      this.$hideMenuBubble(option.closest('.cherry-previewer-table-menu-bubble'));
    });

    // 高亮事件
    if (config.highlight) {
      option.addEventListener('mouseover', () => {
        this.$highlightElement(config.highlight);
      });
      option.addEventListener('mouseout', () => {
        this.$cancelHighlightElement(config.highlight);
      });
    }

    return option;
  }

  /**
   * 执行菜单动作
   */
  $executeMenuAction(action, type) {
    switch (action) {
      case 'deleteRow':
        this.$deleteCurrentRow();
        break;
      case 'deleteColumn':
        this.$deleteCurrentColumn();
        break;
      case 'alignLeft':
        this.$alignColumn('left');
        break;
      case 'alignCenter':
        this.$alignColumn('center');
        break;
      case 'alignRight':
        this.$alignColumn('right');
        break;
      case 'insertRowAbove':
        this.$insertRow('above');
        break;
      case 'insertRowBelow':
        this.$insertRow('below');
        break;
      case 'mergeCells':
        this.$mergeCells();
        break;
      default:
        console.warn(`Unknown menu action: ${action}`);
    }
  }

  /**
   * 高亮元素
   */
  $highlightElement(elementType) {
    switch (elementType) {
      case 'row':
        this.$highlightRow();
        break;
      case 'column':
        this.$highlightColumn();
        break;
      default:
        console.warn(`Unknown highlight type: ${elementType}`);
    }
  }

  /**
   * 取消高亮元素
   */
  $cancelHighlightElement(elementType) {
    switch (elementType) {
      case 'row':
        this.$cancelHighlightRow();
        break;
      case 'column':
        this.$cancelHighlightColumn();
        break;
      default:
        console.warn(`Unknown highlight type: ${elementType}`);
    }
  }

  /**
   * 列对齐方法
   * @param {string} alignment - 对齐方式：'left', 'center', 'right'
   */
  $alignColumn(alignment) {
    const { tableIndex, tdIndex } = this.tableEditor.info;
    this.$setSelection(tableIndex, 'table');
    const selection = this.codeMirror.getSelection();
    const lines = selection.split('\n');

    // 统一处理markdown表格（包括引用表格）
    this.$alignColumnInMarkdownTable(lines, tdIndex, alignment);

    this.$findTableInEditor();
    this.$setSelection(tableIndex, 'table');
  }

  /**
   * 在markdown表格中设置列对齐（支持普通表格和引用表格）
   * @param {Array} lines - 表格行数组
   * @param {number} columnIndex - 列索引
   * @param {string} alignment - 对齐方式
   */
  $alignColumnInMarkdownTable(lines, columnIndex, alignment) {
    if (lines.length < 2) return;

    // 找到分隔符行（第二行）
    const separatorLineIndex = 1;
    const separatorLine = lines[separatorLineIndex];

    // 检查是否是引用表格
    const isBlockquoteTable = separatorLine.trim().startsWith('>');
    let quotePrefix = '';
    let tableContent = separatorLine;

    if (isBlockquoteTable) {
      const quoteMatch = separatorLine.match(/^(>\s*)+/);
      quotePrefix = quoteMatch ? quoteMatch[0] : '> ';
      tableContent = separatorLine.substring(quotePrefix.length);
    }

    const cells = tableContent.split('|').slice(1, -1);

    if (columnIndex >= 0 && columnIndex < cells.length) {
      let newSeparator;
      switch (alignment) {
        case 'left': // 左对齐
          newSeparator = ':---';
          break;
        case 'center': // 居中
          newSeparator = ':---:';
          break;
        case 'right': // 右对齐
          newSeparator = '---:';
          break;
        default: // 默认(居中)
          newSeparator = '---';
      }

      cells[columnIndex] = newSeparator;

      if (isBlockquoteTable) {
        lines[separatorLineIndex] = `${quotePrefix}|${cells.join('|')}|`;
      } else {
        lines[separatorLineIndex] = `|${cells.join('|')}|`;
      }

      const newText = lines.join('\n');
      this.codeMirror.replaceSelection(newText);
    }
  }

  /**
   * 插入行方法（预留）
   */
  $insertRow(position) {
    // 这里可以实现插入行功能
    console.log(`Insert row ${position}`);
    // TODO: 实现插入行逻辑
  }

  /**
   * 合并单元格方法（预留）
   */
  $mergeCells() {
    // 这里可以实现合并单元格功能
    console.log('Merge cells');
    // TODO: 实现合并单元格逻辑
  }

  /**
   * 切换菜单气泡显示状态
   */
  $toggleMenuBubble(button, bubble) {
    if (bubble.classList.contains('cherry-previewer-table-menu-bubble--hidden')) {
      this.$showMenuBubble(button, bubble);
    } else {
      this.$hideMenuBubble(bubble);
    }
  }

  /**
   * 显示菜单气泡
   */
  $showMenuBubble(button, bubble) {
    // 隐藏其他所有菜单气泡
    const allBubbles = this.container.querySelectorAll('.cherry-previewer-table-menu-bubble');
    allBubbles.forEach((b) => {
      if (b !== bubble) {
        b.classList.add('cherry-previewer-table-menu-bubble--hidden');
      }
    });

    bubble.classList.remove('cherry-previewer-table-menu-bubble--hidden');

    // 设置气泡位置
    const { type } = button.dataset;
    if (type === 'right') {
      bubble.style.top = '0px';
      bubble.style.left = '100%';
    } else if (type === 'top') {
      bubble.style.top = '-100%';
      bubble.style.left = '50%';
      bubble.style.transform = 'translateX(-50%)';
    }

    const closeMenuHandler = (e) => {
      if (!bubble.contains(e.target) && !button.contains(e.target)) {
        this.$hideMenuBubble(bubble);
        document.removeEventListener('click', closeMenuHandler);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenuHandler);
    }, 0);
  }

  /**
   * 隐藏菜单气泡
   */
  $hideMenuBubble(bubble) {
    bubble.classList.add('cherry-previewer-table-menu-bubble--hidden');
  }

  /**
   * 删除当前行
   */
  $deleteCurrentRow() {
    const { tableIndex, trIndex } = this.tableEditor.info;
    this.$setSelection(tableIndex, 'table');
    const selection = this.codeMirror.getSelection();
    const table = selection.split('\n');
    table.splice(trIndex + 2, 1);
    const newText = table.join('\n');
    this.codeMirror.replaceSelection(newText);
  }

  /**
   * 删除当前列
   */
  $deleteCurrentColumn() {
    const { tableIndex, tdIndex } = this.tableEditor.info;
    this.$setSelection(tableIndex, 'table');
    const selection = this.codeMirror.getSelection();
    const table = selection.split('\n');
    // 检查是否是引用语法中的表格
    const isBlockquoteTable = table.some((row) => row.trim().startsWith('>'));
    if (isBlockquoteTable) {
      // 处理引用语法中的表格
      const rows = table.map((row) => {
        const trimmedRow = row.trim();
        if (trimmedRow.startsWith('>')) {
          // 提取引用符号和表格内容
          const quoteMatch = trimmedRow.match(/^(>\s*)+/);
          const quotePrefix = quoteMatch ? quoteMatch[0] : '> ';
          const tableContent = trimmedRow.substring(quotePrefix.length);
          const cells = tableContent.split('|').slice(1, -1);
          return { quotePrefix, cells };
        }
        return { quotePrefix: '', cells: [] };
      });
      rows.forEach((row) => {
        if (tdIndex >= 0 && tdIndex < row.cells.length) {
          row.cells.splice(tdIndex, 1);
        }
      });
      const newTable = rows.map((row) => {
        if (row.cells.length === 0) {
          return '';
        }
        return `${row.quotePrefix}|${row.cells.join('|')}|`;
      });
      const newText = newTable.join('\n');
      this.codeMirror.replaceSelection(newText);
    } else {
      // 处理普通表格
      const rows = table.map((row) => row.split('|').slice(1, -1));
      rows.forEach((row) => {
        if (tdIndex >= 0 && tdIndex < row.length) {
          row.splice(tdIndex, 1);
        }
      });
      const newTable = rows.map((row) => (row.length === 0 ? '' : `|${row.join('|')}|`));
      const newText = newTable.join('\n');
      this.codeMirror.replaceSelection(newText);
    }
  }

  /**
   * 绘制列宽调整
   * @returns void
   */
  $drawColumnResize() {
    const { tableNode } = this.tableEditor.info;
    const box = this.tableEditor.info.tdNode;
    const { columns } = this.tableEditor.info;

    if (!box) return; // 安全检查

    let isDragging = false;
    let startX = 0;
    let startWidth = 0;

    // 检查是否已有 dragBar，避免重复创建
    const existingDragBar = box.querySelector('.cherry-table-drag-bar');
    if (existingDragBar) return;

    // 设置定位
    box.style.position = 'relative';
    // 创建 dragBar
    const dragBar = document.createElement('div');
    dragBar.className = 'cherry-table-drag-bar';
    dragBar.style.position = 'absolute';
    box.appendChild(dragBar);

    box.addEventListener('mouseleave', () => {
      if (!isDragging) cleanup(); // 没拖拽，就清理
    });
    // mousedown 拖拽开始
    const handleMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;

      startWidth = box.offsetWidth;
      e.preventDefault();

      // 立即绑定事件
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, true);
      document.addEventListener('mouseleave', handleMouseLeave, true);
    };
    // 移动
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      const width = Math.max(50, startWidth + delta); // 最小宽度 50px

      box.style.width = `${width}px`;
      // 更新表格总宽度
      tableNode.style.width = `${width * columns}px`;
    };
    // 鼠标释放
    const handleMouseUp = (e) => {
      if (isDragging) {
        isDragging = false;
        cleanup();
      }
    };

    const handleMouseLeave = (e) => {
      if (isDragging && e.clientY <= 0) {
        // 鼠标移出窗口（顶部以上），视为取消
        cleanup();
      }
    };

    // 清理函数：统一处理资源释放
    const cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      dragBar?.remove(); // 移除 dragBar
    };

    dragBar.addEventListener('mousedown', handleMouseDown);
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

    // 确保只设置一次 draggable
    if (!tdNode.hasAttribute('draggable')) {
      tdNode.setAttribute('draggable', true);
    }

    function handleDragLeave(event) {
      that.$clearAllBorders();
    }

    function handleDragOver(event) {
      event.preventDefault();
      const tdIndex = Array.from(event.target.parentElement.childNodes).indexOf(event.target);
      that.$dragSymbol(event.target, oldTdIndex, tdIndex, 'Col');
      thNode.setAttribute('draggable', false);
    }

    function handleDrop(event) {
      event.preventDefault();
      const tdIndex = Array.from(event.target.parentElement.childNodes).indexOf(event.target);

      // 检查是否是有效的拖拽操作
      if (oldTdIndex === tdIndex) {
        // 相同位置，不需要操作
        that.$clearAllBorders();
        cleanup();
        return;
      }

      const newLines = lines.map((line, index) => {
        // 跳过空行
        if (!line.trim()) return line;

        const cells = line
          .split('|')
          .map((item) => (item === '' ? 'CHERRY_MARKDOWN_PENDING_TEXT_FOR_EMPTY_CELL' : item))
          .slice(1, -1);

        // 确保索引有效
        if (oldTdIndex >= 0 && oldTdIndex < cells.length && tdIndex >= 0 && tdIndex < cells.length) {
          return `|${that.$operateLines(oldTdIndex, tdIndex, cells).join('|')}|`;
        }
        return line;
      });

      const newText = newLines.join('\n').replace(/CHERRY_MARKDOWN_PENDING_TEXT_FOR_EMPTY_CELL/g, '');

      // 替换选中的内容
      that.codeMirror.replaceSelection(newText);
      that.$clearAllBorders();
      that.$findTableInEditor();
      that.$setSelection(that.tableEditor.info.tableIndex, 'table');

      cleanup();
    }

    function cleanup() {
      thNode.removeEventListener('dragleave', handleDragLeave);
      thNode.removeEventListener('dragover', handleDragOver);
      thNode.removeEventListener('drop', handleDrop);
      tdNode.removeAttribute('draggable');
      // 确保清除所有高光
      that.$clearAllBorders();
    }

    thNode.addEventListener('dragleave', handleDragLeave);
    thNode.addEventListener('dragover', handleDragOver);
    thNode.addEventListener('drop', handleDrop, { once: true });
  }

  /**
   * 拖拽行
   */
  $dragLine() {
    const { trNode } = this.tableEditor.info;

    // 确保只设置一次 draggable
    if (!trNode.hasAttribute('draggable')) {
      trNode.setAttribute('draggable', true);
    }

    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
    const oldTrIndex = this.tableEditor.info.trIndex + 2;
    const tBody = trNode.parentElement;
    const lines = this.codeMirror.getSelection().split(/\n/);
    const that = this;

    function handleDragLeave(event) {
      that.$clearAllBorders();
    }

    function handleDragOver(event) {
      event.preventDefault();
      const trIndex =
        Array.from(event.target.parentElement.parentElement.childNodes).indexOf(event.target.parentElement) + 2;
      that.$dragSymbol(event.target, oldTrIndex, trIndex, 'Line');
      trNode.setAttribute('draggable', false);
    }

    function handleDrop(event) {
      event.preventDefault();
      const trIndex =
        Array.from(event.target.parentElement.parentElement.childNodes).indexOf(event.target.parentElement) + 2;

      // 检查是否是有效的拖拽操作
      if (oldTrIndex === trIndex) {
        // 相同位置，不需要操作
        that.$clearAllBorders();
        cleanup();
        return;
      }

      const newText = that.$operateLines(oldTrIndex, trIndex, lines).join('\n');
      that.codeMirror.replaceSelection(newText);

      that.$findTableInEditor();
      that.$setSelection(that.tableEditor.info.tableIndex, 'table');
      that.$clearAllBorders();

      cleanup();
    }

    function cleanup() {
      tBody.removeEventListener('dragleave', handleDragLeave);
      tBody.removeEventListener('dragover', handleDragOver);
      tBody.removeEventListener('drop', handleDrop);
      trNode.removeAttribute('draggable');
      that.$clearAllBorders();
    }

    tBody.addEventListener('dragleave', handleDragLeave);
    tBody.addEventListener('dragover', handleDragOver);
    tBody.addEventListener('drop', handleDrop, { once: true });
  }

  /**
   * 拖拽过程中的视觉反馈
   * @param {HTMLElement} objTarget - 目标元素
   * @param {number} oldIndex - 原始索引
   * @param {number} index - 新索引
   * @param {string} type - 类型 ('Col' 或 'Line')
   */
  $dragSymbol(objTarget, oldIndex, index, type) {
    const { target } = this;
    if (target !== objTarget && oldIndex !== index) {
      if ((target.tagName === 'TH' || target.tagName === 'TD') && type === 'Col') {
        // 列拖拽的视觉反馈
        this.$showColumnDragFeedback(objTarget, oldIndex, index);
      } else if (target.tagName === 'TD' && type === 'Line') {
        // 行拖拽的视觉反馈
        this.$showRowDragFeedback(objTarget, oldIndex, index);
      }
    }
  }

  /**
   * 显示列拖拽的视觉反馈
   * @param {HTMLElement} objTarget - 目标元素
   * @param {number} oldIndex - 原始索引
   * @param {number} index - 新索引
   */
  $showColumnDragFeedback(objTarget, oldIndex, index) {
    // 清除之前的高光
    this.$clearAllBorders();

    if (oldIndex < index) {
      // 向右拖拽
      this.$hightLightColumnCellsDOM(index, 'right');
    } else if (oldIndex > index) {
      // 向左拖拽
      this.$hightLightColumnCellsDOM(index, 'left');
    }
  }

  /**
   * 显示行拖拽的视觉反馈
   * @param {HTMLElement} objTarget - 目标元素
   * @param {number} oldIndex - 原始索引
   * @param {number} index - 新索引
   */
  $showRowDragFeedback(objTarget, oldIndex, index) {
    // 清除之前的高光
    this.$clearAllBorders();

    if (oldIndex < index) {
      // 向下拖拽
      objTarget.parentElement.classList.add('table-highlight-border-add-bottom');
    } else if (oldIndex > index) {
      // 向上拖拽
      objTarget.parentElement.classList.add('table-highlight-border-add-top');
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
