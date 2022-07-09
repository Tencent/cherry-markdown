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
/**
 * 插入有序/无序/checklist列表的按钮
 */
export default class List extends MenuBase {
  constructor(editor) {
    super(editor);
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
   * 处理编辑区域有选中文字时的操作
   * @param {string} selection 编辑区选中的文本内容
   * @param {string} type 操作类型：ol 有序列表，ul 无序列表，checklist 检查项
   * @returns {string} 对应的markdown源码
   */
  $dealSelection(selection, type) {
    let $selection = selection ? selection : 'No.1\n    No.1.1\nNo.2';
    $selection = $selection.replace(/^\n+/, '').replace(/\n+$/, '');
    let pre = '1.';
    switch (type) {
      case 'ol':
        pre = '1.';
        break;
      case 'ul':
        pre = '-';
        break;
      case 'checklist':
        pre = '- [x]';
        break;
    }
    $selection = $selection.replace(/^(\s*)([0-9a-zA-Z]+\.|- \[x\]|- \[ \]|-) /gm, '$1');
    // 对有序列表进行序号自增处理
    if (pre === '1.') {
      const listNum = {};
      $selection = $selection.replace(/^(\s*)(\S[\s\S]*?)$/gm, (match, p1, p2) => {
        const space = p1.match(/[ \t]/g)?.length || 0;
        listNum[space] = listNum[space] ? listNum[space] + 1 : 1;
        return `${p1}${listNum[space]}. ${p2}`;
      });
    } else {
      $selection = $selection.replace(/^(\s*)(\S[\s\S]*?)$/gm, `$1${pre} $2`);
    }
    return $selection;
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
      return `${before}${this.$dealSelection($selection, listType[shortKey])}${after}`;
    }
    return $selection;
  }
}
