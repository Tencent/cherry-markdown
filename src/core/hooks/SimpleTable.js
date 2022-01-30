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
import ParagraphBase from '@/core/ParagraphBase';

export default class SimpleTable extends ParagraphBase {
  static HOOK_NAME = 'simpleTable';

  constructor({ externals, config }) {
    super({ needCache: true });
  }

  $prevTdKey(curTdKey) {
    return curTdKey.replace(/^([0-9]+)-([0-9]+)$/, function (match, num1, num2) {
      return `${num1}-${+num2 - 1}`;
    });
  }

  $nextTdKey(curTdKey) {
    return curTdKey.replace(/^([0-9]+)-([0-9]+)$/, function (match, num1, num2) {
      return `${num1}-${+num2 + 1}`;
    });
  }

  $prevTrKey(curTrKey) {
    return curTrKey.replace(/^([0-9]+)-([0-9]+)$/, function (match, num1, num2) {
      return `${+num1 - 1}-${num2}`;
    });
  }

  $nextTrKey(curTrKey) {
    return curTrKey.replace(/^([0-9]+)-([0-9]+)$/, function (match, num1, num2) {
      return `${+num1 + 1}-${num2}`;
    });
  }

  $setColMapVal(autoMergeMap, curCellKey) {
    if (autoMergeMap[curCellKey] === undefined)
      return (autoMergeMap[curCellKey] = [1, 2]), (autoMergeMap[this.$nextTdKey(curCellKey)] = [1, -1]), autoMergeMap;
    if (-1 === autoMergeMap[curCellKey][1]) {
      const prevTdKey = this.$prevTdKey(curCellKey);
      return (autoMergeMap[this.$nextTdKey(curCellKey)] = [1, -1]), this.$setColMapVal(autoMergeMap, prevTdKey);
    }
    return (autoMergeMap[curCellKey][1] += 1), autoMergeMap;
  }

  $setRowMapVal(autoMergeMap, curCellKey) {
    if (autoMergeMap[curCellKey] === undefined)
      return (autoMergeMap[curCellKey] = [2, 1]), (autoMergeMap[this.$nextTrKey(curCellKey)] = [-1, 1]), autoMergeMap;
    const nextTrKey = this.$nextTrKey(curCellKey);
    if (
      ((autoMergeMap[nextTrKey] = autoMergeMap[nextTrKey] === undefined ? [1, 1] : autoMergeMap[nextTrKey]),
      autoMergeMap[curCellKey][1] !== autoMergeMap[nextTrKey][1])
    )
      return autoMergeMap;
    if (1 === autoMergeMap[curCellKey][0])
      return (autoMergeMap[curCellKey][0] = 2), (autoMergeMap[nextTrKey][0] = -1), autoMergeMap;
    if (-1 === autoMergeMap[curCellKey][0]) {
      const prevTrKey = this.$prevTrKey(curCellKey);
      return (autoMergeMap[nextTrKey][0] = -1), this.$setRowMapVal(autoMergeMap, prevTrKey);
    }
    return (autoMergeMap[curCellKey][0] += 1), autoMergeMap;
  }

  $dealColCell(rowIdx, colIdx, line, autoMergeMap) {
    const nextColIdx = +colIdx + 1;
    const nextCol = !!line[nextColIdx] && line[nextColIdx].trim();
    const curCell = line[colIdx].trim();
    const curCellKey = this.$getCellKey(rowIdx, colIdx);
    return curCell === nextCol ? this.$setColMapVal(autoMergeMap, curCellKey) : autoMergeMap;
  }

  $dealRowCell(rowIdx, colIdx, line, autoMergeMap) {
    const nextRowIdx = +rowIdx + 1;
    const nextRow = !(!line[nextRowIdx] || !line[nextRowIdx][colIdx]) && line[nextRowIdx][colIdx].trim();
    const curCell = line[rowIdx][colIdx].trim();
    const curCellKey = this.$getCellKey(rowIdx, colIdx);
    return curCell === nextRow ? this.$setRowMapVal(autoMergeMap, curCellKey) : autoMergeMap;
  }

  $getCellKey(num1, num2) {
    return `${num1}-${num2}`;
  }

