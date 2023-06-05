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
 * 插入斜体的按钮
 */
export default class Italic extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('italic', 'italic');
  }

  /**
   * 是不是包含加粗语法
   * @param {String} selection
   * @returns {Boolean}
   */
  $testIsItalic(selection) {
    return /^\s*(\*|_)[\s\S]+(\1)/.test(selection);
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    let $selection = this.getSelection(selection) || this.locale.italic;
    // 如果是单选，并且选中内容的开始结束内没有加粗语法，则扩大选中范围
    if (!this.isSelections && !this.$testIsItalic($selection)) {
      this.getMoreSelection('*', '*', () => {
        const newSelection = this.editor.editor.getSelection();
        const isItalic = this.$testIsItalic(newSelection);
        if (isItalic) {
          $selection = newSelection;
        }
        return isItalic;
      });
    }
    if (this.$testIsItalic($selection)) {
      return $selection.replace(/(^)(\s*)(\*|_)([^\n]+)(\3)(\s*)($)/gm, '$1$4$7');
    }
    this.registerAfterClickCb(() => {
      this.setLessSelection('*', '*');
    });
    return $selection.replace(/(^)([^\n]+)($)/gm, '$1*$2*$3');
  }

  /**
   * 获得监听的快捷键
   * 在windows下是Ctrl+i，在mac下是cmd+i
   */
  get shortcutKeys() {
    return ['Ctrl-i'];
  }
}
