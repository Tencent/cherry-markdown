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
// @ts-check
import Logger from '@/Logger';
import locale from '@/utils/locale';
import { escapeHTMLSpecialCharOnce as $e } from '@/utils/sanitize';
import { createElement } from '@/utils/dom';

/**
 * 生成div
 * @param {string} name data-name
 * @param {string} className
 * @param {DOMRect} position
 * @param {'bottom'} type
 * @returns {HTMLDivElement}
 */
function createDiv(name, className, position, type = 'bottom') {
  const div = /** @type {HTMLDivElement} */ (
    createElement('div', className, {
      name,
    })
  );
  setPosition(div, position);
  return div;
}

/**
 * @param {HTMLElement} dom
 * @param {Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>} position
 * @returns {HTMLElement}
 */
function setPosition(dom, position) {
  dom.style.left = `${position.left + position.width / 2}px`;
  dom.style.top = `${position.top + position.height}px`;
  return dom;
}

/**
 *
 * @param {HTMLElement} targetDom
 * @param {'absolute' | 'fixed'} [positionModel = 'absolute']
 * @returns {Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>}
 */
function getPosition(targetDom, positionModel = 'absolute') {
  const pos = targetDom.getBoundingClientRect();
  if (positionModel === 'fixed') {
    return pos;
  }
  return { left: targetDom.offsetLeft, top: targetDom.offsetTop, width: pos.width, height: pos.height };
}

export class SubMenu {
  /**
   *
   * @param {MenuBase} menuContext 菜单上下文
   * @param {string} name 菜单项名称
   * @param {Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>} defaultPosition 菜单定位
   * @param {any} menuConfig 菜单项
   * @param {Record<string, Function>} eventHandlers 事件回调
   * @param {'absolute' | 'fixed'} positionModel 菜单定位方式
   */
  constructor(menuContext, name, defaultPosition, menuConfig, eventHandlers, positionModel = 'absolute') {
    this.name = name;
    this.dom = null;
    this.visible = false;
    this.context = menuContext;
    this.positionModel = positionModel;
    this.init(name, defaultPosition, menuConfig, eventHandlers);
  }

  init(name, defaultPosition, menuConfig, eventHandlers) {
    const dom = createDiv(name, 'cherry-dropdown', defaultPosition);
    dom.style.position = this.positionModel;
    const clickHandler = typeof eventHandlers?.click === 'function' ? eventHandlers.click : this.onClick;
    menuConfig.forEach((menuItem) => {
      const item = createElement('span', 'cherry-dropdown-item');
      if (menuItem.noIcon) {
        item.innerHTML = `${menuItem.name}`;
      } else {
        const icon = createElement('i', `ch-icon ch-icon-${menuItem.iconName}`);
        item.appendChild(icon);
        item.innerHTML += locale.zh_CN[menuItem.name] || $e(menuItem.name);
      }
      item.addEventListener('click', clickHandler.bind(this.context, menuItem.onclick, menuItem.async), false);
      dom.appendChild(item);
    });
    dom.addEventListener('EditorHideToolbarSubMenu', () => {
      this.hide();
    });
    this.dom = dom;
  }

  /**
   *
   * @param {Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>} [position] 定位
   */
  show(position) {
    if (position) {
      setPosition(this.dom, position);
    }
    this.dom.style.display = 'block';
    this.visible = true;
  }

  hide() {
    this.dom.style.display = 'none';
    this.visible = false;
  }

  onClick() {
    // empty function
  }
}

/**
 * @typedef {import('@/Editor').default} Editor
 */

/**
 * @class MenuBase
 */
export default class MenuBase {
  /**
   * @deprecated
   * @type {MenuBase['$onClick']}
   */
  _onClick;

  /**
   *
   * @param {Editor} editor
   */
  constructor(editor) {
    /** @type {boolean} 是否浮动菜单*/
    this.bubbleMenu = false;
    this.subMenu = null; // 子菜单实例
    this.name = ''; // 菜单项Name
    this.editor = editor; // markdown实例
    this.dom = null;
    this.updateMarkdown = true; // 是否更新markdown原文
    this.subMenuConfig = []; // 子菜单配置
    /**
     * 子菜单的定位方式
     * @property
     * @private
     * @type {'absolute' | 'fixed'}
     */
    this.positionModel = 'absolute';
    // eslint-disable-next-line no-underscore-dangle
    if (typeof this._onClick === 'function') {
      Logger.warn('`MenuBase._onClick` is deprecated. Override `$onClick` instead');
      // eslint-disable-next-line no-underscore-dangle
      this.$onClick = this._onClick;
    }
  }

  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  /**
   * 设置菜单
   * @param {string} name 菜单名称
   * @param {string} [iconName] 菜单图标名
   */
  setName(name, iconName) {
    this.name = name;
    this.iconName = iconName;
  }

