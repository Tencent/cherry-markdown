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
import { saveIsClassicBrToLocal, getIsClassicBrFromLocal, testKeyInLocal } from '@/utils/config';
import ShortcutKeyConfigPanel from '@/toolbars/ShortcutKeyConfigPanel';
import { CONTROL_KEY, getKeyCode, getStorageKeyMap } from '@/utils/shortcutKey';

/**
 * 设置按钮
 */
export default class Settings extends MenuBase {
  /**
   * TODO: 需要优化参数传入方式
   */
  constructor($cherry) {
    super($cherry);
    this.setName('settings', 'settings');
    this.updateMarkdown = false;
    this.engine = $cherry.engine;
    const classicBr = testKeyInLocal('classicBr')
      ? getIsClassicBrFromLocal()
      : this.engine.$cherry.options.engine.global?.classicBr;
    const { defaultModel } = $cherry.editor.options;
    const classicBrIconName = classicBr ? 'br' : 'normal';
    const classicBrName = classicBr ? 'classicBr' : 'normalBr';
    const previewIcon = defaultModel === 'editOnly' ? 'preview' : 'previewClose';
    const previewName = defaultModel === 'editOnly' ? 'togglePreview' : 'previewClose';
    this.instanceId = $cherry.instanceId;
    /** @type {import('@/toolbars/MenuBase').SubMenuConfigItem[]} */
    this.subMenuConfig = [
      { iconName: classicBrIconName, name: classicBrName, onclick: this.bindSubClick.bind(this, 'classicBr') },
      { iconName: previewIcon, name: previewName, onclick: this.bindSubClick.bind(this, 'previewClose') },
      { iconName: '', name: 'hide', onclick: this.bindSubClick.bind(this, 'toggleToolbar') },
    ];
    this.attachEventListeners();
    this.shortcutKeyMap = {
      [`${CONTROL_KEY}-${getKeyCode('0')}`]: {
        hookName: this.name,
        sub: 'toggleToolbar',
        aliasName: this.$cherry.locale.hide,
      },
    };
    // this.shortcutKeyMaps = [
    //   {
    //     shortKey: 'toggleToolbar',
    //     shortcutKey: 'Ctrl-0',
    //   },
    // ];
  }

  /**
   * 获取子菜单数组
   * @returns {Array} 返回子菜单
   */
  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  /**
   * 监听快捷键，并触发回调
   * @param {string} shortCut 快捷键
   * @param {string} selection 编辑区选中的内容
   * @param {boolean} [async] 是否异步
   * @param {Function} [callback] 回调函数
   * @returns
   */
  bindSubClick(shortCut, selection, async, callback) {
    if (async) {
      return this.onClick(selection, shortCut, callback);
    }
    return this.onClick(selection, shortCut);
  }

  /**
   * 切换预览按钮
   * @param {boolean} isOpen 预览模式是否打开
   */
  togglePreviewBtn(isOpen) {
    const previewIcon = isOpen ? 'previewClose' : 'preview';
    const previewName = isOpen ? 'previewClose' : 'togglePreview';
    if (this.subMenu) {
      const dropdown = document.querySelector('.cherry-dropdown[name="settings"]');
      if (dropdown) {
        const icon = /** @type {HTMLElement} */ (dropdown.querySelector('.ch-icon-previewClose,.ch-icon-preview'));
        icon.classList.toggle('ch-icon-previewClose');
        icon.classList.toggle('ch-icon-preview');
        icon.title = this.locale[previewName];
        icon.parentElement.innerHTML = icon.parentElement.innerHTML.replace(
          /<\/i>.+$/,
          `</i>${this.locale[previewName]}`,
        );
      }
    } else {
      this.subMenuConfig = this.subMenuConfig.map((item) => {
        if (item.iconName === 'previewClose' || item.iconName === 'preview') {
          return { iconName: previewIcon, name: previewName, onclick: this.bindSubClick.bind(this, 'previewClose') };
        }
        return item;
      });
    }
  }

