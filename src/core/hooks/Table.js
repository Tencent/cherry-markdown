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
import { getTableRule } from '@/utils/regexp';

const TABLE_LOOSE = 'loose';
const TABLE_STRICT = 'strict';

export default class Table extends ParagraphBase {
  static HOOK_NAME = 'table';

  constructor({ externals, config }) {
    super({ needCache: true });
    const {
      enableChart,
      chartRenderEngine: ChartRenderEngine,
      externals: requiredPackages,
      chartEngineOptions = {},
    } = config;
    this.chartRenderEngine = null;
    if (enableChart === true) {
      try {
        this.chartRenderEngine = new ChartRenderEngine({
          // 注入需要的第三方包
          ...(externals &&
            requiredPackages instanceof Array &&
            requiredPackages.reduce((acc, pkg) => {
              delete chartEngineOptions[pkg]; // 过滤第三方包选项
              return { ...acc, [pkg]: externals[pkg] };
            }, {})),
          renderer: 'svg',
          width: 500,
          height: 300,
          ...chartEngineOptions,
        });
      } catch (error) {
        console.warn(error);
      }
    }
  }

  // 保持每列长度一致
  $extendColumns(row, colCount) {
    const delta = colCount - row.length;
    if (delta < 1) {
      return row;
    }
    return row.concat('&nbsp;|'.repeat(delta).split('|', delta));
  }

  $parseChartOptions(cell) {
    // 初始化失败
    if (!this.chartRenderEngine) {
      return null;
    }
    const CHART_REGEX = /^[ ]*:(\w+):(?:[ ]*{(.*?)}[ ]*)?$/;
    if (!CHART_REGEX.test(cell)) {
      return null;
    }
    const match = cell.match(CHART_REGEX);
    const [, chartType, axisOptions] = match;
    const DEFAULT_AXIS_OPTIONS = ['x', 'y'];
    return {
      type: chartType,
      options: axisOptions ? axisOptions.split(/\s*,\s*/) : DEFAULT_AXIS_OPTIONS,
    };
  }

  $parseColumnAlignRules(row) {
    const COLUMN_ALIGN_MAP = { L: 'left', R: 'right', C: 'center' };
    const COLUMN_ALIGN_CACHE_SIGN = ['U', 'L', 'R', 'C']; // U for undefined
    const textAlignRules = row.map((rule) => {
      const $rule = rule.trim();
      let index = 0;
      if (/^:/.test($rule)) {
        index += 1;
      }
      if (/:$/.test($rule)) {
        index += 2;
      }
      return COLUMN_ALIGN_CACHE_SIGN[index];
    });
    return { textAlignRules, COLUMN_ALIGN_MAP };
  }

  $parseTable(lines, sentenceMakeFunc, dataLines) {
    let maxCol = 0;
    const rows = lines.map((line, index) => {
      const cols = line.replace(/\\\|/g, '~CS').split('|');
      if (cols[0] === '') {
        cols.shift();
      }
      if (cols[cols.length - 1] === '') {
        cols.pop();
      }
      // 文本对齐相关列，不作为最多列数的参考依据
      index !== 1 && (maxCol = Math.max(maxCol, cols.length));
      return cols;
    });
    const { textAlignRules, COLUMN_ALIGN_MAP } = this.$parseColumnAlignRules(rows[1]);
    const tableObject = {
      header: [],
      rows: [],
      colLength: maxCol,
      rowLength: rows.length - 2, // 去除表头和控制行
    };
    const chartOptions = this.$parseChartOptions(rows[0][0]);
    const chartOptionsSign = this.$engine.md5(rows[0][0]);
    // 如果需要生成图表，
    if (chartOptions) {
      rows[0][0] = '';
    }
    /**
     * ~CTHD: <thead>
     * ~CTHD$: </thead>
     * ~CTBD: <tbody>
     * ~CTBD$: </tbody>
     * ~CTR: <tr>
     * ~CTR$: </tr>
     * ~CTH(L|R|C|U): <th>
     * ~CTH$: </th>
     * ~CTD(L|R|C|U): <td>
     * ~CTD$: </td>
     */
    const tableHeader = this.$extendColumns(rows[0], maxCol)
      .map((cell, col) => {
        tableObject.header.push(cell.replace(/~CS/g, '\\|'));
        const { html: cellHtml } = sentenceMakeFunc(cell.replace(/~CS/g, '\\|').trim());
        // 前后补一个空格，否则自动链接会将缓存的内容全部收入链接内部
        return `~CTH${textAlignRules[col] || 'U'} ${cellHtml} ~CTH$`;
      })
      .join('');
    const tableRows = rows
      .reduce((table, row, line) => {
        if (line <= 1) {
          return table;
        }
        const currentRowCountWithoutHeader = line - 2;
        tableObject.rows[currentRowCountWithoutHeader] = [];
        const $extendedColumns = this.$extendColumns(row, maxCol).map((cell, col) => {
          tableObject.rows[currentRowCountWithoutHeader].push(cell.replace(/~CS/g, '\\|'));
          const { html: cellHtml } = sentenceMakeFunc(cell.replace(/~CS/g, '\\|').trim());
          // 前后补一个空格，否则自动链接会将缓存的内容全部收入链接内部
          return `~CTD${textAlignRules[col] || 'U'} ${cellHtml} ~CTD$`;
        });
        table.push(`~CTR${$extendedColumns.join('')}~CTR$`);
        return table;
      }, [])
      .join('');
    // console.log('obj', tableObject);
    const tableResult = this.$renderTable(COLUMN_ALIGN_MAP, tableHeader, tableRows, dataLines);
    if (!chartOptions) {
      return tableResult;
    }
    const chart = this.chartRenderEngine.render(chartOptions.type, chartOptions.options, tableObject);
    const chartHtml = `<figure id="table_chart_${chartOptionsSign}_${tableResult.sign}"
      data-sign="table_chart_${chartOptionsSign}_${tableResult.sign}" data-lines="0">${chart}</figure>`;
    return {
      html: `${chartHtml}${tableResult.html}`,
      sign: chartOptionsSign + tableResult.sign,
    };
  }

