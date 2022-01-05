// @ts-nocheck
/**
 * Tencent is pleased to support the open source community by making CherryMarkdown available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company. All rights reserved.
 * The below software in this distribution may have been modified by THL A29 Limited ("Tencent Modifications").
 *
 * All Tencent Modifications are Copyright (C) THL A29 Limited.
 *
 * CherryMarkdown is licensed under the Apache License, Version 2.0 (the "License");
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
import escapeRegExp from 'lodash/escapeRegExp';
import SyntaxBase from '@/core/SyntaxBase';
import Codemirror from 'codemirror';
import { isLookbehindSupported } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';
export default class Suggester extends SyntaxBase {
  static HOOK_NAME = 'suggester';

  constructor({ config }) {
    /**
     * config.suggester 内容
     * [{
     * 请求url
      suggestList: '',
      唤醒关键字
      keyword: '@',
      建议模板 function
      suggestListRender(valueArray) {

      },
      回填回调 function
      echo(value) {
            
      }]
     * 
     */

    super({ needCache: true });

    this.initConfig(config);
    this.RULE = this.rule();
  }

  initConfig(config) {
    const { suggester } = config;

    this.suggester = {};
    if (!suggester) {
      return;
    }
    suggester.forEach((configItem) => {
      if (!configItem.suggestList) {
        console.warn('[cherry-suggester]: the suggestList of config is missing.');
        return;
      }

      if (!configItem.keyword) {
        configItem.keyword = '@';
      }
      this.suggester[configItem.keyword] = configItem;
    });

    // 反复初始化时， 缓存还在， dom 已更新情况
    if (suggesterPanel.hasEditor()) {
      suggesterPanel.editor = null;
    }
  }

  makeHtml(str) {
    if (!this.RULE.reg) return str;
    if (!suggesterPanel.hasEditor()) {
      const { editor } = this.$engine.$cherry;
      suggesterPanel.setEditor(editor);
      suggesterPanel.setSuggester(this.suggester);
      suggesterPanel.bindEvent();
    }
    if (isLookbehindSupported()) {
      return str.replace(this.RULE.reg, this.toHtml.bind(this));
    }
    return replaceLookbehind(str, this.RULE.reg, this.toHtml.bind(this), true, 1);
  }

  toHtml(str) {
    return str.replace(this.RULE.reg, (wholeMatch, keyword, text) => {
      if (text && text !== 'undefined') {
        return (
          this.suggester[keyword]?.echo?.call(this, text) || `<span class="cherry-suggestion">${keyword}${text}</span>`
        );
      }
      if (this.suggester[keyword]?.echo === false) {
        return '';
      }
      if (!this.suggester[keyword]) {
        return text;
      }
      return text === 'undefined' || text === null ? '' : text;
    });
  }

  rule() {
    if (!this.suggester || Object.keys(this.suggester).length <= 0) {
      return {};
    }
    const keys = Object.keys(this.suggester)
      .map((key) => escapeRegExp(key))
      .join('|');
    const reg = new RegExp(
      `${isLookbehindSupported() ? '((?<!\\\\))[ ]' : '(^|[^\\\\])[ ]'}(${keys})(([^${keys}\\s])+)`,
      'g',
    );
    return {
      reg,
    };
  }

  mounted() {
    if (!suggesterPanel.hasEditor()) {
      const { editor } = this.$engine.$cherry;
      suggesterPanel.setEditor(editor);
      suggesterPanel.setSuggester(this.suggester);
      suggesterPanel.bindEvent();
    }
  }
}

class SuggesterPanel {
  constructor() {
    this.searchCache = false;
    this.searchKeyCache = [];
    this.optionList = [];
    this.cursorMove = true;
    this.suggesterConfig = {};

    if (!this.$suggesterPanel) {
      document.body.append(this.createDom(SuggesterPanel.panelWrap));
      this.$suggesterPanel = document.querySelector('.cherry-suggester-panel');
    }
  }

  static panelWrap = `<div class="cherry-suggester-panel"></div>`;

  hasEditor() {
    return !!this.editor && !!this.editor.editor.display && !!this.editor.editor.display.wrapper;
  }

