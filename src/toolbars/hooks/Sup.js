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
 * 上标的按钮
 **/
export default class Sup extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('sup', 'sup');
  }

  $testIsSup(selection) {
    return /^\s*(\^)[\s\S]+(\1)/.test(selection);
  }

  /**
   *
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    let $selection = getSelection(this.editor.editor, selection) || this.locale.sup;
    // 如果选中的内容里有上标的语法，则认为是要去掉上标语法
    if (!this.isSelections && !this.$testIsSup($selection)) {
      this.getMoreSelection('^', '^', () => {
        const newSelection = this.editor.editor.getSelection();
        const isSup = this.$testIsSup(newSelection);
        if (isSup) {
          $selection = newSelection;
        }
        return isSup;
      });
    }
    if (this.$testIsSup($selection)) {
      return selection.replace(/(^)(\s*)(\^)([^\n]+)(\3)(\s*)($)/gm, '$1$4$7');
    }
    this.registerAfterClickCb(() => {
      this.setLessSelection('^', '^');
    });
    return $selection.replace(/(^)([^\n]+)($)/gm, '$1^$2^$3');
  }
}
