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
import SearchBox from '@/utils/cm-search-replace';
import { getKeyCode, getPlatformControlKey } from '@/utils/shortcutKey';
/**
 * 搜索功能
 */
export default class Search extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('search', 'search');
    this.updateMarkdown = false;
    this.shortcutKeyMap = {
      [`${getPlatformControlKey()}-${getKeyCode('f')}`]: {
        hookName: this.name,
        aliasName: this.name,
      },
    };

    // 检查$cherry上是否已经存在searchBoxInstance实例和searchBoxInit
    if (!this.$cherry.searchBoxInstance) {
      this.$cherry.searchBoxInstance = new SearchBox(this.$cherry);
      this.$cherry.searchBoxInit = false;
    }
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   */
  onClick(selection, shortKey = '') {
    // 控制$cherry上的searchBoxInstance实例
    if (!this.$cherry.searchBoxInit) {
      this.$cherry.searchBoxInit = true;
      this.$cherry.searchBoxInstance.init(this.$cherry.editor.editor);
    }
    if (this.$cherry.searchBoxInstance.isVisible()) {
      this.$cherry.searchBoxInstance.hide();
    } else {
      this.$cherry.searchBoxInstance.show(selection, true);
    }
  }
}
