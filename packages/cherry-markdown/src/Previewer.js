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
import vDH from 'virtual-dom/h';
import vDDiff from 'virtual-dom/diff';
import vDPatch from 'virtual-dom/patch';
import MyersDiff from './utils/myersDiff';
import { getBlockTopAndHeightWithMargin } from './utils/dom';
import Logger from './Logger';
// import locale from './utils/locale';
import { addEvent, removeEvent } from './utils/event';
import { exportPDF, exportScreenShot, exportMarkdownFile, exportHTMLFile, exportWordFile } from './utils/export';
import PreviewerBubble from './toolbars/PreviewerBubble';
import LazyLoadImg from '@/utils/lazyLoadImg';

let onScroll = () => {}; // store in memory for remove event

/**
 * 作用：
 *  dom更新
 *  局部加载（分片）
 *  与左侧输入区域滚动同步
 */
export default class Previewer {
  /**
   * @property
   * @private
   * @type {boolean} 等待预览区域更新。预览区域更新时，预览区的滚动不会引起编辑器滚动，避免因插入的元素高度变化导致编辑区域跳动
   */
  applyingDomChanges = false;

  /**
   * @property
   * @private
   * @type {number} 释放同步滚动锁定的定时器ID
   */
  syncScrollLockTimer = 0;

  /**
   * @property
   * @public
   * @type {boolean} 是否为移动端预览模式
   */
  isMobilePreview = false;

  /**
   *
   * @param {Partial<import('~types/previewer').PreviewerOptions>} options 预览区域设置
   */
  constructor(options) {
    /**
     * @property
     * @type {import('~types/previewer').PreviewerOptions}
     */
    this.options = {
      previewerDom: document.createElement('div'),
      virtualDragLineDom: document.createElement('div'),
      editorMaskDom: document.createElement('div'),
      previewerMaskDom: document.createElement('div'),
      minBlockPercentage: 0.2, // editor或previewer所占宽度比例的最小值
      value: '',
      enablePreviewerBubble: true,
      floatWhenClosePreviewer: false, // 是否在关闭预览区时，将预览区浮动
      afterUpdateCallBack: [],
      isPreviewOnly: false,
      previewerCache: {
        // 关闭/开启预览区时缓存的previewer数据
        html: '',
        htmlChanged: false,
        layout: {},
      },
      /**
       * 配置图片懒加载的逻辑
       * 如果不希望图片懒加载，可配置成 lazyLoadImg = {maxNumPerTime: 6, autoLoadImgNum: -1}
       */
      lazyLoadImg: {
        // 加载图片时如果需要展示loading图，则配置loading图的地址
        loadingImgPath: '',
        // 同一时间最多有几个图片请求，最大同时加载6张图片
        maxNumPerTime: 2,
        // 不进行懒加载处理的图片数量，如果为0，即所有图片都进行懒加载处理， 如果设置为-1，则所有图片都不进行懒加载处理
        noLoadImgNum: 5,
        // 首次自动加载几张图片（不论图片是否滚动到视野内），autoLoadImgNum = -1 表示会自动加载完所有图片
        autoLoadImgNum: 5,
        // 针对加载失败的图片 或 beforeLoadOneImgCallback 返回false 的图片，最多尝试加载几次，为了防止死循环，最多5次。以图片的src为纬度统计重试次数
        maxTryTimesPerSrc: 2,
        // 加载一张图片之前的回调函数，函数return false 会终止加载操作
        beforeLoadOneImgCallback: (img) => {},
        // 加载一张图片失败之后的回调函数
        failLoadOneImgCallback: (img) => {},
        // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
        afterLoadOneImgCallback: (img) => {},
        // 加载完所有图片后调用的回调函数
        afterLoadAllImgCallback: () => {},
      },
    };

    Object.assign(this.options, options);
    this.$cherry = this.options.$cherry;
    this.instanceId = this.$cherry.getInstanceId();
    /**
     * @property
     * @private
     * @type {{ timer?: number; destinationTop?: number }}
     */
    this.animation = {};
  }

  init(editor) {
    /**
     * @property
     * @private
     * @type {boolean} 禁用滚动事件监听
     */
    this.disableScrollListener = false;
    this.bindScroll();
    this.editor = editor;
    this.bindDrag();
    this.$initPreviewerBubble();
    this.lazyLoadImg = new LazyLoadImg(this.options.lazyLoadImg, this);
    this.lazyLoadImg.doLazyLoad();
    this.bindClick();
    this.onMouseDown();
    this.onSizeChange();
    if (this.$cherry.options.previewer.isMobilePreview) {
      this.changePreviewToMobile(true);
    }
  }

  /**
   * “监听”编辑器的尺寸变化，变化时更新拖拽条的位置
   */
  onSizeChange() {
    // 创建一个新的 ResizeObserver 实例
    const resizeObserver = new ResizeObserver(() => {
      this.syncVirtualLayoutFromReal();
      this.subMenusPositionChange();
      // 发布编辑器大小变化事件
      this.$cherry.$event.emit('editor.size.change');
    });
    // 开始监听元素
    resizeObserver.observe(this.$cherry.wrapperDom);
  }

  subMenusPositionChange() {
    ['toolbar', 'sidebar', 'toolbarRight'].forEach((toolbarName) => {
      if (this.$cherry[toolbarName]) {
        this.$cherry[toolbarName].updateSubMenuPosition();
      }
    });
  }

  $initPreviewerBubble() {
    this.previewerBubble = new PreviewerBubble(this);
  }

  /**
   * @returns {HTMLElement}
   */
  getDomContainer() {
    return this.isMobilePreview
      ? this.options.previewerDom.querySelector('.cherry-mobile-previewer-content')
      : this.options.previewerDom;
  }

  getDom() {
    return this.options.previewerDom;
  }

