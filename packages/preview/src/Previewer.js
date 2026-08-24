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
import CherryEngine from '@cherry-markdown/engine';
import LazyLoadImg from './utils/lazyLoadImg';
import MyersDiff from './utils/myersDiff';
import { isBrowser } from './utils/env';

/**
 * 纯 Markdown 预览渲染器（Previewer）
 *
 * 作用：
 *  - 将 markdown（经由 @cherry-markdown/engine 渲染后的 html）渲染到预览 DOM
 *  - 支持增量 DOM 更新（Myers Diff + virtual-dom）
 *  - 支持图片懒加载
 *
 * 不依赖编辑器，可独立用于「纯 Markdown 预览」场景。
 *
 * 用法：
 *   const previewer = new Previewer({ previewerDom, enableLazyLoad: true });
 *   const html = engine.makeHtml(markdown);
 *   previewer.update(html);
 */
export default class Previewer {
  /**
   * @property
   * @private
   * @type {boolean} 标记实例是否已销毁
   */
  isDestroyed = false;

  /**
   * @property
   * @private
   * @type {boolean} 是否正在应用 DOM 变更
   */
  applyingDomChanges = false;

  /**
   * @param {Object} options
   * @param {HTMLElement} [options.previewerDom] 预览容器 DOM
   * @param {string} [options.value] 初始 markdown 值
   * @param {Object} [options.engine] Cherry Engine options
   * @param {Object} [options.engineInstance] existing Cherry Engine instance
   * @param {Object} [options.lazyLoadImg] 图片懒加载配置
   */
  constructor(options = {}) {
    /** @type {Object} */
    this.options = {
      previewerDom: null,
      value: '',
      lazyLoadImg: {
        loadingImgPath: '',
        maxNumPerTime: 2,
        noLoadImgNum: 5,
        autoLoadImgNum: 5,
        maxTryTimesPerSrc: 2,
        beforeLoadOneImgCallback: () => {},
        failLoadOneImgCallback: () => {},
        afterLoadOneImgCallback: () => {},
        afterLoadAllImgCallback: () => {},
      },
      afterUpdateCallBack: [],
      previewerCache: {
        html: '',
        htmlChanged: false,
        layout: {},
      },
    };
    Object.assign(this.options, options);
    this.markdown = this.options.value || '';
    this.engine = options.engineInstance || new CherryEngine(options.engine || {});

    if (!this.options.previewerDom && isBrowser()) {
      this.options.previewerDom = document.createElement('div');
    }

    /** @property @type {LazyLoadImg|null} */
    this.lazyLoadImg = new LazyLoadImg(this.options.lazyLoadImg, this);
    this.lazyLoadImg.doLazyLoad();

    if (this.markdown) {
      this.setMarkdown(this.markdown);
    }
  }

  /**
   * Render Markdown through the Engine owned by this preview package.
   * @param {string} markdown
   * @returns {string} rendered HTML
   */
  setMarkdown(markdown) {
    this.markdown = markdown || '';
    const html = /** @type {string} */ (this.engine.makeHtml(this.markdown));
    this.update(html);
    return html;
  }

  /** @returns {string} */
  getMarkdown() {
    return this.markdown;
  }

  /** @param {boolean} [wrapTheme=false] */
  getHtml(wrapTheme = false) {
    return this.getValue(wrapTheme);
  }

  /**
   * @returns {HTMLElement}
   */
  getDomContainer() {
    return this.options.previewerDom;
  }

  getDom() {
    return this.options.previewerDom;
  }

  /**
   * 获取预览区内的 html 内容
   * @param {boolean} [wrapTheme=false] 是否在外层包裹主题 class
   * @returns {string} html 内容
   */
  getValue(wrapTheme = false) {
    let html = '';
    if (this.isPreviewerHidden()) {
      html = this.options.previewerCache.html;
    } else if (this.options.previewerDom) {
      html = this.options.previewerDom.innerHTML;
    }
    html = this.lazyLoadImg.changeDataSrc2Src(html);
    if (!wrapTheme) {
      return html;
    }
    return `<div class="cherry-markdown">${html}</div>`;
  }

  isPreviewerHidden() {
    return (
      this.options.previewerDom &&
      this.options.previewerDom.classList.contains('cherry-previewer--hidden')
    );
  }

  /**
   * 强制重新渲染预览区域（全量替换 innerHTML）
   * @param {string} html 新的 html 内容
   */
  refresh(html) {
    if (this.isDestroyed || !this.options.previewerDom) {
      return;
    }
    this.options.previewerDom.innerHTML = html;
    this.lazyLoadImg.doLazyLoad();
    this.afterUpdate();
  }

  /**
   * 增量更新预览区域
   * @param {string} html 新的 html 内容
   */
  update(html) {
    if (this.isDestroyed || !this.options.previewerDom) {
      return;
    }
    const newHtml = this.lazyLoadImg.changeSrc2DataSrc(html);
    if (this.isPreviewerHidden()) {
      this.doHtmlCache(newHtml);
      return;
    }
    const domContainer = this.getDomContainer();
    this.applyingDomChanges = true;
    try {
      let tmpDiv = null;
      if (typeof window.DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(newHtml, 'text/html');
        tmpDiv = doc.querySelector('body');
      } else {
        tmpDiv = document.createElement('div');
        tmpDiv.innerHTML = newHtml;
      }
      const newHtmlList = this.$getSignData(tmpDiv.children);
      const oldHtmlList = this.$getSignData(domContainer.children);
      this.$dealUpdate(domContainer, oldHtmlList, newHtmlList);
    } finally {
      this.applyingDomChanges = false;
    }
    this.afterUpdate();
    this.lazyLoadImg.doLazyLoad();
  }

