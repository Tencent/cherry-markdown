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
 * 生成ruby，使用场景：给中文增加拼音、给中文增加英文、给英文增加中文等等
 */
export default class Ruby extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('pinyin', 'pinyin');
  }

  $testIsRuby(selection) {
    return /^\s*\{[\s\S]+\|[\s\S]+\}/.test(selection);
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    let $selection = getSelection(this.editor.editor, selection) || '拼音';
    // 如果选中的文本中已经有ruby语法了，则去掉该语法
    if (!this.isSelections && !this.$testIsRuby($selection)) {
      this.getMoreSelection(' { ', ' } ', () => {
        const newSelection = this.editor.editor.getSelection();
        const isRuby = this.$testIsRuby(newSelection);
        if (isRuby) {
          $selection = newSelection;
        }
        return isRuby;
      });
    }
    if (this.$testIsRuby($selection)) {
      return $selection.replace(/^\s*\{\s*([\s\S]+?)\s*\|[\s\S]+\}\s*/gm, '$1');
    }
    const pinyin = (this.editor.$cherry.options.callback.changeString2Pinyin($selection) || 'pin yin').trim();
    this.registerAfterClickCb(() => {
      this.setLessSelection(' { ', ' } ');
    });
    return ` { ${$selection} | ${pinyin} } `;
  }
}
