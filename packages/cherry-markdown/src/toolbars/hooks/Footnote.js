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

/**
 * 插入脚注
 */
export default class Footnote extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('footnote', 'footnote');
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {string|false} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    if (this.$cherry.status?.wysiwyg === 'show' && this.$cherry.wysiwygEditor) {
      this.$cherry.wysiwygEditor.execCommand('footnote');
      return false;
    }
    return `${selection}[^fn1]\n\n[^fn1]: 脚注内容\n\n`;
  }
}
