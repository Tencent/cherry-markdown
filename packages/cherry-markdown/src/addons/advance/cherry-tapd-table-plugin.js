/**
 * Tencent is pleased to support the open source community by making CherryMarkdown available.
 *
 * Copyright (C) 2021 Tencent. All rights reserved.
 * The below software in this distribution may have been modified by Tencent ("Tencent Modifications").
 *
 * All Tencent Modifications are Copyright (C) Tencent.
 *
 * CherryMarkdown is licensed under the Apache License, Version 2.0 (the "License");
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
/* eslint-disable no-underscore-dangle */
import ParagraphBase from '@/core/ParagraphBase';
/**
 * [TAPD](https://tapd.cn)的简单表格语法
 * 该表格语法不是markdown通用的表格语法，请谨慎使用
 * 该简单表格语法特点：
 *    1、轻量，不需要强制指定表头和对齐方式
 *    2、支持单元格合并，打开合并开关后，多个连续相同的cell会自动进行单元格合并
 * 例子：
 *    带标题：
 *    ||~项目                       ||~价格(居中)~   ||数量（右对齐）~  ||
 *    || 计算机 <br >(包括笔记本)  || $1600  ||   5    ||
 *    || 手机                       || $12    ||   5    ||
 *    || 管线                       || $1     ||   5    ||
 *    不带标题：
 *    || 计算机 <br >(包括笔记本)  || $1600  ||   5    ||
 *    || 手机                       || $12    ||   5    ||
 *    || 管线                       || $1     ||   5    ||
 *    自动合并：
 *    |||~项目                      ||价格   ||数量  ||
 *    || 计算机  || $3600（高配）  ||   20    ||
 *    || 笔记本  || $2600（中配）  ||   30    ||
 *    || 笔记本  || $1600（低配）  ||   40    ||
 *    || 总计                       || $214000   ||   90    ||
 */
export default class TapdTablePlugin extends ParagraphBase {
  static HOOK_NAME = 'tapdTable';

  constructor() {
    super({ needCache: true });
    this.cacheMap = {};
    this.sentenceMakeFunc = null;
  }

  /**
   * 根据当前坐标，获取同一行下一列的坐标
   * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
   * @returns {string} 新坐标
   */
  $nextTdKey(key) {
    return key.replace(/^([0-9]+)-([0-9]+)$/, (match, m1, m2) => {
      return `${m1}-${Number.parseInt(m2, 10) + 1}`;
    });
  }

  /**
   * 根据当前坐标，获取同一行上一列的坐标
   * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
   * @returns {string} 新坐标
   */
  $prevTdKey(key) {
    return key.replace(/^([0-9]+)-([0-9]+)$/, (match, m1, m2) => {
      return `${m1}-${Number.parseInt(m2, 10) - 1}`;
    });
  }

  /**
   * 根据当前坐标，获取同一列下一行的坐标
   * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
   * @returns {string} 新坐标
   */
  $nextTrKey(key) {
    return key.replace(/^([0-9]+)-([0-9]+)$/, (match, m1, m2) => {
      return `${Number.parseInt(m1, 10) + 1}-${m2}`;
    });
  }

  /**
   * 根据当前坐标，获取同一列上一行的坐标
   * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
   * @returns {string} 新坐标
   */
  $prevTrKey(key) {
    return key.replace(/^([0-9]+)-([0-9]+)$/, (match, m1, m2) => {
      return `${Number.parseInt(m1, 10) - 1}-${m2}`;
    });
  }

  /**
   * 设置每一个cell的colspan属性
   * @param {Object} map 存储每一个cell对应的rowspan和colspan值
   * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
   * @returns {Object} map
   */
  $setColMapVal(map, key) {
    if (typeof map[key] === 'undefined') {
      map[key] = [1, 2];
      map[this.$nextTdKey(key)] = [1, -1];
      return map;
    }
    if (map[key][1] === -1) {
      const preKey = this.$prevTdKey(key);
      map[this.$nextTdKey(key)] = [1, -1];
      return this.$setColMapVal(map, preKey);
    }
    map[key][1] += 1;

    return map;
  }

  /**
   * 设置每一个cell的rowspan属性
   * @param {Object} map 存储每一个cell对应的rowspan和colspan值
   * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
   * @returns {Object} map
   */
  $setRowMapVal(map, key) {
    if (typeof map[key] === 'undefined') {
      map[key] = [2, 1];
      map[this.$nextTrKey(key)] = [-1, 1];
      return map;
    }
    const nextTrkey = this.$nextTrKey(key);
    map[nextTrkey] = typeof map[nextTrkey] === 'undefined' ? [1, 1] : map[nextTrkey];
    if (map[key][1] !== map[nextTrkey][1]) {
      return map;
    }
    if (map[key][0] === 1) {
      map[key][0] = 2;
      map[nextTrkey][0] = -1;
      return map;
    }
    if (map[key][0] === -1) {
      const preKey = this.$prevTrKey(key);
      map[nextTrkey][0] = -1;
      return this.$setRowMapVal(map, preKey);
    }
    map[key][0] += 1;

    return map;
  }

