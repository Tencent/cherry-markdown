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
import { getSelection } from '@/utils/selection';
import { getKeyCode, getPlatformControlKey } from '@/utils/shortcutKey';
/**
 * 删除线的按钮
 */
export default class Strikethrough extends MenuBase {
  /**
   * @param {import('@/toolbars/MenuBase').MenuBaseConstructorParams} $cherry
   */
  constructor($cherry) {
    super($cherry);
    this.setName('strikethrough', 'strike');
    this.shortcutKeyMap = {
      [`${getPlatformControlKey()}-${getKeyCode('d')}`]: {
        hookName: this.name,
        aliasName: this.name,
      },
    };
  }

  $testIsStrike(selection) {
    return /(~~)[\s\S]+(\1)/.test(selection);
  }

  /**
   *
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    let $selection = getSelection(this.editor.editor, selection) || this.locale.strikethrough;
    // @ts-ignore
    const needWhitespace = this.$cherry?.options?.engine?.syntax?.strikethrough?.needWhitespace;
    const space = needWhitespace ? ' ' : '';
    // 如果被选中的文本中包含删除线语法，则去掉删除线语法
    if (!this.isSelections && !this.$testIsStrike($selection)) {
      this.getMoreSelection(`${space}~~`, `~~${space}`, () => {
        const { from, to } = this.editor.editor.view.state.selection.main;
        const newSelection = this.editor.editor.view.state.doc.sliceString(from, to);
        const isStrike = this.$testIsStrike(newSelection);
        if (isStrike) {
          $selection = newSelection;
        }
        return isStrike;
      });
    }
    if (this.$testIsStrike($selection)) {
      return selection.replace(/[\s]*(~~)([\s\S]+)(\1)[\s]*/g, '$2');
    }
    this.registerAfterClickCb(() => {
      this.setLessSelection(`${space}~~`, `~~${space}`);
    });
    return $selection.replace(/(^)[\s]*([\s\S]+?)[\s]*($)/g, `$1${space}~~$2~~${space}$3`);
  }
}
