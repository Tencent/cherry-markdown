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
// @ts-check
import Logger from '@/Logger';
import { escapeHTMLSpecialCharOnce as $e } from '@/utils/sanitize';
import { createElement } from '@/utils/dom';
import NestedError from '@/utils/error';
import { getSelection as getSelectionUtil } from '@/utils/selection';

/**
 * @typedef {Object} SubMenuConfigItem
 * @property {string} name - 子菜单项名称
 * @property {string=} iconName - 子菜单项图标名称
 * @property {function(MouseEvent): any} onclick - 子菜单项点击事件
 * @property {string=} icon - 子菜单项图标(url)
 * @property {boolean=} [disabledHideAllSubMenu=false] - 是否禁用后续调用hideAllSubMenu
 */

/**
 * @typedef {Record<string, import('~types/cherry').ShortcutKeyMapStruct>} HookShortcutKeyMap
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
 * @typedef {Partial<import('@/Cherry').default> & {$currentMenuOptions?:import('~types/menus').CustomMenuConfig}} MenuBaseConstructorParams
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
   * @param {MenuBaseConstructorParams} $cherry
   */
  constructor($cherry) {
    this.$cherry = $cherry;
    this.bubbleMenu = false;
    this.subMenu = null; // 子菜单实例
    this.$currentMenuOptions = $cherry.$currentMenuOptions;
    // HookCenter 中会默认使currentMenuOptions的name属性与iconName属性一致
    this.name = $cherry.$currentMenuOptions?.name ?? ''; // 菜单项Name
    if (typeof $cherry.$currentMenuOptions?.icon === 'string') {
      this.iconName = $cherry.$currentMenuOptions.icon;
    }
    /** @type {import('~types/menus').MenuIconType} */
    this.iconType = null;
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
    /**
     * 快捷键map映射
     * @type {HookShortcutKeyMap}
     */
    this.shortcutKeyMap = {};
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
    this.$currentMenuOptions = { name, icon: iconName };
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
   * 创建一个IconFont类型的图标
   * @param {string} iconName
   * @param {object} options
   */
  createIconFontIcon(iconName, options = {}) {
    const icon = createElement('i', `ch-icon ch-icon-${iconName}`);
    if (typeof options?.className === 'string') {
      icon.classList.add(options.className);
    }
    return icon;
  }

  /**
   * 创建一个SVG类型的图标
   * @param {import('~types/menus').CustomMenuIcon} options
   */
  createSvgIcon(options) {
    if (options.type !== 'svg') {
      throw new Error('except options.type is "svg", but get "${options.type}"');
    }
    try {
      const domParser = new DOMParser();
      const svg = domParser.parseFromString(options.content, 'image/svg+xml')?.lastElementChild;
      if (options.iconStyle) {
        svg.setAttribute('style', options.iconStyle);
      }
      if (options.iconClassName) {
        svg.setAttribute('class', options.iconClassName);
      }
      return svg;
    } catch (error) {
      throw new NestedError(error);
    }
  }

  /**
   * 创建一个Image类型的图标
   * @param {import('~types/menus').CustomMenuIcon} options
   */
  createImageIcon(options) {
    if (options.type !== 'image') {
      throw new Error('except options.type is "image", but get "${options.type}"');
    }
    return createElement('img', `ch-icon${options.iconClassName ? ` ${options.iconClassName}` : ''}`, {
      src: options.content,
      style: options.iconStyle,
    });
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
    if (!this.noIcon) {
      /** @type{Element} */
      let icon = null;
      const customIcon = this.$currentMenuOptions.icon;
      if (typeof customIcon === 'string') {
        // 默认 this.name 和 iconName 是一致的，除非手动调用 setName 方法来更改
        // 这里的逻辑就是 MenuBase 子类没有手动调用setName时则以传入的（默认跟hook name一致，可以在配置文件中更改）为准
        // 否则以子类set的为准
        icon = this.createIconFontIcon(this.iconName !== this.name ? this.iconName : customIcon);
        this.iconType = 'iconfont';
      } else if (customIcon instanceof HTMLElement) {
        icon = customIcon;
        this.iconType = 'element';
      } else if (typeof customIcon === 'object') {
        const { type } = customIcon;
        if (type === 'svg') {
          icon = this.createSvgIcon(customIcon);
          this.iconType = 'svg';
        } else if (type === 'image') {
          icon = this.createImageIcon(customIcon);
          this.iconType = 'image';
        } else if (type === 'iconfont') {
          icon = this.createIconFontIcon(customIcon.content);
          this.iconType = 'iconfont';
        } else {
          throw new Error(`except customIcon.type is "svg", "image", "iconfont", but get "${type}"`);
        }
      }
      if (icon !== null) {
        icon.classList.add(`cherry-menu-${this.name}`);
        span.appendChild(icon);
      }
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

  /**
   * 通过配置创建一个二级菜单
   * @param {SubMenuConfigItem} config 配置
   */
  createSubBtnByConfig(config) {
    if (typeof config === 'object' && config.name === '|') {
      const separator = createElement('div', 'cherry-dropdown-separator');
      return separator;
    }

    const { name, iconName, icon, onclick } = config;
    const span = createElement('span', 'cherry-dropdown-item', {
      title: this.locale[name] || $e(name),
    });
    if (iconName) {
      const iconElement = createElement('i', `ch-icon ch-icon-${iconName}`);
      span.appendChild(iconElement);
    } else if (icon) {
      const iconElement = createElement('img', 'ch-icon', {
        src: icon,
        style: 'width: 16px; height: 16px; vertical-align: sub;',
      });
      span.appendChild(iconElement);
    }
    span.innerHTML += this.locale[name] || $e(name);
    span.addEventListener('click', onclick, false);
    return span;
  }

  /**
   * 处理菜单项点击事件
   * @param {MouseEvent | KeyboardEvent | undefined} [event] 点击事件
   * @param {string} [shortKey] 快捷键参数
   * @returns {void}
   */
  fire(event, shortKey = '') {
    event?.stopPropagation();
    if (typeof this.onClick === 'function') {
      const selections = this.editor.getSelections();
      // 判断是不是多选
      this.isSelections = selections.length > 1;
      // 当onClick返回null、undefined、false时，维持原样
      const results = selections.map(
        (selection, index, srcArray) => this.onClick(selection, shortKey, event) || srcArray[index],
      );
      if (!this.bubbleMenu && this.updateMarkdown) {
        const hasPromise = results.some((result) => result instanceof Promise);
        if (hasPromise) {
          // 处理异步结果（如上传文件等）
          Promise.all(results.map((result) => (result instanceof Promise ? result : Promise.resolve(result)))).then(
            (resolvedResults) => {
              const safeResults = resolvedResults.map((result, index) =>
                result === undefined || result === null ? selections[index] : String(result),
              );
              this.$replaceSelectionsWithCursor(safeResults);
              this.$afterClick();
              this.editor.editor.view.focus();
            },
          );
        } else {
          // 处理同步结果
          this.$replaceSelectionsWithCursor(results);
          this.$afterClick();
          this.editor.editor.view.focus();
        }
      }
    }
  }

  /**
   * 替换选区并智能调整光标位置（CodeMirror 6版本）
   * @param {string[]} replacements 替换文本数组
   */
  $replaceSelectionsWithCursor(replacements) {
    const editorView = this.editor.editor;
    /** @type {import('@codemirror/view').EditorView} */
    // @ts-ignore - editorView 可能是 CM6Adapter，它有 view 属性
    const view = editorView.view || editorView;
    const { state } = view;
    const { selection } = state;
    const changes = [];
    const newSelections = [];
    let offset = 0;

    // 为每个选区创建替换变更
    selection.ranges.forEach((range, index) => {
      const replacement = String(replacements[index] || '');
      const { from, to } = range;
      const adjustedFrom = from + offset;
      const adjustedTo = to + offset;

      changes.push({
        from: adjustedFrom,
        to: adjustedTo,
        insert: replacement,
      });

      // 计算新选区的位置（选中整个替换后的文本）
      newSelections.push({
        anchor: adjustedFrom,
        head: adjustedFrom + replacement.length,
      });

      // 累计偏移量，用于后续选区位置计算
      const oldLength = to - from;
      const newLength = replacement.length;
      offset += newLength - oldLength;
    });

    // 应用更改并设置选区
    view.dispatch({
      changes,
      selection: { anchor: newSelections[0].anchor, head: newSelections[0].head },
    });
  }

  /**
   * 获取当前选择区域的range (完全兼容版本)
   */
  $getSelectionRange() {
    const editorView = this.editor.editor;
    /** @type {import('@codemirror/view').EditorView} */
    // @ts-ignore - editorView 可能是 CM6Adapter，它有 view 属性
    const view = editorView.view || editorView;
    const { state } = view;
    const { selection, doc } = state;
    const { main: selectionMain } = selection;

    // 辅助函数：将偏移量转换为行列位置
    const offsetToPos = (offset) => {
      const line = doc.lineAt(offset);
      return {
        line: line.number - 1, // 转换为0基索引
        ch: offset - line.from,
      };
    };

    const anchorPos = offsetToPos(selectionMain.anchor);
    const headPos = offsetToPos(selectionMain.head);

    // 处理选择方向，确保 begin 在 end 之前
    if (selectionMain.anchor > selectionMain.head) {
      return { begin: headPos, end: anchorPos };
    }

    return { begin: anchorPos, end: headPos };
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
    const editorView = this.editor.editor;
    /** @type {import('@codemirror/view').EditorView} */
    // @ts-ignore - editorView 可能是 CM6Adapter，它有 view 属性
    const cm = editorView.view || editorView;
    const { begin, end } = this.$getSelectionRange();

    // 计算 lessBefore 的偏移量
    const lessBeforeLines = lessBefore.match(/\n/g)?.length || 0;
    const newBeginLine = lessBeforeLines > 0 ? begin.line + lessBeforeLines : begin.line;
    const lessBeforeLastLine = lessBefore.replace(/^[\s\S]*?\n([^\n]*)$/, '$1');
    const newBeginCh = lessBeforeLines > 0 ? lessBeforeLastLine.length : begin.ch + lessBefore.length;

    // 计算 lessAfter 的偏移量
    const lessAfterLines = lessAfter.match(/\n/g)?.length || 0;
    const newEndLine = lessAfterLines > 0 ? end.line - lessAfterLines : end.line;

    // 修复：当 lessAfterLines > 0 时，我们移动到了新的行，
    // newEndCh 应该是该行的实际长度，而不是基于 end.ch 计算
    let newEndCh;
    if (lessAfterLines > 0) {
      // 获取目标行的内容长度
      try {
        const targetLine = cm.state.doc.line(newEndLine + 1);
        newEndCh = targetLine.length;
      } catch (e) {
        console.warn('Error getting line length:', e);
        newEndCh = 0;
      }
    } else {
      newEndCh = end.ch - lessAfter.length;
    }

    // 使用 CodeMirror 6 的方式设置选择
    const newFrom = cm.state.doc.line(newBeginLine + 1).from + newBeginCh;
    const newTo = cm.state.doc.line(newEndLine + 1).from + newEndCh;

    cm.dispatch({
      selection: { anchor: newFrom, head: newTo },
    });
  }

  /**
   * 基于当前已选择区域，获取更多的选择区 (CodeMirror 6 现代风格)
   * @param {string} [appendBefore] 选择区前面追加的内容
   * @param {string} [appendAfter] 选择区后面追加的内容
   * @param {function} [cb] 回调函数，如果返回false，则恢复原来的选取
   */
  getMoreSelection(appendBefore = '', appendAfter = '', cb) {
    const editorView = this.editor.editor;
    /** @type {import('@codemirror/view').EditorView} */
    // @ts-ignore - editorView 可能是 CM6Adapter，它有 view 属性
    const view = editorView.view || editorView;
    const { state } = view;
    const { selection, doc } = state;
    const { main: selectionMain } = selection;

    // 保存原始选择区域
    const { anchor, head } = selectionMain;
    const originalSelection = { anchor, head };

    // 计算扩展后的选择区域
    const { from, to } = selectionMain;
    let newFrom = from;
    let newTo = to;

    // 处理前置内容
    if (appendBefore) {
      const beforeLines = appendBefore.match(/\n/g)?.length || 0;
      if (beforeLines > 0) {
        // 包含换行符，移动到行首
        const fromLine = doc.lineAt(from);
        const targetLineNum = Math.max(1, fromLine.number - beforeLines);
        newFrom = doc.line(targetLineNum).from;
      } else {
        // 不包含换行符，向前扩展字符数
        newFrom = Math.max(0, from - appendBefore.length);
      }
    }

    // 处理后置内容
    if (appendAfter) {
      const afterLines = appendAfter.match(/\n/g)?.length || 0;
      if (afterLines > 0) {
        // 包含换行符，移动到目标行末
        const toLine = doc.lineAt(to);
        const targetLineNum = Math.min(doc.lines, toLine.number + afterLines);
        newTo = doc.line(targetLineNum).to;
      } else {
        // 不包含换行符，向后扩展字符数
        const toLine = doc.lineAt(to);
        newTo = Math.min(toLine.to, to + appendAfter.length);
      }
    }

    // 设置新的选择区域
    view.dispatch({
      selection: { anchor: newFrom, head: newTo },
    });

    // 执行回调，如果返回false则恢复原选择
    if (cb && cb() === false) {
      view.dispatch({
        selection: originalSelection,
      });
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
    const editorView = this.editor.editor;
    /** @type {import('@codemirror/view').EditorView} */
    // @ts-ignore - editorView 可能是 CM6Adapter，它有 view 属性
    const view = editorView.view || editorView;
    // 多光标模式下不做处理
    if (this.isSelections) {
      return selection;
    }

    // 使用 CodeMirror 6 的 getSelection 工具函数
    return getSelectionUtil(view, selection, type, focus);
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

  /**
   * 兼容之前的写法，但不支持配置
   */
  get shortcutKeys() {
    return [];
  }

  /**
   * 更新菜单图标
   * @param {import('~types/menus').CustomMenuConfig['icon']} options 图标配置
   */
  updateMenuIcon(options) {
    if (this.noIcon) {
      return false;
    }
    // 传入 options 是个字符串，说明是想要更新 iconfont，那就要求当前的icon类型也为iconfont
    if (typeof options === 'string') {
      if (this.iconType === 'iconfont') {
        this.dom.querySelector('i')?.classList.replace(`ch-icon-${this.iconName}`, `ch-icon-${options}`);
        this.iconName = options;
        this.$currentMenuOptions.icon = options;
        this.iconType = 'iconfont';
        return true;
      }
      return false;
    }
    if (options instanceof HTMLElement) {
      options.classList.add(`ch-icon cherry-menu-${this.name}`);
      this.dom.replaceChildren(options);
      this.iconType = 'element';
      return true;
    }
    let { iconName } = this;
    switch (options.type) {
      case 'iconfont':
        if (this.iconType === 'iconfont') {
          iconName = options.content;
          this.dom.querySelector('i')?.classList.replace(`ch-icon-${this.iconName}`, `ch-icon-${iconName}`);
          this.iconName = iconName;
        } else {
          const icon = this.createIconFontIcon(options.content, {
            className: `cherry-menu-${this.name}`,
          });
          if (options.iconClassName) {
            icon.classList.add(options.iconClassName);
          }
          if (options.iconStyle) {
            icon.setAttribute('style', options.iconStyle);
          }
          this.dom.replaceChildren(icon);
        }
        this.iconType = 'iconfont';
        break;
      case 'svg':
        this.dom.replaceChildren(this.createSvgIcon(options));
        this.iconType = 'svg';
        break;
      case 'image':
        this.dom.replaceChildren(this.createImageIcon(options));
        this.iconType = 'image';
        break;
      case 'element':
        throw Error(`except the options argument instance of HTMLElement, but get a type of ${typeof options}`);
      default:
        break;
    }
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

  hide() {
    this.dom.style.display = 'none';
  }

  show() {
    this.dom.style.display = 'block';
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

  /**
   * 绑定子菜单点击事件
   * @param {HTMLDivElement} subMenuDomPanel
   * @returns {number|number[]} 当前激活的子菜单索引或索引数组
   */
  getActiveSubMenuIndex(subMenuDomPanel) {
    return -1;
  }
}
