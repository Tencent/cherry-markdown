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
import Logger from '@/Logger';

/**
 * 用于在表格上出现编辑区，并提供拖拽行列的功能
 */
export default class TableHandler {
  /**
   * 用来存放所有的数据
   */
  tableEditor = {
    info: {}, // 当前点击的预览区域table的相关信息
    mainTextCodes: [], // 正文中的表格语法
    footnoteCodes: [], // 脚注中的表格语法
    editorDom: {}, // 编辑器容器
  };

  constructor(trigger, target, container, previewerDom, codeMirror, tableElement, cherry) {
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
    this.$setDeleteButtonPosition();
  }

  $remove() {
    this.tableEditor = { info: {}, mainTextCodes: [], footnoteCodes: [], editorDom: {} };
  }

  /**
   * 收集编辑器中的表格语法，并记录表格语法的开始的offset
   * 支持 Markdown 表格和 HTML 表格语法，按正文和脚注分别存储
   */
  $collectTableCode() {
    const value = this.codeMirror.getValue();

    // 首先收集所有脚注的位置信息
    const footnoteRanges = [];
    const footnoteReg = /(^|\n)[ \t]*\[\^([^\]]+?)\]:[ \t]*([\s\S]+?)(?=\s*$|\n\n)/g;
    let footnoteMatch;
    while ((footnoteMatch = footnoteReg.exec(value)) !== null) {
      const start = footnoteMatch.index + footnoteMatch[1].length; // 去掉开头的换行符
      const end = footnoteMatch.index + footnoteMatch[0].length;
      footnoteRanges.push({
        start,
        end,
        id: footnoteMatch[2],
        content: footnoteMatch[3],
      });
    }

    // 判断给定位置是否在脚注中
    const isInFootnote = (offset) => {
      return footnoteRanges.some((range) => offset >= range.start && offset < range.end);
    };

    // 创建一个处理过的版本，排除代码块中的内容
    const processedValue = value.replace(this.codeBlockReg, (whole, ...args) => {
      // 把代码块里的表格语法关键字干掉，但保持字符串长度不变
      return whole.replace(/\|/g, '.').replace(/<table[\s\S]*?<\/table>/gi, (match) => '.'.repeat(match.length));
    });

    // 收集所有表格（Markdown 和 HTML），按正文和脚注分别存储
    const mainTextTables = [];
    const footnoteTables = [];

    // 收集 Markdown 表格
    processedValue.replace(this.tableReg, function (whole, ...args) {
      const match = whole.replace(/^\n*/, '');
      const offsetBegin = args[args.length - 2] + whole.match(/^\n*/)[0].length;
      const tableInfo = {
        code: match,
        offset: offsetBegin,
        type: 'markdown',
      };

      if (isInFootnote(offsetBegin)) {
        footnoteTables.push(tableInfo);
      } else {
        mainTextTables.push(tableInfo);
      }
      return whole;
    });

    // 收集 HTML 表格
    value.replace(this.htmlTableReg, (whole, ...args) => {
      const offset = args[args.length - 2];

      // 检查是否在代码块中
      let inCodeBlock = false;
      value.replace(this.codeBlockReg, (codeWhole, ...codeArgs) => {
        const codeOffset = codeArgs[codeArgs.length - 2];
        const codeEnd = codeOffset + codeWhole.length;
        if (offset >= codeOffset && offset < codeEnd) {
          inCodeBlock = true;
        }
        return codeWhole;
      });

      // 如果不在代码块中，则添加到相应的表格列表
      if (!inCodeBlock) {
        const tableInfo = {
          code: whole,
          offset,
          type: 'html',
        };

        if (isInFootnote(offset)) {
          footnoteTables.push(tableInfo);
        } else {
          mainTextTables.push(tableInfo);
        }
      }
      return whole;
    });

    // 按偏移量排序以保持文档中的实际顺序
    mainTextTables.sort((a, b) => a.offset - b.offset);
    footnoteTables.sort((a, b) => a.offset - b.offset);

