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
import vDH from 'virtual-dom/h';
import vDDiff from 'virtual-dom/diff';
import vDPatch from 'virtual-dom/patch';
import MyersDiff from './utils/myersDiff';
import { getBlockTopAndHeightWithMargin, elementsFromPoint } from './utils/dom';
import Logger from './Logger';
import Event from './Event';
// import locale from './utils/locale';
import { addEvent, removeEvent } from './utils/event';
import PreviewerBubble from './toolbars/PreviewerBubble';

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
     * @type {string} 实例ID
     */
    this.instanceId = `cherry-previewer-${new Date().getTime()}`;
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
      afterUpdateCallBack: [],
      isPreviewOnly: false,
      previewerCache: {
        // 关闭/开启预览区时缓存的previewer数据
        html: '',
        htmlChanged: false,
        layout: {},
      },
    };

    Object.assign(this.options, options);
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
    this.$initPreviewerBubble(editor);
  }

  $initPreviewerBubble(editor) {
    if (this.options.enablePreviewerBubble) {
      this.previewerBubble = new PreviewerBubble(this, editor);
    }
  }

  domContainer = () =>
    /** @type {HTMLDivElement} */ (this.isMobilePreview
      ? document.querySelector('.cherry-mobile-previewer-content')
      : this.options.previewerDom);

  getDom() {
    return this.options.previewerDom;
  }

  getValue() {
    return this.options.previewerDom.innerHTML;
  }

  isPreviewerHidden() {
    return this.options.previewerDom.classList.contains('cherry-previewer--hidden');
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

    virtualLineDom.style.height = `${editorHeight}px`;
    virtualLineDom.style.top = `${editorTop}px`;
    virtualLineDom.style.left = `${previewerLeft}px`;

    editorMaskDom.style.height = `${editorHeight}px`;
    editorMaskDom.style.top = `${editorTop}px`;
    editorMaskDom.style.left = '0px';
    editorMaskDom.style.width = `${editorWidth}px`;

    previewerMaskDom.style.height = `${editorHeight}px`;
    previewerMaskDom.style.top = `${editorTop}px`;
    previewerMaskDom.style.left = `${previewerLeft}px`;
    previewerMaskDom.style.width = `${previewerWidth}px`;
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
      this.editor.editor.refresh();
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
    const domContainer = this.domContainer();
    onScroll = () => {
      if (this.applyingDomChanges) {
        Logger.log(new Date(), 'sync scroll locked');
        return;
      }
      if (this.disableScrollListener) {
        this.disableScrollListener = false;
        return;
      }
      if (domContainer.scrollTop <= 0) {
        this.editor.scrollToLineNum(0, 0, 1);
        return;
      }
      if (domContainer.scrollTop + domContainer.offsetHeight > domContainer.scrollHeight) {
        this.editor.scrollToLineNum(null);
        return;
      }
      // 获取预览容器基准坐标
      const basePoint = domContainer.getBoundingClientRect();
      // 观察点坐标，取容器中轴线
      const watchPoint = {
        x: basePoint.left + basePoint.width / 2,
        y: basePoint.top + 1,
      };
      // 获取观察点处的DOM
      const targetElements = elementsFromPoint(watchPoint.x, watchPoint.y);
      let targetElement;
      for (let i = 0; i < targetElements.length; i++) {
        if (domContainer.contains(targetElements[i])) {
          targetElement = targetElements[i];
          break;
        }
      }
      if (!targetElement || targetElement === domContainer) {
        return;
      }
      // 获取观察点处最近的markdown元素
      let mdElement = targetElement.closest('[data-sign]');
      // 由于新增脚注，内部容器也有可能存在data-sign，所以需要循环往父级找
      while (mdElement && mdElement.parentElement && mdElement.parentElement !== domContainer) {
        mdElement = mdElement.parentElement.closest('[data-sign]');
      }
      if (!mdElement) {
        return;
      }
      // 计算当前焦点容器的所在行数
      let lines = 0;
      let element = mdElement;
      while (element) {
        lines += +element.getAttribute('data-lines');
        element = element.previousElementSibling; // 取上一个兄弟节点，直到为null
      }
      // markdown元素存在margin，getBoundingRect不能获取到margin
      const mdElementStyle = getComputedStyle(mdElement);
      const marginTop = parseFloat(mdElementStyle.marginTop);
      const marginBottom = parseFloat(mdElementStyle.marginBottom);
      // markdown元素基于当前页面的矩形模型
      const mdRect = mdElement.getBoundingClientRect();
      const mdActualHeight = mdRect.height + marginTop + marginBottom;
      // (mdRect.y - marginTop)为顶部触达区域，basePoint.y为预览区域的顶部，故可视范围应减去预览区域的偏移
      const mdOffsetTop = mdRect.y - marginTop - basePoint.y;
      const lineNum = +mdElement.getAttribute('data-lines'); // 当前markdown元素所占行数
      const percent = (100 * Math.abs(mdOffsetTop)) / mdActualHeight / 100;
      // console.log('destLine:', lines, percent,
      //  mdRect.height + marginTop + marginBottom, mdOffsetTop, mdElement);
      // if(mdOffsetTop < 0) {
      return this.editor.scrollToLineNum(lines - lineNum, lineNum, percent);
      // }
      // return this.editor.scrollToLineNum(lines - lineNum, 0, 0);
    };
    addEvent(domContainer, 'scroll', onScroll, false);
  }

  removeScroll() {
    const domContainer = this.domContainer();
    removeEvent(domContainer, 'scroll', onScroll, false);
  }

  $html2H(dom) {
    if (typeof dom === 'undefined') {
      return vDH('span', {}, []);
    }
    if (!dom.tagName) {
      return dom.wholeText;
    }
    const { tagName } = dom;
    const myAttrs = this.$getAttrsForH(dom.attributes);
    const children = [];
    if (dom.childNodes && dom.childNodes.length > 0) {
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
      if (/^(class|id|href|rel|target|src|title|controls|align|width|height|style)$/i.test(name)) {
        name = name === 'class' ? 'className' : name;
        if (name === 'style') {
          ret.style = ret.style ? ret.style : [];
          ret.style.push(value);
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
      ret.style = ret.style.join(';');
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
  $getSignData(dom) {
    const list = dom.querySelectorAll('[data-sign]');
    const ret = { list: [], signs: {} };
    for (let i = 0; i < list.length; i++) {
      if (!this.$testChild(list[i])) {
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
            if (newContent[change.newIndex].dom.querySelector('svg')) {
              throw new Error(); // SVG暂不使用patch更新
            }
            this.$updateDom(newContent[change.newIndex].dom, oldContent[change.oldIndex].dom);
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

  update(html) {
    if (!this.isPreviewerHidden()) {
      // 标记当前正在更新预览区域，锁定同步滚动功能
      window.clearTimeout(this.syncScrollLockTimer);
      this.applyingDomChanges = true;
      // 预览区未隐藏时，直接更新
      const tmpDiv = document.createElement('div');
      const domContainer = this.options.previewerDom;
      tmpDiv.innerHTML = html;
      const newHtmlList = this.$getSignData(tmpDiv);
      const oldHtmlList = this.$getSignData(domContainer);

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
      this.doHtmlCache(html);
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
    }
    setTimeout(() => this.editor.editor.refresh(), 0);
  }

  previewOnly() {
    this.$dealEditAndPreviewOnly(false);
    if (this.options.previewerCache.htmlChanged) {
      this.update(this.options.previewerCache.html);
    }
    this.cleanHtmlCache();
  }

  editOnly(dealToolbar = false) {
    this.$dealEditAndPreviewOnly(true);
    this.cleanHtmlCache();
    Event.emit(this.instanceId, Event.Events.previewerClose);
  }

  recoverPreviewer(dealToolbar = false) {
    this.options.previewerDom.classList.remove('cherry-previewer--hidden');
    this.options.virtualDragLineDom.classList.remove('cherry-drag--hidden');
    this.editor.options.editorDom.classList.remove('cherry-editor--full');
    // 恢复现场
    if (this.options.previewerCache.layout !== {}) {
      const { layout } = this.options.previewerCache;
      this.setRealLayout(layout.editorPercentage, layout.previewerPercentage);
    }
    if (this.options.previewerCache.htmlChanged) {
      this.update(this.options.previewerCache.html);
    }
    this.cleanHtmlCache();

    Event.emit(this.instanceId, Event.Events.previewerOpen);

    setTimeout(() => this.editor.editor.refresh(), 0);
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

  scrollToLineNum(lineNum, linePercent) {
    const domContainer = this.domContainer();
    if (lineNum === null) {
      this.disableScrollListener = true;
      domContainer.scrollTo(0, domContainer.scrollHeight);
      return;
    }
    const $lineNum = parseInt(lineNum, 10);
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
        // console.log(lines, blockLines, lineNum, blockY, blockHeight, linePercent);
        this.disableScrollListener = true;
        domContainer.scrollTo(0, scrollTo);
        // console.log('滚动编辑区域，左侧应scroll to ', lineNum, '::',scrollTo);
        return;
      }
    }
  }
}