  /**
   * 获取预览区内的html内容
   * @param {boolean} wrapTheme 是否在外层包裹主题class
   * @returns html内容
   */
  getValue(wrapTheme = true) {
    let html = '';
    if (this.isPreviewerHidden()) {
      html = this.options.previewerCache.html;
    } else {
      html = this.getDomContainer().innerHTML;
    }
    // 需要未加载的图片替换成原始图片
    html = this.lazyLoadImg.changeDataSrc2Src(html);
    if (!wrapTheme || !this.$cherry.wrapperDom) {
      return html;
    }
    const inlineCodeTheme = this.$cherry.wrapperDom.getAttribute('data-inline-code-theme');
    const codeBlockTheme = this.$cherry.wrapperDom.getAttribute('data-code-block-theme');
    return `<div data-inline-code-theme="${inlineCodeTheme}" data-code-block-theme="${codeBlockTheme}">${html}</div>`;
  }

  isPreviewerHidden() {
    return this.options.previewerDom.classList.contains('cherry-previewer--hidden');
  }

  isPreviewerFloat() {
    const floatDom = this.$cherry.cherryDom.querySelector('.float-previewer-wrap');
    return this.$cherry.cherryDom.contains(floatDom);
  }

  isPreviewerNeedFloat() {
    return this.options.floatWhenClosePreviewer;
  }

  calculateRealLayout(editorWidth) {
    // 根据editor的绝对宽度计算editor和previewer的百分比宽度
    const editorDomWidth = this.editor.options.editorDom.getBoundingClientRect().width;
    const previewerDomWidth = this.options.previewerDom.getBoundingClientRect().width;
    const totalWidth = editorDomWidth + previewerDomWidth;
    let editorPercentage = +(editorWidth / totalWidth).toFixed(3);
    if (editorPercentage < this.options.minBlockPercentage) {
      editorPercentage = +this.options.minBlockPercentage.toFixed(3);
    } else if (editorPercentage > 1 - this.options.minBlockPercentage) {
      editorPercentage = +(1 - this.options.minBlockPercentage).toFixed(3);
    }
    const previewerPercentage = +(1 - editorPercentage).toFixed(3);
    const res = {
      editorPercentage: `${editorPercentage * 100}%`,
      previewerPercentage: `${previewerPercentage * 100}%`,
    };
    return res;
  }

  setRealLayout(editorPercentage, previewerPercentage) {
    // 主动设置editor,previewer宽度,按百分比计算
    let $editorPercentage = editorPercentage;
    let $previewerPercentage = previewerPercentage;
    if (!$editorPercentage || !$previewerPercentage) {
      $editorPercentage = '50%';
      $previewerPercentage = '50%';
    }
    this.editor.options.editorDom.style.width = $editorPercentage;
    this.options.previewerDom.style.width = $previewerPercentage;

    this.syncVirtualLayoutFromReal();
  }

  syncVirtualLayoutFromReal() {
    // 通过editor和previewer的百分比宽度,同步更新mask和dragLine的px宽度及位置
    const editorPos = this.editor.options.editorDom.getBoundingClientRect();
    const previewerPos = this.options.previewerDom.getBoundingClientRect();
    const editorHeight = editorPos.height;
    const editorTop = this.editor.options.editorDom.offsetTop;
    const editorLeft = editorPos.left;
    const editorWidth = editorPos.width;
    const previewerLeft = previewerPos.left ? previewerPos.left - editorLeft : 0;
    const previewerWidth = previewerPos.width || 0;

    const { editorMaskDom, previewerMaskDom, virtualDragLineDom: virtualLineDom } = this.options;

    this.$tryChangeValue(virtualLineDom, 'top', `${editorTop}px`);
    this.$tryChangeValue(virtualLineDom, 'left', `${previewerLeft}px`);
    this.$tryChangeValue(virtualLineDom, 'bottom', '0px');

    this.$tryChangeValue(editorMaskDom, 'height', `${editorHeight}px`);
    this.$tryChangeValue(editorMaskDom, 'top', `${editorTop}px`);
    this.$tryChangeValue(editorMaskDom, 'left', '0px');
    this.$tryChangeValue(editorMaskDom, 'width', `${editorWidth}px`);

    this.$tryChangeValue(previewerMaskDom, 'height', `${editorHeight}px`);
    this.$tryChangeValue(previewerMaskDom, 'top', `${editorTop}px`);
    this.$tryChangeValue(previewerMaskDom, 'left', `${previewerLeft}px`);
    this.$tryChangeValue(previewerMaskDom, 'width', `${previewerWidth}px`);
  }

  $tryChangeValue(obj, key, value) {
    if (obj.style[key] !== value) {
      obj.style[key] = value;
    }
  }

  calculateVirtualLayout(editorLeft, editorRight) {
    // 计算mask和dragline应处在的位置,按px计算
    const editorDomWidth = this.editor.options.editorDom.getBoundingClientRect().width;
    const previewerDomWidth = this.options.previewerDom.getBoundingClientRect().width;
    const totalWidth = editorDomWidth + previewerDomWidth;
    const startWidth = editorLeft.toFixed(0);
    let leftWidth = editorRight - editorLeft;
    if (leftWidth < totalWidth * this.options.minBlockPercentage) {
      leftWidth = +(totalWidth * this.options.minBlockPercentage).toFixed(0);
    } else if (leftWidth > totalWidth * (1 - this.options.minBlockPercentage)) {
      leftWidth = +(totalWidth * (1 - this.options.minBlockPercentage)).toFixed(0);
    }
    const rightWidth = totalWidth - leftWidth;
    const ret = {
      startWidth: parseInt(startWidth, 10), // 起始位置(左侧留白)
      leftWidth, // 左侧mask宽度
      rightWidth, // 右侧mask宽度
    };
    return ret;
  }

  setVirtualLayout(startWidth, leftWidth, rightWidth) {
    // 主动设置mask和dragLine位置,按px计算
    const { editorMaskDom, previewerMaskDom, virtualDragLineDom: virtualLineDom } = this.options;
    const $startWidth = 0; // =startWidth

    editorMaskDom.style.left = `${$startWidth}px`;
    editorMaskDom.style.width = `${leftWidth}px`;

    virtualLineDom.style.left = `${$startWidth + leftWidth}px`;

    previewerMaskDom.style.left = `${$startWidth + leftWidth}px`;
    previewerMaskDom.style.width = `${rightWidth}px`;
  }

