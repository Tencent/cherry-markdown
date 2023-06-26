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
import { Pass } from 'codemirror/src/util/misc';
import { isLookbehindSupported } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';
import { isBrowser } from '@/utils/env';
import Cherry from '@/Cherry';

/**
 * @typedef {import('codemirror')} CodeMirror
 */

/**
 * @typedef { Object } SuggestListItemObject 推荐列表项对象
 * @property { string } type 类型
 * @property { string } icon 图标
 * @property { string } text 文本
 * @property { string= } sub 推荐列表项子项(常用于列表项有子项的情况，例如：header)
 * @typedef { SuggestListItemObject | string } SuggestListItem 推荐列表项
 * @typedef { Array<SuggestListItem> } SuggestList 推荐列表
 */

/**
 * @typedef {object} SuggesterConfigItem
 * @property {function(string, function(SuggestList): void): void} suggestList
 * @property {string} keyword
 * @property {function} suggestListRender
 * @property {function} echo
 * @typedef {object} SuggesterConfig
 * @property {Array<SuggesterConfigItem>} suggester
 */

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

  /**
   * 初始化配置
   * @param {SuggesterConfig} config
   */
  initConfig(config) {
    const { suggester } = config;

    this.suggester = {};
    if (!suggester) {
      return;
    }
    // 默认的唤醒关键字
    suggester.unshift({
      keyword: '/',
      suggestList(word, callback) {
        callback([
          {
            type: 'header',
            icon: 'h1',
            sub: 'h1',
            text: 'H1 一级标题',
          },
          {
            type: 'header',
            icon: 'h2',
            sub: 'h2',
            text: 'H2 二级标题',
          },
          {
            type: 'header',
            icon: 'h3',
            sub: 'h3',
            text: 'H3 三级标题',
          },
          {
            type: 'quickTable',
            icon: 'table',
            text: '快捷表格',
          },
          {
            type: 'codeBlock',
            icon: 'code',
            text: '代码块',
          },
          {
            type: 'graph',
            sub: 'insertFlow',
            icon: 'insertFlow',
            text: '流程图',
          },
          {
            type: 'formula',
            icon: 'insertFormula',
            text: '公式',
          },
        ]);
      },
    });
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
    if (!suggesterPanel.hasEditor() && isBrowser()) {
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

  toHtml(wholeMatch, leadingChar, keyword, text) {
    if (text) {
      return (
        this.suggester[keyword]?.echo?.call(this, text) ||
        `${leadingChar}<span class="cherry-suggestion">${keyword}${text}</span>`
      );
    }
    if (this.suggester[keyword]?.echo === false) {
      return `${leadingChar}`;
    }
    if (!this.suggester[keyword]) {
      return leadingChar + text;
    }
    return text ? leadingChar + text : `${leadingChar}`;
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
    if (!suggesterPanel.hasEditor() && isBrowser()) {
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

    if (!this.$suggesterPanel && isBrowser() && document) {
      document?.body?.appendChild(this.createDom(SuggesterPanel.panelWrap));
      this.$suggesterPanel = document?.querySelector('.cherry-suggester-panel');
    }
  }

  static panelWrap = `<div class="cherry-suggester-panel"></div>`;

  hasEditor() {
    return !!this.editor && !!this.editor.editor.display && !!this.editor.editor.display.wrapper;
  }

  /**
   * 设置编辑器
   * @param {import('@/Editor').default} editor
   */
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

    const extraKeys = this.editor.editor.getOption('extraKeys');
    const decorateKeys = ['Up', 'Down', 'Enter'];
    decorateKeys.forEach((key) => {
      if (typeof extraKeys[key] === 'function') {
        const proxyTarget = extraKeys[key];
        extraKeys[key] = (codemirror) => {
          if (suggesterPanel.cursorMove) {
            const res = proxyTarget.call(codemirror, codemirror);

            if (res) {
              return res;
            }
            // logic to decide whether to move up or not
            return Pass.toString();
          }
        };
      } else if (!extraKeys[key]) {
        extraKeys[key] = () => {
          if (suggesterPanel.cursorMove) {
            // logic to decide whether to move up or not
            return Pass.toString();
          }
        };
      } else if (typeof extraKeys[key] === 'string') {
        const command = extraKeys[key];
        extraKeys[key] = (codemirror) => {
          if (suggesterPanel.cursorMove) {
            this.editor.editor.execCommand(command);

            // logic to decide whether to move up or not
            // return Pass.toString();
          }
        };
      }
    });

    this.editor.editor.setOption('extraKeys', extraKeys);

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
    if (!this.$suggesterPanel && isBrowser()) {
      document.body.appendChild(this.createDom(SuggesterPanel.panelWrap));
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

  /**
   * 更新suggesterPanel
   * @param {SuggestList} suggestList
   */
  updatePanel(suggestList) {
    let defaultValue = suggestList
      .map((suggest, idx) => {
        if (typeof suggest === 'object' && suggest !== null) {
          let renderContent = suggest.text;
          if (suggest?.icon) {
            renderContent = `<i class="ch-icon ch-icon-${suggest.icon}"></i>${renderContent}`;
          }
          return this.renderPanelItem(renderContent, idx === 0);
        }
        return this.renderPanelItem(suggest, idx === 0);
      })
      .join('');
    /**
     * @type { SuggesterConfigItem }
     */
    const suggesterConfig = this.suggesterConfig[this.keyword];
    // 用户自定义渲染逻辑 suggestListRender
    if (suggesterConfig && typeof suggesterConfig.suggestListRender === 'function') {
      defaultValue = suggesterConfig.suggestListRender.call(this, suggestList) || defaultValue;
    }

    this.$suggesterPanel.innerHTML = ''; // 清空
    if (typeof defaultValue === 'string') {
      this.$suggesterPanel.innerHTML = defaultValue;
    } else if (Array.isArray(defaultValue) && defaultValue.length > 0) {
      defaultValue.forEach((item) => {
        this.$suggesterPanel.appendChild(item);
      });
    } else if (typeof defaultValue === 'object' && defaultValue.nodeType === 1) {
      this.$suggesterPanel.appendChild(defaultValue);
    }
  }

  /**
   * 渲染suggesterPanel item
   * @param {string} item 渲染内容
   * @param {boolean} selected 是否选中
   * @returns {string} html
   */
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

  /**
   * 获取光标位置
   * @param {CodeMirror} codemirror
   * @returns {{ left: number, top: number }}
   */
  getCursorPos(codemirror) {
    const $cursor = document.querySelector('.CodeMirror-cursors .CodeMirror-cursor');
    if (!$cursor) return null;
    const pos = codemirror.getCursor();
    const lineHeight = codemirror.lineInfo(pos.line).handle.height;
    const rect = $cursor.getBoundingClientRect();
    const top = rect.top + lineHeight;
    const { left } = rect;
    return { left, top };
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
    this.optionList = [];
  }

  /**
   * 粘贴选择结果
   * @param {number} idx 选择的结果索引
   * @param {KeyboardEvent} evt 键盘事件
   */
  pasteSelectResult(idx, evt) {
    if (!this.cursorTo) {
      this.cursorTo = JSON.parse(JSON.stringify(this.cursorFrom));
    }
    if (!this.cursorTo) {
      return;
    }
    this.cursorTo.ch += 1;
    const { cursorFrom, cursorTo } = this; // 缓存光标位置
    if (this.optionList[idx]) {
      let result = '';
      if (typeof this.optionList[idx] === 'object' && this.optionList[idx] !== null) {
        result = this.matchQuickTool(this.optionList[idx], this.editor.$cherry);
      }
      if (typeof this.optionList[idx] === 'string') {
        result = ` ${this.keyword}${this.optionList[idx]} `;
      }
      // this.cursorTo.ch = this.cursorFrom.ch + result.length;
      if (result) {
        this.editor.editor.replaceRange(result, cursorFrom, cursorTo);
      }
    }
  }

  /**
   * 匹配快捷工具
   * @param {SuggestListItemObject} suggester
   * @param {import('../../Cherry').default} cherry
   * @returns {string}
   */
  matchQuickTool(suggester, cherry) {
    if (typeof suggester !== 'object' || suggester === null) return '';
    if (cherry instanceof Cherry === false) return '';
    const { type = '', sub = '' } = suggester;
    const quickToolMap = {
      header: (sub) => cherry.toolbar.menus.hooks.header.onClick('/', sub),
      quickTable: () => cherry.floatMenu.menus.hooks.quickTable.onClick(''),
      codeBlock: () => cherry.floatMenu.menus.hooks.code.onClick(''),
      graph: (sub) => cherry.toolbar.menus.hooks.graph.subMenuConfig.find((menu) => menu.name === sub)?.onclick(),
      formula: () => cherry.toolbar.menus.hooks.formula.onClick(''),
    };
    if (typeof quickToolMap[type] === 'function') {
      return quickToolMap[type](sub) ?? '';
    }
    return '';
  }

  /**
   * 寻找当前选中项的索引
   * @returns {number}
   */
  findSelectedItemIndex() {
    return Array.prototype.findIndex.call(this.$suggesterPanel.childNodes, (item) =>
      item.classList.contains('cherry-suggester-panel__item--selected'),
    );
  }

  enableRelate() {
    return this.searchCache;
  }

  /**
   *  codeMirror change事件
   * @param {CodeMirror.Editor} codemirror
   * @param {CodeMirror.EditorChange} evt
   * @returns
   */
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
      // 展示推荐列表
      if (typeof this.suggesterConfig[this.keyword]?.suggestList === 'function') {
        // 请求api 返回结果拼凑
        this.suggesterConfig[this.keyword].suggestList(this.searchKeyCache.join(''), (res) => {
          if (!res || !res.length) {
            return;
          }
          this.optionList = res;
          this.updatePanel(this.optionList);
        });
      }
    }
  }

  /**
   * 监听方向键选择 options
   * @param {CodeMirror.Editor} codemirror
   * @param {KeyboardEvent} evt
   */
  onKeyDown(codemirror, evt) {
    if (!this.$suggesterPanel) {
      return false;
    }
    const { keyCode } = evt;
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
      evt.stopPropagation();
      this.cursorMove = false;
      this.pasteSelectResult(this.findSelectedItemIndex(), evt);
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
