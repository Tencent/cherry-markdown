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
import BubbleTableMenu from '@/toolbars/BubbleTable';
/**
 * 插入普通表格
 */
export default class Table extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('table', 'table');

    this.subBubbleTableMenu = new BubbleTableMenu({ row: 9, col: 9 });
    $cherry.editor.options.wrapperDom.appendChild(this.subBubbleTableMenu.dom);
    this.catchOnce = '';
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {*} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    // 如果二维面板处于隐藏状态，说明是第一次点击
    if (this.subBubbleTableMenu.dom.style.display === 'none' || !this.hasCacheOnce()) {
      // 插入表格，会出现一个二维面板，用户可以通过点击决定插入表格的行号和列号
      const pos = this.dom.getBoundingClientRect();
      this.subBubbleTableMenu.dom.style.left = `${pos.left + pos.width}px`;
      this.subBubbleTableMenu.dom.style.top = `${pos.top + pos.height}px`;
      this.subBubbleTableMenu.show((row, col) => {
        const headerText = ' Header |'.repeat(col);
        const controlText = ' ------ |'.repeat(col);
        const rowText = `\n|${' Sample |'.repeat(col)}`;
        const final = `${selection}\n\n|${headerText}\n|${controlText}${rowText.repeat(row)}\n\n`;
        this.setCacheOnce(final);
        this.fire(null);
      });
      this.updateMarkdown = false;
      return false;
    }
    return this.getAndCleanCacheOnce();
  }
}
