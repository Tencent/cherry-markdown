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
 * 加粗按钮
 */
export default class Bold extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('bold', 'bold');
  }

  /**
   * 是不是包含加粗语法
   * @param {String} selection
   * @returns {Boolean}
   */
  $testIsBold(selection) {
    return /^\s*(\*\*|__)[\s\S]+(\1)/.test(selection);
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    let $selection = this.getSelection(selection) || this.locale.bold;
    // 如果是单选，并且选中内容的开始结束内没有加粗语法，则扩大选中范围
    if (!this.isSelections && !this.$testIsBold($selection)) {
      this.getMoreSelection('**', '**', () => {
        const newSelection = this.editor.editor.getSelection();
        const isBold = this.$testIsBold(newSelection);
        if (isBold) {
          $selection = newSelection;
        }
        return isBold;
      });
    }
    // 如果选中的文本中已经有加粗语法了，则去掉加粗语法
    if (this.$testIsBold($selection)) {
      return $selection.replace(/(^)(\s*)(\*\*|__)([^\n]+)(\3)(\s*)($)/gm, '$1$4$7');
    }
    this.registerAfterClickCb(() => {
      this.setLessSelection('**', '**');
    });
    return $selection.replace(/(^)([^\n]+)($)/gm, '$1**$2**$3');
  }

  /**
   * 声明绑定的快捷键，快捷键触发onClick
   */
  get shortcutKeys() {
    return ['Ctrl-b'];
  }
}