  /**
   * 初始化菜单项
   */
  createBtn() {
    const classNames = [];
    this.subMenuConfig.length > 0 && classNames.push('cherry-toolbar-dropdown');
    classNames.push('cherry-toolbar-button', `cherry-toolbar-${this.iconName ? this.iconName : this.name}`);
    const span = createElement('span', classNames.join(' '));
    if (this.iconName && !['insert', 'graph'].includes(this.name)) {
      const icon = createElement('i', `ch-icon ch-icon-${this.iconName}`, {
        title: locale.zh_CN[this.name] || $e(this.name),
      });
      span.appendChild(icon);
    } else {
      span.innerHTML = locale.zh_CN[this.name] || $e(this.name);
    }
    span.addEventListener('click', this.$onClick.bind(this), false);
    this.dom = span;
    return span;
  }

  /**
   * 内部处理菜单项点击事件
   * @param {MouseEvent} event 点击事件
   * @returns {void}
   */
  $onClick(event, shortKey = '') {
    event?.stopPropagation();
    if (this.subMenuConfig.length) {
      return this.toggleSubMenu();
    }
    if (typeof this.onClick === 'function') {
      MenuBase.cleanSubMenu();
      const selections = this.editor.editor.getSelections();
      // 判断是不是多选
      this.isSelections = selections.length > 1;
      // 当onClick返回null或undefined时，维持原样
      const ret = selections.map(
        (selection, index, srcArray) => this.onClick(selection, shortKey, event) || srcArray[index],
      );
      if (!this.bubbleMenu && this.updateMarkdown) {
        // 非下拉菜单按钮保留selection
        this.editor.editor.replaceSelections(ret, 'around');
        this.editor.editor.focus();
        this.$afterClick();
      }
    }
  }

  /**
   * 获取当前选择区域的range
   */
  $getSelectionRange() {
    const { anchor, head } = this.editor.editor.listSelections()[0];
    // 如果begin在end的后面
    if ((anchor.line === head.line && anchor.ch > head.ch) || anchor.line > head.line) {
      return { begin: head, end: anchor };
    }
    return { begin: anchor, end: head };
  }

  /**
   * 注册点击事件渲染后的回调函数
   * @param {function} cb
   */
  registerAfterClickCb(cb) {
    this.afterClickCb = cb;
  }

  /**
   * 点击事件渲染后的回调函数
   */
  $afterClick() {
    if (typeof this.afterClickCb === 'function' && !this.isSelections) {
      this.afterClickCb();
      this.afterClickCb = null;
    }
  }

  /**
   * 选中除了前后语法后的内容
   * @param {String} lessBefore
   * @param {String} lessAfter
   */
  setLessSelection(lessBefore, lessAfter) {
    const cm = this.editor.editor;
    const { begin, end } = this.$getSelectionRange();
    const newBegin = { line: begin.line, ch: begin.ch + lessBefore.length };
    const newEnd = { line: end.line, ch: end.ch - lessAfter.length };
    cm.setSelection(newBegin, newEnd);
  }

  /**
   * 基于当前已选择区域，获取更多的选择区
   * @param {string} [appendBefore] 选择区前面追加的内容
   * @param {string} [appendAfter] 选择区后面追加的内容
   * @param {function} [cb] 回调函数，如果返回false，则恢复原来的选取
   */
  getMoreSelection(appendBefore, appendAfter, cb) {
    const cm = this.editor.editor;
    const { begin, end } = this.$getSelectionRange();
    const newBeginCh = begin.ch > appendBefore.length ? begin.ch - appendBefore.length : 0;
    const newBegin = { line: begin.line, ch: newBeginCh };
    const newEndCh =
      cm.getLine(end.line).length < end.ch + appendAfter.length
        ? cm.getLine(end.line).length
        : end.ch + appendAfter.length;
    const newEnd = { line: end.line, ch: newEndCh };
    cm.setSelection(newBegin, newEnd);
    if (cb() === false) {
      cm.setSelection(begin, end);
    }
  }

