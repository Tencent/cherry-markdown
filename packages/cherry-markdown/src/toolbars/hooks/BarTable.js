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
 * 插入柱状图图+表格
 */
export default class BrTable extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('brTable', 'table');
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    // 插入带折线图的表格
    return `${selection}\n\n${[
      '| :bar: {x,y} | a | b | c |',
      '| :-: | :-: | :-: | :-: |',
      '| x | 1 | 2 | 3 |',
      '| y | 2 | 4 | 6 |',
      '| z | 7 | 5 | 3 |',
    ].join('\n')}\n\n`;
  }
}
