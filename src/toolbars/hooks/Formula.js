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
import BubbleFormula from '../BubbleFormula';
import { CONTROL_KEY, getKeyCode } from '@/utils/shortcutKey';

/**
 * 插入行内公式
 * @see https://github.com/QianJianTech/LaTeXLive/blob/master/README.md
 */
export default class Formula extends MenuBase {
  /**
   * @param {import('@/toolbars/MenuBase').MenuBaseConstructorParams} $cherry
   */
  constructor($cherry) {
    super($cherry);
    this.setName('formula', 'insertFormula');
    this.subBubbleFormulaMenu = new BubbleFormula($cherry?.options?.toolbars?.config?.formula);
    $cherry.editor.options.wrapperDom.appendChild(this.subBubbleFormulaMenu.dom);
    this.catchOnce = '';
    this.shortcutKeyMap = {
      [`${CONTROL_KEY}-${getKeyCode('m')}`]: {
        hookName: this.name,
        aliasName: this.$cherry.locale[this.name],
      },
    };
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {boolean} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    if (this.subBubbleFormulaMenu.isHide() || !this.hasCacheOnce()) {
      const pos = this.dom.getBoundingClientRect();
      this.subBubbleFormulaMenu.dom.style.left = `${pos.left + pos.width}px`;
      this.subBubbleFormulaMenu.dom.style.top = `${pos.top + pos.height}px`;
      this.subBubbleFormulaMenu.show((latex) => {
        const before = /\n/.test(latex)
          ? `${/\n$/.test(selection) ? selection : `${selection}\n`}$$`
          : `${selection} $ `;
        const after = /\n/.test(latex) ? '\n$$ ' : ' $ ';
        this.registerAfterClickCb(() => {
          this.setLessSelection(before, after);
        });
        const final = `${before}${latex}${after}`;
        this.setCacheOnce(final);
        this.fire(null);
      });
      this.updateMarkdown = false;
      return false;
    }
    return this.getAndCleanCacheOnce();
  }
}