  $dealColSpan(trIndex, tdIndex, tr, spanMap) {
    const nextIndex = Number.parseInt(tdIndex, 10) + 1;
    const nextTd = tr[nextIndex] ? tr[nextIndex].trim() : false;
    const currentTd = tr[tdIndex].trim();
    const key = this.$getSpanKey(trIndex, tdIndex);
    if (currentTd === nextTd) {
      return this.$setColMapVal(spanMap, key);
    }
    return spanMap;
  }

  $dealRowSpan(trIndex, tdIndex, trs, spanMap) {
    const nextIndex = Number.parseInt(trIndex, 10) + 1;
    const nextTd = trs[nextIndex] && trs[nextIndex][tdIndex] ? trs[nextIndex][tdIndex].trim() : false;
    const currentTd = trs[trIndex][tdIndex].trim();
    const key = this.$getSpanKey(trIndex, tdIndex);
    if (currentTd === nextTd) {
      return this.$setRowMapVal(spanMap, key);
    }
    return spanMap;
  }

  $getSpanKey(trIndex, tdIndex) {
    return `${trIndex}-${tdIndex}`;
  }

  // 获取单元格合并数据
  $getColAndRowSpanMap(trs) {
    let spanMap = {};
    // 优先算水平合并单元格
    for (const trIndex of trs.keys()) {
      const tr = trs[trIndex];
      for (const tdIndex of tr.keys()) {
        spanMap = this.$dealColSpan(trIndex, tdIndex, tr, spanMap);
      }
    }
    // 再算垂直合并单元格
    for (const trIndex of trs.keys()) {
      const tr = trs[trIndex];
      for (const tdIndex of tr.keys()) {
        spanMap = this.$dealRowSpan(trIndex, tdIndex, trs, spanMap);
      }
    }
    return spanMap;
  }

  $convertTrsString2Array(trs) {
    const ret = [];
    if (!trs) {
      return trs;
    }
    for (const tr of trs) {
      tr.length > 0 &&
        ret.push(
          tr
            .replace(/^\|{2,3}/, '')
            .replace(/\|\|\s*$/, '')
            .split('||'),
        );
    }
    return ret;
  }

  $isMeerged(span, key) {
    return span[key] ? span[key][0] < 0 || span[key][1] < 0 : false;
  }

  $getTdSpan(spanMap, key) {
    if (typeof spanMap[key] !== 'undefined') {
      return `rowspan="${spanMap[key][0]}" colspan="${spanMap[key][1]}"`;
    }
    return '';
  }

  $dealTh(oneTh) {
    const hasLeft = /^\s*~T/.test(oneTh);
    const hasRight = /~T\s*$/.test(oneTh);
    const ret = { style: '', content: '' };
    if (hasLeft && hasRight) {
      ret.align = 'align="center"';
    } else if (hasRight) {
      ret.align = 'align="right"';
    } else if (hasLeft) {
      ret.align = 'align="left"';
    }
    ret.content = oneTh
      .replace(/^\s*~T/, '')
      .replace(/~T\s*$/, '')
      .trim();
    return ret;
  }

  makeHtml(html, sentenceMakeFunc) {
    return html.replace(/(^|\n)\s*?((?:\|\|[^\n]+(?:$|\n))+)/g, (match, prev, content) => {
      const sign = this.$engine.md5(content);
      const lineCount = content.match(/\n/g).length;
      const autoMerge = /^\|\|\|/.test(content);
      const hasHead = /\|{2,3}\s*~T/.test(content) || /~T\s*\|\|/.test(content);
      let trs = content.split(/\n/);
      let thead = '';
      const tbody = [];
      const aligns = [];
      if (hasHead && trs[0]) {
        thead = '<thead><tr>';
        const ths = trs[0]
          .replace(/^\|{2,3}/, '')
          .replace(/\|\|\s*$/, '')
          .split('||');
        for (const oneTh of ths) {
          const thObj = this.$dealTh(oneTh);
          aligns.push(thObj.align);
          thead += `<th ${thObj.align}>${sentenceMakeFunc(thObj.content).html}</th>`;
        }
        thead += '</tr></thead>';
        trs.shift();
      }
      trs = this.$convertTrsString2Array(trs);
      const spanMap = autoMerge ? this.$getColAndRowSpanMap(trs) : {};
      for (const trIndex of trs.keys()) {
        const tr = trs[trIndex];
        let oneTr = '<tr>';
        for (const tdIndex of tr.keys()) {
          const key = this.$getSpanKey(trIndex, tdIndex);
          const oneTd = tr[tdIndex];
          if (!this.$isMeerged(spanMap, key)) {
            oneTr += `<td ${aligns[tdIndex] ? aligns[tdIndex] : ''} ${this.$getTdSpan(spanMap, key)}>${
              sentenceMakeFunc(oneTd.trim()).html
            }</td>`;
          }
        }
        oneTr += '</tr>';
        tbody.push(oneTr);
      }
      const html = `<div class="cherry-table-container simple-table" data-lines="${lineCount}" data-sign="${sign}">
        <table class="cherry-table">${thead + tbody.join('')}</table></div>`;
      return `${prev}${this.pushCache(html, sign)}`;
    });
  }

  // @ts-ignore
  rule() {
    return {};
  }
}
