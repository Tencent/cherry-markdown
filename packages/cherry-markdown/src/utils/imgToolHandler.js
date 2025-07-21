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
    // console.log('event:', event);
    const operationList = [
      { text: locale.border, type: 'border', active: false },
      { text: locale.shadow, type: 'shadow', active: false },
      { text: locale.radius, type: 'radius', active: false },
      {
        text: locale.align,
        type: 'align',
        active: false,
        subTypes: [
          { text: locale.alignLeft, type: 'left' },
          { text: locale.alignCenter, type: 'center' },
          { text: locale.alignRight, type: 'right' },
          { text: locale.alignFloatRight, type: 'float-right' },
          { text: locale.alignFloatLeft, type: 'float-left' },
          { text: locale.alignNone, type: 'none' },
        ],
      },
    ];
    this.previewerDom = previewerDom;
    this.container = container;
    console.log('imgToolHandler:', this.img, this.container, this.previewerDom);
    operationList.forEach((operation) => {
      operation.active = this.img.className.match(`cherry-img-${operation.type}`);
      const div = document.createElement('div');
      const icon = document.createElement('i');
      div.appendChild(icon);
      div.className = `img-tool-button ${operation.active ? ' active' : ''}`;
      div.title = operation.text;
      if (operation.type === 'align') {
        icon.className = `img-tool-icon ch-icon ch-icon-align`;
        div.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          operation.active = !operation.active;
          // 点击后，更新样式
          div.className = `img-tool-button ${operation.active ? ' active' : ''}`;
          // 点击样式按键，打开样式菜单
          this.showAlignMenu(div, operation);
        });
        console.info('div:', div);
      } else {
        icon.className = `img-tool-icon ch-icon ch-icon-imgTool${capitalizeFirstLetter(operation.type)}`;
        div.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          operation.active = !operation.active;
          // 点击后，更新样式
          div.className = `img-tool-button ${operation.active ? ' active' : ''}`;
          // 点击样式按键，打开样式菜单
          this.emitChange(this.img, operation.type);
        });
      }
      this.container.append(div);
    });
    const previewerRect = this.previewerDom.parentNode.getBoundingClientRect();
    this.container.style.left = `${event.x - previewerRect.left}px`;
    this.container.style.top = `${event.y - previewerRect.top}px`;

    this.position = {
      ...this.getImgPosition(),
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

function capitalizeFirstLetter(str) {
  return str ? str.replace(/^\w/, (c) => c.toUpperCase()) : '';
}

imgToolHandler.showAlignMenu = function (button, operation) {
  // 检查是否已有菜单，有则移除
  const existingMenu = button.querySelector('.img-align-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  // 创建对齐菜单
  const menu = document.createElement('div');
  menu.className = 'img-align-menu';

  operation.subTypes.forEach((subType) => {
    const item = document.createElement('div');
    item.className = 'img-align-item';
    item.textContent = subType.text;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      this.emitChange(this.img, `align-${subType.type}`);
      menu.remove();
      // 点击后，更新样式
      operation.active = !operation.active;
      button.className = `img-tool-button ${operation.active ? ' active' : ''}`;
    });
    menu.appendChild(item);
  });

  button.appendChild(menu);

  // 点击按钮本身也关闭菜单
  button.addEventListener('click', (e) => {
    console.log('button clicked:', button);
    if (menu.parentNode === button) {
      // 如果菜单已显示，再次点击时关闭菜单并移除active状态
      menu.remove();
    }
  });
};

export default imgToolHandler;
