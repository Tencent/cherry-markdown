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
 * 下标的按钮
 **/
export default class Checklist extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('checklist', 'checklist');
  }

  /**
   *
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    const $selection = getSelection(this.editor.editor, selection, 'line', true) || 'Item 1\n    Item 1.1\nItem 2';
    const [before] = $selection.match(/^\n*/);
    const [after] = $selection.match(/\n*$/);
    return `${before}${getListFromStr($selection, 'checklist')}${after}`;
  }
}
