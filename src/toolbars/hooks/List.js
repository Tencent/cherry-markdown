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
import { getSelection } from '@/utils/selection';
import { getListFromStr } from '@/utils/regexp';
/**
 * 插入有序/无序/checklist列表的按钮
 */
export default class List extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('list', 'list');
    this.subMenuConfig = [
      { iconName: 'ol', name: 'ol', onclick: this.bindSubClick.bind(this, '1') },
      { iconName: 'ul', name: 'ul', onclick: this.bindSubClick.bind(this, '2') },
      { iconName: 'checklist', name: 'checklist', onclick: this.bindSubClick.bind(this, '3') },
    ];
  }

  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  /**
   * 响应点击事件
   * @param {string} selection 编辑区选中的文本内容
   * @param {string} shortKey 快捷键：ol 有序列表，ul 无序列表，checklist 检查项
   * @returns 对应markdown的源码
   */
  onClick(selection, shortKey = '') {
    const listType = [null, 'ol', 'ul', 'checklist']; // 下标1, 2, 3生效
    const $selection = getSelection(this.editor.editor, selection, 'line', true);
    const [before] = $selection.match(/^\n*/);
    const [after] = $selection.match(/\n*$/);
    if (listType[shortKey] !== null) {
      return `${before}${getListFromStr($selection, listType[shortKey])}${after}`;
    }
    return $selection;
  }
}