  /**
   * 获取用户选中的文本内容，如果没有选中文本，则返回光标所在的位置的内容
   * @param {string} selection 当前选中的文本内容
   * @param {string} type  'line': 当没有选择文本时，获取光标所在行的内容； 'word': 当没有选择文本时，获取光标所在单词的内容
   * @param {boolean} focus true；强行选中光标处的内容，否则只获取选中的内容
   * @returns {string}
   */
  getSelection(selection, type = 'word', focus = false) {
    const cm = this.editor.editor;
    // 多光标模式下不做处理
    if (this.isSelections) {
      return selection;
    }
    if (selection && !focus) {
      return selection;
    }
    // 获取光标所在行的内容，同时选中所在行
    if (type === 'line') {
      const { begin, end } = this.$getSelectionRange();
      cm.setSelection({ line: begin.line, ch: 0 }, { line: end.line, ch: cm.getLine(end.line).length });
      return cm.getSelection();
    }
    // 获取光标所在单词的内容，同时选中所在单词
    if (type === 'word') {
      const { anchor: begin, head: end } = cm.findWordAt(cm.getCursor());
      cm.setSelection(begin, end);
      return cm.getSelection();
    }
  }

  /**
   *
   * @param {string} key 触发的快捷键
   * @returns
   */
  onKeyDown(key) {
    if (this.getSubMenuConfig().length === 0) {
      this.$onClick(null, key);
    } else {
      // 有子菜单的情况下，先用旧的调用方式
      const ret = this.editor.editor.getSelections().map((selection) => this.onClick(selection, key));
      return this.editor.editor.replaceSelections(ret, 'around');
    }
  }

  // 反转子菜单点击事件参数顺序
  bindSubClick(shortcut, selection) {
    return this.onClick(selection, shortcut);
  }
  onClick(selection, shortcut, callback) {
    return selection;
  }

  get shortcutKeys() {
    return [];
  }

  shortcutKey(options) {
    // 快捷键
    const shortcutReplacer = (shortcut) => {
      if (options && options.isMac) {
        return shortcut.replace(/mod/i, 'Command');
      }
      return shortcut.replace(/mod/i, 'Ctrl');
    };
    return this.shortcutKeys.reduce((ret, key) => {
      const registerKey = shortcutReplacer(key);
      ret[registerKey] = (evt, codemirror) => this.onKeyDown(key);
      return ret;
    }, {});
  }

  initSubMenu() {
    if (!this.subMenuConfig.length) {
      return;
    }
    if (/cherry-bubble/.test(this.dom.parentElement.className)) {
      this.positionModel = 'fixed';
    } else {
      this.positionModel = 'absolute';
    }
    const pos = getPosition(this.dom, this.positionModel);
    this.subMenu = new SubMenu(
      this,
      this.name,
      pos,
      this.subMenuConfig,
      { click: this.onSubClick },
      this.positionModel,
    );
    // append to editor
    this.editor.options.wrapperDom.appendChild(this.subMenu.dom);
  }

  showSubMenu() {
    if (!this.subMenu) {
      this.initSubMenu();
      MenuBase.hideSubMenuExcept(this.subMenu.name);
      this.subMenu.show();
      return;
    }
    MenuBase.hideSubMenuExcept(this.subMenu.name);
    if (/cherry-bubble/.test(this.dom.parentElement.className)) {
      this.positionModel = 'fixed';
    } else {
      this.positionModel = 'absolute';
    }
    const pos = getPosition(this.dom, this.positionModel);
    this.subMenu.show(pos);
  }

  hideSubMenu() {
    if (this.subMenu) {
      this.subMenu.hide();
    }
  }

  toggleSubMenu() {
    if (this.subMenu && this.subMenu.visible) {
      return this.hideSubMenu();
    }
    this.showSubMenu();
  }

  onSubClick(clickEventHandler, async, event) {
    // 异步回调修改内容
    if (async) {
      const selection = this.editor.editor.getSelection();
      clickEventHandler(selection, true, this.editor.editor.replaceSelection.bind(this.editor.editor));
    } else {
      const selections = this.editor.editor.getSelections();
      // 当onClick返回null或undefined时，维持原样
      const ret = selections.map((selection, index, srcArray) => clickEventHandler(selection) || srcArray[index]);
      if (this.updateMarkdown) {
        this.editor.editor.replaceSelections(ret, 'around');
        this.editor.editor.focus();
      }
    }
    this.hideSubMenu();
  }

  static cleanSubMenu() {
    this.hideSubMenuExcept(null);
  }

  /**
   * 隐藏除给定名字外的所有子菜单
   * @param {string | null} name 不隐藏的子菜单
   */
  static hideSubMenuExcept(name) {
    /** @type {NodeListOf<HTMLElement>} */
    const menu = document.querySelectorAll('.cherry-dropdown');
    menu.forEach((element) => {
      if (name && element.dataset.name === name) {
        return;
      }
      element.dispatchEvent(new Event('EditorHideToolbarSubMenu'));
    });
  }
}
