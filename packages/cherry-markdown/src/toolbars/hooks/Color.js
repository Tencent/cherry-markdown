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
import { getSelection } from '@/utils/selection';
import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@/utils/color';
/**
 * 插入字体颜色或者字体背景颜色的按钮
 */
export default class Color extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('color', 'color');
    // this.bubbleMenu = true;
    this.bubbleColor = new BubbleColor($cherry);
  }

  $testIsColor(type, selection) {
    const textReg = /^\s*!![^\s]+ [\s\S]+!!\s*$/;
    const bgReg = /^\s*!!![^\s]+ [\s\S]+!!!\s*$/;
    if (type === 'text') {
      return textReg.test(selection) && !bgReg.test(selection);
    }
    return bgReg.test(selection);
  }

  $testIsShortKey(shortKey) {
    return /(color|background-color)\s*:/.test(shortKey);
  }

  $getTypeAndColor(shortKey) {
    if (this.$testIsShortKey(shortKey)) {
      const type = /background-color\s*:/.test(shortKey) ? 'background-color' : 'text';
      const color = shortKey.replace(/(color|background-color)\s*:\s*([#0-9a-zA-Z]+)[^#0-9a-zA-Z]*$/, '$2').trim();
      return { type, color };
    }
    return this.getAndCleanCacheOnce();
  }

  hideOtherSubMenu(hideAllSubMenu) {
    const lastDisplay = this.bubbleColor.dom.style.display || 'none';
    hideAllSubMenu();
    this.bubbleColor.dom.style.display = lastDisplay;
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，color: #000000 | background-color: #000000
   * @param {Event & {target:HTMLElement}} event 点击事件，用来从被点击的调色盘中获得对应的颜色
   * @returns 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '', event) {
    if (this.hasCacheOnce() || this.$testIsShortKey(shortKey)) {
      let $selection = getSelection(this.editor.editor, selection) || this.locale.color;
      // @ts-ignore
      const { type, color } = this.$getTypeAndColor(shortKey);
      const begin = type === 'text' ? `!!${color} ` : `!!!${color} `;
      const end = type === 'text' ? '!!' : '!!!';
      if (!this.isSelections && !this.$testIsColor(type, $selection)) {
        this.getMoreSelection(begin, end, () => {
          const newSelection = this.editor.editor.getSelection();
          if (this.$testIsColor(type, newSelection)) {
            $selection = newSelection;
            return true;
          }
          return false;
        });
      }
      if (this.$testIsColor(type, $selection)) {
        const reg = new RegExp(`(^\\s*${end})([^\\s]+) ([\\s\\S]+${end}\\s*$)`, 'gm');
        const tmp = $selection.replace(reg, (w, m1, m2, m3) => {
          return `${m1}${color} ${m3}`;
        });
        this.registerAfterClickCb(() => {
          this.setLessSelection(begin, end);
        });
        return tmp;
      }
      this.registerAfterClickCb(() => {
        this.setLessSelection(begin, end);
      });
      return `${begin}${$selection}${end}`;
    }
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
    this.updateMarkdown = false;
    // 【TODO】需要增加getMoreSelection的逻辑
    this.bubbleColor.toggle({
      left,
      top,
      $color: this,
    });
  }
}

/**
 * 调色盘
 */
class BubbleColor {
  constructor($cherry) {
    this.editor = $cherry.editor;
    this.$cherry = $cherry;
    this.currentColor = '#ff0000';
    this.currentType = 'text';
    this.currentHue = 0;
    this.currentSaturation = 1;
    this.currentBrightness = 1;
    this.isDragging = '';
    this.recentColors = this.getRecentColors();
    this.init();
    this.initAction();
  }

  /**
   * 定义调色盘每个色块的颜色值
   */
  presetColors = [
    // 蓝色系
    ['#e6f3ff', '#cce7ff', '#99d6ff', '#66c5ff', '#33b4ff', '#0099ff', '#0080e6', '#0066cc', '#004d99', '#003366'],
    // 红色系
    ['#ffe6e6', '#ffcccc', '#ff9999', '#ff6666', '#ff3333', '#ff0000', '#e60000', '#cc0000', '#990000', '#660000'],
    // 橙色系
    ['#fff2e6', '#ffe6cc', '#ffcc99', '#ffb366', '#ff9933', '#ff8000', '#e6730d', '#cc6600', '#995500', '#663300'],
    // 绿色系
    ['#e6ffe6', '#ccffcc', '#99ff99', '#66ff66', '#33ff33', '#00ff00', '#00e600', '#00cc00', '#009900', '#006600'],
  ];

  /**
   * 获取最近使用的颜色
   */
  getRecentColors() {
    try {
      return JSON.parse(localStorage.getItem('cherry-recent-colors') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * 保存最近使用的颜色
   */
  saveRecentColor(color) {
    if (!color || color === '#000000') return;

    this.recentColors = [color, ...this.recentColors.filter((c) => c !== color)].slice(0, 6);
    localStorage.setItem('cherry-recent-colors', JSON.stringify(this.recentColors));
  }

  /**
   * 更新色相条背景
   */
  updateHueBackground() {
    const saturationEl = /** @type {HTMLElement}*/ (this.dom.querySelector('.cherry-color-saturation'));
    if (saturationEl) {
      const hueColor = hsvToRgb(this.currentHue, 1, 1);
      const hueHex = rgbToHex(hueColor.r, hueColor.g, hueColor.b);
      saturationEl.parentElement.style.background = `linear-gradient(to right, ${hueHex} 0%, ${hueHex} 100%)`;
    }
  }

  /**
   * 更新颜色指针位置
   */
  updatePointers() {
    const pointer = /** @type {HTMLElement}*/ (this.dom.querySelector('.cherry-color-pointer'));
    const huePointer = /** @type {HTMLElement}*/ (this.dom.querySelector('.cherry-color-hue-pointer'));

    if (pointer) {
      pointer.style.left = `${this.currentSaturation * 100}%`;
      pointer.style.top = `${(1 - this.currentBrightness) * 100}%`;
    }

    if (huePointer) {
      huePointer.style.left = `${(this.currentHue / 360) * 100}%`;
    }
  }

  /**
   * 从HSV值更新当前颜色
   */
  updateColorFromHsv() {
    const rgb = hsvToRgb(this.currentHue, this.currentSaturation, this.currentBrightness);
    this.currentColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    this.updateColorDisplay(this.currentColor);
    this.updateHueBackground();
    this.updatePointers();
  }

  /**
   * 用来暂存选中的内容
   * @param {string} selection 编辑区选中的文本内容
   */
  setSelection(selection) {
    this.selection = selection;
  }

  /**
   * 创建颜色选择器主体区域
   */
  createColorPicker() {
    return `
      <div class="cherry-color-picker">
        <div class="cherry-color-main" style="background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);">
          <div class="cherry-color-saturation" style="background: linear-gradient(to top, #000 0%, transparent 100%), linear-gradient(to right, #fff 0%, transparent 100%);">
            <div class="cherry-color-pointer" style="left: 100%; top: 0%;"></div>
          </div>
        </div>
        <div class="cherry-color-hue">
          <div class="cherry-color-hue-pointer" style="left: 0%;"></div>
        </div>
      </div>
    `;
  }

  /**
   * 创建最近使用颜色区域
   */
  createRecentColors() {
    const createColorItem = (color, isEmpty = false) =>
      `<div class="cherry-color-item ${isEmpty ? 'cherry-color-recent-empty' : 'cherry-color-recent-item'}" 
           ${!isEmpty ? `data-color="${color}" style="background-color: ${color};"` : ''}></div>`;

    const recentColorsHTML = this.recentColors.map((color) => createColorItem(color)).join('');
    const emptyHTML = Array(Math.max(0, 6 - this.recentColors.length))
      .fill(createColorItem('', true))
      .join('');

    return `
      <div class="cherry-color-recent">
        <div class="cherry-color-section-title">最近使用颜色</div>
        <div class="cherry-color-recent-grid">
          ${recentColorsHTML}${emptyHTML}
        </div>
      </div>
    `;
  }

  /**
   * 创建预设颜色区域
   */
  createPresetColors() {
    const presetsHTML = this.presetColors
      .map(
        (row) =>
          `<div class="cherry-color-preset-row">
          ${row
            .map(
              (color) =>
                `<div class="cherry-color-item cherry-color-preset-item" data-color="${color}" style="background-color: ${color};"></div>`,
            )
            .join('')}
        </div>`,
      )
      .join('');

    return `
      <div class="cherry-color-presets">
        <div class="cherry-color-section-title">系统预设颜色</div>
        <div class="cherry-color-preset-grid">
          ${presetsHTML}
        </div>
      </div>
    `;
  }

  getDom() {
    const $colorWrap = document.createElement('div');
    $colorWrap.classList.add('cherry-color-wrap');
    $colorWrap.classList.add('cherry-dropdown');

    $colorWrap.innerHTML = `
      <div class="cherry-color-tabs">
        <div class="cherry-color-tab active" data-type="text">文字</div>
        <div class="cherry-color-tab" data-type="background">背景</div>
      </div>
      ${this.createColorPicker()}
      ${this.createRecentColors()}
      ${this.createPresetColors()}
    `;

    return $colorWrap;
  }

  init() {
    this.dom = this.getDom();
    this.editor.options.wrapperDom.appendChild(this.dom);
  }

  onClick() {
    if (this.type === 'text') {
      if (/^!!#\S+ [\s\S]+?!!/.test(this.selection)) {
        return this.selection.replace(/^!!#\S+ ([\s\S]+?)!!/, `!!${this.colorValue} $1!!`);
      }
      return `!!${this.colorValue} ${this.selection}!!`;
    }
    if (/^!!!#\S+ [\s\S]+?!!!/.test(this.selection)) {
      return this.selection.replace(/^!!!#\S+ ([\s\S]+?)!!!/, `!!!${this.colorValue} $1!!!`);
    }
    return `!!!${this.colorValue} ${this.selection}!!!`;
  }

  /**
   * 更新颜色显示
   */
  updateColorDisplay(color) {
    this.currentColor = color;
  }

  /**
   * 从颜色选择器获取颜色
   */
  getColorFromPicker(e) {
    const saturationEl = this.dom.querySelector('.cherry-color-saturation');
    if (!saturationEl) return this.currentColor;

    const rect = saturationEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    this.currentSaturation = x / rect.width;
    this.currentBrightness = 1 - y / rect.height;

    this.updateColorFromHsv();
    return this.currentColor;
  }

  /**
   * 从色相条获取色相值
   */
  getHueFromPicker(e) {
    const hueEl = this.dom.querySelector('.cherry-color-hue');
    if (!hueEl) return this.currentColor;

    const rect = hueEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));

    this.currentHue = (x / rect.width) * 360;
    this.updateColorFromHsv();
    return this.currentColor;
  }

  /**
   * 设置颜色并更新HSV值
   */
  setColor(color) {
    this.currentColor = color;
    const rgb = hexToRgb(color);
    if (rgb) {
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      this.currentHue = hsv.h;
      this.currentSaturation = hsv.s;
      this.currentBrightness = hsv.v;
      this.updateColorDisplay(color);
      this.updateHueBackground();
      this.updatePointers();
    }
  }

  /**
   * 更新颜色选择并触发事件
   */
  updateColorSelection(color) {
    this.colorValue = color;
    this.type = this.currentType;
    this.$color.setCacheOnce({ type: this.type, color: this.colorValue });
    this.$color.fire(null);
  }

  initAction() {
    this.dom.addEventListener('mousedown', (evt) => {
      const { target } = /** @type {MouseEvent & {target:HTMLElement}}*/ (evt);

      // 颜色选择器
      if (
        target.classList.contains('cherry-color-saturation') ||
        target.classList.contains('cherry-color-pointer') ||
        target.closest('.cherry-color-saturation')
      ) {
        this.isDragging = 'saturation';
        const color = this.getColorFromPicker(evt);
        this.updateColorSelection(color);
        evt.preventDefault();
        return;
      }

      // 色相条
      if (
        target.classList.contains('cherry-color-hue') ||
        target.classList.contains('cherry-color-hue-pointer') ||
        target.closest('.cherry-color-hue')
      ) {
        this.isDragging = 'hue';
        const color = this.getHueFromPicker(evt);
        this.updateColorSelection(color);
        evt.preventDefault();
        return;
      }
    });

    // 鼠标移动：更新颜色选择
    document.addEventListener('mousemove', (evt) => {
      if (this.isDragging === 'saturation') {
        const color = this.getColorFromPicker(evt);
        this.updateColorSelection(color);
        evt.preventDefault();
      } else if (this.isDragging === 'hue') {
        const color = this.getHueFromPicker(evt);
        this.updateColorSelection(color);
        evt.preventDefault();
      }
    });

    // 鼠标松开
    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = '';
      }
    });

    this.dom.addEventListener('click', (evt) => {
      const { target } = /** @type {MouseEvent & {target:HTMLElement}}*/ (evt);

      // 标签页切换
      if (target.classList.contains('cherry-color-tab')) {
        this.dom.querySelectorAll('.cherry-color-tab').forEach((tab) => tab.classList.remove('active'));
        target.classList.add('active');
        this.currentType = target.dataset.type;
        return;
      }

      // 预设颜色点击
      if (
        target.classList.contains('cherry-color-preset-item') ||
        target.classList.contains('cherry-color-recent-item')
      ) {
        const { color } = target.dataset;
        if (color) {
          this.setColor(color);
          this.updateColorSelection(color);
          this.saveRecentColor(color);
        }
        return;
      }
    });
  }

  /**
   * 在对应的坐标展示/关闭调色盘
   * @param {Object} 坐标
   */
  toggle({ left, top, $color }) {
    if (this.dom.style.display?.length > 0 && this.dom.style.display !== 'none') {
      this.dom.style.display = 'none';
      return;
    }

    this.dom.style.left = `${left}px`;
    this.dom.style.top = `${top}px`;
    this.dom.style.display = 'block';
    this.$color = $color;

    this.setColor(this.currentColor);
    this.updateRecentColorsDisplay();
  }

  /**
   * 更新最近使用颜色的显示
   */
  updateRecentColorsDisplay() {
    const recentGrid = this.dom.querySelector('.cherry-color-recent-grid');
    if (!recentGrid) return;

    const createColorItem = (color, isEmpty = false) =>
      `<div class="cherry-color-item ${isEmpty ? 'cherry-color-recent-empty' : 'cherry-color-recent-item'}" 
           ${!isEmpty ? `data-color="${color}" style="background-color: ${color};"` : ''}></div>`;

    const recentColorsHTML = this.recentColors.map((color) => createColorItem(color)).join('');
    const emptyHTML = Array(Math.max(0, 6 - this.recentColors.length))
      .fill(createColorItem('', true))
      .join('');

    recentGrid.innerHTML = `${recentColorsHTML}${emptyHTML}`;
  }
}
