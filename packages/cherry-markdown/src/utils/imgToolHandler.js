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
  showBubble(img, container, previewerDom, event) {
    this.img = img;
    // console.log('event:', event);
    const operationList = [
      { text: '边框', type: 'border', active: false },
      { text: '阴影', type: 'shadow', active: false },
      { text: '圆角', type: 'radius', active: false },
    ];
    this.previewerDom = previewerDom;
    this.container = container;
    // console.log('imgToolHandler:', this.img, this.container, this.previewerDom);
    operationList.forEach((operation) => {
      operation.active = this.img.className.match(`cherry-img-${operation.type}`);
      const div = document.createElement('div');
      const icon = document.createElement('i');
      div.appendChild(icon);
      icon.className = `img-tool-icon img-tool-icon-${operation.type} ch-icon ch-icon-imgTool${capitalizeFirstLetter(
        operation.type,
      )}`;
      div.className = `img-tool-icon-button ${operation.active ? ' img-tool-icon-active' : ''}`;
      div.title = operation.text;
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        operation.active = !operation.active;
        div.className = `img-tool-icon-button ${operation.active ? ' img-tool-icon-active' : ''}`;
        this.emitChange(this.img, operation.type);
      });
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

export default imgToolHandler;
