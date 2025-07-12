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

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，color: #000000 | background-color: #000000
   * @param {Event & {target:HTMLElement}} event 点击事件，用来从被点击的调色盘中获得对应的颜色
   * @returns {string | undefined} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '', event) {
    if (this.hasCacheOnce() || this.$testIsShortKey(shortKey)) {
      const $selection = getSelection(this.editor.editor, selection) || this.locale.color;

      const colorInfo = this.$getTypeAndColor(shortKey);

      if (typeof colorInfo === 'object' && colorInfo) {
        if (colorInfo.type === 'clear') {
          this.bubbleColor.toggle({ forceHide: true });
          if (!$selection) return '';
          const { text } = this.parseAppliedColors($selection);
          return text;
        }

        const { type, color } = colorInfo;
        const applied = this.parseAppliedColors($selection);

        if (type === 'text') {
          applied.textColor = color;
        } else if (type === 'background-color') {
          applied.bgColor = color;
        }

        return this.buildStyleString(applied.textColor, applied.bgColor, applied.text);
      }
      return;
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

  /**
   * 解析颜色语法
   * @param {string} selection 选中的文本
   * @returns {{textColor: string|null, bgColor: string|null, text: string}}
   */
  parseAppliedColors(selection) {
    // 复合样式1：!!textcolor !!!bgcolor text!!!!!
    const combinedTextOuter = /^\s*!!([#\w]+)\s+!!!([#\w]+)\s+([\s\S]+?)\s*!!!!!\s*$/;
    const combinedTextOuterMatch = selection.match(combinedTextOuter);
    if (combinedTextOuterMatch) {
      const [, textColor, bgColor, text] = combinedTextOuterMatch;
      return { textColor, bgColor, text };
    }

    // 复合样式2：!!!bgcolor !!textcolor text!!!!!
    const combinedBgOuter = /^\s*!!!([#\w]+)\s+!!([#\w]+)\s+([\s\S]+?)\s*!!!!!\s*$/;
    const combinedBgOuterMatch = selection.match(combinedBgOuter);
    if (combinedBgOuterMatch) {
      const [, bgColor, textColor, text] = combinedBgOuterMatch;
      return { bgColor, textColor, text };
    }

    // 仅背景颜色：!!!bgcolor text!!!
    const bgOnly = /^\s*!!!([#\w]+)\s+([\s\S]+?)\s*!!!\s*$/;
    const bgOnlyMatch = selection.match(bgOnly);
    if (bgOnlyMatch) {
      const [, bgColor, text] = bgOnlyMatch;
      return { bgColor, textColor: null, text };
    }

    // 仅文字颜色：!!textcolor text!!
    const textOnly = /^\s*!!([#\w]+)\s+([\s\S]+?)\s*!!\s*$/;
    const textOnlyMatch = selection.match(textOnly);
    if (textOnlyMatch) {
      const [, textColor, text] = textOnlyMatch;
      return { textColor, bgColor: null, text };
    }

    // 如果都没有匹配，则返回原始文本和null颜色
    return {
      textColor: null,
      bgColor: null,
      text: selection,
    };
  }

  /**
   * 根据传入的颜色构建最终的样式字符串
   * @param {string|null} textColor 文字颜色
   * @param {string|null} bgColor 背景颜色
   * @param {string} text 文本内容
   * @returns {string}
   */
  buildStyleString(textColor, bgColor, text) {
    if (!text) return '';
    let styledText = text;

    if (bgColor) {
      styledText = `!!!${bgColor} ${styledText}!!!`;
    }
    if (textColor) {
      styledText = `!!${textColor} ${styledText}!!`;
    }

    return styledText;
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
}

/**
 * 调色盘
 */
class BubbleColor {
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
    // 灰色系
    ['#fafafa', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040', '#262626', '#171717'],
  ];

  constructor($cherry) {
    this.editor = $cherry.editor;
    this.$cherry = $cherry;
    this.locale = $cherry.locale;

    // 当前选中的颜色（十六进制格式）
    this.currentColor = '#ff0000';
    // 当前操作类型：'text' 或 'background'
    this.currentType = 'text';

    // HSV色彩空间的三个分量
    this.currentHue = 0; // 色相（0-360度）
    this.currentSaturation = 1; // 饱和度（0-1）
    this.currentBrightness = 1; // 明度（0-1）

    // 当前是否正在拖拽操作，可能的值：'saturation'（饱和度/明度区域）、'hue'（色相条）、''（无拖拽）
    this.isDragging = '';
    this.recentColors = this.getRecentColors();
    this.init();
    this.initAction();
  }

  init() {
    this.dom = this.getDom();
    this.editor.options.wrapperDom.appendChild(this.dom);
  }

  getDom() {
    const $colorWrap = document.createElement('div');
    $colorWrap.classList.add('cherry-color-wrap');
    $colorWrap.classList.add('cherry-dropdown');

    $colorWrap.innerHTML = `
      <div class="cherry-color-tabs">
        <div class="cherry-color-tab-group">
          <div class="cherry-color-tab active" data-type="text">${this.locale.colorPickerText}</div>
          <div class="cherry-color-tab" data-type="background">${this.locale.colorPickerBackground}</div>
        </div>
        <div class="cherry-color-clear">${this.locale.colorPickerClear}</div>
      </div>
      ${this.createColorPicker()}
      ${this.createRecentColors()}
      ${this.createPresetColors()}
    `;

    return $colorWrap;
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
        <div class="cherry-color-hue-container">
          <div class="cherry-color-hue">
            <div class="cherry-color-hue-pointer" style="left: 0%;"></div>
          </div>
          <div class="cherry-color-preview" style="background-color: #ff0000;"></div>
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
        <div class="cherry-color-section-title">${this.locale.colorPickerRecentColors}</div>
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
        <div class="cherry-color-section-title">${this.locale.colorPickerPresetColors}</div>
        <div class="cherry-color-preset-grid">
          ${presetsHTML}
        </div>
      </div>
    `;
  }

  initAction() {
    // 鼠标按下事件：开始颜色选择或拖拽操作
    this.dom.addEventListener('mousedown', (evt) => {
      const { target } = /** @type {MouseEvent & {target:HTMLElement}}*/ (evt);

      // 检测是否点击了饱和度/明度选择区域
      if (
        target.classList.contains('cherry-color-saturation') ||
        target.classList.contains('cherry-color-pointer') ||
        target.closest('.cherry-color-saturation')
      ) {
        this.isDragging = 'saturation';
        // 根据点击位置计算颜色值
        const color = this.getColorFromPicker(evt);
        this.updateColorSelection(color);
        evt.preventDefault();
        return;
      }

      // 检测是否点击了色相选择条
      if (
        target.classList.contains('cherry-color-hue') ||
        target.classList.contains('cherry-color-hue-pointer') ||
        target.closest('.cherry-color-hue')
      ) {
        this.isDragging = 'hue';
        // 根据点击位置计算色相值
        const color = this.getHueFromPicker(evt);
        this.updateColorSelection(color);
        evt.preventDefault();
        return;
      }
    });

    // 鼠标移动事件：处理拖拽过程中的颜色更新
    document.addEventListener('mousemove', (evt) => {
      if (this.isDragging === 'saturation') {
        // 拖拽饱和度/明度区域时实时更新颜色
        const color = this.getColorFromPicker(evt);
        this.updateColorSelection(color);
        evt.preventDefault();
      } else if (this.isDragging === 'hue') {
        // 拖拽色相条时实时更新颜色
        const color = this.getHueFromPicker(evt);
        this.updateColorSelection(color);
        evt.preventDefault();
      }
    });

    // 鼠标松开事件：结束拖拽操作
    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = '';
      }
    });

    // 点击事件：处理选项卡切换、清除颜色、颜色选择等操作
    this.dom.addEventListener('click', (evt) => {
      const { target } = /** @type {MouseEvent & {target:HTMLElement}}*/ (evt);

      // 切换文字/背景颜色选项卡
      if (target.classList.contains('cherry-color-tab')) {
        this.dom.querySelectorAll('.cherry-color-tab').forEach((tab) => tab.classList.remove('active'));
        target.classList.add('active');
        this.currentType = target.dataset.type;
        return;
      }

      // 清除颜色按钮
      if (target.classList.contains('cherry-color-clear')) {
        this.$color.setCacheOnce({ type: 'clear' });
        this.$color.fire(null);
        return;
      }

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
   * @param {{left?: number, top?: number, $color?: object, forceHide?: boolean}} options
   */
  toggle({ left, top, $color, forceHide = false } = {}) {
    const isVisible = this.dom.style.display !== 'none' && this.dom.style.display !== '';

    if (forceHide || isVisible) {
      this.dom.style.display = 'none';
      return;
    }

    if (typeof left === 'number' && typeof top === 'number' && $color) {
      this.dom.style.left = `${left}px`;
      this.dom.style.top = `${top}px`;
      this.dom.style.display = 'block';
      this.$color = $color;

      this.setColor(this.currentColor);
      this.updateRecentColorsDisplay();
    }
  }

  /**
   * 设置颜色并更新HSV值
   */
  setColor(color) {
    this.currentColor = color;
    const rgb = hexToRgb(color);
    if (rgb) {
      // 将RGB转换为HSV色彩空间，便于在颜色选择器中定位
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      this.currentHue = hsv.h; // 色相：0-360度
      this.currentSaturation = hsv.s; // 饱和度：0-1
      this.currentBrightness = hsv.v; // 明度：0-1

      // 更新界面显示
      this.updateColorDisplay(color);
      this.updateHueBackground();
      this.updatePointers();
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
   * 从颜色选择器获取颜色
   * 根据鼠标在饱和度/明度区域的位置计算对应的颜色值
   * @param {MouseEvent} e 鼠标事件，用于获取点击位置
   * @returns {string} 计算得到的十六进制颜色值
   */
  getColorFromPicker(e) {
    const saturationEl = this.dom.querySelector('.cherry-color-saturation');
    if (!saturationEl) return this.currentColor;

    // 获取饱和度/明度选择区域的位置和尺寸
    const rect = saturationEl.getBoundingClientRect();
    // 计算鼠标在区域内的相对位置，并限制在有效范围内
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    // 将位置转换为饱和度和明度值
    // x轴代表饱和度：左边是0（白色），右边是1（纯色）
    this.currentSaturation = x / rect.width;
    // y轴代表明度：上面是1（亮），下面是0（暗）
    this.currentBrightness = 1 - y / rect.height;

    // 根据新的HSV值计算颜色
    this.updateColorFromHsv();
    return this.currentColor;
  }

  /**
   * 从色相条获取色相值
   * 根据鼠标在色相条上的位置计算对应的色相值
   * @param {MouseEvent} e 鼠标事件，用于获取点击位置
   * @returns {string} 计算得到的十六进制颜色值
   */
  getHueFromPicker(e) {
    const hueEl = this.dom.querySelector('.cherry-color-hue');
    if (!hueEl) return this.currentColor;

    // 获取色相条的位置和尺寸
    const rect = hueEl.getBoundingClientRect();
    // 计算鼠标在色相条上的相对位置，并限制在有效范围内
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));

    // 将位置转换为色相值：0度到360度的范围
    this.currentHue = (x / rect.width) * 360;

    // 根据新的色相值重新计算颜色
    this.updateColorFromHsv();
    return this.currentColor;
  }

  /**
   * 更新颜色选择
   */
  updateColorSelection(color) {
    const typeKey = this.currentType === 'text' ? 'text' : 'background-color';
    this.$color.setCacheOnce({ type: typeKey, color });
    this.$color.fire(null);
  }

  /**
   * 更新颜色显示
   */
  updateColorDisplay(color) {
    this.currentColor = color;
    const previewEl = /** @type {HTMLElement}*/ (this.dom.querySelector('.cherry-color-preview'));
    if (previewEl) {
      previewEl.style.backgroundColor = color;
    }
  }

  /**
   * 更新颜色指针位置
   */
  updatePointers() {
    const pointer = /** @type {HTMLElement}*/ (this.dom.querySelector('.cherry-color-pointer'));
    const huePointer = /** @type {HTMLElement}*/ (this.dom.querySelector('.cherry-color-hue-pointer'));

    if (pointer) {
      // 饱和度/明度区域的指针位置
      // 水平位置代表饱和度：0%（左）到100%（右）
      pointer.style.left = `${this.currentSaturation * 100}%`;
      // 垂直位置代表明度：0%（上，亮）到100%（下，暗）
      pointer.style.top = `${(1 - this.currentBrightness) * 100}%`;
    }

    if (huePointer) {
      // 色相条指针位置：0%（左，0度）到100%（右，360度）
      huePointer.style.left = `${(this.currentHue / 360) * 100}%`;
    }
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

  /**
   * 获取最近使用的颜色
   */
  getRecentColors() {
    return JSON.parse(localStorage.getItem('cherry-recent-colors') || '[]');
  }

  /**
   * 保存最近使用的颜色
   */
  saveRecentColor(color) {
    if (!color) return;

    // 将新颜色添加到列表开头，移除已存在的相同颜色，并限制为最多6个
    this.recentColors = [color, ...this.recentColors.filter((c) => c !== color)].slice(0, 6);
    localStorage.setItem('cherry-recent-colors', JSON.stringify(this.recentColors));
  }
}