  bindDrag() {
    const dragLineMouseMove = (mouseMoveEvent) => {
      // 阻止事件冒泡
      if (mouseMoveEvent && mouseMoveEvent.stopPropagation) {
        mouseMoveEvent.stopPropagation();
      } else {
        mouseMoveEvent.cancelBubble = true;
      }
      // 取消默认事件
      if (mouseMoveEvent.preventDefault) {
        mouseMoveEvent.preventDefault();
      } else {
        window.event.returnValue = false;
      }

      const editorLeft = this.editor.options.editorDom.getBoundingClientRect().left;
      const editorRight = mouseMoveEvent.clientX;
      const virtualLayout = this.calculateVirtualLayout(editorLeft, editorRight);
      this.setVirtualLayout(virtualLayout.startWidth, virtualLayout.leftWidth, virtualLayout.rightWidth);
      return false;
    };

    const dragLineMouseUp = (mouseUpEvent) => {
      // 阻止事件冒泡
      if (mouseUpEvent && mouseUpEvent.stopPropagation) {
        mouseUpEvent.stopPropagation();
      } else {
        mouseUpEvent.cancelBubble = true;
      }
      // 取消默认事件
      if (mouseUpEvent.preventDefault) {
        mouseUpEvent.preventDefault();
      } else {
        window.event.returnValue = false;
      }

      // 重新设置editor和previewer宽度占比
      const editorLeft = this.editor.options.editorDom.getBoundingClientRect().left;
      const editorRight = mouseUpEvent.clientX;
      const layout = this.calculateRealLayout(editorRight - editorLeft);
      this.setRealLayout(layout.editorPercentage, layout.previewerPercentage);
      // 去掉蒙层和虚拟拖动条
      this.editor.options.editorDom.classList.remove('no-select');
      this.options.previewerDom.classList.remove('no-select');
      this.options.editorMaskDom.classList.remove('cherry-editor-mask--show');
      this.options.previewerMaskDom.classList.remove('cherry-previewer-mask--show');
      this.options.virtualDragLineDom.classList.remove('cherry-drag--show');
      // 刷新codemirror宽度
      try {
        if (this.editor.editor.refresh && typeof this.editor.editor.refresh === 'function') {
          this.editor.editor.refresh();
        } else if (this.editor.editor.requestMeasure && typeof this.editor.editor.requestMeasure === 'function') {
          // CodeMirror 6 equivalent
          this.editor.editor.requestMeasure();
        }
      } catch (e) {
        console.warn('Failed to refresh editor in Previewer:', e);
      }
      // 取消事件绑定
      removeEvent(document, 'mousemove', dragLineMouseMove, false);
      removeEvent(document, 'mouseup', dragLineMouseUp, false);
      return false;
    };

    const dragLineMouseDown = (mouseDownEvent) => {
      // 阻止事件冒泡
      if (mouseDownEvent && mouseDownEvent.stopPropagation) {
        mouseDownEvent.stopPropagation();
      } else {
        mouseDownEvent.cancelBubble = true;
      }
      // 取消默认事件
      if (mouseDownEvent.preventDefault) {
        mouseDownEvent.preventDefault();
      } else {
        window.event.returnValue = false;
      }

      this.syncVirtualLayoutFromReal();

      const editorLeft = this.editor.options.editorDom.getBoundingClientRect().left;
      const editorRight = mouseDownEvent.clientX;
      const virtualLayout = this.calculateVirtualLayout(editorLeft, editorRight);
      this.setVirtualLayout(virtualLayout.startWidth, virtualLayout.leftWidth, virtualLayout.rightWidth);
      if (!this.options.virtualDragLineDom.classList.contains('cherry-drag--show')) {
        // 增加蒙层防止选中editor或previewer内容
        this.options.virtualDragLineDom.classList.add('cherry-drag--show');
        this.options.editorMaskDom.classList.add('cherry-editor-mask--show');
        this.options.previewerMaskDom.classList.add('cherry-previewer-mask--show');
        this.options.previewerDom.classList.add('no-select');
        this.editor.options.editorDom.classList.add('no-select');
        // 绑定事件
        addEvent(document, 'mousemove', dragLineMouseMove, false);
        addEvent(document, 'mouseup', dragLineMouseUp, false);
      }
      return false;
    };

    addEvent(this.options.virtualDragLineDom, 'mousedown', dragLineMouseDown, false);
    addEvent(window, 'resize', this.syncVirtualLayoutFromReal.bind(this), false);
    this.setRealLayout();
  }

