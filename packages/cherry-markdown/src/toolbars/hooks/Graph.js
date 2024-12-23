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
import MenuBase from '@/toolbars/MenuBase';

function generateExample(title, mermaidCode) {
  return [title, '```mermaid', mermaidCode, '```'].join('\n');
}

const flowChartContent = [
  '\tA[公司] -->| 下 班 | B(菜市场)',
  '\tB --> C{看见<br>卖西瓜的}',
  '\tC -->|Yes| D[买一个包子]',
  '\tC -->|No| E[买一斤包子]',
].join('\n');

const flowChartContentEn = [
  '\tA[Company] -->| Finish work | B(Grocery Store)',
  '\tB --> C{See<br>Watermelon Seller}',
  '\tC -->|Yes| D[Buy a bun]',
  '\tC -->|No| E[Buy a kilogram of buns]',
].join('\n');

const sample = {
  flow: [
    'FlowChart',
    generateExample('左右结构', `graph LR\n${flowChartContent}`),
    generateExample('上下结构', `graph TD\n${flowChartContent}`),
  ].join('\n'),
  sequence: generateExample(
    'SequenceDiagram',
    [
      'sequenceDiagram',
      'autonumber',
      'A-->A: 文本1',
      'A->>B: 文本2',
      'loop 循环1',
      'loop 循环2',
      'A->B: 文本3',
      'end',
      'loop 循环3',
      'B -->>A: 文本4',
      'end',
      'B -->> B: 文本5',
      'end',
    ].join('\n'),
  ),
  state: generateExample(
    'StateDiagram',
    [
      'stateDiagram-v2',
      '[*] --> A',
      'A --> B',
      'A --> C',
      'state A {',
      '  \t[*] --> D',
      '  \tD --> [*]',
      '}',
      'B --> [*]',
      'C --> [*]',
    ].join('\n'),
  ),
  class: generateExample(
    'ClassDiagram',
    [
      'classDiagram',
      'Base <|-- One',
      'Base <|-- Two',
      'Base : +String name',
      'Base: +getName()',
      'Base: +setName(String name)',
      'class One{',
      '  \t+String newName',
      '  \t+getNewName()',
      '}',
      'class Two{',
      '  \t-int id',
      '  \t-getId()',
      '}',
    ].join('\n'),
  ),
  pie: generateExample('PieChart', ['pie', 'title 饼图', '"A" : 100', '"B" : 80', '"C" : 40', '"D" : 30'].join('\n')),
  gantt: generateExample(
    'GanttChart',
    [
      'gantt',
      '\ttitle 敏捷研发流程',
      '\tsection 迭代前',
      '\t\t交互设计     :a1, 2020-03-01, 4d',
      '\t\tUI设计        :after a1, 5d',
      '\t\t需求评审     : 1d',
      '\tsection 迭代中',
      '\t\t详细设计      :a2, 2020-03-11, 2d',
      '\t\t开发          :2020-03-15, 7d',
      '\t\t测试          :2020-03-22, 5d',
      '\tsection 迭代后',
      '\t\t发布: 1d',
      '\t\t验收: 2d',
      '\t\t回顾: 1d',
    ].join('\n'),
  ),
};