  /**
   * 设置 markdown 内容并渲染（需配合 engine 使用）
   * @param {string} html 已经由 engine 渲染好的 html
   */
  setContent(html) {
    this.update(html);
  }

  doHtmlCache(newHtml) {
    this.options.previewerCache.html = newHtml;
    this.options.previewerCache.htmlChanged = true;
  }

  /**
   * 注册更新后的回调
   * @param {Function} callback
   */
  registerAfterUpdate(callback) {
    if (typeof callback === 'function') {
      this.options.afterUpdateCallBack.push(callback);
    }
  }

  afterUpdate() {
    this.options.afterUpdateCallBack.forEach((cb) => {
      try {
        cb && cb();
      } catch (e) {
        // 单个回调异常不阻塞其它回调
      }
    });
  }

  $getSignData(list) {
    const ret = { list: [], signs: {} };
    for (let i = 0; i < list.length; i++) {
      if (!list[i].getAttribute || !list[i].getAttribute('data-sign')) {
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

  $dealUpdate(domContainer, oldHtmlList, newHtmlList) {
    if (newHtmlList.list !== oldHtmlList.list) {
      if (newHtmlList.list.length && oldHtmlList.list.length) {
        const myersDiff = new MyersDiff(newHtmlList.list, oldHtmlList.list, (obj, index) => obj[index].sign);
        const res = myersDiff.doDiff();
        this.$dealWithMyersDiffResult(res, oldHtmlList.list, newHtmlList.list, domContainer);
      } else if (newHtmlList.list.length && !oldHtmlList.list.length) {
        newHtmlList.list.forEach((piece) => {
          domContainer.appendChild(piece.dom);
        });
      } else if (!newHtmlList.list.length && oldHtmlList.list.length) {
        oldHtmlList.list.forEach((piece) => {
          domContainer.removeChild(piece.dom);
        });
      }
    }
  }

  $dealWithMyersDiffResult(res, oldContent, newContent, domContainer) {
    let oldChange = null;
    for (let i = 0; i < res.length; i++) {
      const change = res[i];
      if (!oldChange) {
        oldChange = change;
      } else {
        if (oldChange.type === change.type) {
          oldChange.oldIndex = change.oldIndex;
          oldChange.newIndex = change.newIndex;
          continue;
        }
        this.$applyChange(domContainer, oldContent, newContent, oldChange);
        oldChange = change;
      }
    }
    if (oldChange) {
      this.$applyChange(domContainer, oldContent, newContent, oldChange);
    }
  }

  $applyChange(domContainer, oldContent, newContent, change) {
    if (change.type === 'add' || change.type === 'insert') {
      const oldDom = oldContent[change.oldIndex];
      for (let j = change.newIndex; j >= change.oldIndex; j--) {
        if (oldDom) {
          domContainer.insertBefore(newContent[j].dom, oldDom.dom);
        } else {
          domContainer.appendChild(newContent[j].dom);
        }
      }
    } else if (change.type === 'delete') {
      const newDom = newContent[change.newIndex];
      for (let j = change.oldIndex; j >= change.newIndex; j--) {
        if (newDom) {
          domContainer.removeChild(oldContent[j].dom);
        } else {
          domContainer.removeChild(oldContent[j].dom);
        }
      }
    } else if (change.type === 'modify' || change.type === 'update') {
      const newDom = newContent[change.newIndex];
      if (newDom) {
        newDom.dom = this.$updateDom(newDom.dom, oldContent[change.oldIndex].dom);
        if (change.newIndex === change.oldIndex) {
          domContainer.replaceChild(newDom.dom, oldContent[change.oldIndex].dom);
        } else if (change.newIndex > change.oldIndex) {
          domContainer.insertBefore(newDom.dom, oldContent[change.newIndex].dom);
        } else {
          domContainer.insertBefore(newDom.dom, oldContent[change.newIndex].dom);
        }
      }
    }
  }

  $html2H(dom) {
    if (typeof dom === 'undefined') {
      return vDH('span', {}, []);
    }
    if (!dom.tagName) {
      return dom.textContent;
    }
    const { tagName } = dom;
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
      if (
        /^(class|id|href|rel|target|src|title|controls|align|width|height|style|open|for|name|type|disabled|checked|selected|contenteditable)$/i.test(
          name,
        )
      ) {
        const nameMap = {
          class: 'className',
          for: 'htmlFor',
          contenteditable: 'contentEditable',
        };
        name = nameMap[name.toLowerCase()] || name;
        if (name === 'style') {
          ret.style = ret.style ? ret.style : [];
          ret.style.push(value);
        } else if (name === 'open') {
          ret[name] = true;
        } else {
          ret[name] = value;
        }
      } else {
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
      ret.style = { cssText: ret.style.join(';') };
    }
    return ret;
  }

  $updateDom(newDom, oldDom) {
    const diff = vDDiff(this.$html2H(oldDom), this.$html2H(newDom));
    return vDPatch(oldDom, diff);
  }

  destroy() {
    this.isDestroyed = true;
    if (this.lazyLoadImg) {
      this.lazyLoadImg.destroy && this.lazyLoadImg.destroy();
    }
    this.options = null;
  }
}
