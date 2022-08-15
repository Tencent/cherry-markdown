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

export default class Size extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('size', 'size');
    this.subMenuConfig = [
      { name: '小', noIcon: true, onclick: this.bindSubClick.bind(this, '12') },
      { name: '中', noIcon: true, onclick: this.bindSubClick.bind(this, '17') },
      { name: '大', noIcon: true, onclick: this.bindSubClick.bind(this, '24') },
      { name: '特大', noIcon: true, onclick: this.bindSubClick.bind(this, '32') },
    ];
    this.shortKeyMap = {
      'Alt-1': '12',
      'Alt-2': '17',
      'Alt-3': '24',
      'Alt-4': '32',
    };
  }

  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  _getFlagStr(shortKey) {
    const test = shortKey.replace(/[^0-9]+([0-9])/g, '$1');
    let header = '#';
    for (let i = 1; i < test; i++) {
      header += '#';
    }
    return header;
  }

  $testIsSize(selection) {
    return /^\s*(![0-9]+) [\s\S]+!/.test(selection);
  }

  $getSizeByShortKey(shortKey) {
    if (/^[0-9]+$/.test(shortKey)) {
      return shortKey;
    }
    return this.shortKeyMap[shortKey] || '17';
  }

  onClick(selection, shortKey = '17') {
    const size = this.$getSizeByShortKey(shortKey);
    let $selection = getSelection(this.editor.editor, selection) || '字号';
    // 如果选中的内容里有字号语法，则直接去掉该语法
    if (!this.isSelections && !this.$testIsSize($selection)) {
      this.getMoreSelection('!32 ', '!', () => {
        const newSelection = this.editor.editor.getSelection();
        if (this.$testIsSize(newSelection)) {
          $selection = newSelection;
          return true;
        }
        return false;
      });
    }
    if (this.$testIsSize($selection)) {
      // 如果选中的内容里有字号语法，并且字号与目标一致，则去掉字号语法
      // 反之，修改字号与目标一致
      let needClean = true;
      const tmp = $selection.replace(/(^)(\s*)(![0-9]+)([^\n]+)(!)(\s*)($)/gm, (w, m1, m2, m3, m4, m5, m6, m7) => {
        needClean = needClean ? m3 === `!${size}` : false;
        return `${m1}${m2}!${size}${m4}${m5}${m6}${m7}`;
      });
      if (needClean) {
        return $selection.replace(/(^)(\s*)(![0-9]+\s*)([^\n]+)(!)(\s*)($)/gm, '$1$4$7');
      }
      this.registerAfterClickCb(() => {
        this.setLessSelection(`!${size} `, '!');
      });
      return tmp;
    }
    this.registerAfterClickCb(() => {
      this.setLessSelection(`!${size} `, '!');
    });
    return $selection.replace(/(^)([^\n]+)($)/gm, `$1!${size} $2!$3`);
  }

  get shortcutKeys() {
    return ['Alt-1', 'Alt-2', 'Alt-3', 'Alt-4'];
  }
}
