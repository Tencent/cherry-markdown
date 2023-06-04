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
 * 插入1级~5级标题
 */
export default class Header extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('header', 'header');
    this.subMenuConfig = [
      { iconName: 'h1', name: 'h1', onclick: this.bindSubClick.bind(this, '1') },
      { iconName: 'h2', name: 'h2', onclick: this.bindSubClick.bind(this, '2') },
      { iconName: 'h3', name: 'h3', onclick: this.bindSubClick.bind(this, '3') },
      { iconName: 'h4', name: 'h4', onclick: this.bindSubClick.bind(this, '4') },
      { iconName: 'h5', name: 'h5', onclick: this.bindSubClick.bind(this, '5') },
    ];
  }

  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  /**
   * 解析快捷键，判断插入的标题级别
   * @param {string} shortKey 快捷键
   * @returns
   */
  $getFlagStr(shortKey) {
    const test = +(typeof shortKey === 'string' ? shortKey.replace(/[^0-9]+([0-9])/g, '$1') : shortKey);
    return '#'.repeat(test ? test : 1);
  }

  $testIsHead(selection) {
    return /^\s*(#+)\s*.+/.test(selection);
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    let $selection = getSelection(this.editor.editor, selection, 'line', true) || this.locale.header;
    const header = this.$getFlagStr(shortKey);
    if (!this.isSelections && !this.$testIsHead($selection)) {
      this.getMoreSelection('\n', '', () => {
        const newSelection = this.editor.editor.getSelection();
        const isHead = this.$testIsHead(newSelection);
        if (isHead) {
          $selection = newSelection;
        }
        return isHead;
      });
    }
    if (this.$testIsHead($selection)) {
      // 如果选中的内容里有标题语法，并且标记级别与目标一致，则去掉标题语法
      // 反之，修改标题级别与目标一致
      let needClean = true;
      const tmp = $selection.replace(/(^\s*)(#+)(\s*)(.+$)/gm, (w, m1, m2, m3, m4) => {
        needClean = needClean ? m2.length === header.length : false;
        return `${m1}${header}${m3}${m4}`;
      });
      if (needClean) {
        return $selection.replace(/(^\s*)(#+)(\s*)(.+$)/gm, '$1$4');
      }
      this.registerAfterClickCb(() => {
        this.setLessSelection(`${header} `, '');
      });
      return tmp;
    }
    this.registerAfterClickCb(() => {
      this.setLessSelection(`${header} `, '');
    });
    return $selection.replace(/(^)([\s]*)([^\n]+)($)/gm, `$1${header} $3$4`);
  }

  /**
   * 获得监听的快捷键
   * 在windows下是Ctrl+1，在mac下是cmd+1
   */
  get shortcutKeys() {
    return ['Ctrl-1', 'Ctrl-2', 'Ctrl-3', 'Ctrl-4', 'Ctrl-5', 'Ctrl-6'];
  }
}
