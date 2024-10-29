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
    if (typeof $cherry.options.theme !== 'undefined') {
      $cherry.options.theme.forEach((one) => {
        self.subMenuConfig.push({
          iconName: one.className,
          name: one.label,
          onclick: self.bindSubClick.bind(self, one.className),
          getSelectState: self.getSelectState,
          setSubMenuHighlight: self.setSubMenuHighlight.bind(self),
        });
      });
    } else {
      $cherry.options.themeSettings.themeList.forEach((one) => {
        self.subMenuConfig.push({
          iconName: one.className,
          name: one.label,
          onclick: self.bindSubClick.bind(self, one.className),
          getSelectState: self.getSelectState,
          setSubMenuHighlight: self.setSubMenuHighlight.bind(self),
        });
      });
    }
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

  /**
   * 设置子菜单高亮
   * // todo 抽离到父类
   * @param {HTMLSpanElement} currentIcon 当前选中的图标名称
   */
  setSubMenuHighlight(currentIcon) {
    const targetChild = Array.from(currentIcon.children).find((child) => child.classList.contains('ch-icon'));
    if (!targetChild) return;

    const domIconName = Array.from(targetChild.classList)
      .find((className) => className.startsWith('ch-icon-'))
      ?.split('ch-icon-')[1];

    this.subMenuConfig.forEach((item) => {
      const { iconName } = item;
      const currentIDom = document.querySelector(`.ch-icon-${item.iconName}`);

      if (currentIDom && currentIDom.parentNode instanceof HTMLElement) {
        const currentSpan = currentIDom.parentNode;
        if (domIconName === iconName) {
          currentSpan.classList.add('cherry-dropdown-item__selected');
        } else {
          currentSpan.classList.remove('cherry-dropdown-item__selected');
        }
      }
    });
  }

  /**
   * 获取选中状态(当配置项`subMenuHighlight`为`false`时永远返回`false`,调用时已拦截)
   * @param {string} iconName 图标名称
   * @returns {boolean} 是否选中
   */
  getSelectState(iconName) {
    const cherryDom = document.querySelector('.cherry');
    const currentTheme = Array.from(cherryDom.classList)
      .find((item) => item.includes('theme__'))
      ?.split('theme__')[1];

    return iconName === currentTheme;
  }
}