    this.tableEditor.mainTextCodes = mainTextTables;
    this.tableEditor.footnoteCodes = footnoteTables;
  }

  /**
   * 获取预览区域被点击的table对象，并记录table的顺位
   * 使用新的索引策略：脚注表格根据 one-footnote 容器顺序，正文表格使用全局索引
   */
  $collectTableDom() {
    const tableNode = this.$getClosestNode(this.target, 'TABLE');
    if (tableNode === false) {
      return false;
    }

    // 判断当前点击的表格是否在脚注中
    // 向上遍历DOM，查找是否有.one-footnote祖先节点
    let footnoteContainer = null;
    let currentElement = this.target;

    while (currentElement && currentElement !== this.previewerDom) {
      if (currentElement.classList && currentElement.classList.contains('one-footnote')) {
        footnoteContainer = currentElement;
        break;
      }
      currentElement = currentElement.parentElement;
    }

    const isInFootnote = footnoteContainer !== null;

    let tableIndex;
    let totalTables;

    if (isInFootnote) {
      // 脚注表格：统计当前脚注容器前面有多少个脚注容器包含表格
      const allFootnoteContainers = Array.from(this.previewerDom.querySelectorAll('.one-footnote'));
      const currentFootnoteIndex = allFootnoteContainers.indexOf(footnoteContainer);

      if (currentFootnoteIndex === -1) {
        Logger.warn('无法找到当前脚注容器的索引');
        return false;
      }

      // 统计当前脚注容器前面的脚注容器中包含的表格数量
      let tablesBeforeCurrentFootnote = 0;
      for (let i = 0; i < currentFootnoteIndex; i++) {
        tablesBeforeCurrentFootnote += allFootnoteContainers[i].querySelectorAll('table').length;
      }

      // 在当前脚注容器中的表格索引
      const tablesInCurrentFootnote = Array.from(footnoteContainer.querySelectorAll('table'));
      const indexInCurrentFootnote = tablesInCurrentFootnote.indexOf(tableNode);

      if (indexInCurrentFootnote === -1) {
        Logger.warn('无法找到表格在当前脚注容器中的索引');
        return false;
      }

      // 总的脚注表格索引
      tableIndex = tablesBeforeCurrentFootnote + indexInCurrentFootnote;

      // 统计所有脚注中的表格总数
      totalTables = this.previewerDom.querySelectorAll('.one-footnote table').length;
    } else {
      // 正文表格：排除脚注中的表格，获取正文区域的表格
      const allTables = Array.from(this.previewerDom.querySelectorAll('table'));
      const footnoteTableSet = new Set();

      // 收集所有脚注中的表格
      const footnoteContainers = this.previewerDom.querySelectorAll('.one-footnote');
      footnoteContainers.forEach((container) => {
        const footnoteTables = container.querySelectorAll('table');
        footnoteTables.forEach((table) => footnoteTableSet.add(table));
      });

      // 过滤出正文区域的表格（不在脚注中的表格）
      const mainTextTables = allTables.filter((table) => !footnoteTableSet.has(table));

      tableIndex = mainTextTables.indexOf(tableNode);
      totalTables = mainTextTables.length;
    }

    if (tableIndex === -1) {
      Logger.warn('无法找到当前表格在相应区域的索引', {
        isInFootnote,
        tableNode: tableNode.outerHTML.slice(0, 100),
        totalTablesInArea: totalTables,
      });
      return false;
    }

    // 计算列数和单元格索引，只考虑td/th元素
    const rowCells = Array.from(this.target.parentElement.children).filter(
      (child) => child.tagName && (child.tagName.toLowerCase() === 'td' || child.tagName.toLowerCase() === 'th'),
    );

    const columns = rowCells.length;
    const tdIndex = rowCells.indexOf(this.target);

    // 计算行索引，只考虑tr元素
    const tableRows = Array.from(this.target.parentElement.parentElement.children);
    const trIndex = tableRows.indexOf(this.target.parentElement);

    this.tableEditor.info = {
      tableNode,
      tdNode: this.target,
      trNode: this.target.parentElement,
      tdIndex,
      trIndex,
      isTHead: this.target.parentElement.parentElement.tagName !== 'TBODY',
      totalTables,
      tableIndex,
      tableText: tableNode.textContent.replace(/[\s]/g, ''),
      columns,
      isFootnote: isInFootnote,
    };
  }

  /**
   * 选中对应单元格、所在行、所在列的内容
   * @param {Number} index 表格在相应区域（正文或脚注）中的索引
   * @param {String} type 'td': 当前单元格, 'table': 当前表格, 'cell': HTML表格单元格
   * @param {Boolean} select 是否选中编辑器中的代码
   * @param {Boolean} isFootnote 是否为脚注表格
   */
  $setSelection(index, type = 'table', select = true, isFootnote = false) {
    // 根据表格位置选择相应的表格代码数组
    const tableCodes = isFootnote ? this.tableEditor.footnoteCodes : this.tableEditor.mainTextCodes;
    const tableCode = tableCodes[index];

    if (!tableCode) {
      Logger.warn('找不到对应的表格代码');
      return;
    }

    const whole = this.codeMirror.getValue();
    const selectTdInfo = this.tableEditor.info;
    const beginLine = whole.slice(0, tableCode.offset).match(/\n/g)?.length ?? 0;

    // 根据表格类型使用不同的处理逻辑
    if (tableCode.type === 'html') {
      if (type === 'cell') {
        // HTML 表格单元格级别的定位
        const cellPosition = this.$getHtmlTableCellPosition(tableCode.code, selectTdInfo);
        if (cellPosition) {
          // 定位到具体的单元格内容
          const cellStartLine = beginLine + cellPosition.line;
          const cellStartCh = cellPosition.start;
          const cellEndCh = cellPosition.end;

          this.tableEditor.info.selection = [
            { line: cellStartLine, ch: cellStartCh },
            { line: cellStartLine, ch: cellEndCh },
          ];
          this.tableEditor.info.code = cellPosition.content;
        } else {
          // 如果无法解析单元格位置，则选择整个表格
          const lines = tableCode.code.split('\n');
          const endLine = beginLine + lines.length - 1;
          const endCh = lines[lines.length - 1].length;

          this.tableEditor.info.selection = [
            { line: beginLine, ch: 0 },
            { line: endLine, ch: endCh },
          ];
          this.tableEditor.info.code = tableCode.code;
        }
      } else {
        // HTML 表格整体选择
        const lines = tableCode.code.split('\n');
        const endLine = beginLine + lines.length - 1;
        const endCh = lines[lines.length - 1].length;

        this.tableEditor.info.selection = [
          { line: beginLine, ch: 0 },
          { line: endLine, ch: endCh },
        ];
        this.tableEditor.info.code = tableCode.code;
      }
    } else {
      // Markdown 表格的原有处理逻辑
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
        this.tableEditor.info.code = tableCode.code;
      } else {
        this.tableEditor.info.selection = [
          { line: beginLine + preLine, ch: preCh },
          { line: beginLine + preLine, ch: preCh + plusCh },
        ];
        this.tableEditor.info.code = currentTd;
      }
    }

    select && this.codeMirror.setSelection(...this.tableEditor.info.selection);
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
    let originalLine, cleanLine, tds, quoteMatch;
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
    const lines = tableCode.split(/\n/);
    const currentLine = 0;
    const currentChar = 0;
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
          let searchPos = 0;
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
            searchPos = tdMatch.index + tdMatch[0].length;
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
  /**
   * 在编辑器里找到对应的表格源码，并让编辑器选中
   */
  $findTableInEditor() {
    this.$collectTableDom();

    // 如果DOM收集失败，直接返回
    if (!this.tableEditor.info.tableNode) {
      Logger.warn('DOM收集失败，无法定位表格');
      return false;
    }

    this.$collectTableCode();

    const currentTableInfo = this.tableEditor.info;
    const isFootnoteTable = currentTableInfo.isFootnote;

    // 根据表格所在区域进行匹配验证
    const relevantTableCodes = isFootnoteTable ? this.tableEditor.footnoteCodes : this.tableEditor.mainTextCodes;

    if (currentTableInfo.totalTables !== relevantTableCodes.length) {
      Logger.warn(
        `${isFootnoteTable ? '脚注' : '正文'}区域表格数量不匹配: 预览区${currentTableInfo.totalTables}个，编辑区${
          relevantTableCodes.length
        }个`,
      );
      return false;
    }

    if (currentTableInfo.tableIndex === -1) {
      Logger.warn('无法找到当前表格在预览区的索引');
      return false;
    }

    // 获取对应的表格代码
    const targetTableCode = relevantTableCodes[currentTableInfo.tableIndex];
    if (!targetTableCode) {
      Logger.warn('无法找到对应的表格代码');
      return false;
    }

    // 检查表格类型，决定选择策略
    let selectionType;

    if (targetTableCode.type === 'html') {
      // HTML 表格选择单元格
      selectionType = 'cell';
    } else {
      selectionType = 'td';
    }

    this.$setSelection(currentTableInfo.tableIndex, selectionType, this.trigger === 'click', isFootnoteTable);
    return true;
  }

  $initReg() {
    this.tableReg = this.tableReg ? this.tableReg : getTableRule(true);
    this.codeBlockReg = this.codeBlockReg ? this.codeBlockReg : getCodeBlockRule().reg;
    // HTML表格的正则表达式，匹配从<table>到</table>的完整结构
    this.htmlTableReg = this.htmlTableReg ? this.htmlTableReg : /<table[\s\S]*?<\/table>/gi;
  }


  /**
   * 获取当前操作的表格代码对象
   * @returns {Object|null} 表格代码对象
   */
  $getCurrentTableCode() {
    const currentTableInfo = this.tableEditor.info;

    if (!currentTableInfo || currentTableInfo.tableIndex === undefined) {
      return null;
    }

    // 根据表格所在区域获取相应的表格代码
    const isFootnoteTable = currentTableInfo.isFootnote;
    const relevantTableCodes = isFootnoteTable ? this.tableEditor.footnoteCodes : this.tableEditor.mainTextCodes;
    return relevantTableCodes[currentTableInfo.tableIndex] || null;
  }

  /**
   * 获取HTML表格中具体单元格的位置信息
   * @param {String} htmlTableCode HTML表格代码
   * @param {Object} selectTdInfo 选中的单元格信息
   * @returns {Object|null} 单元格位置信息
   */
  $getHtmlTableCellPosition(htmlTableCode, selectTdInfo) {
    try {
      // 获取当前点击的单元格DOM元素
      const targetCell = selectTdInfo.tdNode;
      const cellContent = targetCell.textContent.trim();

      // 如果单元格内容为空，返回null使用默认选择
      if (!cellContent) {
        return null;
      }

      const lines = htmlTableCode.split('\n');

      // 在HTML代码中搜索包含此内容的行
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 检查这行是否包含目标单元格的内容
        if (line.includes(cellContent)) {
          // 查找内容在行中的位置
          const contentIndex = line.indexOf(cellContent);
          if (contentIndex !== -1) {
            return {
              line: i,
              start: contentIndex,
              end: contentIndex + cellContent.length,
              content: cellContent,
            };
          }
        }
      }

      // 如果没找到精确匹配，尝试模糊匹配（处理HTML实体等情况）
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 检查是否是td或th标签行
        if ((line.includes('<td') || line.includes('<th')) && (line.includes('</td>') || line.includes('</th>'))) {
          // 提取标签内的文本内容
          const tagMatch = line.match(/<(td|th)[^>]*>(.*?)<\/(td|th)>/i);
          if (tagMatch) {
            const tagContent = tagMatch[2].replace(/<[^>]*>/g, '').trim();

            // 如果内容匹配
            if (tagContent === cellContent) {
              const fullMatch = tagMatch[0];
              const matchStart = line.indexOf(fullMatch);
              const contentStart = matchStart + tagMatch[0].indexOf(tagMatch[2]);

              return {
                line: i,
                start: contentStart,
                end: contentStart + tagMatch[2].length,
                content: tagMatch[2],
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      Logger.warn('解析HTML表格单元格位置时出错:', error);
      return null;
    }
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
    const foundTr = 0;
    const foundTd = 0;
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
    this.$drawSortSymbol();
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
      container.appendChild(li);
    }, true);
    this.tableEditor.editorDom.symbolContainer = container;
    this.container.appendChild(this.tableEditor.editorDom.symbolContainer);
    this.$setSymbolOffset();
  }
  $drawSortSymbol() {
    // const types = ['RowLeft', 'RowRight', 'ColUp', 'ColDown']; // 不要底部的拖拽按钮了，貌似没啥用
    const types = ['RowLeft', 'RowRight', 'ColUp'];

    const container = document.createElement('ul');
    container.className = 'cherry-previewer-table-hover-handler-sort-container';
    types.forEach((type) => {
      const sortSymbol = document.createElement('li');
      sortSymbol.setAttribute('data-type', type);
      sortSymbol.className = 'cherry-previewer-table-hover-handler__sort ch-icon';
      sortSymbol.draggable = true;
      if (type.startsWith('Row')) {
        sortSymbol.title = this.$cherry.locale.moveRow;
        sortSymbol.classList.add('ch-icon-swap-vert');
        sortSymbol.addEventListener('mouseover', () => {
          const { tdNode } = this.tableEditor.info;
          tdNode.draggable = true;

          tdNode.parentNode.style.backgroundColor = 'rgb(206,226,248)';
        });
        sortSymbol.addEventListener('mouseleave', () => {
          const { tdNode } = this.tableEditor.info;
          tdNode.draggable = false;
          tdNode.parentNode.style.backgroundColor = '';
        });
        sortSymbol.addEventListener('mousedown', (e) => {
          this.$setSelection(this.tableEditor.info.tableIndex, 'table');
          this.$dragLine();
        });
      } else {
        sortSymbol.title = this.$cherry.locale.moveCol;
        sortSymbol.classList.add('ch-icon-swap');
        const highLightTrDom = [];
        sortSymbol.addEventListener('mouseover', () => {
          const { tdNode } = this.tableEditor.info;
          tdNode.draggable = true;

          const index = Array.from(tdNode.parentNode.children).indexOf(tdNode);

          Array.from(tdNode.parentNode.parentNode.parentNode.children)
            .map((item) => item.children)
            .forEach((item) => {
              Array.from(item).forEach((tr) => {
                highLightTrDom.push(tr);
              });
            });
          highLightTrDom.forEach((tr) => (tr.children[index].style.backgroundColor = 'rgb(206,226,248)'));
        });
        sortSymbol.addEventListener('mouseleave', () => {
          const { tdNode } = this.tableEditor.info;
          tdNode.draggable = false;
          const index = Array.from(tdNode.parentNode.children).indexOf(tdNode);
          highLightTrDom.forEach((tr) => (tr.children[index].style.backgroundColor = ''));
        });
        sortSymbol.addEventListener('mousedown', (e) => {
          this.$setSelection(this.tableEditor.info.tableIndex, 'table');
          this.$dragCol();
        });
      }
      container.appendChild(sortSymbol);
    });
    this.tableEditor.editorDom.sortContainer = container;
    this.container.appendChild(this.tableEditor.editorDom.sortContainer);
    this.$setSortSymbolsPosition();
  }
  $setSortSymbolsPosition() {
    const container = this.tableEditor.editorDom.sortContainer;
    const { tableNode, tdNode, isTHead } = this.tableEditor.info;
    const tableInfo = this.$getPosition(tableNode);
    const tdInfo = this.$getPosition(tdNode);

    this.setStyle(this.container, 'width', `${tableInfo.width}px`);
    this.setStyle(this.container, 'height', `${tableInfo.height}px`);
    this.setStyle(this.container, 'top', `${tableInfo.top}px`);
    this.setStyle(this.container, 'left', `${tableInfo.left}px`);

    container.childNodes.forEach((node) => {
      const { type } = node.dataset;

      switch (type) {
        case 'RowLeft':
          this.setStyle(node, 'top', `${tdInfo.top - tableInfo.top + tdInfo.height / 2 - node.offsetHeight / 2}px`);
          this.setStyle(node, 'left', `${-node.offsetWidth / 2}px`);
          break;
        case 'RowRight':
          this.setStyle(node, 'top', `${tdInfo.top - tableInfo.top + tdInfo.height / 2 - node.offsetHeight / 2}px`);
          this.setStyle(node, 'left', `${tableInfo.width - node.offsetWidth / 2}px`);
          break;
        case 'ColUp':
          this.setStyle(node, 'left', `${tdInfo.left - tableInfo.left + tdInfo.width / 2 - node.offsetWidth / 2}px`);
          this.setStyle(node, 'top', `${-node.offsetHeight / 2}px`);
          break;
        case 'ColDown':
          this.setStyle(node, 'left', `${tdInfo.left - tableInfo.left + tdInfo.width / 2 - node.offsetWidth / 2}px`);
          this.setStyle(node, 'top', `${tableInfo.height - node.offsetHeight / 2}px`);

          break;
      }
      if (isTHead && type.startsWith('Row')) {
        this.setStyle(node, 'display', 'none');
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
    const newRow = `${'|'.repeat(this.tableEditor.info.columns)}\n`;
    this.codeMirror.replaceRange(newRow, { line: line + 1, ch: 0 });
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
        }
      }
    }
  }

  /**
   * 高亮当前行
   */
  $highlightRow() {
    this.$doHighlightRow('1px solid red');
  }

  /**
   * 取消高亮当前行
   */
  $cancelHighlightRow() {
    this.$doHighlightRow('');
  }

  $doHighlightRow(style = '') {
    const { trNode, tableNode } = this.tableEditor.info;
    const tds = trNode.cells;
    const preTds = trNode.previousElementSibling?.cells || tableNode.tHead.firstChild.cells;
    for (let i = 0; i < tds.length; i++) {
      if (preTds[i]) preTds[i].style.borderBottom = style;
      tds[i].style.borderBottom = style;
    }
    tds[0].style.borderLeft = style;
    tds[tds.length - 1].style.borderRight = style;
  }

  /**
   * 添加删除按钮
   */
  $drawDelete() {
    const types = ['top', 'bottom', 'right'];
    const buttons = types.map((type) => [type]);
    const container = document.createElement('div');
    container.className = 'cherry-previewer-table-hover-handler-delete-container';
    buttons.forEach(([type]) => {
      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('data-type', type);
      button.className = 'cherry-previewer-table-hover-handler__delete ch-icon ch-icon-cherry-table-delete';
      if (/(right|left)/.test(type)) {
        button.title = this.$cherry.locale.deleteRow;
        button.addEventListener('click', () => {
          this.$deleteCurrentRow();
        });
        button.addEventListener('mouseover', () => {
          this.$highlightRow();
        });
        button.addEventListener('mouseout', () => {
          this.$cancelHighlightRow();
        });
      } else {
        button.title = this.$cherry.locale.deleteColumn;
        button.addEventListener('click', () => {
          this.$deleteCurrentColumn();
        });
        button.addEventListener('mouseover', () => {
          this.$highlightColumn();
        });
        button.addEventListener('mouseout', () => {
          this.$cancelHighlightColumn();
        });
      }
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
    const { tableNode, tdNode, isTHead } = this.tableEditor.info;
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
      if (/(right|left)/.test(type)) {
        if (isTHead) {
          this.setStyle(node, 'display', 'none');
        }
        this.setStyle(node, 'top', `${tdInfo.top - tableInfo.top + tdInfo.height / 2 - node.offsetHeight / 2}px`);
        this.setStyle(node, `${type}`, `-${node.offsetWidth + 5}px`);
      } else {
        this.setStyle(node, `${type}`, `-${offset.outer}px`);
        this.setStyle(node, 'left', `${tdInfo.left - tableInfo.left + tdInfo.width / 2 - node.offsetWidth / 2}px`);
      }
    });
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
   * 拖拽列
   */
  $dragCol() {
    const oldTdIndex = this.tableEditor.info.tdIndex;
    const thNode = this.target.parentElement;
    const lines = this.codeMirror.getSelection().split(/\n/);
    const { tdNode } = this.tableEditor.info;
    const that = this;
    tdNode.setAttribute('draggable', true);

    function handleDragLeave(event) {
      that.setStyle(event.target, 'border', '1px solid #dfe6ee');
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
      const newLines = lines.map((line, index) => {
        const cells = line
          .split('|')
          .map((item) => (item === '' ? 'CHERRY_MARKDOWN_PENDING_TEXT_FOR_EMPTY_CELL' : item))
          .slice(1, -1);
        return `|${that.$operateLines(oldTdIndex, tdIndex, cells).join('|')}|`;
      });
      const newText = newLines.join('\n').replace(/CHERRY_MARKDOWN_PENDING_TEXT_FOR_EMPTY_CELL/g, '');
      that.codeMirror.replaceSelection(newText);
      that.setStyle(event.target, 'border', '1px solid #dfe6ee');
      that.$findTableInEditor();
      that.$setSelection(that.tableEditor.info.tableIndex, 'table');

      thNode.removeEventListener('dragleave', handleDragLeave);
      thNode.removeEventListener('dragover', handleDragOver);
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
    trNode.setAttribute('draggable', true);
    this.$setSelection(this.tableEditor.info.tableIndex, 'table');
    const oldTrIndex = this.tableEditor.info.trIndex + 2;
    const tBody = trNode.parentElement;
    const lines = this.codeMirror.getSelection().split(/\n/);
    const that = this;

    function handleDragLeave(event) {
      that.setStyle(event.target.parentElement, 'border', '1px solid #dfe6ee');
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
      const newText = that.$operateLines(oldTrIndex, trIndex, lines).join('\n');
      that.codeMirror.replaceSelection(newText);

      that.$findTableInEditor();
      that.$setSelection(that.tableEditor.info.tableIndex, 'table');
      that.setStyle(event.target.parentElement, 'border', '1px solid #dfe6ee');

      tBody.removeEventListener('dragleave', handleDragLeave);
      tBody.removeEventListener('dragover', handleDragOver);
    }

    tBody.addEventListener('dragleave', handleDragLeave);
    tBody.addEventListener('dragover', handleDragOver);
    tBody.addEventListener('drop', handleDrop, { once: true });
  }

  $dragSymbol(objTarget, oldIndex, index, type) {
    const { target } = this;
    if (target !== objTarget && oldIndex !== index) {
      if ((target.tagName === 'TH' || target.tagName === 'TD') && type === 'Col') {
        if (oldIndex < index) {
          this.setStyle(objTarget, 'border', `1px solid #dfe6ee`);
          this.setStyle(objTarget, 'border-right', `2px solid #6897bb`);
        } else if (oldIndex > index) {
          this.setStyle(objTarget, 'border', `1px solid #dfe6ee`);
          this.setStyle(objTarget, 'border-left', `2px solid #6897bb`);
        }
      } else if (target.tagName === 'TD' && type === 'Line') {
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
