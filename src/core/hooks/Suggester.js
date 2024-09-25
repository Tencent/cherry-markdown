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
import { allSuggestList, suggesterKeywords } from '@/core/hooks/SuggestList';
import { Pass } from 'codemirror/src/util/misc';
import { isLookbehindSupported } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';
import { isBrowser } from '@/utils/env';

/**
 * @typedef {import('codemirror')} CodeMirror
 */

/**
 * @typedef { Object } SuggestListItemObject 推荐列表项对象
 * @property { string } icon 图标
 * @property { string } label 候选列表回显的内容
 * @property { string } value 点击候选项的时候回填的值
 * @property { string } keyword 关键词，通过关键词控制候选项的显隐
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

  constructor({ config, cherry }) {
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

    this.config = config;
    this.$cherry = cherry;
    this.suggesterPanel = new SuggesterPanel(cherry);

    if (!this.inited) {
      this.initConfig(this.config);
    }

    this.RULE = this.rule();
  }

  afterInit(callback) {
    // node环境下直接跳过输入联想
    if (!isBrowser()) {
      return;
    }
    if (typeof callback === 'function') {
      callback();
    }
  }

  /**
   * 初始化配置
   * @param {SuggesterConfig} config
   */
  initConfig(config) {
    let { suggester } = config;

    this.suggester = {};
    const defaultSuggest = [];
    const that = this;
    // 默认的唤醒关键字
    for (const suggesterKeyword of suggesterKeywords) {
      defaultSuggest.push({
        keyword: suggesterKeyword,
        suggestList(_word, callback) {
          // 将word全转成小写
          const word = _word.toLowerCase();
          const systemSuggestList = allSuggestList(suggesterKeyword, that.$locale);
          // 加个空格就直接退出联想
          if (/^\s$/.test(word)) {
            callback(false);
            return;
          }
          const keyword = word
            .replace(/\s+/g, '') // 删掉空格，避免产生不必要的空数组元素
            .replace(new RegExp(`^${suggesterKeyword}`, 'g'), '') // 删掉word当中suggesterKeywords出现的字符
            .replace(/^[#]+/, '#')
            .replace(/^[/]+/, '/')
            .split('')
            .join('.*?');
          // 匹配任何包含 "keyword" 的字符串，无论 "keyword" 是在字符串的开头、中间还是结尾，并且不区分大小写
          const test = new RegExp(`^.*?${keyword}.*?$`, 'i');
          const suggestList = systemSuggestList.filter((item) => {
            // 处理精确匹配
            if (item.exactMatch) {
              return !word || item.keyword === word;
            }
            // TODO: 首次联想的时候会把所有的候选项列出来，后续可以增加一些机制改成默认拉取一部分候选项
            return !word || test.test(item.keyword);
          });
          // 当没有候选项时直接推出联想
          callback(suggestList.length === 0 ? false : suggestList);
        },
        echo() {
          return '';
        },
      });
    }
    if (!suggester) {
      suggester = defaultSuggest;
    } else {
      suggester = defaultSuggest.concat(suggester);
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
    if (this.suggesterPanel.hasEditor()) {
      this.suggesterPanel.editor = null;
    }

    this.inited = true;
  }

  makeHtml(str) {
    if (!this.RULE.reg) return str;
    if (!this.suggesterPanel.hasEditor() && isBrowser()) {
      const { editor } = this.$engine.$cherry;
      this.suggesterPanel.setEditor(editor);
      this.suggesterPanel.setSuggester(this.suggester);
      this.suggesterPanel.bindEvent();
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
    if (!this.config?.suggester || Object.keys(this.config?.suggester).length <= 0) {
      return {};
    }

    let suggester;
    if (Array.isArray(this.config.suggester)) {
      suggester = this.config.suggester.map((obj) => obj.keyword || '');
    } else {
      suggester = Object.keys(this.config.suggester).map((key) => this.config.suggester[key].keyword || '');
    }

    const keys = suggester.map((key) => escapeRegExp(key)).join('|');
    const reg = new RegExp(
      `${isLookbehindSupported() ? '((?<!\\\\))[ ]' : '(^|[^\\\\])[ ]'}(${keys})(([^${keys}\\s])+)`,
      'g',
    );
    return /** @type {any} */ ({
      reg,
    });
  }

  mounted() {
    if (!this.suggesterPanel.hasEditor() && isBrowser()) {
      const { editor } = this.$engine.$cherry;
      this.suggesterPanel.setEditor(editor);
      this.suggesterPanel.setSuggester(this.suggester);
      this.suggesterPanel.bindEvent();
    }
  }
}

class SuggesterPanel {
  constructor(cherry) {
    this.searchCache = false;
    this.searchKeyCache = [];
    this.optionList = [];
    this.cursorMove = true;
    this.suggesterConfig = {};
    this.$cherry = cherry;
  }

  /**
   * 如果没有panel，则尝试初始化一个，在node模式不初始化
   */
  tryCreatePanel() {
    if (!this.$suggesterPanel && isBrowser() && document) {
      this.$cherry.wrapperDom.appendChild(this.createDom(this.panelWrap));
      this.$suggesterPanel = this.$cherry.wrapperDom.querySelector('.cherry-suggester-panel');
    }
  }

  panelWrap = `<div class="cherry-suggester-panel"></div>`;

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
    if (!this.editor.options.showSuggestList) {
      return;
    }
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
          if (this.cursorMove) {
            const res = proxyTarget.call(codemirror, codemirror);

            if (res) {
              return res;
            }
            // logic to decide whether to move up or not
            // return Pass.toString();
          }
        };
      } else if (!extraKeys[key]) {
        extraKeys[key] = () => {
          if (this.cursorMove) {
            // logic to decide whether to move up or not
            return Pass.toString();
          }
        };
      } else if (typeof extraKeys[key] === 'string') {
        const command = extraKeys[key];
        extraKeys[key] = (codemirror) => {
          if (this.cursorMove) {
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

    this.onClickPanelItem();
  }

  onClickPanelItem() {
    this.tryCreatePanel();
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

  showSuggesterPanel({ left, top, items }) {
    this.tryCreatePanel();
    if (!this.$suggesterPanel && isBrowser()) {
      this.$cherry.wrapperDom.appendChild(this.createDom(this.panelWrap));
      this.$suggesterPanel = this.$cherry.wrapperDom.querySelector('.cherry-suggester-panel');
    }
    this.updatePanel(items);
    this.$suggesterPanel.style.left = `${left}px`;
    this.$suggesterPanel.style.top = `${top}px`;
    this.$suggesterPanel.style.display = 'block';
    this.$suggesterPanel.style.position = 'absolute';
    this.$suggesterPanel.style.zIndex = '100';
  }

  hideSuggesterPanel() {
    this.tryCreatePanel();
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
    this.tryCreatePanel();
    let defaultValue = suggestList
      .map((suggest, idx) => {
        if (typeof suggest === 'object' && suggest !== null) {
          let renderContent = suggest.label;
          if (suggest?.icon) {
            renderContent = `<i class="ch-icon ch-icon-${suggest.icon}"></i>${renderContent}`;
          }
          return this.renderPanelItem(renderContent, false);
        }
        return this.renderPanelItem(suggest, false);
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
    // 找到光标位置来确定候选框位置
    let $cursor = this.$cherry.wrapperDom.querySelector('.CodeMirror-cursors .CodeMirror-cursor');
    // 当editor选中某一内容时，".CodeMirror-cursor"会消失，此时通过定位".selected"来确定候选框位置
    if (!$cursor) {
      $cursor = this.$cherry.wrapperDom.querySelector('.CodeMirror-selected');
    }
    if (!$cursor) {
      return false;
    }
    const editorDomRect = this.$cherry.wrapperDom.getBoundingClientRect();
    const rect = $cursor.getBoundingClientRect();
    const top = rect.top + rect.height + 5 - editorDomRect.top;
    const left = rect.left - editorDomRect.left;
    this.showSuggesterPanel({ left, top, items: this.optionList });
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
    this.relocatePanel(codemirror);
  }

  // 关闭关联
  stopRelate() {
    this.hideSuggesterPanel();
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
    if (!this.cursorTo || this.cursorTo === this.cursorFrom) {
      this.cursorTo = JSON.parse(JSON.stringify(this.cursorFrom));
    }
    if (!this.cursorTo) {
      return;
    }
    this.cursorTo.ch += 1;
    const { cursorFrom, cursorTo } = this; // 缓存光标位置
    if (this.optionList[idx]) {
      let result = '';
      if (
        typeof this.optionList[idx] === 'object' &&
        this.optionList[idx] !== null &&
        typeof this.optionList[idx].value === 'string'
      ) {
        result = this.optionList[idx].value;
      } else if (
        typeof this.optionList[idx] === 'object' &&
        this.optionList[idx] !== null &&
        typeof this.optionList[idx].value === 'function'
      ) {
        result = this.optionList[idx].value();
      } else {
        result = ` ${this.keyword}${this.optionList[idx]} `;
      }
      // this.cursorTo.ch = this.cursorFrom.ch + result.length;
      if (result) {
        this.editor.editor.replaceRange(result, cursorFrom, cursorTo);
      }
      // 控制光标左移若干位
      if (this.optionList[idx].goLeft) {
        const cursor = this.editor.editor.getCursor();
        this.editor.editor.setCursor(cursor.line, cursor.ch - this.optionList[idx].goLeft);
      }
      // 控制光标上移若干位
      if (this.optionList[idx].goTop) {
        const cursor = this.editor.editor.getCursor();
        this.editor.editor.setCursor(cursor.line - this.optionList[idx].goTop, cursor.ch);
      }
      // 选中某个范围
      if (this.optionList[idx].selection) {
        const { line } = this.editor.editor.getCursor();
        const { ch } = this.editor.editor.getCursor();
        this.editor.editor.setSelection(
          { line, ch: ch - this.optionList[idx].selection.from },
          { line, ch: ch - this.optionList[idx].selection.to },
        );
      }
    }
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

    // 首次输入命中关键词的时候开启联想
    if (!this.enableRelate() && this.suggesterConfig[changeValue]) {
      this.startRelate(codemirror, changeValue, from);
    }
    if (this.enableRelate() && (changeValue || origin === '+delete')) {
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
          // 如果返回了false，则强制退出联想
          if (res === false) {
            this.stopRelate();
            return;
          }
          // 回显命中的结果
          this.optionList = !res || !res.length ? [] : res;
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
    this.tryCreatePanel();
    if (!this.$suggesterPanel) {
      return false;
    }
    const { keyCode } = evt;
    // up down
    if ([38, 40].includes(keyCode)) {
      // issue 558
      if (this.optionList.length === 0) {
        setTimeout(() => {
          this.stopRelate();
        }, 0);
        return;
      }

      this.cursorMove = false;

      const selectedItem =
        this.$suggesterPanel.querySelector('.cherry-suggester-panel__item--selected') ||
        this.$suggesterPanel.querySelector('.cherry-suggester-panel__item:last-child');
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

      // 提示面板高度
      const suggestPanelHeight = this.$suggesterPanel.offsetHeight;
      // 可视区域范围上端
      const viewTop = this.$suggesterPanel.scrollTop;
      // 可视区域范围下端
      const viewBottom = viewTop + suggestPanelHeight;
      // item的上端
      const nextEleTop = nextElement.offsetTop;
      // item高度
      const nextEleHeight = nextElement.offsetHeight;
      // 当前元素全部或部分在可视区域之外，就滚动
      if (nextEleTop < viewTop || nextEleTop + nextEleHeight > viewBottom) {
        this.$suggesterPanel.scrollTop = nextEleTop - suggestPanelHeight / 2;
      }
    } else if (keyCode === 13) {
      const index = this.findSelectedItemIndex();
      if (index >= 0) {
        evt.stopPropagation();
        this.cursorMove = false;
        this.pasteSelectResult(index, evt);
        codemirror.focus();
      }
      // const cache = JSON.parse(JSON.stringify(this.cursorTo));
      // setTimeout(() => {
      //   codemirror.setCursor(cache);
      // }, 100);
      setTimeout(() => {
        this.stopRelate();
      }, 0);
    } else if (keyCode === 27 || keyCode === 0x25 || keyCode === 0x27) {
      // 按下esc或者←、→键的时候退出联想
      evt.stopPropagation();
      codemirror.focus();
      setTimeout(() => {
        this.stopRelate();
      }, 0);
    }
  }
}
