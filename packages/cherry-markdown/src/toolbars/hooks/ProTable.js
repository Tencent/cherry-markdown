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
import MenuBase from '@/toolbars/MenuBase';
/**
 * 图表表格工具栏组合
 */
export default class ProTable extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('proTable', 'insertLineChart');
    this.localeName = $cherry.options.locale;
    /** @type {import('@/toolbars/MenuBase').SubMenuConfigItem[]} */
    this.subMenuConfig = [
      { iconName: 'insertLineChart', name: 'lineTable', onclick: this.bindSubClick.bind(this, 'lineTable') },
      { iconName: 'insertBarChart', name: 'barTable', onclick: this.bindSubClick.bind(this, 'barTable') },
      { iconName: 'insertRadarChart', name: 'radarTable', onclick: this.bindSubClick.bind(this, 'radarTable') },
      { iconName: 'insertMapChart', name: 'mapTable', onclick: this.bindSubClick.bind(this, 'mapTable') },
      { iconName: 'insertHeatmapChart', name: 'heatmapTable', onclick: this.bindSubClick.bind(this, 'heatmapTable') },
      { iconName: 'insertScatterChart', name: 'scatterTable', onclick: this.bindSubClick.bind(this, 'scatterTable') },
      { iconName: 'insertPieChart', name: 'pieTable', onclick: this.bindSubClick.bind(this, 'pieTable') },
    ];
  }

  /**
   * 获取子菜单数组
   * @returns {Array} 返回子菜单
   */
  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  // 重载之后就无法插入代码了，但是不知道这么做的目的，先注释掉。
  // /**
  //  * 绑定子菜单点击事件
  //  * @param {string} type 图表类型
  //  * @param {string} selection 编辑区选中的内容
  //  * @param {boolean} [async] 是否异步
  //  * @param {Function} [callback] 回调函数
  //  */
  // bindSubClick(type, selection, async, callback) {
  //   return this.onClick(selection, type);
  // }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键或子菜单类型
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = 'lineTable') {
    switch (shortKey) {
      case 'lineTable':
        return this.insertLineTable(selection);
      case 'barTable':
        return this.insertBarTable(selection);
      case 'radarTable':
        return this.insertRadarTable(selection);
      case 'mapTable':
        return this.insertMapTable(selection);
      case 'heatmapTable':
        return this.insertHeatmapTable(selection);
      case 'pieTable':
        return this.insertPieTable(selection);
      case 'scatterTable':
        return this.insertScatterTable(selection);
      default:
        return this.insertLineTable(selection);
    }
  }

  /**
   * 插入折线图表格
   */
  insertLineTable(selection) {
    return `${selection}\n\n${[
      `| :line: {"title": "${this.$cherry.locale.lineTable}"} | a | b | c |`,
      '| :-: | :-: | :-: | :-: |',
      '| x | 1 | 2 | 3 |',
      '| y | 2 | 4 | 6 |',
      '| z | 7 | 5 | 3 |',
    ].join('\n')}\n\n`;
  }

  /**
   * 插入柱状图表格
   */
  insertBarTable(selection) {
    return `${selection}\n\n${[
      `| :bar: {"title": "${this.$cherry.locale.barTable}"} | a | b | c |`,
      '| :-: | :-: | :-: | :-: |',
      '| x | 1 | 2 | 3 |',
      '| y | 2 | 4 | 6 |',
      '| z | 7 | 5 | 3 |',
    ].join('\n')}\n\n`;
  }

  /**
   * 插入雷达图表格
   */
  insertRadarTable(selection) {
    return `${selection}\n\n${[
      `| :radar: {"title": "${this.$cherry.locale.radarTable}"} | 技能1 | 技能2 | 技能3 | 技能4 | 技能5 |`,
      '| :-: | :-: | :-: | :-: | :-: | :-: |',
      '| 用户A | 90 | 85 | 75 | 80 | 88 |',
      '| 用户B | 75 | 90 | 88 | 85 | 78 |',
      '| 用户C | 85 | 78 | 90 | 88 | 85 |',
    ].join('\n')}\n\n`;
  }

  /**
   * 插入地图表格
   */
  insertMapTable(selection) {
    return `${selection}\n\n${[
      `| :map:{"title": "${this.$cherry.locale.mapTable}", "mapDataSource": "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"} | 数值 |`,
      '| :-: | :-: |',
      '| 北京 | 120 |',
      '| 上海 | 280 |',
      '| 广东 | 350 |',
      '| 四川 | 180 |',
      '| 江苏 | 290 |',
      '| 浙江 | 220 |',
    ].join('\n')}\n\n`;
  }

  /**
   * 插入热力图表格
   */
  insertHeatmapTable(selection) {
    return `${selection}\n\n${[
      `| :heatmap:{"title": "${this.$cherry.locale.heatmapTable}"} | 周一 | 周二 | 周三 | 周四 | 周五 |`,
      '| :-: | :-: | :-: | :-: | :-: | :-: |',
      '| 9:00 | 10 | 15 | 8 | 12 | 20 |',
      '| 12:00 | 25 | 30 | 18 | 22 | 35 |',
      '| 15:00 | 18 | 20 | 25 | 28 | 30 |',
      '| 18:00 | 35 | 40 | 32 | 38 | 45 |',
    ].join('\n')}\n\n`;
  }

  /**
   * 插入饼图表格
   */
  insertPieTable(selection) {
    return `${selection}\n\n${[
      `| :pie:{"title": "${this.$cherry.locale.pieTable}"} | 数值 |`,
      '| :-: | :-: |',
      '| 苹果 | 35 |',
      '| 香蕉 | 25 |',
      '| 橙子 | 20 |',
      '| 葡萄 | 15 |',
      '| 其他 | 5 |',
    ].join('\n')}\n\n`;
  }

  /**
   * 插入散点图表格
   */
  insertScatterTable(selection) {
    return `${selection}\n\n${[
      `| :scatter:{"title": "${this.$cherry.locale.scatterTable}"} | X | Y | Size | Series |`,
      '| :-: | :-: | :-: | :-: | :-: |',
      '| A1 | 10 | 20 | 5 | S1 |',
      '| A2 | 15 | 35 | 8 | S1 |',
      '| B1 | 30 | 12 | 3 | S2 |',
      '| B2 | 25 | 28 | 6 | S2 |',
      '| C1 | 50 | 40 | 9 | S3 |',
      '| C2 | 60 | 55 | 7 | S3 |',
    ].join('\n')}\n\n`;
  }
}