// 英文例子
const sampleEn = {
  flow: [
    'FlowChart',
    generateExample('Left-right structure', `graph LR\n${flowChartContentEn}`),
    generateExample('Top-bottom structure', `graph TD\n${flowChartContentEn}`),
  ].join('\n'),
  sequence: generateExample(
    'SequenceDiagram',
    [
      'sequenceDiagram',
      'autonumber',
      'A-->A: text1',
      'A->>B: text2',
      'loop loop1',
      'loop loop2',
      'A->B: text3',
      'end',
      'loop loop3',
      'B -->>A: text4',
      'end',
      'B -->> B: text5',
      'end',
    ].join('\n'),
  ),
  state: generateExample(
    'StateDiagram',
    [
      'stateDiagram-v2',
      '[*] --> A',
      'A --> B',
      'A --> C',
      'state A {',
      '  \t[*] --> D',
      '  \tD --> [*]',
      '}',
      'B --> [*]',
      'C --> [*]',
    ].join('\n'),
  ),
  class: generateExample(
    'ClassDiagram',
    [
      'classDiagram',
      'Base <|-- One',
      'Base <|-- Two',
      'Base : +String name',
      'Base: +getName()',
      'Base: +setName(String name)',
      'class One{',
      '  \t+String newName',
      '  \t+getNewName()',
      '}',
      'class Two{',
      '  \t-int id',
      '  \t-getId()',
      '}',
    ].join('\n'),
  ),
  pie: generateExample('PieChart', ['pie', 'title pie', '"A" : 100', '"B" : 80', '"C" : 40', '"D" : 30'].join('\n')),
  gantt: generateExample(
    'GanttChart',
    [
      'gantt',
      '\ttitle work',
      '\tsection session 1',
      '\t\twork1     :a1, 2020-03-01, 4d',
      '\t\twork2        :after a1, 5d',
      '\t\twork3     : 1d',
      '\tsection session 2',
      '\t\twork4      :a2, 2020-03-11, 2d',
      '\t\twork5          :2020-03-15, 7d',
      '\t\twork6          :2020-03-22, 5d',
      '\tsection session 3',
      '\t\twork7: 1d',
      '\t\twork8: 2d',
      '\t\twork9: 1d',
    ].join('\n'),
  ),
};

/**
 * 插入“画图”的按钮
 * 本功能依赖[Mermaid.js](https://mermaid-js.github.io)组件，请保证调用CherryMarkdown前已加载mermaid.js组件
 */
export default class Graph extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('graph', 'insertChart');
    this.noIcon = true;
    this.localeName = $cherry.options.locale;
    this.subMenuConfig = [
      // 流程图
      // 访问[Mermaid 流程图](https://mermaid-js.github.io/mermaid/#/flowchart)参考具体使用方法。
      { iconName: 'insertFlow', name: 'insertFlow', onclick: this.bindSubClick.bind(this, '1') },
      // 时序图
      // 访问[Mermaid 时序图](https://mermaid-js.github.io/mermaid/#/sequenceDiagram)参考具体使用方法
      { iconName: 'insertSeq', name: 'insertSeq', onclick: this.bindSubClick.bind(this, '2') },
      // 状态图
      // 访问[Mermaid 状态图](https://mermaid-js.github.io/mermaid/#/stateDiagram)参考具体使用方法
      { iconName: 'insertState', name: 'insertState', onclick: this.bindSubClick.bind(this, '3') },
      // 类图
      // 访问[Mermaid UML图](https://mermaid-js.github.io/mermaid/#/classDiagram)参考具体使用方法
      { iconName: 'insertClass', name: 'insertClass', onclick: this.bindSubClick.bind(this, '4') },
      // 饼图
      // 访问[Mermaid 饼图](https://mermaid-js.github.io/mermaid/#/pie)参考具体使用方法
      { iconName: 'insertPie', name: 'insertPie', onclick: this.bindSubClick.bind(this, '5') },
      // 甘特图
      { iconName: 'insertGantt', name: 'insertGantt', onclick: this.bindSubClick.bind(this, '6') },
    ];
  }

  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容，本函数不处理选中的内容，会直接清空用户选中的内容
   * @param {1|2|3|4|5|6|'1'|'2'|'3'|'4'|'5'|'6'|'flow'|'sequence'|'state'|'class'|'pie'|'gantt'|''} shortKey 快捷键参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    const shortcutKeyMap = [null, 'flow', 'sequence', 'state', 'class', 'pie', 'gantt'];
    const type = shortcutKeyMap[shortKey] ? shortcutKeyMap[shortKey] : shortKey;

    if (!type || !/^(flow|sequence|state|class|pie|gantt)$/.test(type)) {
      return;
    }
    this.registerAfterClickCb(() => {
      this.setLessSelection('\n\n\n\n\n', '\n\n');
    });
    return `\n\n${this.$getSampleCode(type)}\n`;
  }

  /**
   * 画图的markdown源码模版
   * @param {string} type 画图的类型
   * @returns
   */
  $getSampleCode(type) {
    if (this.localeName !== 'zh-CN' && this.localeName !== 'zh_CN') {
      // 只要不是中文，就返回英文例子
      return sampleEn[type]?.replace(/\t/g, '    ');
    }
    return sample[type]?.replace(/\t/g, '    ');
  }
}
