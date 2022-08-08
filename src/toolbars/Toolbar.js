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
import { mac } from 'codemirror/src/util/browser';
import HookCenter from './HookCenter';
import Event from '@/Event';
import { createElement } from '@/utils/dom';

export default class Toolbar {
  constructor(options) {
    // 存储所有菜单的实例
    this.menus = {};
    // 存储所有快捷键的影射  {快捷键: 菜单名称}
    this.shortcutKeyMap = {};
    // 存储所有二级菜单面板
    this.subMenus = {};
    // 默认的菜单配置
    this.options = {
      dom: document.createElement('div'),
      buttonConfig: ['bold'],
      customMenu: [],
    };

    Object.assign(this.options, options);
    this.$cherry = this.options.$cherry;
    this.instanceId = this.$cherry.instanceId;
    this.menus = new HookCenter(this);
    this.drawMenus();
    this.init();
  }

  init() {
    this.collectShortcutKey();
    Event.on(this.instanceId, Event.Events.cleanAllSubMenus, () => this.hidAlleSubMenu());
  }

  previewOnly() {
    this.options.dom.classList.add('preview-only');
    Event.emit(this.instanceId, Event.Events.toolbarHide);
  }

  showToolbar() {
    this.options.dom.classList.remove('preview-only');
    Event.emit(this.instanceId, Event.Events.toolbarShow);
  }

  isHasLevel2Menu(name) {
    return this.menus.level2MenusName[name];
  }

  isHasConfigMenu(name) {
    return this.menus.hooks[name].subMenuConfig || [];
  }

  /**
   * 判断是否有子菜单，目前有两种子菜单配置方式：1、通过`subMenuConfig`属性 2、通过`buttonConfig`配置属性
   * @param {String} name
   * @returns {boolean} 是否有子菜单
   */
  isHasSubMenu(name) {
    return this.isHasLevel2Menu(name) || this.isHasConfigMenu(name).length > 0;
  }

  /**
   * 根据配置画出来一级工具栏
   */
  drawMenus() {
    const frag = document.createDocumentFragment();
    this.menus.level1MenusName.forEach((name) => {
      const btn = this.menus.hooks[name].createBtn();
      btn.addEventListener(
        'click',
        (event) => {
          this.onClick(event, name);
        },
        false,
      );
      if (this.isHasSubMenu(name)) {
        btn.classList.add('cherry-toolbar-dropdown');
      }
      frag.appendChild(btn);
    });
    this.options.dom.appendChild(frag);
  }

  drawSubMenus(name) {
    const menu = this.menus.hooks[name];
    const pos = menu.getMenuPosition();
    this.subMenus[name] = createElement('div', 'cherry-dropdown', { name });
    this.subMenus[name].style.left = `${pos.left + pos.width / 2}px`;
    this.subMenus[name].style.top = `${pos.top + pos.height}px`;
    this.subMenus[name].style.position = menu.positionModel;
    // 如果有配置的二级菜单
    const level2MenusName = this.isHasLevel2Menu(name);
    if (level2MenusName) {
      level2MenusName.forEach((level2Name) => {
        const subMenu = this.menus.hooks[level2Name];
        const btn = subMenu.createBtn(true);
        // 二级菜单的dom认定为一级菜单的
        subMenu.dom = subMenu.dom ? subMenu.dom : this.menus.hooks[name].dom;
        btn.addEventListener('click', (event) => this.onClick(event, level2Name, true), false);
        this.subMenus[name].appendChild(btn);
      });
    }
    // 兼容旧版本配置的二级菜单
    const subMenuConfig = this.isHasConfigMenu(name);
    if (subMenuConfig.length > 0) {
      subMenuConfig.forEach((config) => {
        const btn = this.menus.hooks[name].createSubBtnByConfig(config);
        btn.addEventListener('click', () => this.hidAlleSubMenu(), false);
        this.subMenus[name].appendChild(btn);
      });
    }
    this.$cherry.wrapperDom.appendChild(this.subMenus[name]);
  }

  onClick(event, name, focusEvent = false) {
    const menu = this.menus.hooks[name];
    if (!menu) {
      return;
    }
    if (this.isHasSubMenu(name) && !focusEvent) {
      this.toggleSubMenu(name);
    } else {
      this.hidAlleSubMenu();
      menu.fire(event, name);
    }
  }

  toggleSubMenu(name) {
    if (this.subMenus[name]) {
      const test = this.subMenus[name].style.display;
      this.hidAlleSubMenu();
      this.subMenus[name].style.display = test === 'none' ? 'block' : 'none';
    } else {
      this.drawSubMenus(name);
    }
  }

  /**
   * 隐藏所有的二级菜单
   */
  hidAlleSubMenu() {
    this.$cherry.wrapperDom.querySelectorAll('.cherry-dropdown').forEach((dom) => {
      dom.style.display = 'none';
    });
  }

  /**
   * 收集快捷键
   */
  collectShortcutKey() {
    this.menus.allMenusName.forEach((name) => {
      this.menus.hooks[name].shortcutKeys?.forEach((key) => {
        this.shortcutKeyMap[key] = name;
      });
    });
  }

  /**
   * 监测是否有对应的快捷键
   * @param {KeyboardEvent} evt keydown 事件
   * @returns {boolean} 是否有对应的快捷键
   */
  matchShortcutKey(evt) {
    return !!this.shortcutKeyMap[this.getCurrentKey(evt)];
  }

  /**
   * 触发对应快捷键的事件
   * @param {KeyboardEvent} evt
   */
  fireShortcutKey(evt) {
    const currentKey = this.getCurrentKey(evt);
    this.menus.hooks[this.shortcutKeyMap[currentKey]]?.fire(evt, currentKey);
  }

  /**
   * 格式化当前按键，mac下的command按键转换为ctrl
   * @param {KeyboardEvent} event
   * @returns
   */
  getCurrentKey(event) {
    let key = '';
    if (event.ctrlKey) {
      key += 'Ctrl-';
    }

    if (event.altKey) {
      key += 'Alt-';
    }

    if (event.metaKey && mac) {
      key += 'Ctrl-';
    }

    // 如果存在shift键
    if (event.shiftKey) {
      key += `Shift-`;
    }

    // 如果还有第三个键 且不是 shift键
    if (event.key && event.key.toLowerCase() !== 'shift') {
      key += event.key.toLowerCase();
    }

    return key;
  }
}
