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
import SearchBox from '@/utils/cm-search-replace';
import { CONTROL_KEY, getKeyCode } from '@/utils/shortcutKey';
/**
 * 搜索功能
 */
export default class Search extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('search', 'search');
    this.updateMarkdown = false;
    this.shortcutKeyMap = {
      [`${CONTROL_KEY}-${getKeyCode('f')}`]: {
        hookName: this.name,
        aliasName: $cherry.locale[this.name],
      },
    };
    this.searchBox = new SearchBox();
    this.searchBoxInit = false;
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   */
  onClick(selection, shortKey = '') {
    if (!this.searchBoxInit) {
      this.searchBoxInit = true;
      this.searchBox.init(this.$cherry.editor.editor);
    }
    if (this.searchBox.isVisible()) {
      this.searchBox.hide();
    } else {
      this.searchBox.show(selection, true);
    }
  }
}