  setEditor(editor) {
    this.editor = editor;
  }

  setSuggester(suggester) {
    this.suggesterConfig = suggester;
  }

  bindEvent() {
    let keyAction = false;
    this.editor.editor.on('change', (codemirror, evt) => {
      keyAction = true;
      this.onCodeMirrorChange(codemirror, evt);
    });

    this.editor.editor.on('keydown', (codemirror, evt) => {
      keyAction = true;
      if (this.enableRelate()) {
        this.onKeyDown(codemirror, evt);
      }
    });

    this.editor.editor.on('cursorActivity', () => {
      // 当编辑区光标位置改变时触发
      if (!keyAction) {
        this.stopRelate();
      }
      keyAction = false;
    });

    this.editor.editor.setOption('extraKeys', {
      Up() {
        if (suggesterPanel.cursorMove) {
          // logic to decide whether to move up or not
          return Codemirror.Pass;
        }
      },
      Down() {
        if (suggesterPanel.cursorMove) {
          // logic to decide whether to move up or not
          return Codemirror.Pass;
        }
      },
      Enter() {
        if (suggesterPanel.cursorMove) {
          // logic to decide whether to move up or not
          return Codemirror.Pass;
        }
      },
    });

    this.editor.editor.on('scroll', (codemirror, evt) => {
      if (!this.searchCache) {
        return;
      }
      // 当编辑器滚动时触发
      this.relocatePanel(this.editor.editor);
    });

    this.onClickPancelItem();
  }

  onClickPancelItem() {
    this.$suggesterPanel.addEventListener(
      'click',
      (evt) => {
        const idx = isChildNode(this.$suggesterPanel, evt.target);
        if (idx > -1) {
          this.pasteSelectResult(idx);
        }
        this.stopRelate();
      },
      false,
    );

    function isChildNode(parent, node) {
      let res = -1;
      parent.childNodes.forEach((item, idx) => (item === node ? (res = idx) : ''));
      return res;
    }
  }

  showsuggesterPanel({ left, top, items }) {
    if (!this.$suggesterPanel) {
      document.body.append(this.createDom(SuggesterPanel.panelWrap));
      this.$suggesterPanel = document.querySelector('.cherry-suggester-panel');
    }
    this.updatePanel(items);
    this.$suggesterPanel.style.left = `${left}px`;
    this.$suggesterPanel.style.top = `${top}px`;
    this.$suggesterPanel.style.display = 'block';
    this.$suggesterPanel.style.position = 'absolute';
    this.$suggesterPanel.style.zIndex = '100';
  }

  hidesuggesterPanel() {
    // const $suggesterPanel = document.querySelector('.cherry-suggester-panel');
    if (this.$suggesterPanel) {
      this.$suggesterPanel.style.display = 'none';
    }
  }

  updatePanel(items) {
    let defaultValue = items.map((item, idx) => this.renderPanelItem(item, idx === 0)).join('');
    if (this.suggesterConfig[this.keyword] && this.suggesterConfig[this.keyword].suggestListRender) {
      defaultValue = this.suggesterConfig[this.keyword].suggestListRender.call(this, items) || defaultValue;
    }

    if (typeof defaultValue === 'string') {
      this.$suggesterPanel.innerHTML = defaultValue;
    } else if (typeof defaultValue === 'object' && defaultValue.nodeType === 1) {
      this.$suggesterPanel.append(defaultValue);
    }
  }

  renderPanelItem(item, selected) {
    if (selected) {
      return `<div class="cherry-suggester-panel__item cherry-suggester-panel__item--selected">${item}</div>`;
    }
    return `<div class="cherry-suggester-panel__item">${item}</div>`;
  }

  createDom(string = '') {
    if (!this.template) {
      this.template = document.createElement('div');
    }

    this.template.innerHTML = string.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    const frag = document.createDocumentFragment();
    Array.prototype.map.call(this.template.childNodes, (item, idx) => {
      frag.appendChild(item);
    });
    return frag;
  }

