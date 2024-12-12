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
import { createElement } from '../utils/dom';
/**
 * 悬浮目录
 */
export default class Toc {
  constructor(options) {
    this.$cherry = options.$cherry;
    this.editor = options.$cherry.editor.editor;
    this.tocStr = '';
    this.updateLocationHash = options.updateLocationHash ?? true;
    this.defaultModel = options.defaultModel ?? 'full';
    this.showAutoNumber = options.showAutoNumber ?? false;
    this.position = options.position ?? 'absolute';
    this.cssText = options.cssText ?? '';
    this.init();
  }

  init() {
    this.drawDom();
    this.timer = setTimeout(() => {
      this.updateTocList();
    }, 300);
    this.editor.on('change', (codemirror, evt) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.updateTocList();
        this.$switchModel(this.model);
      }, 300);
    });
    this.$switchModel(this.getModelFromLocalStorage());
  }

  getModelFromLocalStorage() {
    if (typeof localStorage === 'undefined') {
      return this.defaultModel;
    }
    return localStorage.getItem('cherry-toc-model') || this.defaultModel;
  }

  setModelToLocalStorage(model) {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem('cherry-toc-model', model);
  }

  drawDom() {
    const tocDom = createElement(
      'div',
      `cherry-flex-toc cherry-flex-toc__pure${this.showAutoNumber ? ' auto-num' : ''}`,
    );
    if (this.position === 'fixed') {
      tocDom.classList.add('cherry-flex-toc__fixed');
    }

    if (this.cssText.length > 0) {
      tocDom.style.cssText = this.cssText;
    }

    const tocHead = createElement('div', 'cherry-toc-head');
    const tocTitle = createElement('span', 'cherry-toc-title');
    tocTitle.append(this.$cherry.locale.toc);
    const tocClose = createElement('i', 'ch-icon ch-icon-chevronsRight');
    const tocOpen = createElement('i', 'ch-icon ch-icon-chevronsLeft');
    this.tocClose = tocClose;
    this.tocOpen = tocOpen;
    tocHead.appendChild(tocTitle);
    tocHead.appendChild(tocClose);
    tocHead.appendChild(tocOpen);
    tocDom.appendChild(tocHead);
    const tocListDom = createElement('div', 'cherry-toc-list');
    this.tocListDom = tocListDom;
    tocDom.appendChild(tocListDom);
    this.tocDom = tocDom;
    this.$cherry.wrapperDom.appendChild(tocDom);
    this.bindClickEvent();
  }

  bindClickEvent() {
    this.tocDom.addEventListener('click', (e) => {
      const a = this.$getClosestNode(e.target, 'A');
      if (a === false) {
        return;
      }
      if (/cherry-toc-one-a/.test(a.className)) {
        const { id, index } = a.dataset;
        if (this.$cherry.status.previewer === 'hide') {
          // editorOnly模式下，需要定位到编辑区对应位置
          const searcher = this.$cherry.editor.editor.getSearchCursor(
            /(?:^|\n)\n*((?:[ \t\u00a0]*#{1,6}).+?|(?:[ \t\u00a0]*.+)\n(?:[ \t\u00a0]*[=]+|[-]+))(?=$|\n)/g,
          );
          for (let i = 0; i <= index; i++) {
            searcher.findNext();
          }
          const target = searcher.from();
          this.$cherry.editor.scrollToLineNum(target.line, target.line + 1, 0);
        } else {
          // 有预览的情况下，直接通过滚动预览区位置实现滚动到锚点
          this.$cherry.previewer.scrollToHeadByIndex(index);
        }
        if (this.updateLocationHash) {
          location.href = id;
        }
      }
    });
    this.tocClose.addEventListener('click', (e) => {
      this.$switchModel('pure');
      this.setModelToLocalStorage('pure');
    });
    this.tocOpen.addEventListener('click', (e) => {
      this.$switchModel('full');
      this.setModelToLocalStorage('full');
    });
    if (window) {
      window.addEventListener('resize', () => {
        this.$switchModel(this.model);
      });
    }
    this.editor.on('scroll', (codemirror, evt) => {
      this.updateTocList(true);
    });
    const scrollDom = this.$cherry.previewer.getDomCanScroll();
    if (scrollDom.nodeName === 'HTML') {
      window.addEventListener('scroll', () => {
        this.updateTocList(true);
      });
    } else {
      scrollDom.addEventListener('scroll', () => {
        this.updateTocList(true);
      });
    }
  }

  $switchModel(model = 'pure') {
    this.model = model;
    const targetClassName = `cherry-flex-toc__${model}`;
    if (!this.tocDom.classList.contains(targetClassName)) {
      this.tocDom.classList.remove(`cherry-flex-toc__pure`);
      this.tocDom.classList.remove(`cherry-flex-toc__full`);
      this.tocDom.classList.add(targetClassName);
    }
    const list = this.tocListDom.querySelectorAll('.cherry-toc-one-a');
    if (list.length > 0) {
      let targetHeight = 28;
      if (model === 'pure') {
        const { height } = this.tocListDom.getBoundingClientRect();
        const minHeight = Math.floor((height - list.length * 3) / list.length);
        // eslint-disable-next-line no-nested-ternary
        targetHeight = minHeight < 3 ? 3 : minHeight > 10 ? 10 : minHeight;
      }
      for (let i = 0; i < list.length; i++) {
        // @ts-ignore
        if (list[i].style.height !== `${targetHeight}px`) {
          // @ts-ignore
          list[i].style.height = `${targetHeight}px`;
        }
      }
    }
  }

  $getClosestNode(node, targetNodeName) {
    if (!node || !node.tagName) {
      return false;
    }
    if (node.tagName === targetNodeName) {
      return node;
    }
    if (node.parentNode.tagName === 'BODY') {
      return false;
    }
    return this.$getClosestNode(node.parentNode, targetNodeName);
  }

  updateTocList(onlyScroll = false) {
    if (onlyScroll === true) {
      // do nothing
    } else {
      const tocList = this.$cherry.getToc();
      let tocStr = '';
      tocList.map((item) => {
        tocStr += item.text;
        return item;
      });
      tocStr = this.$cherry.engine.hash(tocStr);
      if (this.tocStr !== tocStr) {
        this.tocStr = tocStr;
        let tocHtml = '';
        let index = 0;
        tocList.map((item) => {
          const text = item.text.replace(/<a .+?<\/a>/g, '');
          const title = text.replace(/<[^>]+?>/g, '');
          tocHtml += `<a class="cherry-toc-one-a cherry-toc-one-a__${item.level > 5 ? 5 : item.level}"
            title="${title}"
            data-index="${index}"
            data-id="#${item.id}"
            >${text}</a>`;
          index += 1;
          return item;
        });
        this.tocListDom.innerHTML = tocHtml;
      }
    }
    // 处理当前标题的高亮
    if (this.$cherry.status.previewer === 'hide') {
      // 似乎没有特别好的办法，先欠着
    } else {
      const scrollDom = this.$cherry.previewer.getDomCanScroll();
      const minY = scrollDom.nodeName === 'HTML' ? 0 : scrollDom.getBoundingClientRect().y;
      const headList = this.$cherry.previewer.getDomContainer().querySelectorAll('h1,h2,h3,h4,h5,h6,h7,h8');
      let index = 0;
      for (; index < headList.length; index++) {
        const { y } = headList[index].getBoundingClientRect();
        if (y > minY + 20) {
          break;
        }
      }
      index = index > 0 ? index - 1 : index;
      this.tocListDom.querySelectorAll('.cherry-toc-one-a').forEach((item, key) => {
        if (key === index) {
          item.classList.add('current');
        } else {
          item.classList.remove('current');
        }
      });
    }
  }
}
