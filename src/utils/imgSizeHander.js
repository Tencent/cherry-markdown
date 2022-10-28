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
/**
 * 用于在图片四周画出调整图片尺寸的边框
 */
const imgSizeHander = {
  mouseResize: {},
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
  initBubbleButtons() {
    const position = this.getImgPosition();
    return {
      points: {
        arr: [
          'leftTop',
          'leftBottom',
          'rightTop',
          'rightBottom',
          'leftMiddle',
          'middleBottom',
          'middleTop',
          'rightMiddle',
        ],
        arrInfo: {
          leftTop: { name: '20', left: 0, top: 0 },
          leftBottom: { name: '00', left: 0, top: 0 },
          rightTop: { name: '22', left: 0, top: 0 },
          rightBottom: { name: '02', left: 0, top: 0 },
          leftMiddle: { name: '10', left: 0, top: 0 },
          middleBottom: { name: '01', left: 0, top: 0 },
          middleTop: { name: '21', left: 0, top: 0 },
          rightMiddle: { name: '12', left: 0, top: 0 },
        },
      },
      imgSrc: this.img.src,
      style: {
        width: this.img.width,
        height: this.img.height,
        left: position.left - 1,
        top: position.top - 1,
        marginTop: 0,
        marginLeft: 0,
      },
      scrollTop: this.previewerDom.scrollTop,
      position,
    };
  },
  showBubble(img, container, previewerDom) {
    if (this.$isResizing()) {
      return;
    }
    this.img = img;
    this.previewerDom = previewerDom;
    this.container = container;
    this.buts = this.initBubbleButtons();
    this.drawBubbleButs();
  },
  emit(type, event = {}) {
    switch (type) {
      case 'mousedown':
        return this.resizeBegin(event);
      case 'mouseup':
        return this.resizeStop(event);
      case 'mousemove':
        return this.resizeWorking(event);
      case 'scroll':
        return this.dealScroll(event);
      case 'remove':
        return this.remove();
      case 'previewUpdate':
        return this.previewUpdate(event);
    }
  },
  previewUpdate(callback) {
    if (this.$isResizing()) {
      return;
    }
    this.remove();
    callback();
  },
  drawBubbleButs() {
    if (this.butsLayout) {
      return this.updateBubbleButs();
    }
    this.butsLayout = this.container;
    this.butsImg = document.createElement('div');
    this.butsImg.className = 'cherry-previewer-img-size-hander__background';
    this.butsImg.style.backgroundImage = `url(${this.buts.imgSrc})`;
    this.butsLayout.appendChild(this.butsImg);

    this.butsPoints = {};
    Object.keys(this.buts.points.arr).forEach((index) => {
      const name = this.buts.points.arr[index];
      const tmp = document.createElement('div');
      tmp.className = [
        'cherry-previewer-img-size-hander__points',
        `cherry-previewer-img-size-hander__points-${name}`,
      ].join(' ');
      tmp.dataset.name = name;
      this.butsLayout.appendChild(tmp);
      this.butsPoints[`pints-${name}`] = tmp;
    });
    return this.updateBubbleButs();
  },
  remove() {
    this.butsLayout = false;
  },
  updateBubbleButs() {
    this.$updatePointsInfo();
    Object.keys(this.buts.style).forEach((name) => {
      this.butsLayout.style[name] = `${this.buts.style[name]}px`;
    });
    Object.keys(this.buts.points.arr).forEach((index) => {
      const name = this.buts.points.arr[index];
      this.butsPoints[`pints-${name}`].style.top = `${this.buts.points.arrInfo[name].top}px`;
      this.butsPoints[`pints-${name}`].style.left = `${this.buts.points.arrInfo[name].left}px`;
    });
  },
  $updatePointsInfo() {
    const pointLeft = this.buts.style.width;
    const pointTop = this.buts.style.height;
    const newPointsInfo = this.$getPointsInfo(pointLeft, pointTop);
    Object.keys(this.buts.points.arr).forEach((index) => {
      const name = this.buts.points.arr[index];
      if (this.buts.points.arrInfo[name].left !== newPointsInfo[name].left) {
        this.buts.points.arrInfo[name].left = newPointsInfo[name].left;
      }
      if (this.buts.points.arrInfo[name].top !== newPointsInfo[name].top) {
        this.buts.points.arrInfo[name].top = newPointsInfo[name].top;
      }
    });
  },
  $getPointsInfo(left, top) {
    return {
      leftTop: { left: 0, top: 0 },
      leftBottom: { left: 0, top },
      rightTop: { left, top: 0 },
      rightBottom: { left, top },
      leftMiddle: { left: 0, top: top / 2 },
      middleBottom: { left: left / 2, top },
      middleTop: { left: left / 2, top: 0 },
      rightMiddle: { left, top: top / 2 },
    };
  },
  $isResizing() {
    return this.mouseResize.resize;
  },
  dealScroll(event) {
    const position = this.getImgPosition();
    if (this.butsLayout.style.marginTop !== position.top - this.buts.position.top) {
      this.butsLayout.style.marginTop = `${position.top - this.buts.position.top}px`;
      this.buts.style.marginTop = `${position.top - this.buts.position.top}px`;
    }
    if (this.butsLayout.style.marginLeft !== position.left - this.buts.position.left) {
      this.butsLayout.style.marginLeft = `${position.left - this.buts.position.left}px`;
      this.buts.style.marginLeft = `${position.left - this.buts.position.left}px`;
    }
  },
  initMouse() {
    return { left: 0, top: 0, resize: false, name: '' };
  },
  resizeBegin(event) {
    const point = event.target;
    if (!point.classList.contains('cherry-previewer-img-size-hander__points')) {
      return false;
    }
    this.mouseResize.left = event.clientX;
    this.mouseResize.top = event.clientY;
    this.mouseResize.resize = true;
    this.mouseResize.name = point.getAttribute('data-name');
    this.previewerDom.classList.add('doing-resize-img');
  },
  resizeStop(event, buts, editor, menu) {
    if (!this.$isResizing()) {
      return false;
    }
    this.img.style.width = `${this.buts.style.width}px`;
    this.img.style.height = `${this.buts.style.height}px`;
    this.buts.style.marginTop = 0;
    this.buts.style.marginLeft = 0;
    this.updateBubbleButs();
    this.mouseResize.resize = false;
    this.previewerDom.classList.remove('doing-resize-img');
    this.change();
  },
  resizeWorking(event, buts) {
    if (!this.$isResizing()) {
      return;
    }
    const changeX = event.clientX - this.mouseResize.left;
    const changeY = event.clientY - this.mouseResize.top;
    let change = {};
    switch (this.mouseResize.name) {
      case 'leftTop':
      case 'leftBottom':
      case 'leftMiddle':
        change = this.$getChange(changeX, changeY, 'x');
        this.buts.style.width = this.buts.position.width - change.changeX;
        if (this.mouseResize.name !== 'leftMiddle') {
          this.buts.style.height = this.buts.position.height - change.changeY;
        }
        break;
      case 'rightTop':
      case 'rightBottom':
      case 'rightMiddle':
        change = this.$getChange(changeX, changeY, 'x');
        this.buts.style.width = this.buts.position.width + change.changeX;
        if (this.mouseResize.name !== 'rightMiddle') {
          this.buts.style.height = this.buts.position.height + change.changeY;
        }
        break;
      case 'middleTop':
        change = this.$getChange(changeX, changeY, 'y');
        this.buts.style.height = this.buts.position.height - change.changeY;
        break;
      case 'middleBottom':
        change = this.$getChange(changeX, changeY, 'y');
        this.buts.style.height = this.buts.position.height + change.changeY;
        break;
    }
    this.updateBubbleButs();
    this.change();
  },
  change() {
    this.emitChange(this.img, { width: this.buts.style.width, height: this.buts.style.height });
  },
  bindChange(func) {
    this.emitChange = func;
  },
  /**
   * 根据宽（x）或高（y）来进行等比例缩放
   * @param {number} x 宽度
   * @param {number} y 高度
   * @param {string} type 类型，以宽/高为基准做等比例缩放
   * @returns
   */
  $getChange(x, y, type) {
    const ret = { changeX: 0, changeY: 0 };
    switch (type) {
      case 'y':
        ret.changeY = y;
        ret.changeX = (y * this.buts.position.width) / this.buts.position.height;
        break;
      default:
        ret.changeX = x;
        ret.changeY = (x * this.buts.position.height) / this.buts.position.width;
        break;
    }
    return ret;
  },
};

export default imgSizeHander;
