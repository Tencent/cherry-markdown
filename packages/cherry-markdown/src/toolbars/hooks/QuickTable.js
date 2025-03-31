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
/**
 * 插入“简单表格”的按钮
 * 所谓简单表格，是源于[TAPD](https://tapd.cn) wiki应用里的一种表格语法
 * 该表格语法不是markdown通用语法，请慎用
 */
export default class QuickTable extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('quickTable', 'table');
  }

  /**
   * 响应点击事件
   * @param {string} selection 编辑器里选中的内容
   * @param {string} shortKey 本函数不处理快捷键
   * @returns
   */
  onClick(selection, shortKey = '') {
    // TODO：可以尝试解析下selection里的内容，按\s、\t区分列，按\n区分行
    return (
      `${selection}| LeftAlignedCol | CenterAlignedCol | RightAlignedCol |\n` +
      '| :--- | :---: | ---: |\n' +
      '| sampleText | sampleText | sampleText |\n' +
      '| **left**Text | centered Text | *right*Text |\n'
    );
  }
}
