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
import { changeTheme } from '@/utils/config';
/**
 * 修改主题
 */
export default class Theme extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('theme', 'insertChart');
    this.subMenuConfig = [];
    const self = this;

    const themes = $cherry.options.theme || $cherry.options.themeSettings.themeList;
    themes.forEach((one) => {
      self.subMenuConfig.push({
        iconName: one.className,
        name: one.label,
        onclick: self.bindSubClick.bind(self, one.className),
      });
    });
  }

  /**
   * 绑定子菜单点击事件
   * @param {HTMLDivElement} subMenuDomPanel
   * @returns {number} 当前激活的子菜单索引
   */
  getActiveSubMenuIndex(subMenuDomPanel) {
    const theme = this.$cherry.wrapperDom.className.match(/theme__([^\s]+)/)?.[1] || '';
    return Array.from(subMenuDomPanel.querySelectorAll('.cherry-dropdown-item')).findIndex((item) =>
      item.querySelector(`.ch-icon-${theme}`),
    );
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    this.$cherry.$event.emit('changeMainTheme', shortKey);
    changeTheme(this.$cherry, shortKey);
    this.updateMarkdown = false;
    return '';
  }
}