  bindScroll() {
    const domContainer = this.getDomContainer();
    onScroll = () => {
      if (this.applyingDomChanges) {
        Logger.log(new Date(), 'sync scroll locked');
        return;
      }
      if (this.disableScrollListener) {
        // 如果正在动画滚动,不要重置标志,让动画继续控制
        return;
      }
      if (domContainer.scrollTop <= 0) {
        this.editor.scrollToLineNum(0, 0, 1);
        return;
      }
      // 判定预览区域是否滚动到底部的逻辑，增加10px的冗余
      if (domContainer.scrollTop + domContainer.offsetHeight + 10 > domContainer.scrollHeight) {
        this.editor.scrollToLineNum(null);
        return;
      }
      const domPosition = domContainer.getBoundingClientRect();
      let targetElement;
      let lines = 0;
      const elements = domContainer.children;
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.getBoundingClientRect().top < domPosition.top) {
          targetElement = element;
          const currentLines = element.getAttribute('data-lines') ?? 0;
          lines += +currentLines;
        } else {
          break;
        }
      }
      if (!targetElement) {
        this.editor.scrollToLineNum(0, 0, 1);
        return;
      }
      // markdown元素存在margin，getBoundingRect不能获取到margin
      const mdElementStyle = getComputedStyle(targetElement);
      const marginTop = parseFloat(mdElementStyle.marginTop);
      const marginBottom = parseFloat(mdElementStyle.marginBottom);
      // markdown元素基于当前页面的矩形模型
      const mdRect = targetElement.getBoundingClientRect();
      const mdActualHeight = mdRect.height + marginTop + marginBottom;
      // (mdRect.y - marginTop)为顶部触达区域，basePoint.y为预览区域的顶部，故可视范围应减去预览区域的偏移
      const mdOffsetTop = mdRect.y - marginTop - domPosition.y;
      const lineNum = +targetElement.getAttribute('data-lines'); // 当前markdown元素所占行数
      const percent = (100 * Math.abs(mdOffsetTop)) / mdActualHeight / 100;
      // if(mdOffsetTop < 0) {
      return this.editor.scrollToLineNum(lines - lineNum, lineNum, percent);
      // }
      // return this.editor.scrollToLineNum(lines - lineNum, 0, 0);
    };
    addEvent(domContainer, 'scroll', onScroll, false);
    addEvent(
      domContainer,
      'wheel',
      () => {
        // 鼠标滚轮滚动时,打断滚动动画并恢复监听
        cancelAnimationFrame(this.animation.timer);
        this.animation.timer = 0;
        this.disableScrollListener = false;
      },
      false,
    );
  }

  removeScroll() {
    const domContainer = this.getDomContainer();
    removeEvent(domContainer, 'scroll', onScroll, false);
  }

  $html2H(dom) {
    if (typeof dom === 'undefined') {
      return vDH('span', {}, []);
    }
    if (!dom.tagName) {
      return dom.textContent;
    }
    const { tagName } = dom;

    // skip all children if data-cm-atomic attribute is set
    const isAtomic = 'true' === dom.getAttribute('data-cm-atomic');

    const myAttrs = this.$getAttrsForH(dom.attributes);
    const children = [];
    if (!isAtomic && dom.childNodes && dom.childNodes.length > 0) {
      for (let i = 0; i < dom.childNodes.length; i++) {
        children.push(this.$html2H(dom.childNodes[i]));
      }
    }
    return vDH(tagName, myAttrs, children);
  }

  $getAttrsForH(obj) {
    if (!obj) {
      return {};
    }
    const ret = { dataset: {} };
    for (let i = 0; i < obj.length; i++) {
      let { name } = obj[i];
      const { value } = obj[i];
      if (/^(width|height)$/i.test(name)) {
        if (isNaN(value)) {
          ret.style = ret.style ? ret.style : [];
          ret.style.push(`${name}:${value}`);
          continue;
        }
      }
      if (/^(class|id|href|rel|target|src|title|controls|align|width|height|style|open|contenteditable)$/i.test(name)) {
        name = name === 'class' ? 'className' : name;
        name = name === 'contenteditable' ? 'contentEditable' : name;
        if (name === 'style') {
          ret.style = ret.style ? ret.style : [];
          ret.style.push(value);
        } else if (name === 'open') {
          // 只要有open这个属性，就一定是true
          ret[name] = true;
        } else {
          ret[name] = value;
        }
      } else {
        // jsDom属性里面rowspan的S要大写,否则应用到html的dom节点会变成data-rowspan
        // https://stackoverflow.com/q/29774686
        if ('colspan' === name) {
          name = 'colSpan';
        } else if ('rowspan' === name) {
          name = 'rowSpan';
        }
        if (/^data-/i.test(name)) {
          name = name.replace(/^data-/i, '');
        } else {
          ret[name] = value;
        }
        ret.dataset[name] = value;
      }
    }
    if (ret.style) {
      ret.style = { cssText: ret.style.join(';') }; // see virtual-dom implementation
    }
    return ret;
  }

  $updateDom(newDom, oldDom) {
    const diff = vDDiff(this.$html2H(oldDom), this.$html2H(newDom));
    return vDPatch(oldDom, diff);
  }

  $testChild(dom) {
    if (!dom.parentNode) {
      return true;
    }
    if (dom.parentNode.classList.contains('cherry-previewer')) {
      return true;
    }
    if (dom.parentNode.getAttribute('data-sign')) {
      return false;
    }
    return this.$testChild(dom.parentNode);
  }
  _testMaxIndex(index, arr) {
    if (!arr) {
      return false;
    }
    for (let i = 0; i < arr.length; i++) {
      if (index <= arr[i]) {
        return true;
      }
    }
    return false;
  }
  $getSignData(list) {
    // const list = dom.querySelectorAll('[data-sign]');
    const ret = { list: [], signs: {} };
    for (let i = 0; i < list.length; i++) {
      if (!list[i].getAttribute('data-sign')) {
        continue;
      }
      const sign = list[i].getAttribute('data-sign');
      ret.list.push({ sign, dom: list[i] });
      if (!ret.signs[sign]) {
        ret.signs[sign] = [];
      }
      ret.signs[sign].push(i);
    }
    return ret;
  }

  _hasNewSign(list, sign, signIndex) {
    if (list.length > 0) {
      let resSign;
      list.forEach((listItem, i) => {
        // hash精度校准
        if (listItem.sign.slice(0, 12) === sign.slice(0, 12) && i > signIndex) {
          resSign = {
            index: i > signIndex ? i : signIndex,
            sign,
          };
        }
      });
      return resSign;
    }
    return false;
  }

  $dealWithMyersDiffResult(result, oldContent, newContent, domContainer) {
    result.forEach((change) => {
      if (newContent[change.newIndex].dom) {
        // 把已经加载过的图片的data-src变成src
        newContent[change.newIndex].dom.innerHTML = this.lazyLoadImg.changeLoadedDataSrc2Src(
          newContent[change.newIndex].dom.innerHTML,
        );
      }
      switch (change.type) {
        case 'delete':
          domContainer.removeChild(oldContent[change.oldIndex].dom);
          break;
        case 'insert':
          if (oldContent[change.oldIndex]) {
            domContainer.insertBefore(newContent[change.newIndex].dom, oldContent[change.oldIndex].dom);
          } else {
            domContainer.appendChild(newContent[change.newIndex].dom);
          }
          break;
        case 'update':
          try {
            // 处理表格包含图表的特殊场景
            let hasUpdate = false;
            if (
              newContent[change.newIndex].dom.className === 'cherry-table-container' &&
              newContent[change.newIndex].dom.querySelector('.cherry-table-figure') &&
              oldContent[change.oldIndex].dom.querySelector('.cherry-table-figure')
            ) {
              oldContent[change.oldIndex].dom
                .querySelector('.cherry-table-figure')
                .replaceWith(newContent[change.newIndex].dom.querySelector('.cherry-table-figure'));
              oldContent[change.oldIndex].dom.dataset.sign = newContent[change.oldIndex].dom.dataset.sign;
              this.$updateDom(
                newContent[change.newIndex].dom.querySelector('.cherry-table'),
                oldContent[change.oldIndex].dom.querySelector('.cherry-table'),
              );
              hasUpdate = true;
            } else if (newContent[change.newIndex].dom.querySelector('svg')) {
              throw new Error(); // SVG暂不使用patch更新
            }
            if (!hasUpdate) {
              this.$updateDom(newContent[change.newIndex].dom, oldContent[change.oldIndex].dom);
            }
          } catch (e) {
            domContainer.insertBefore(newContent[change.newIndex].dom, oldContent[change.oldIndex].dom);
            domContainer.removeChild(oldContent[change.oldIndex].dom);
          }
      }
    });
  }

  $dealUpdate(domContainer, oldHtmlList, newHtmlList) {
    if (newHtmlList.list !== oldHtmlList.list) {
      if (newHtmlList.list.length && oldHtmlList.list.length) {
        const myersDiff = new MyersDiff(newHtmlList.list, oldHtmlList.list, (obj, index) => obj[index].sign);
        const res = myersDiff.doDiff();
        Logger.log(res);
        this.$dealWithMyersDiffResult(res, oldHtmlList.list, newHtmlList.list, domContainer);
      } else if (newHtmlList.list.length && !oldHtmlList.list.length) {
        // 全新增
        Logger.log('add all');
        newHtmlList.list.forEach((piece) => {
          domContainer.appendChild(piece.dom);
        });
      } else if (!newHtmlList.list.length && oldHtmlList.list.length) {
        // 全删除
        Logger.log('delete all');
        oldHtmlList.list.forEach((piece) => {
          domContainer.removeChild(piece.dom);
        });
      }
    }
  }

  /**
   * 强制重新渲染预览区域
   */
  refresh(html) {
    const domContainer = this.getDomContainer();
    domContainer.innerHTML = html;
  }

  update(html) {
    // 更新时保留图片懒加载逻辑
    const newHtml = this.lazyLoadImg.changeSrc2DataSrc(html);
    if (!this.isPreviewerHidden()) {
      // 标记当前正在更新预览区域，锁定同步滚动功能
      window.clearTimeout(this.syncScrollLockTimer);
      this.applyingDomChanges = true;
      // 预览区未隐藏时，直接更新
      const domContainer = this.getDomContainer();
      if (this.editor.selectAll) {
        domContainer.innerHTML = '';
      }
      let tmpDiv = null;
      if (typeof window.DOMParser !== 'undefined') {
        // 如果支持DOMParser，则使用DOMParser将html字符串转成对应的HtmlElement
        // 使用DOMParser是为了防止newHtml里的图片等资源自动加载
        const parser = new DOMParser();
        const doc = parser.parseFromString(newHtml, 'text/html');
        tmpDiv = doc.querySelector('body');
      } else {
        tmpDiv = document.createElement('div');
        tmpDiv.innerHTML = newHtml;
      }
      const newHtmlList = this.$getSignData(tmpDiv.children);
      const oldHtmlList = this.$getSignData(domContainer.children);

      try {
        this.$dealUpdate(domContainer, oldHtmlList, newHtmlList);
        this.afterUpdate();
      } finally {
        // 延时释放同步滚动功能，在DOM更新完成后执行
        this.syncScrollLockTimer = window.setTimeout(() => {
          this.applyingDomChanges = false;
        }, 50);
      }
    } else {
      // 预览区隐藏时，先缓存起来，等到预览区打开再一次性更新
      this.doHtmlCache(newHtml);
    }
  }

  $dealEditAndPreviewOnly(isEditOnly = true) {
    let fullEditorLayout = {
      editorPercentage: '0%',
      previewerPercentage: '100%',
    };
    if (isEditOnly) {
      fullEditorLayout = {
        editorPercentage: '100%',
        previewerPercentage: '0%',
      };
    }
    const editorWidth = this.editor.options.editorDom.getBoundingClientRect().width;
    const layout = this.calculateRealLayout(editorWidth);
    this.options.previewerCache.layout = layout;
    this.setRealLayout(fullEditorLayout.editorPercentage, fullEditorLayout.previewerPercentage);
    this.options.virtualDragLineDom.classList.add('cherry-drag--hidden');
    const { previewerDom } = this.options;
    const { editorDom } = this.editor.options;
    if (isEditOnly) {
      previewerDom.classList.add('cherry-previewer--hidden');
      editorDom.classList.add('cherry-editor--full');
      previewerDom.classList.remove('cherry-preview--full');
      editorDom.classList.remove('cherry-editor--hidden');
    } else {
      previewerDom.classList.add('cherry-preview--full');
      editorDom.classList.add('cherry-editor--hidden');
      previewerDom.classList.remove('cherry-previewer--hidden');
      editorDom.classList.remove('cherry-editor--full');
      /**
       * 如果是流式输出，并且没有开启预览区编辑，则需要移除不再需要的dom
       *  这里针对流式输出的场景简单移除dom，是符合预期的
       *  但这种精简dom的方案在需要switchModel时会有问题
       */
      if (this.$cherry.options.engine.global.flowSessionContext && !this.options.enablePreviewerBubble) {
        editorDom.remove();
        this.$cherry.toolbar.options.dom.remove();
        this.$cherry.wrapperDom
          .querySelectorAll(
            '.cherry-dropdown,.cherry-drag,.cherry-editor-mask,.cherry-previewer-mask,.cherry-suggester-panel',
          )
          .forEach((dom) => dom.remove());
      }
    }
    setTimeout(() => {
      try {
        if (this.editor.editor.refresh && typeof this.editor.editor.refresh === 'function') {
          this.editor.editor.refresh();
        } else if (this.editor.editor.requestMeasure && typeof this.editor.editor.requestMeasure === 'function') {
          // CodeMirror 6 equivalent
          this.editor.editor.requestMeasure();
        }
      } catch (e) {
        console.warn('Failed to refresh editor in Previewer:', e);
      }
    }, 0);
  }

  previewOnly() {
    this.$dealEditAndPreviewOnly(false);
    if (this.options.previewerCache.htmlChanged) {
      this.update(this.options.previewerCache.html);
    }
    this.cleanHtmlCache();
    this.$cherry.$event.emit('previewerOpen');
    this.$cherry.$event.emit('editorClose');
  }

  editOnly() {
    const html = this.options.previewerCache.html ? this.options.previewerCache.html : this.getDomContainer().innerHTML;
    this.doHtmlCache(html);
    this.$dealEditAndPreviewOnly(true);
    this.$cherry.$event.emit('previewerClose');
    this.$cherry.$event.emit('editorOpen');
  }

  floatPreviewer() {
    const fullEditorLayout = {
      editorPercentage: '100%',
      previewerPercentage: '100%',
    };
    const editorWidth = this.editor.options.editorDom.getBoundingClientRect().width;
    const layout = this.calculateRealLayout(editorWidth);
    this.options.previewerCache.layout = layout;
    this.setRealLayout(fullEditorLayout.editorPercentage, fullEditorLayout.previewerPercentage);
    this.options.virtualDragLineDom.classList.add('cherry-drag--hidden');
    this.$cherry.createFloatPreviewer();
  }

  recoverFloatPreviewer() {
    this.recoverPreviewer(true);
    this.$cherry.clearFloatPreviewer();
  }

  recoverPreviewer(dealToolbar = false) {
    this.options.previewerDom.classList.remove('cherry-previewer--hidden');
    this.options.virtualDragLineDom.classList.remove('cherry-drag--hidden');
    this.editor.options.editorDom.classList.remove('cherry-editor--full');
    // 恢复现场
    const { layout } = this.options.previewerCache;
    this.setRealLayout(layout.editorPercentage, layout.previewerPercentage);
    if (this.options.previewerCache.htmlChanged) {
      this.update(this.options.previewerCache.html);
    }
    this.cleanHtmlCache();

    this.$cherry.$event.emit('previewerOpen');
    this.$cherry.$event.emit('editorOpen');

    setTimeout(() => {
      try {
        if (this.editor.editor.refresh && typeof this.editor.editor.refresh === 'function') {
          this.editor.editor.refresh();
        } else if (this.editor.editor.requestMeasure && typeof this.editor.editor.requestMeasure === 'function') {
          // CodeMirror 6 equivalent
          this.editor.editor.requestMeasure();
        }
      } catch (e) {
        console.warn('Failed to refresh editor in Previewer:', e);
      }
    }, 0);
  }

  doHtmlCache(html) {
    this.options.previewerCache.html = html;
    this.options.previewerCache.htmlChanged = true;
  }

  cleanHtmlCache() {
    this.options.previewerCache.html = '';
    this.options.previewerCache.htmlChanged = false;
    this.options.previewerCache.layout = {};
  }

  afterUpdate() {
    this.options.afterUpdateCallBack.map((fn) => fn());
    if (this.highlightLineNum === undefined) {
      this.highlightLineNum = 0;
    }
    this.highlightLine(this.highlightLineNum);
  }

  registerAfterUpdate(fn) {
    if (Array.isArray(fn)) {
      this.options.afterUpdateCallBack = this.options.afterUpdateCallBack.concat(fn);
    } else if (!fn) {
      throw new Error('[markdown error]: Previewer registerAfterUpdate params are undefined');
    } else {
      this.options.afterUpdateCallBack.push(fn);
    }
  }

  /**
   * 根据行号计算出top值
   * @param {Number} lineNum
   * @param {Number} linePercent
   * @return {Number} top
   */
  $getTopByLineNum(lineNum, linePercent = 0) {
    const domContainer = this.getDomContainer();
    if (lineNum === null) {
      return domContainer.scrollHeight;
    }
    const $lineNum = typeof lineNum === 'number' ? lineNum : parseInt(lineNum, 10);
    const doms = /** @type {NodeListOf<HTMLElement>}*/ (domContainer.querySelectorAll('[data-sign]'));
    let lines = 0;
    const containerY = domContainer.offsetTop;
    for (let index = 0; index < doms.length; index++) {
      if (doms[index].parentNode !== domContainer) {
        continue;
      }
      const blockLines = parseInt(doms[index].getAttribute('data-lines'), 10);
      if (lines + blockLines < $lineNum) {
        lines += blockLines;
        continue;
      } else {
        // 基础定位，区块高度及offsetTop会受到block margin合并的影响
        const { height: blockHeight, offsetTop } = getBlockTopAndHeightWithMargin(doms[index]);
        const blockY = offsetTop - containerY;
        let scrollTo = blockY + blockHeight * linePercent;
        // 区块多于1行
        if (blockLines > 1) {
          // 高度百分比计算
          // 该区块已经滚动过的行，不包括当前行，减一
          const overScrolledLines = blockLines - Math.abs($lineNum - (lines + blockLines)) - 1;
          const overScrolledHeight = (overScrolledLines / blockLines) * blockHeight; // 已经滚过的高度
          const blockLineHeight = blockHeight / blockLines; // 该区块每一行的高度
          // 应该滚动到的位置
          scrollTo = blockY + overScrolledHeight + blockLineHeight * linePercent;
          // console.log('overscrolled:', overScrolledHeight, blockLineHeight, linePercent);
        }
        // console.log('滚动编辑区域，左侧应scroll to ', lineNum, '::',scrollTo);
        return scrollTo;
      }
    }
    // 如果计算完预览区域所有的行号依然＜左侧光标所在的行号，则预览区域直接滚到最低部
    return domContainer.scrollHeight;
  }

  /**
   * 高亮预览区域对应的行
   * @param {Number} lineNum
   */
  highlightLine(lineNum) {
    const domContainer = this.getDomContainer();
    // 先取消所有行的高亮效果
    domContainer.querySelectorAll('.cherry-highlight-line').forEach((element) => {
      element.classList.remove('cherry-highlight-line');
    });
    // 只有双栏模式下才需要高亮光标对应的预览区域
    if (this.$cherry?.status?.previewer !== 'show' || this.$cherry?.status?.editor !== 'show') {
      return;
    }
    const doms = /** @type {NodeListOf<HTMLElement>}*/ (domContainer.querySelectorAll('[data-sign]'));
    let lines = 0;
    for (let index = 0; index < doms.length; index++) {
      if (doms[index].parentNode !== domContainer) {
        continue;
      }
      const blockLines = parseInt(doms[index].getAttribute('data-lines'), 10);
      if (lines + blockLines < lineNum) {
        lines += blockLines;
        continue;
      } else {
        this.highlightLineNum = lineNum;
        doms[index].classList.add('cherry-highlight-line');
        return;
      }
    }
  }

  /**
   * 滚动到对应行号位置并加上偏移量
   * @param {Number} lineNum
   * @param {Number} offset
   */
  scrollToLineNumWithOffset(lineNum, offset) {
    const top = this.$getTopByLineNum(lineNum) - offset;
    this.$scrollAnimation(top);
    this.highlightLine(lineNum);
  }

  /**
   * 滚动到对应位置
   * @param {number} scrollTop 元素的id属性值
   * @param {'auto'|'smooth'|'instant'} behavior 滚动方式
   */
  scrollToTop(scrollTop, behavior = 'auto') {
    const previewDom = this.getDomContainer();
    const scrollDom = this.getDomCanScroll(previewDom);
    scrollDom.scrollTo({
      top: scrollTop,
      left: 0,
      behavior,
    });
  }

  /**
   * 滚动到对应id的位置，实现锚点滚动能力
   * @param {string} id 元素的id属性值
   * @param {'smooth'|'instant'|'auto'} behavior 滚动方式
   * @return {boolean} 是否有对应id的元素并执行滚动
   */
  scrollToId(id, behavior = 'smooth') {
    const previewDom = this.getDomContainer();
    const scrollDom = this.getDomCanScroll(previewDom);
    // 设置未加载图片的默认尺寸
    const images = previewDom.getElementsByTagName('img');
    const modifiedImages = new Set(); // 记录被修改过样式的图片
    let isDealScroll = false;
    Array.from(images).forEach((img) => {
      if (!img.hasAttribute('width') && !img.hasAttribute('height') && !img.style.width && !img.style.height) {
        // img.style.minHeight = '200px';
        // img.style.aspectRatio = '16/9';
        modifiedImages.add(img);
      }
    });

    let $id = id.replace(/^\s*#/, '').trim();
    $id = /[%:]/.test($id) ? $id : encodeURIComponent($id);
    const target = previewDom.querySelector(`[id="${$id}"]`) ?? false;
    if (target === false) {
      return false;
    }

    let scrollTop = 0;

    // 尝试找到目标元素所在的data-sign块,使用精确的位置计算
    let targetBlock = target;
    while (targetBlock && targetBlock !== previewDom) {
      if (targetBlock.hasAttribute('data-sign')) {
        break;
      }
      targetBlock = targetBlock.parentElement;
    }

    // 如果找到了data-sign块,使用$getTopByLineNum的计算方式
    if (targetBlock && targetBlock.hasAttribute('data-sign')) {
      const doms = /** @type {NodeListOf<HTMLElement>}*/ (previewDom.querySelectorAll('[data-sign]'));
      const containerY = previewDom.offsetTop;

      for (let index = 0; index < doms.length; index++) {
        if (doms[index].parentNode !== previewDom) {
          continue;
        }
        if (doms[index] === targetBlock) {
          // 找到目标块,使用精确的位置计算
          const { offsetTop } = getBlockTopAndHeightWithMargin(doms[index]);
          const blockY = offsetTop - containerY;

          // 如果目标元素不是块本身,计算目标元素在块内的偏移
          if (target !== targetBlock) {
            const targetEl = /** @type {HTMLElement}*/ (target);
            const targetBlockEl = /** @type {HTMLElement}*/ (targetBlock);
            const targetOffsetInBlock = targetEl.offsetTop - targetBlockEl.offsetTop;
            scrollTop = blockY + targetOffsetInBlock - 10;
          } else {
            scrollTop = blockY - 10;
          }
          break;
        }
      }
    } else {
      // 没有找到data-sign块,使用原来的计算方式
      if (scrollDom.nodeName === 'HTML') {
        scrollTop = scrollDom.scrollTop + target.getBoundingClientRect().y - 10;
      } else {
        scrollTop = scrollDom.scrollTop + target.getBoundingClientRect().y - scrollDom.getBoundingClientRect().y - 10;
      }
    }

    // 创建一个函数来清理图片样式并重新滚动
    const cleanupAndScroll = () => {
      // modifiedImages.forEach((img) => {
      //   img.style.minHeight = '';
      //   img.style.aspectRatio = '';
      // });
      modifiedImages.clear();

      // 重新计算位置并滚动
      let newScrollTop = 0;
      if (scrollDom.nodeName === 'HTML') {
        newScrollTop = scrollDom.scrollTop + target.getBoundingClientRect().y - 10;
      } else {
        newScrollTop =
          scrollDom.scrollTop + target.getBoundingClientRect().y - scrollDom.getBoundingClientRect().y - 10;
      }
      // 如果位置有变化，使用instant行为重新滚动
      if (Math.abs(newScrollTop - scrollTop) > 5) {
        scrollDom.scrollTo({
          top: newScrollTop,
          left: 0,
          behavior: 'instant',
        });
      }
    };

    // 监听滚动结束事件
    const handleScrollEnd = () => {
      if (isDealScroll) {
        return;
      }
      isDealScroll = true;
      // 移除滚动事件监听器
      scrollDom.removeEventListener('scrollend', handleScrollEnd);
      // 等待一小段时间确保图片开始加载
      setTimeout(() => {
        // 获取所有修改过的图片的加载状态
        const imageLoadPromises = Array.from(modifiedImages).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            const onLoad = () => {
              img.removeEventListener('load', onLoad);
              img.removeEventListener('error', onLoad);
              resolve();
            };
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onLoad);
          });
        });

        // 等待所有图片加载完成后再清理样式
        Promise.all(imageLoadPromises).then(() => {
          // 使用 requestAnimationFrame 确保在下一帧渲染时处理
          requestAnimationFrame(cleanupAndScroll);
        });
      }, 100);
    };

    // 开始滚动
    scrollDom.scrollTo({
      top: scrollTop,
      left: 0,
      behavior,
    });

    // 对于 instant 行为，立即触发位置修正逻辑
    if (behavior === 'instant') {
      // 使用 requestAnimationFrame 确保滚动完成后再处理
      requestAnimationFrame(() => {
        handleScrollEnd();
      });
    } else {
      // 添加滚动结束事件监听器
      scrollDom.addEventListener('scrollend', handleScrollEnd);

      // 如果浏览器不支持 scrollend 事件，使用 setTimeout 作为后备方案
      setTimeout(() => {
        scrollDom.removeEventListener('scrollend', handleScrollEnd);
        handleScrollEnd();
      }, 1000);
    }

    return true;
  }

  /**
   * 实现滚动动画
   * @param { Number } targetY 目标位置
   */
  $scrollAnimation(targetY) {
    this.animation.destinationTop = targetY;
    if (this.animation.timer) {
      return;
    }
    const animationHandler = () => {
      const dom = this.getDomContainer();
      const currentTop = dom.scrollTop;
      const delta = this.animation.destinationTop - currentTop;
      // 减小步进值,使滚动更平滑,从100ms改为200ms完成
      const move = Math.ceil(Math.min(Math.abs(delta), Math.max(1, Math.abs(delta) / (200 / 16.7))));
      if (delta === 0 || currentTop >= dom.scrollHeight || move > Math.abs(delta)) {
        cancelAnimationFrame(this.animation.timer);
        this.animation.timer = 0;
        this.disableScrollListener = false; // 动画结束后恢复滚动监听
        return;
      }
      this.disableScrollListener = true;
      this.getDomContainer().scrollTo(null, currentTop + (delta / Math.abs(delta)) * move);
      this.animation.timer = requestAnimationFrame(animationHandler);
    };
    this.animation.timer = requestAnimationFrame(animationHandler);
  }

  scrollToLineNum(lineNum, linePercent) {
    const top = this.$getTopByLineNum(lineNum, linePercent);
    this.$scrollAnimation(top);
  }

  /**
   * 获取有滚动条的dom
   */
  getDomCanScroll(currentDom = this.getDomContainer()) {
    if (currentDom.scrollHeight > currentDom.clientHeight || currentDom.clientHeight < window.innerHeight) {
      return currentDom;
    }
    if (currentDom.parentElement) {
      if (currentDom.nodeName === 'BODY') {
        // 如果当前是body了，再往上就是html了
        if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
          return document.documentElement;
        }
        return currentDom;
      }
      return this.getDomCanScroll(currentDom.parentElement);
    }
  }

  scrollToHeadByIndex(index) {
    const previewDom = this.getDomContainer();
    const targetHead = previewDom.querySelectorAll('h1,h2,h3,h4,h5,h6,h7,h8')[index] ?? false;
    if (targetHead !== false) {
      this.scrollToId(targetHead.id);
    }
  }

  bindClick() {}

  onMouseDown() {
    addEvent(this.getDomContainer(), 'mousedown', () => {
      setTimeout(() => {
        this.$cherry.$event.emit('cleanAllSubMenus');
      });
    });
  }
  /**
   * 导出预览区域内容
   * @public
   * @param {'pdf' | 'img' | 'screenShot' | 'markdown' | 'html' | 'word'} [type='pdf']
   * 'pdf'：导出成pdf文件; 'img' | screenShot：导出成png图片; 'markdown'：导出成markdown文件; 'html'：导出成html文件; 'word'：导出到Word（复制到剪贴板）;
   * @param {string} [fileName] 导出文件名
   */
  export(type = 'pdf', fileName = '') {
    const name = fileName ? fileName : this.$cherry.getFirstLineText('cherry-export');
    if (type === 'pdf') {
      exportPDF(this.getDomContainer(), name);
    } else if (type === 'screenShot' || type === 'img') {
      exportScreenShot(this.getDomContainer(), name);
    } else if (type === 'markdown') {
      exportMarkdownFile(this.$cherry.getMarkdown(), name);
    } else if (type === 'html') {
      exportHTMLFile(this.getValue(), name);
    } else if (type === 'word') {
      exportWordFile(this.getValue(), name);
    }
  }

  changePreviewToMobile(isMobile = true) {
    // TODO：是否可以只通过修改外层class的方式来实现移动端预览效果的展示，而不是增加删除dom结构的方式
    const previewerDom = this.getDomContainer();
    if (isMobile) {
      previewerDom.innerHTML = `<div class='cherry-mobile-previewer-content'>${previewerDom.innerHTML}</div>`;
    } else {
      // @ts-ignore
      previewerDom.parentNode.innerHTML = previewerDom.innerHTML;
    }
    this.isMobilePreview = isMobile;
  }
}
