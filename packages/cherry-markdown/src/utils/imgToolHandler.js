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

import imgSizeHandler from './imgSizeHandler';

/**
 * 用于在图片被点击时弹出调整图片边框|阴影|圆角的工具栏
 */
const imgToolHandler = {
  mouseResize: {},
  position: { x: 0, y: 0 },
  getImgPosition() {
    const position = this.img.getBoundingClientRect();
    const editorPosition = this.previewerDom.parentNode.getBoundingClientRect();
    const padding = parseFloat(this.img.style.padding) || 0;
    return {
      bottom: position.bottom - editorPosition.bottom,
      top: position.top - editorPosition.top + padding * 1.5,
      height: position.height,
      width: position.width,
      right: position.right - editorPosition.right,
      left: position.left - editorPosition.left + padding * 1.5,
      x: position.x - editorPosition.x,
      y: position.y - editorPosition.y,
    };
  },
  showBubble(img, container, previewerDom, event, locale) {
    this.img = img;

    this.previewerDom = previewerDom;
    this.container = container;

    const decoList = [
      { text: locale.border, type: 'border', active: false },
      { text: locale.shadow, type: 'shadow', active: false },
      { text: locale.radius, type: 'radius', active: false },
    ];
    const decoDiv = document.createElement('div');
    decoDiv.className = 'img-tool-group';
    const getImgToolButtonClassName = (item) => `img-tool-button${item.active ? ' active' : ''}`;
    this.container.appendChild(decoDiv);
    decoList.forEach((deco) => {
      deco.active = this.img.className.match(`cherry-img-deco-${deco.type}`);
      const div = document.createElement('div');
      const icon = document.createElement('i');
      div.appendChild(icon);
      icon.className = `img-tool-icon ch-icon ch-icon-imgDeco${capitalizeFirstLetter(deco.type)}`;
      div.className = getImgToolButtonClassName(deco);
      div.title = deco.text;
      div.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deco.active = !deco.active;
        // 点击后，更新样式
        div.className = getImgToolButtonClassName(deco);
        this.emitChange(this.img, deco.type);
      });
      decoDiv.append(div);
    });

    const divider = document.createElement('div');
    divider.className = 'img-tool-divider';
    this.container.appendChild(divider);

    const alignList = [
      { text: locale.alignLeft, type: 'left' },
      { text: locale.alignCenter, type: 'center' },
      { text: locale.alignRight, type: 'right' },
      { text: locale.alignFloatLeft, type: 'float-left' },
      { text: locale.alignFloatRight, type: 'float-right' },
    ];
    const alignDiv = document.createElement('div');
    alignDiv.className = 'img-tool-group';
    this.container.appendChild(alignDiv);
    alignList.forEach((align, index) => {
      align.active = this.img.className.match(`cherry-img-align-${align.type}`);
      const div = document.createElement('div');
      const icon = document.createElement('i');
      align.div = div;
      div.appendChild(icon);
      icon.className = `img-tool-icon ch-icon ch-icon-imgAlign${capitalizeLetter(align.type)}`;
      div.className = getImgToolButtonClassName(align);
      div.title = align.text;
      div.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        align.active = !align.active;
        alignList.forEach(
          (align1) => align1 !== align && ((align1.active = false) || (align1.div.className = `img-tool-button`)),
        );
        div.className = getImgToolButtonClassName(align);
        this.emitChange(this.img, align.active ? align.type : 'clear-align');

        imgSizeHandler.showBubble(this.img, this.container, this.previewerDom);
        setTimeout(() => {
          imgSizeHandler.updatePosition();
        }, 150);
      });
      alignDiv.append(div);
    });

    const previewerRect = this.previewerDom.parentNode.getBoundingClientRect();
    const imgPosition = this.getImgPosition();

    // 临时设置工具栏位置以获取其尺寸
    this.container.style.visibility = 'hidden';
    this.container.style.left = '0px';
    this.container.style.top = '0px';

    // 获取工具栏的尺寸
    const toolbarRect = this.container.getBoundingClientRect();
    const toolbarWidth = toolbarRect.width;
    const toolbarHeight = toolbarRect.height;

    // 恢复可见性
    this.container.style.visibility = '';

    // 计算鼠标位置相对于预览器的坐标
    const mouseX = event.x - previewerRect.left;
    const mouseY = event.y - previewerRect.top;

    // 工具栏与图片边缘的间距
    const padding = 8;

    let finalLeft;
    let finalTop;

    if (imgPosition.width < toolbarWidth + padding * 2 || imgPosition.height < toolbarHeight + padding * 2) {
      // 图片宽度或高度小于工具栏尺寸，工具栏放在图片下方居中
      finalLeft = imgPosition.left + (imgPosition.width - toolbarWidth) / 2;
      finalTop = imgPosition.top + imgPosition.height + padding;
    } else {
      // 图片宽度、高度足够，尝试将工具栏放在图片内部
      finalTop = mouseY;

      // 检查垂直方向是否超出图片边界
      if (mouseY < imgPosition.top + padding) {
        finalTop = imgPosition.top + padding;
      } else if (mouseY + toolbarHeight > imgPosition.top + imgPosition.height - padding) {
        finalTop = imgPosition.top + imgPosition.height - toolbarHeight - padding;
      }

      // 水平方向：从鼠标位置开始，如果超出右边界就左移
      finalLeft = mouseX;
      if (mouseX + toolbarWidth > imgPosition.left + imgPosition.width - padding) {
        // 右边界超出，调整到图片右边界内
        finalLeft = imgPosition.left + imgPosition.width - toolbarWidth - padding;
      }

      // 检查左边界
      if (finalLeft < imgPosition.left + padding) {
        finalLeft = imgPosition.left + padding;
      }
    }

    this.container.style.left = `${finalLeft}px`;
    this.container.style.top = `${finalTop}px`;

    this.position = {
      ...imgPosition,
    };
  },
  emit(type, event = {}) {
    switch (type) {
      case 'scroll':
        return this.dealScroll(event);
    }
  },
  previewUpdate(callback) {
    if (this.$isResizing()) {
      return;
    }
    this.remove();
    callback();
  },
  remove() {
    this.butsLayout = false;
  },
  $isResizing() {
    return this.mouseResize.resize;
  },
  dealScroll(event) {
    const position = this.getImgPosition();
    if (this.container.style.marginTop !== position.top - this.position.top) {
      this.container.style.marginTop = `${position.top - this.position.top}px`;
    }
    if (this.container.style.marginLeft !== position.left - this.position.left) {
      this.container.style.marginLeft = `${position.left - this.position.left}px`;
    }
  },
  change() {
    this.emitChange(this.img, { width: this.buts.style.width, height: this.buts.style.height });
  },
  bindChange(func) {
    this.emitChange = func;
  },
};

function capitalizeLetter(str) {
  return str
    ? str
        .split('-')
        .map((w) => capitalizeFirstLetter(w))
        .join('')
    : '';
}
function capitalizeFirstLetter(str) {
  return str ? str.replace(/^\w/, (c) => c.toUpperCase()) : '';
}

export default imgToolHandler;