  /**
   * 如果table.head是空的，就不渲染<thead>了
   * @param {String} str
   * @returns {Boolean}
   */
  $testHeadEmpty(str) {
    const test = str
      .replace(/&nbsp;/g, '')
      .replace(/\s/g, '')
      .replace(/(~CTH\$|~CTHU|~CTHL|~CTHR|~CTHC)/g, '');
    return test?.length > 0;
  }

  $renderTable(COLUMN_ALIGN_MAP, tableHeader, tableRows, dataLines) {
    const cacheSrc = this.$testHeadEmpty(tableHeader)
      ? `~CTHD${tableHeader}~CTHD$~CTBD${tableRows}~CTBD$`
      : `~CTBD${tableRows}~CTBD$`;
    const html = cacheSrc;
    const sign = this.$engine.md5(html);
    const renderHtml = html
      .replace(/~CTHD\$/g, '</thead>')
      .replace(/~CTHD/g, '<thead>')
      .replace(/~CTBD\$/g, '</tbody>')
      .replace(/~CTBD/g, '</tbody>')
      .replace(/~CTR\$/g, '</tr>')
      .replace(/~CTR/g, '<tr>')
      .replace(/[ ]?~CTH\$/g, '</th>')
      .replace(/[ ]?~CTD\$/g, '</td>') // 在这里将加上的空格还原回来
      .replace(/~CT(D|H)(L|R|C|U)[ ]?/g, (match, type, align) => {
        let tag = `<t${type}`;
        if (align === 'U') {
          tag += '>';
        } else {
          tag += ` align="${COLUMN_ALIGN_MAP[align]}">`;
        }
        return tag;
      })
      .replace(/\\\|/g, '|'); // escape \|
    return {
      html: `<div class="cherry-table-container" data-sign="${sign}${dataLines}" data-lines="${dataLines}">
        <table class="cherry-table">${renderHtml}</table></div>`,
      sign,
    };
  }

  makeHtml(str, sentenceMakeFunc) {
    let $str = str;
    // strict fenced mode
    if (this.test($str, TABLE_STRICT)) {
      $str = $str.replace(this.RULE[TABLE_STRICT].reg, (match, leading) => {
        const dataLines = this.getLineCount(match, leading);
        // 必须先trim，否则分割出来的结果不对
        // 将fenced mode转换为loose mode
        const lines = match
          .trim()
          .split(/\n/)
          .map((line) => String(line).trim());
        const { html: table, sign } = this.$parseTable(lines, sentenceMakeFunc, dataLines);
        return this.getCacheWithSpace(this.pushCache(table, sign, dataLines), match);
      });
    }
    // loose mode
    if (this.test($str, TABLE_LOOSE)) {
      // console.log(TABLE_LOOSE);
      $str = $str.replace(this.RULE[TABLE_LOOSE].reg, (match, leading) => {
        const dataLines = this.getLineCount(match, leading);
        // 必须先trim，否则分割出来的结果不对
        const lines = match
          .trim()
          .split(/\n/)
          .map((line) => String(line).trim());
        const { html: table, sign } = this.$parseTable(lines, sentenceMakeFunc, dataLines);
        return this.getCacheWithSpace(this.pushCache(table, sign, dataLines), match);
      });
    }
    return $str;
  }

  test(str, flavor) {
    return this.RULE[flavor].reg && this.RULE[flavor].reg.test(str);
  }

  rule() {
    return getTableRule();
  }
}
