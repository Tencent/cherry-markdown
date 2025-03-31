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
import { CONTROL_KEY } from '@/utils/shortcutKey';
/**
 * 插入行内代码的按钮
 */
export default class InlineCode extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('inlineCode', 'code');
    this.shortcutKeyMap = {
      [`${CONTROL_KEY}-Backquote`]: {
        hookName: this.name,
        aliasName: this.$cherry.locale[this.name],
      },
    };
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    if (!selection) {
      this.registerAfterClickCb(() => this.setLessSelection('`', '`'));
      return '``';
    }

    if (!selection.includes('\n')) {
      this.registerAfterClickCb(() => this.setLessSelection('`', '`'));
      return `\`${selection}\``;
    }

    const arr = selection.split('\n').map((item) => `\`${item}\``);
    return arr.join('\n');
  }
}