  /**
   * 绑定预览事件
   */
  attachEventListeners() {
    this.$cherry.$event.on('previewerClose', () => {
      this.togglePreviewBtn(false);
    });
    this.$cherry.$event.on('previewerOpen', () => {
      this.togglePreviewBtn(true);
    });
  }

  /**
   * 响应点击事件
   * @param {string} selection 编辑区选中的内容
   * @param {string} shortKey 快捷键
   * @param {Function} [callback] 回调函数
   * @returns
   */
  onClick(selection, shortKey = '', callback) {
    // eslint-disable-next-line no-param-reassign
    shortKey = this.matchShortcutKey(shortKey);
    if (shortKey === 'classicBr') {
      const targetIsClassicBr = !getIsClassicBrFromLocal();
      saveIsClassicBrToLocal(targetIsClassicBr);
      this.engine.$cherry.options.engine.global.classicBr = targetIsClassicBr;
      this.engine.hookCenter.hookList.paragraph.forEach((item) => {
        item.classicBr = targetIsClassicBr;
      });

      let i = this.$cherry.wrapperDom.querySelector('.cherry-dropdown .ch-icon-normal');
      i = i ? i : this.$cherry.wrapperDom.querySelector('.cherry-dropdown .ch-icon-br');
      if (targetIsClassicBr) {
        i.classList.replace('ch-icon-normal', 'ch-icon-br');
        i.parentElement.childNodes[1].textContent = this.locale.classicBr;
      } else {
        i.classList.replace('ch-icon-br', 'ch-icon-normal');
        i.parentElement.childNodes[1].textContent = this.locale.normalBr;
      }
      this.engine.$cherry.previewer.update('');
      this.engine.$cherry.initText(this.engine.$cherry.editor.editor);
    } else if (shortKey === 'previewClose') {
      // 需要浮动预览
      if (this.editor.previewer.isPreviewerNeedFloat()) {
        // 正在浮动预览
        if (this.editor.previewer.isPreviewerFloat()) {
          this.editor.previewer.recoverFloatPreviewer(true);
        } else {
          this.editor.previewer.floatPreviewer();
        }
        return;
      }
      if (this.editor.previewer.isPreviewerHidden()) {
        this.editor.previewer.recoverPreviewer(true);
      } else {
        this.editor.previewer.editOnly(true);
      }
    } else if (shortKey === 'toggleToolbar') {
      this.toggleToolbar();
    } else if (shortKey === 'shortcutKey') {
      if (!this.shortcutKeyConfigPanel) {
        this.shortcutKeyConfigPanel = new ShortcutKeyConfigPanel(this.engine.$cherry);
      }
      const subMenuDropdownDom = this.engine?.$cherry?.toolbar?.subMenus?.[this.name];
      if (subMenuDropdownDom instanceof HTMLElement) {
        subMenuDropdownDom.style.display = 'none';
      }
      this.shortcutKeyConfigPanel.toggle(this.dom);
    }
    return selection;
  }

  /**
   * 解析快捷键
   * @param {string} shortcutKey 快捷键
   * @returns
   */
  matchShortcutKey(shortcutKey) {
    // 处理 bindSubClick 事件
    const shortcutConfig = Object.values(this.shortcutKeyMap).find(({ sub }) => sub === shortcutKey);
    if (typeof shortcutConfig === 'undefined') {
      // 尝试找快捷键
      const storageKeyMap = getStorageKeyMap(this.$cherry.nameSpace);
      const storageShortcutConfig = storageKeyMap?.[shortcutKey];
      return storageShortcutConfig ? String(storageShortcutConfig.sub) : shortcutKey;
    }
    return shortcutConfig.sub;
  }

  /**
   * 切换Toolbar显示状态
   */
  toggleToolbar() {
    const { wrapperDom } = this.engine.$cherry;
    if (wrapperDom instanceof HTMLDivElement) {
      if (wrapperDom.className.indexOf('cherry--no-toolbar') > -1) {
        wrapperDom.classList.remove('cherry--no-toolbar');
        this.$cherry.$event.emit('toolbarShow');
      } else {
        wrapperDom.classList.add('cherry--no-toolbar');
        this.$cherry.$event.emit('toolbarHide');
      }
    }
  }
}
