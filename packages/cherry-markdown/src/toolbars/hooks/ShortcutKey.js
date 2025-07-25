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
import ShortcutKeyConfigPanel from '@/toolbars/ShortcutKeyConfigPanel';
import { CONTROL_KEY, META_KEY, getKeyCode } from '@/utils/shortcutKey';
/**
 * 快捷键配置
 */
export default class ShortcutKey extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('shortcutKeySetting', 'command');
    this.updateMarkdown = false;
    this.disabledHideAllSubMenu = true;
    this.shortcutKeyMap = {
      [`${this.isMac ? META_KEY : CONTROL_KEY}-${getKeyCode('0')}`]: {
        hookName: this.name,
        sub: 'toggleToolbar',
        aliasName: 'hide',
      },
    };
  }

  hideOtherSubMenu(hideAllSubMenu) {
    if (!this.shortcutKeyConfigPanel) {
      return hideAllSubMenu();
    }
    const lastDisplay = this.shortcutKeyConfigPanel.isHide();
    hideAllSubMenu();
    if (lastDisplay) {
      this.shortcutKeyConfigPanel.hide();
    } else {
      this.shortcutKeyConfigPanel.show();
    }
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   */
  onClick(selection, shortKey = '') {
    if (!this.shortcutKeyConfigPanel) {
      this.shortcutKeyConfigPanel = new ShortcutKeyConfigPanel(this.$cherry);
    }
    this.shortcutKeyConfigPanel.toggle(this.dom);
    return selection;
  }
}