  // 面板重定位
  relocatePanel(codemirror) {
    const $cursor = document.querySelector('.CodeMirror-cursors .CodeMirror-cursor');
    if (!$cursor) {
      return false;
    }
    const pos = codemirror.getCursor();
    const lineHeight = codemirror.lineInfo(pos.line).handle.height;
    const rect = $cursor.getBoundingClientRect();
    const top = rect.top + lineHeight;
    const { left } = rect;
    this.showsuggesterPanel({ left, top, items: this.optionList });
  }

  // 开启关联
  startRelate(codemirror, keyword, from) {
    this.cursorFrom = from;
    this.keyword = keyword;
    this.searchCache = true;
    this.searchKeyCache = [keyword];
    this.relocatePanel(codemirror);
  }

  // 关闭关联
  stopRelate() {
    this.hidesuggesterPanel();
    this.cursorFrom = null;
    this.cursorTo = null;
    this.keyword = '';
    this.searchKeyCache = [];
    this.searchCache = false;
    this.cursorMove = true;
  }

  // 粘贴选择结果
  pasteSelectResult(idx) {
    if (!this.cursorTo) {
      this.cursorTo = JSON.parse(JSON.stringify(this.cursorFrom));
    }
    if (!this.cursorTo) {
      return;
    }
    this.cursorTo.ch += 1;

    if (this.optionList[idx]) {
      const result = ` ${this.keyword}${this.optionList[idx]} `;
      // this.cursorTo.ch = this.cursorFrom.ch + result.length;
      this.editor.editor.replaceRange(result, this.cursorFrom, this.cursorTo);
    }
  }

  findSelectedItemIndex() {
    return Array.prototype.findIndex.call(this.$suggesterPanel.childNodes, (item) =>
      item.classList.contains('cherry-suggester-panel__item--selected'),
    );
  }

  enableRelate() {
    return this.searchCache;
  }

  onCodeMirrorChange(codemirror, evt) {
    const { text, from, to, origin } = evt;
    const changeValue = text.length === 1 ? text[0] : '';

    if (this.suggesterConfig[changeValue]) {
      this.startRelate(codemirror, changeValue, from);
    } else if (this.enableRelate() && (changeValue || origin === '+delete')) {
      this.cursorTo = to;
      if (changeValue) {
        this.searchKeyCache.push(changeValue);
      } else if (origin === '+delete') {
        this.searchKeyCache.pop();
        if (this.searchKeyCache.length === 0) {
          this.stopRelate();
          return;
        }
      }

      // 请求api
      // 返回结果拼凑
      this.suggesterConfig[this.keyword].suggestList(this.searchKeyCache.join(''), (res) => {
        if (!res || !res.length) {
          return;
        }
        this.optionList = res;
        this.updatePanel(this.optionList);
      });
    }
  }

  // 监听方向键选择 options
  onKeyDown(codemirror, evt) {
    if (!this.$suggesterPanel) {
      return false;
    }
    const { key, keyCode } = evt;
    // up down
    if ([38, 40].includes(keyCode)) {
      this.cursorMove = false;

      const selectedItem = this.$suggesterPanel.querySelector('.cherry-suggester-panel__item--selected');
      let nextElement = null;
      if (keyCode === 38 && !selectedItem.previousElementSibling) {
        nextElement = this.$suggesterPanel.lastElementChild;
        // codemirror.focus();
      } else if (keyCode === 40 && !selectedItem.nextElementSibling) {
        nextElement = this.$suggesterPanel.firstElementChild;
        // codemirror.focus();
      } else {
        if (keyCode === 38) {
          nextElement = selectedItem.previousElementSibling;
        } else if (keyCode === 40) {
          nextElement = selectedItem.nextElementSibling;
        }
      }

      selectedItem.classList.remove('cherry-suggester-panel__item--selected');

      nextElement.classList.add('cherry-suggester-panel__item--selected');
    } else if (keyCode === 13) {
      this.cursorMove = false;
      this.pasteSelectResult(this.findSelectedItemIndex());
      codemirror.focus();
      // const cache = JSON.parse(JSON.stringify(this.cursorTo));
      // setTimeout(() => {
      //   codemirror.setCursor(cache);
      // }, 100);
      setTimeout(() => {
        this.stopRelate();
      }, 0);
    }
  }
}

const suggesterPanel = new SuggesterPanel();
