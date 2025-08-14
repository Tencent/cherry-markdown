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
 * 插入雷达图+表格
 */
export default class RadarTable extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('radarTable', 'table');
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    // 插入带雷达图的表格
    return `${selection}\n\n${[
      '| :radar: {title: 雷达图,} | 技能1 | 技能2 | 技能3 | 技能4 | 技能5 |',
      '| :-: | :-: | :-: | :-: | :-: | :-: |',
      '| 用户A | 90 | 85 | 75 | 80 | 88 |',
      '| 用户B | 75 | 90 | 88 | 85 | 78 |',
      '| 用户C | 85 | 78 | 90 | 88 | 85 |',
    ].join('\n')}\n\n`;
  }
}
