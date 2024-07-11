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
import { createElement } from '@/utils/dom';
import Logger from '@/Logger';
import { getAllowedShortcutKey, getStorageKeyMap, keyStack2UniqueString } from '@/utils/shortcutKey';

/**
 * @typedef {()=>void} Bold 向cherry编辑器中插入粗体语法
 * @typedef {()=>void} Italic 向cherry编辑器中插入斜体语法
 * @typedef {(level:1|2|3|4|5|'1'|'2'|'3'|'4'|'5')=>void} Header  向cherry编辑器中插入标题语法
 * - level 标题等级 1~5
 * @typedef {()=>void} Strikethrough 向cherry编辑器中插入删除线语法
 * @typedef {(type:'ol'|'ul'|'checklist'|1|2|3|'1'|'2'|'3')=>void} List 向cherry编辑器中插入有序、无序列表或者checklist语法
 * - ol(1)有序
 * - ul(2)无序列表
 * - checklist(3)checklist
 * @typedef {(insert:'hr'|'br'|'code'|'formula'|'checklist'|'toc'|'link'|'image'|'video'|'audio'|'normal-table'|'normal-table-row*col')=>void} Insert 向cherry编辑器中插入特定语法
 * - hr 水平分割线
 * - br 换行
 * - code 代码块
 * - formula 公式
 * - checklist 检查项
 * - toc 目录
 * - link 链接
 * - image 图片
 * - video 视频
 * - audio 音频
 * - normal-table 插入3行5列的表格
 * - normal-table-row*col 如normal-table-2*4插入2行(包含表头是3行)4列的表格
 * @typedef {(type:'1'|'2'|'3'|'4'|'5'|'6'|1|2|3|4|5|6|'flow'|'sequence'|'state'|'class'|'pie'|'gantt')=>void} Graph 向cherry编辑器中插入画图语法
 * - flow(1) 流程图
 * - sequence(2) 时序图
 * - state(3)状态图
 * - class(4)类图
 * - pie(5)饼图
 * - gantt(6)甘特图
 */

