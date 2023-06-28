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
import { escapeHTMLSpecialCharOnce as $e } from '@/utils/sanitize';
import { createElement } from '@/utils/dom';

/**
 * @typedef {Object} SubMenuConfigItem
 * @property {string} name - 子菜单项名称
 * @property {string=} iconName - 子菜单项图标名称
 * @property {function} onclick - 子菜单项点击事件
 */

/**
 *
 * @param {HTMLElement} targetDom
 * @param {'absolute' | 'fixed' | 'sidebar'} [positionModel = 'absolute']
 * @returns {Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>}
 */
function getPosition(targetDom, positionModel = 'absolute') {
  const pos = targetDom.getBoundingClientRect();
  if (positionModel === 'fixed') {
    return pos;
  }
  // 侧边栏按钮做个特殊处理
  if (positionModel === 'sidebar') {
    const parent = MenuBase.getTargetParentByButton(targetDom);
    return {
      left: parent.offsetLeft - 130 + pos.width,
      top: targetDom.offsetTop + pos.height / 2,
      width: pos.width,
      height: pos.height,
    };
  }
  return { left: targetDom.offsetLeft, top: targetDom.offsetTop, width: pos.width, height: pos.height };
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
   * @type {MenuBase['fire']}
   */
  _onClick;

  /**
   *
   * @param {*} $cherry
   */
  constructor($cherry) {
    this.$cherry = $cherry;
    this.bubbleMenu = false;
    this.subMenu = null; // 子菜单实例
    this.name = ''; // 菜单项Name
    this.editor = $cherry.editor; // markdown实例
    this.locale = $cherry.locale;
    this.dom = null;
    this.updateMarkdown = true; // 是否更新markdown原文
    /** @type {SubMenuConfigItem[]} */
    this.subMenuConfig = []; // 子菜单配置
    this.noIcon = false; // 是否不显示图标
    this.cacheOnce = false; // 是否保存一次点击事件生成的内容
    /**
     * 子菜单的定位方式
     * @property
     * @type {'absolute' | 'fixed' | 'sidebar'}
     */
    this.positionModel = 'absolute';
    // eslint-disable-next-line no-underscore-dangle
    if (typeof this._onClick === 'function') {
      Logger.warn('`MenuBase._onClick` is deprecated. Override `fire` instead');
      // eslint-disable-next-line no-underscore-dangle
      this.fire = this._onClick;
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
   * 设置一个一次性缓存
   * 使用场景：
   *  当需要异步操作是，比如上传视频、选择字体颜色、通过棋盘插入表格等
   * 实现原理：
   *  1、第一次点击按钮时触发fire()方法，触发选择文件、选择颜色、选择棋盘格的操作。此时onClick()不返回任何数据。
   *  2、当异步操作完成后（如提交了文件、选择了颜色等），调用本方法（setCacheOnce）实现缓存，最后调用fire()方法
   *  3、当fire()方法再次调用onClick()方法时，onClick()方法会返回缓存的数据（getAndCleanCacheOnce）
   *
   * 这么设计的原因：
   *  1、可以复用MenuBase的相关方法
   *  2、避免异步操作直接与codemirror交互
   * @param {*} info
   */
  setCacheOnce(info) {
    this.cacheOnce = info;
  }

  getAndCleanCacheOnce() {
    this.updateMarkdown = true;
    const ret = this.cacheOnce;
    this.cacheOnce = false;
    return ret;
  }

  hasCacheOnce() {
    return this.cacheOnce !== false;
  }

  /**
   * 创建一个一级菜单
   * @param {boolean} asSubMenu 是否以子菜单的形式创建
   */
  createBtn(asSubMenu = false) {
    const classNames = asSubMenu
      ? 'cherry-dropdown-item'
      : `cherry-toolbar-button cherry-toolbar-${this.iconName ? this.iconName : this.name}`;
    const span = createElement('span', classNames, {
      title: this.locale[this.name] || $e(this.name),
    });
    // 如果有图标，则添加图标
    if (this.iconName && !this.noIcon) {
      const icon = createElement('i', `ch-icon ch-icon-${this.iconName}`);
      span.appendChild(icon);
    }
    // 二级菜单强制显示文字，没有图标的按钮也显示文字
    if (asSubMenu || this.noIcon) {
      span.innerHTML += this.locale[this.name] || $e(this.name);
    }
    // 只有一级菜单才保存dom，且只保存一次
    if (!asSubMenu && !this.dom) {
      this.dom = span;
    }
    return span;
  }

  createSubBtnByConfig(config) {
    const { name, iconName, onclick } = config;
    const span = createElement('span', 'cherry-dropdown-item', {
      title: this.locale[name] || $e(name),
    });
    if (iconName) {
      const icon = createElement('i', `ch-icon ch-icon-${iconName}`);
      span.appendChild(icon);
    }
    span.innerHTML += this.locale[name] || $e(name);
    span.addEventListener('click', onclick, false);
    return span;
  }

  /**
   * 处理菜单项点击事件
   * @param {MouseEvent | KeyboardEvent | undefined} [event] 点击事件
   * @returns {void}
   */
  fire(event, shortKey = '') {
    event?.stopPropagation();
    if (typeof this.onClick === 'function') {
      const selections = this.editor.editor.getSelections();
      // 判断是不是多选
      this.isSelections = selections.length > 1;
      // 当onClick返回null、undefined、false时，维持原样
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
    const newBeginLine = lessBefore.match(/\n/g)?.length > 0 ? begin.line + lessBefore.match(/\n/g).length : begin.line;
    const newBeginCh =
      lessBefore.match(/\n/g)?.length > 0
        ? lessBefore.replace(/^[\s\S]*?\n([^\n]*)$/, '$1').length
        : begin.ch + lessBefore.length;
    const newBegin = { line: newBeginLine, ch: newBeginCh };
    const newEndLine = lessAfter.match(/\n/g)?.length > 0 ? end.line - lessAfter.match(/\n/g).length : end.line;
    const newEndCh = lessAfter.match(/\n/g)?.length > 0 ? cm.getLine(newEndLine).length : end.ch - lessAfter.length;
    const newEnd = { line: newEndLine, ch: newEndCh };
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
    let newBeginCh =
      // 如果只包含换行，则起始位置一定是0
      /\n/.test(appendBefore) ? 0 : begin.ch - appendBefore.length;
    newBeginCh = newBeginCh < 0 ? 0 : newBeginCh;
    let newBeginLine = /\n/.test(appendBefore) ? begin.line - appendBefore.match(/\n/g).length : begin.line;
    newBeginLine = newBeginLine < 0 ? 0 : newBeginLine;
    const newBegin = { line: newBeginLine, ch: newBeginCh };
    let newEndLine = end.line;
    let newEndCh = end.ch;
    if (/\n/.test(appendAfter)) {
      newEndLine = end.line + appendAfter.match(/\n/g).length;
      newEndCh = cm.getLine(newEndLine)?.length;
    } else {
      newEndCh =
        cm.getLine(end.line).length < end.ch + appendAfter.length
          ? cm.getLine(end.line).length
          : end.ch + appendAfter.length;
    }
    const newEnd = { line: newEndLine, ch: newEndCh };
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
   * 反转子菜单点击事件参数顺序
   * @deprecated
   */
  bindSubClick(shortcut, selection) {
    return this.fire(null, shortcut);
  }

  onClick(selection, shortcut, callback) {
    return selection;
  }

  get shortcutKeys() {
    return [];
  }

  /**
   * 获取当前菜单的位置
   */
  getMenuPosition() {
    const parent = MenuBase.getTargetParentByButton(this.dom);
    const isFromSidebar = /cherry-sidebar/.test(parent.className);
    if (/cherry-bubble/.test(parent.className) || /cherry-floatmenu/.test(parent.className)) {
      this.positionModel = 'fixed';
    } else if (isFromSidebar) {
      this.positionModel = 'sidebar';
    } else {
      this.positionModel = 'absolute';
    }
    return getPosition(this.dom, this.positionModel);
  }

  /**
   * 根据按钮获取按钮的父元素，这里父元素要绕过toolbar-(left|right)那一层
   * @param {HTMLElement} dom 按钮元素
   * @returns {HTMLElement} 父元素
   */
  static getTargetParentByButton(dom) {
    let parent = dom.parentElement;
    if (/toolbar-(left|right)/.test(parent.className)) {
      parent = parent.parentElement;
    }
    return parent;
  }
}