  $getColAndRowSpanMap(lines) {
    let autoMergeMap = {};
    lines.forEach((line, rowIdx) => {
      line.forEach((tt, colIdx) => {
        autoMergeMap = this.$dealColCell(rowIdx, colIdx, line, autoMergeMap);
      });
    });
    lines.forEach((line, rowIdx, A) => {
      line.forEach((tt, colIdx) => {
        autoMergeMap = this.$dealRowCell(rowIdx, colIdx, lines, autoMergeMap);
      });
    });
    return autoMergeMap;
  }

  $convertTrsString2Array(lines) {
    const t = [];
    if (!lines) return lines;

    lines.forEach((line) => {
      line.length > 0 &&
        t.push(
          line
            .replace(/^\|{2,3}/, '')
            .replace(/\|\|\s*$/, '')
            .split('||'),
        );
    });
    return t;
  }

  $isMeerged(autoMergeMap, curSpanKey) {
    return !!autoMergeMap[curSpanKey] && (autoMergeMap[curSpanKey][0] < 0 || autoMergeMap[curSpanKey][1] < 0);
  }

  $getTdSpan(autoMergeMap, curSpanKey) {
    return autoMergeMap[curSpanKey] !== undefined
      ? `rowspan="${autoMergeMap[curSpanKey][0]}" colspan="${autoMergeMap[curSpanKey][1]}"`
      : '';
  }

  $dealTh(str) {
    const thRightReg = /^\s*~T/.test(str);
    const thLeftReg = /~T\s*$/.test(str);
    const result = { style: '', content: '' };
    if (thRightReg && thLeftReg) {
      result.align = 'align="center"';
    } else if (thLeftReg) {
      result.align = 'align="left"';
    } else if (thRightReg) {
      result.align = 'align="right"';
    }
    result.content = str
      .replace(/^\s*~T/, '')
      .replace(/~T\s*$/, '')
      .trim();
    return result;
  }

  makeHtml(str, sentenceMakeFunc) {
    const self = this;
    return str.replace(/(^|\n)\s*?((?:\|\|[^\n]+(?:$|\n))+)/g, function (match, leading, sourceContent) {
      const sign = self.$engine.md5(sourceContent);
      const linesCount = sourceContent.match(/\n/g).length;
      const isAutoMerge = /^\|\|\|/.test(sourceContent);
      const needTableHeader = /\|{2,3}\s*~T/.test(sourceContent) || /~T\s*\|\|/.test(sourceContent);
      let lines = sourceContent.split(/\n/);
      let headerStr = '';
      const trHtmlList = [];
      const tdHtmlList = [];
      if (needTableHeader && lines[0]) {
        headerStr = '<thead><tr>';

        lines[0]
          .replace(/^\|{2,3}/, '')
          .replace(/\|\|\s*$/, '')
          .split('||')
          .forEach((line) => {
            const thHtmlContent = self.$dealTh(line);
            tdHtmlList.push(thHtmlContent.align),
              (headerStr += `<th ${thHtmlContent.align}>${sentenceMakeFunc(thHtmlContent.content).html}</th>`);
          });
        (headerStr += '</tr></thead>'), lines.shift();
      }
      lines = self.$convertTrsString2Array(lines);

      const autoMergeMap = isAutoMerge ? self.$getColAndRowSpanMap(lines) : {};

      lines.forEach((line, rowIdx) => {
        let trStr = '<tr>';

        line.forEach((cell, colIdx) => {
          const curSpanKey = self.$getCellKey(rowIdx, colIdx);
          if (!self.$isMeerged(autoMergeMap, curSpanKey))
            trStr += `<td ${tdHtmlList[colIdx] ? tdHtmlList[colIdx] : ''} ${self.$getTdSpan(
              autoMergeMap,
              curSpanKey,
            )}>${sentenceMakeFunc(cell.trim()).html}</td>`;
        });
        trStr += '</tr>';
        trHtmlList.push(trStr);
      });

      const tableStr = `<div class="cherry-table-container simple-table" data-lines="${linesCount}" data-sign="${sign}">\n        <table class="cherry-table">${
        headerStr + trHtmlList.join('')
      }</table></div>`;

      return `${leading}${self.pushCache(tableStr, sign)}`;
    });
  }
}
