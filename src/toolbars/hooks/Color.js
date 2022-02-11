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
/**
 * 插入字体颜色或者字体背景颜色的按钮
 */
export default class Color extends MenuBase {
  constructor(editor) {
    super(editor);
    this.setName('color', 'color');
    this.bubbleMenu = true;
    this.bubbleColor = new BubbleColor(editor);
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @param {Event & {target:HTMLElement}} event 点击事件，用来从被点击的调色盘中获得对应的颜色
   * @returns 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '', event) {
    const text = selection ? selection : '字体颜色或背景';
    if (event) {
      // 暂存选中的文本内容
      this.bubbleColor.setSelection(text);

      // 定位调色盘应该出现的位置
      // 该按钮可能出现在顶部工具栏，
      // 也可能出现在选中文字时出现的bubble工具栏，
      // 也可能出现在新行出现的float工具栏
      let top = 0;
      let left = 0;
      if (event.target.closest('.cherry-bubble')) {
        const $colorDom = /** @type {HTMLElement}*/ (event.target.closest('.cherry-bubble'));
        const clientRect = $colorDom.getBoundingClientRect();
        top = clientRect.top + $colorDom.offsetHeight;
        left = /** @type {HTMLElement}*/ (event.target.closest('.cherry-toolbar-color')).offsetLeft + clientRect.left;
      } else {
        const $colorDom = /** @type {HTMLElement}*/ (event.target.closest('.cherry-toolbar-color'));
        const clientRect = $colorDom.getBoundingClientRect();
        top = clientRect.top + $colorDom.offsetHeight;
        left = clientRect.left;
      }
      this.bubbleColor.show({
        left,
        top,
      });
    }
  }
}

/**
 * 调色盘
 */
class BubbleColor {
  constructor(editor) {
    this.editor = editor;
    this.init();
    this.initAction();
  }

  /**
   * 定义调色盘每个色块的颜色值
   */
  colorStack = [
    '#000000',
    '#444444',
    '#666666',
    '#999999',
    '#cccccc',
    '#eeeeee',
    '#f3f3f3',
    '#ffffff',
    '#ff0000',
    '#ff9900',
    '#ffff00',
    '#00ff00',
    '#00ffff',
    '#0000ff',
    '#9900ff',
    '#ff00ff',
    '#f4cccc',
    '#fce5cd',
    '#fff2cc',
    '#d9ead3',
    '#d0e0e3',
    '#cfe2f3',
    '#d9d2e9',
    '#ead1dc',
    '#ea9999',
    '#f9cb9c',
    '#ffe599',
    '#b6d7a8',
    '#a2c4c9',
    '#9fc5e8',
    '#b4a7d6',
    '#d5a6bd',
    '#e06666',
    '#f6b26b',
    '#ffd966',
    '#93c47d',
    '#76a5af',
    '#6fa8dc',
    '#8e7cc3',
    '#c27ba0',
    '#cc0000',
    '#e69138',
    '#f1c232',
    '#6aa84f',
    '#45818e',
    '#3d85c6',
    '#674ea7',
    '#a64d79',
    '#990000',
    '#b45f06',
    '#bf9000',
    '#38761d',
    '#134f5c',
    '#0b5394',
    '#351c75',
    '#741b47',
    '#660000',
    '#783f04',
    '#7f6000',
    '#274e13',
    '#0c343d',
    '#073763',
    '#20124d',
    '#4c1130',
  ];

  /**
   * 用来暂存选中的内容
   * @param {string} selection 编辑区选中的文本内容
   */
  setSelection(selection) {
    this.selection = selection;
  }

  getFontColorDom(title) {
    const colorStackDOM = this.colorStack
      .map(
        (color) =>
          `<span class="cherry-color-item" unselectable="on" data-val="${color}"
                  style="background-color:${color}"></span>`,
      )
      .join('');
    return `<h3>${title}</h3>${colorStackDOM}`;
  }

  getDom() {
    const $colorWrap = document.createElement('div');
    $colorWrap.classList.add('cherry-color-wrap');
    $colorWrap.classList.add('cherry-dropdown');
    const $textWrap = document.createElement('div');
    $textWrap.classList.add('cherry-color-text');
    $textWrap.innerHTML = this.getFontColorDom('文本颜色');
    $colorWrap.appendChild($textWrap);

    const $bgWrap = document.createElement('div');
    $bgWrap.classList.add('cherry-color-bg');
    $bgWrap.innerHTML = this.getFontColorDom('背景颜色');
    $colorWrap.appendChild($bgWrap);

    return $colorWrap;
  }

  init() {
    this.dom = this.getDom();
    this.editor.options.wrapperDom.appendChild(this.dom);
  }

  onClick() {
    if (this.type === 'text') {
      return `!!${this.colorValue} ${this.selection}!!`;
    }
    return `!!!${this.colorValue} ${this.selection}!!!`;
  }

  initAction() {
    const self = this;
    this.dom.addEventListener(
      'click',
      (evt) => {
        const { target } = /** @type {MouseEvent & {target:HTMLElement}}*/ (evt);
        this.colorValue = target.getAttribute('data-val');
        if (!this.colorValue) {
          return false;
        }
        this.type = target.closest('.cherry-color-text') ? 'text' : 'bg';
        const selections = this.editor.editor.getSelections();
        const res = selections.map((selection, index, srcArray) => this.onClick() || srcArray[index]);
        self.editor.editor.replaceSelections(res);
        self.editor.editor.focus();
      },
      false,
    );
    this.dom.addEventListener('EditorHideToolbarSubMenu', () => {
      if (this.dom.style.display !== 'none') {
        this.dom.style.display = 'none';
      }
    });
  }

  /**
   * 在对应的坐标展示调色盘
   * @param {Object} 坐标
   */
  show({ left, top }) {
    this.dom.style.left = `${left}px`;
    this.dom.style.top = `${top}px`;
    this.dom.style.display = 'block';
  }
}