export default class Toolbar {
  /**
   * @typedef {{
   * bold?:Bold;
   * italic?:Italic;
   * header?:Header;
   * strikethrough?:Strikethrough;
   * list?:List;
   * insert?:Insert;
   * graph?:Graph;
   * [key:string]:any;
   * }} ToolbarHandlers
   * @type ToolbarHandlers 外部获取 toolbarHandlers 的部分功能
   */
  toolbarHandlers = {};

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
    this.collectShortcutKey();
    this.collectToolbarHandler();
    this.init();
  }

  init() {
    this.$cherry.$event.on('cleanAllSubMenus', () => this.hideAllSubMenu());
  }

  previewOnly() {
    this.options.dom.classList.add('preview-only');
    this.$cherry.wrapperDom.classList.add('cherry--no-toolbar');
    this.$cherry.$event.emit('toolbarHide');
  }

  showToolbar() {
    this.options.dom.classList.remove('preview-only');
    this.$cherry.wrapperDom.classList.remove('cherry--no-toolbar');
    this.$cherry.$event.emit('toolbarShow');
  }

  isHasLevel2Menu(name) {
    // FIXME: return boolean
    return this.menus.level2MenusName[name];
  }

  isHasConfigMenu(name) {
    // FIXME: return boolean
    return this.menus.hooks[name].subMenuConfig || [];
  }

  /**
   * 判断是否有子菜单，目前有两种子菜单配置方式：1、通过`subMenuConfig`属性 2、通过`buttonConfig`配置属性
   * @param {string} name
   * @returns {boolean} 是否有子菜单
   */
  isHasSubMenu(name) {
    return Boolean(this.isHasLevel2Menu(name) || this.isHasConfigMenu(name).length > 0);
  }

  /**
   * 根据配置画出来一级工具栏
   */
  drawMenus() {
    const fragLeft = document.createDocumentFragment();

    this.menus.level1MenusName.forEach((name) => {
      const btn = this.menus.hooks[name].createBtn();
      if (typeof window === 'object' && 'onpointerup' in window) {
        // 只有先down再up的才触发click逻辑，避免误触（尤其是float menu的场景）
        btn.addEventListener(
          'pointerdown',
          () => {
            this.isPointerDown = true;
          },
          false,
        );
        btn.addEventListener(
          'pointerup',
          (event) => {
            this.isPointerDown && this.onClick(event, name);
            this.isPointerDown = false;
          },
          false,
        );
      } else {
        // vscode 插件里不支持 pointer event
        btn.addEventListener(
          'click',
          (event) => {
            this.onClick(event, name);
          },
          false,
        );
      }
      if (this.isHasSubMenu(name)) {
        btn.classList.add('cherry-toolbar-dropdown');
      }
      fragLeft.appendChild(btn);
    });

    this.appendMenusToDom(fragLeft);
  }

  appendMenusToDom(menus) {
    const toolbarLeft = createElement('div', 'toolbar-left');
    toolbarLeft.appendChild(menus);
    this.options.dom.appendChild(toolbarLeft);
  }

  setSubMenuPosition(menuObj, subMenuObj) {
    const pos = menuObj.getMenuPosition();
    subMenuObj.style.left = `${pos.left + pos.width / 2}px`;
    subMenuObj.style.top = `${pos.top + pos.height}px`;
    subMenuObj.style.position = menuObj.positionModel;
  }

  drawSubMenus(name) {
    this.subMenus[name] = createElement('div', 'cherry-dropdown', { name });
    this.setSubMenuPosition(this.menus.hooks[name], this.subMenus[name]);
    // 如果有配置的二级菜单
    const level2MenusName = this.isHasLevel2Menu(name);
    if (level2MenusName) {
      level2MenusName.forEach((level2Name) => {
        const subMenu = this.menus.hooks[level2Name];
        if (subMenu !== undefined && typeof subMenu.createBtn === 'function') {
          const btn = subMenu.createBtn(true);
          // 二级菜单的dom认定为一级菜单的
          subMenu.dom = subMenu.dom ? subMenu.dom : this.menus.hooks[name].dom;
          btn.addEventListener('click', (event) => this.onClick(event, level2Name, true), false);
          this.subMenus[name].appendChild(btn);
        }
      });
    }
    // 兼容旧版本配置的二级菜单
    const subMenuConfig = this.isHasConfigMenu(name);
    if (subMenuConfig.length > 0) {
      subMenuConfig.forEach((config) => {
        const btn = this.menus.hooks[name].createSubBtnByConfig(config);
        if (!config?.disabledHideAllSubMenu) {
          btn.addEventListener('click', () => this.hideAllSubMenu(), false);
        }
        this.subMenus[name].appendChild(btn);
      });
    }
    this.$cherry.wrapperDom.appendChild(this.subMenus[name]);
  }

  /**
   * 处理点击事件
   */
  onClick(event, name, focusEvent = false) {
    const menu = this.menus.hooks[name];
    if (!menu) {
      return;
    }
    if (this.isHasSubMenu(name) && !focusEvent) {
      this.toggleSubMenu(name);
    } else {
      this.hideAllSubMenu();
      menu.fire(event, name);
    }
  }

  /**
   * 展开/收起二级菜单
   */
  toggleSubMenu(name) {
    if (!this.subMenus[name]) {
      // 如果没有二级菜单，则先画出来，然后再显示
      this.hideAllSubMenu();
      this.drawSubMenus(name);
      this.subMenus[name].style.display = 'block';
      return;
    }
    if (this.subMenus[name].style.display === 'none') {
      // 如果是隐藏的，则先隐藏所有二级菜单，再显示当前二级菜单
      this.hideAllSubMenu();
      this.subMenus[name].style.display = 'block';
      this.setSubMenuPosition(this.menus.hooks[name], this.subMenus[name]);
    } else {
      // 如果是显示的，则隐藏当前二级菜单
      this.subMenus[name].style.display = 'none';
    }
  }

  /**
   * 隐藏所有的二级菜单
   */
  hideAllSubMenu() {
    this.$cherry.wrapperDom.querySelectorAll('.cherry-dropdown').forEach((dom) => {
      dom.style.display = 'none';
    });
  }

  /**
   * 收集工具栏的各项信息，主要有：
   *   this.toolbarHandlers
   *   this.menus.hooks
   *   this.shortcutKeyMap
   * @param {Toolbar} toolbarObj 工具栏对象
   */
  collectMenuInfo(toolbarObj) {
    this.toolbarHandlers = Object.assign({}, this.toolbarHandlers, toolbarObj.toolbarHandlers);
    this.menus.hooks = Object.assign({}, toolbarObj.menus.hooks, this.menus.hooks);
    // 只有没设置自定义快捷键的时候才需要收集其他toolbar对象的快捷键配置
    if (!this.options.shortcutKey || Object.keys(this.options.shortcutKey).length <= 0) {
      this.shortcutKeyMap = Object.assign({}, this.shortcutKeyMap, toolbarObj.shortcutKeyMap);
    }
  }

  /**
   * 收集快捷键
   */
  collectShortcutKey() {
    if (this.options.shortcutKey && Object.keys(this.options.shortcutKey).length > 0) {
      console.warn(
        'options.shortcutKey will deprecated in the future, please use shortcutKeyMap instead, get more info at https://github.com/Tencent/cherry-markdown/wiki',
      );
      this.shortcutKeyMap = this.options.shortcutKey;
    } else {
      this.menus.allMenusName.forEach((name) => {
        this.menus.hooks[name].shortcutKeys?.forEach((key) => {
          this.shortcutKeyMap[key] = name;
        });
        if (typeof this.menus.hooks[name].shortcutKeyMap === 'object' && this.menus.hooks[name].shortcutKeyMap) {
          Object.entries(this.menus.hooks[name].shortcutKeyMap).forEach(([key, value]) => {
            if (key in this.shortcutKeyMap) {
              console.error(`The shortcut key ${key} is already registered`);
              return;
            }
            this.shortcutKeyMap[key] = value;
          });
        }
      });
    }
  }

  collectToolbarHandler() {
    this.toolbarHandlers = this.menus.allMenusName.reduce((handlerMap, name) => {
      const menuHook = this.menus.hooks[name];
      if (!menuHook) {
        return handlerMap;
      }
      handlerMap[name] = (shortcut, _callback) => {
        if (typeof _callback === 'function') {
          Logger.warn(
            'MenuBase#onClick param callback is no longer supported. Please register the callback via MenuBase#registerAfterClickCb instead.',
          );
        }
        menuHook.fire.call(menuHook, undefined, shortcut);
      };
      return handlerMap;
    }, {});
  }

  /**
   * 监测是否有对应的快捷键
   * @param {KeyboardEvent} evt keydown 事件
   * @returns {boolean} 是否有对应的快捷键
   */
  matchShortcutKey(evt) {
    const storageShortcutKeyMap = getStorageKeyMap(this.instanceId);
    if (storageShortcutKeyMap) {
      try {
        const onKeyStack = getAllowedShortcutKey(evt);
        const shortcutKey = keyStack2UniqueString(onKeyStack);
        return !!storageShortcutKeyMap?.[shortcutKey];
      } catch (error) {
        console.error(error);
        return false;
      }
    }
    return !!this.shortcutKeyMap[this.getCurrentKey(evt)];
  }

  /**
   * 触发对应快捷键的事件
   * @param {KeyboardEvent} evt
   */
  fireShortcutKey(evt) {
    const storageShortcutKeyMap = getStorageKeyMap(this.instanceId);
    let currentKey = '';
    let keyMap;
    if (storageShortcutKeyMap) {
      const onKeyStack = getAllowedShortcutKey(evt);
      currentKey = keyStack2UniqueString(onKeyStack);
      keyMap = storageShortcutKeyMap[currentKey];
    } else {
      currentKey = this.getCurrentKey(evt);
      keyMap = this.shortcutKeyMap[currentKey];
    }
    if (typeof keyMap === 'string' && keyMap) {
      this.menus.hooks[keyMap]?.fire(evt, currentKey);
    } else if (typeof keyMap === 'object' && keyMap) {
      const { hookName } = keyMap;
      this.menus.hooks[hookName]?.fire(evt, currentKey);
    }
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
