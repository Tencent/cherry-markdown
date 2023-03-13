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
import { getDetailRule } from '@/utils/regexp';
import { getSelection } from '@/utils/selection';
/**
 * 插入手风琴
 */
export default class Detail extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('detail', 'insertFlow');
    this.detailRule = getDetailRule().reg;
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection) {
    let $selection =
      getSelection(this.editor.editor, selection, 'line', true) ||
      '点击展开更多\n内容\n++- 默认展开\n内容\n++ 默认收起\n内容';
    this.detailRule.lastIndex = 0;
    if (!this.detailRule.test($selection)) {
      // 如果没有命中手风琴语法，则尝试扩大选区
      this.getMoreSelection('+++ ', '\n', () => {
        const newSelection = this.editor.editor.getSelection();
        this.detailRule.lastIndex = 0;
        const isMatch = this.detailRule.test(newSelection);
        if (isMatch !== false) {
          $selection = newSelection;
        }
        return isMatch !== false;
      });
    }
    this.detailRule.lastIndex = 0;
    if (this.detailRule.test($selection)) {
      // 如果命中了手风琴语法，则去掉手风琴语法
      this.detailRule.lastIndex = 0;
      return $selection.replace(this.detailRule, (match, preLines, isOpen, title, content) => {
        return `${title}\n${content}`;
      });
    }
    // 去掉开头的空格
    $selection = $selection.replace(/^\s+/, '');
    // 如果选中的内容不包含换行，则强制增加一个换行
    if (!/\n/.test($selection)) {
      $selection = `${$selection}\n${$selection}`;
    }
    this.registerAfterClickCb(() => {
      this.setLessSelection('+++ ', '\n');
    });
    return `+++ ${$selection}\n+++`.replace(/\n{2,}\+\+\+/g, '\n+++');
  }
}
