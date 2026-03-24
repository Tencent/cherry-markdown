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
// @ts-check
import {
  EditorView,
  keymap,
  placeholder,
  lineNumbers,
  Decoration,
  WidgetType,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  ViewPlugin,
  rectangularSelection,
} from '@codemirror/view';
import { EditorState, StateEffect, StateField, EditorSelection, Transaction, Compartment } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { search, searchKeymap, SearchQuery } from '@codemirror/search';
import { history, historyKeymap, defaultKeymap, indentWithTab } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { syntaxHighlighting, defaultHighlightStyle, foldGutter, indentOnInput } from '@codemirror/language';
import htmlParser from '@/utils/htmlparser';
import pasteHelper from '@/utils/pasteHelper';
import Logger from '@/Logger';
import { handleFileUploadCallback } from '@/utils/file';
import { tagHighlighter, tags } from '@lezer/highlight';
import { createElement } from './utils/dom';
import { base64Reg, imgDrawioXmlReg, createUrlReg, getCodeBlockRule, pasteWrapperReg } from './utils/regexp';
import { addEvent, removeEvent } from './utils/event';
import { handleNewlineIndentList } from './utils/autoindent';

/**
 * 自定义语法高亮器 - 将 Lezer tags 映射为 cm-* 类名
 * 用于保持样式兼容性
 */
const cherryHighlighter = tagHighlighter([
  { tag: tags.string, class: 'cm-string' },
  { tag: tags.special(tags.string), class: 'cm-string-2' },
  { tag: tags.number, class: 'cm-number' },
  { tag: tags.keyword, class: 'cm-keyword' },
  { tag: tags.comment, class: 'cm-comment' },
  { tag: tags.lineComment, class: 'cm-comment' },
  { tag: tags.blockComment, class: 'cm-comment' },
  { tag: tags.docComment, class: 'cm-comment' },
  { tag: tags.variableName, class: 'cm-variable' },
  { tag: tags.definition(tags.variableName), class: 'cm-def' },
  { tag: tags.function(tags.variableName), class: 'cm-variable-2' },
  { tag: tags.local(tags.variableName), class: 'cm-variable' },
  { tag: tags.special(tags.variableName), class: 'cm-variable-3' },
  { tag: tags.propertyName, class: 'cm-property' },
  { tag: tags.definition(tags.propertyName), class: 'cm-property' },
  { tag: tags.special(tags.propertyName), class: 'cm-property' },
  { tag: tags.operator, class: 'cm-operator' },
  { tag: tags.arithmeticOperator, class: 'cm-operator' },
  { tag: tags.logicOperator, class: 'cm-operator' },
  { tag: tags.bitwiseOperator, class: 'cm-operator' },
  { tag: tags.compareOperator, class: 'cm-operator' },
  { tag: tags.updateOperator, class: 'cm-operator' },
  { tag: tags.definitionOperator, class: 'cm-operator' },
  { tag: tags.controlOperator, class: 'cm-operator' },
  { tag: tags.derefOperator, class: 'cm-operator' },
  { tag: tags.url, class: 'cm-url' },
  { tag: tags.link, class: 'cm-link' },
  { tag: tags.atom, class: 'cm-atom' },
  { tag: tags.bool, class: 'cm-atom' },
  { tag: tags.null, class: 'cm-atom' },
  { tag: tags.self, class: 'cm-atom' },
  { tag: tags.meta, class: 'cm-meta' },
  { tag: tags.annotation, class: 'cm-meta' },
  { tag: tags.modifier, class: 'cm-meta' },
  { tag: tags.heading, class: 'cm-header' },
  { tag: tags.heading1, class: 'cm-header cm-header-1' },
  { tag: tags.heading2, class: 'cm-header cm-header-2' },
  { tag: tags.heading3, class: 'cm-header cm-header-3' },
  { tag: tags.heading4, class: 'cm-header cm-header-4' },
  { tag: tags.heading5, class: 'cm-header cm-header-5' },
  { tag: tags.heading6, class: 'cm-header cm-header-6' },
  { tag: tags.emphasis, class: 'cm-em' },
  { tag: tags.strong, class: 'cm-strong' },
  { tag: tags.strikethrough, class: 'cm-strikethrough' },
  { tag: tags.quote, class: 'cm-quote' },
  { tag: tags.list, class: 'cm-list' },
  { tag: tags.contentSeparator, class: 'cm-hr' },
  { tag: tags.typeName, class: 'cm-type' },
  { tag: tags.className, class: 'cm-type' },
  { tag: tags.namespace, class: 'cm-qualifier' },
  { tag: tags.labelName, class: 'cm-tag' },
  { tag: tags.tagName, class: 'cm-tag' },
  { tag: tags.angleBracket, class: 'cm-bracket' },
  { tag: tags.attributeName, class: 'cm-attribute' },
  { tag: tags.attributeValue, class: 'cm-string' },
  { tag: tags.paren, class: 'cm-bracket' },
  { tag: tags.squareBracket, class: 'cm-bracket' },
  { tag: tags.brace, class: 'cm-bracket' },
  { tag: tags.punctuation, class: 'cm-punctuation' },
  { tag: tags.separator, class: 'cm-punctuation' },
  { tag: tags.escape, class: 'cm-escape' },
  { tag: tags.regexp, class: 'cm-string-2' },
  { tag: tags.monospace, class: 'cm-comment' },
  { tag: tags.processingInstruction, class: 'cm-meta' },
  { tag: tags.invalid, class: 'cm-invalidchar' },
  { tag: tags.character, class: 'cm-string' },
]);

/**
 * @typedef {import('~types/editor').EditorConfiguration} EditorConfiguration
 * @typedef {import('~types/editor').EditorEventCallback<keyof import('~types/editor').EditorEventMap>} EditorEventCallback
 * @typedef {import('~types/editor').CM6Adapter} CM6AdapterType
 * @typedef {import('~types/editor').TextMarker} TextMarker
 * @typedef {import('~types/editor').MarkInfo} MarkInfo
 * @typedef {import('~types/editor').MarkTextOptions} MarkTextOptions
 * @typedef {import('~types/editor').SearchCursor} SearchCursor
 * @typedef {import('~types/editor').ScrollInfo} ScrollInfo
 * @typedef {import('@codemirror/state').SelectionRange} SelectionRange
 * @typedef {import('@codemirror/view').Rect} Rect
 */

/**
 * @typedef {Object} MarkEffectValue
 * @property {number} from - 起始位置（文档偏移量）
 * @property {number} to - 结束位置（文档偏移量）
 * @property {Decoration} [decoration] - 装饰对象
 * @property {MarkTextOptions} [options] - 标记选项
 * @property {string} [markId] - 用于追踪 mark 的唯一标识符
 */

// 注意：keymapCompartment 和 vimCompartment 已移至 Editor 类实例属性

// vim 模块缓存
let vimModule = null;
let vimModuleLoadPromise = null;

/**
 * 动态加载 vim 模块
 * @returns {Promise<any>} vim 模块
 */
async function loadVimModule() {
  if (vimModule) {
    return vimModule;
  }
  if (vimModuleLoadPromise) {
    return vimModuleLoadPromise;
  }

  vimModuleLoadPromise = (async () => {
    try {
      const mod = await import('@replit/codemirror-vim');
      vimModule = mod;
      return mod;
    } catch (e) {
      vimModuleLoadPromise = null;
      Logger.error('Failed to load @replit/codemirror-vim. Please install it: npm install @replit/codemirror-vim');
      throw e;
    }
  })();

  return vimModuleLoadPromise;
}

// 缓存语法高亮扩展
const cachedCherryHighlighting = syntaxHighlighting(cherryHighlighter);
const cachedDefaultHighlighting = syntaxHighlighting(defaultHighlightStyle);

// 搜索高亮效果
/** @type {import('@codemirror/state').StateEffectType<import('@codemirror/view').DecorationSet>} */
const setSearchHighlightEffect = StateEffect.define();

/**
 * 搜索高亮的 ViewPlugin（增量更新，只处理可见区域）
 */
const searchHighlightField = ViewPlugin.fromClass(
  class {
    /**
     * @param {EditorView} view
     */
    constructor(view) {
      /** @type {RegExp | null} */
      this.query = null;
      /** @type {import('@codemirror/view').DecorationSet} */
      this.decorations = Decoration.none;
      this.buildDecorations(view);
    }

    /**
     * @param {import('@codemirror/view').ViewUpdate} update
     */
    update(update) {
      const shouldRebuild =
        update.docChanged ||
        update.viewportChanged ||
        update.transactions.some((tr) => tr.effects.some((e) => e.is(setSearchHighlightEffect)));

      if (shouldRebuild) {
        this.buildDecorations(update.view);
      }
    }

    /**
     * @param {EditorView} view
     */
    buildDecorations(view) {
      if (!this.query) {
        this.decorations = Decoration.none;
        return;
      }

      const decorations = [];

      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        const tempQuery = new RegExp(this.query.source, this.query.flags);
        tempQuery.lastIndex = 0;

        let match;
        while ((match = tempQuery.exec(text)) !== null) {
          const matchFrom = from + match.index;
          const matchTo = matchFrom + match[0].length;

          decorations.push(
            Decoration.mark({
              class: 'cm-searching',
            }).range(matchFrom, matchTo),
          );

          if (match[0].length === 0) {
            tempQuery.lastIndex += 1;
          }
        }
      }

      this.decorations = Decoration.set(decorations.sort((a, b) => a.from - b.from));
    }

    destroy() {
      this.query = null;
      this.decorations = Decoration.none;
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

/**
 * CodeMirror 6 适配器
 * 提供对 EditorView 的封装，使用 CM6 原生类型
 * @implements {CM6AdapterType}
 */
class CM6Adapter {
  /**
   * 创建 CM6Adapter 实例
   * @param {EditorView} view - EditorView 实例
   * @param {Compartment} [vimCompartment] - vim 模式的 Compartment（可选，用于多实例隔离）
   */
  constructor(view, vimCompartment) {
    /** @type {EditorView} */
    this.view = view;
    /** @type {Map<string, Array<(...args: unknown[]) => void>>} */
    this.eventHandlers = new Map();
    /** @type {'sublime' | 'vim'} */
    this.currentKeyMap = 'sublime';
    /** @type {Compartment | null} */
    this.vimCompartment = vimCompartment || null;
    /** @type {number} 实例级 markId 计数器 */
    this.markIdCounter = 0;
  }

  /**
   * 获取编辑器状态
   * @returns {EditorState}
   */
  get state() {
    return this.view.state;
  }

  /**
   * 获取滚动容器 DOM 元素
   * @returns {HTMLElement}
   */
  get scrollDOM() {
    return this.view.scrollDOM;
  }

  /**
   * 分发事务到编辑器
   * @param {...import('@codemirror/state').TransactionSpec} specs
   * @returns {void}
   */
  dispatch(...specs) {
    return this.view.dispatch(...specs);
  }

  /**
   * 请求测量
   * @template T
   * @param {{ read: (view: EditorView) => T; write?: (measure: T, view: EditorView) => void }} [request]
   * @returns {void}
   */
  requestMeasure(request) {
    return this.view.requestMeasure(request);
  }

  /**
   * 坐标转位置
   * @param {{ x: number; y: number }} coords
   * @returns {number | null}
   */
  posAtCoords(coords) {
    return this.view.posAtCoords(coords);
  }

  /**
   * 获取行块信息
   * @param {number} pos
   * @returns {import('@codemirror/view').BlockInfo}
   */
  lineBlockAt(pos) {
    return this.view.lineBlockAt(pos);
  }

  /**
   * 获取编辑器全部内容
   * @returns {string} 文档内容字符串
   */
  getValue() {
    return this.view.state.doc.toString();
  }

  /**
   * 设置编辑器内容
   * @param {string} value - 要设置的文本内容
   * @returns {void}
   */
  setValue(value) {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: value },
    });
  }

  /**
   * 获取当前选中的文本
   * @returns {string} 选中的文本，如果没有选中则返回空字符串
   */
  getSelection() {
    const { from, to } = this.view.state.selection.main;
    return this.view.state.doc.sliceString(from, to);
  }

  /**
   * 获取所有选区的文本
   * @returns {string[]} 所有选区文本的数组
   */
  getSelections() {
    return this.view.state.selection.ranges.map((range) => this.view.state.doc.sliceString(range.from, range.to));
  }

  /**
   * 替换当前选中的文本
   * @param {string} text - 替换文本
   * @param {'around' | 'start'} [select='around'] - 替换后的选区行为
   *   - 'around': 光标移动到替换文本末尾
   *   - 'start': 光标移动到替换文本开头
   * @returns {void}
   */
  replaceSelection(text, select = 'around') {
    const { from, to } = this.view.state.selection.main;
    let selection;

    if (select === 'start') {
      selection = { anchor: from };
    } else {
      selection = { anchor: from + text.length };
    }

    this.view.dispatch({
      changes: { from, to, insert: text },
      selection,
    });
  }

  /**
   * 替换多个选区的文本
   * @param {string[]} texts - 替换文本数组
   * @param {'around' | 'start'} [select='around'] - 替换后的选区行为
   * @returns {void}
   */
  replaceSelections(texts, select = 'around') {
    const { ranges } = this.view.state.selection;
    const changes = ranges.map((range, i) => ({
      from: range.from,
      to: range.to,
      insert: texts[i] || '',
    }));

    let newSelections;
    if (select === 'around') {
      let offset = 0;
      newSelections = ranges.map((range, i) => {
        const text = texts[i] || '';
        const newFrom = range.from + offset;
        const newTo = newFrom + text.length;
        offset += text.length - (range.to - range.from);
        return EditorSelection.range(newTo, newTo);
      });
    } else if (select === 'start') {
      let offset = 0;
      newSelections = ranges.map((range, i) => {
        const text = texts[i] || '';
        const newFrom = range.from + offset;
        offset += text.length - (range.to - range.from);
        return EditorSelection.range(newFrom, newFrom);
      });
    }

    this.view.dispatch({
      changes,
      selection: newSelections ? EditorSelection.create(newSelections) : undefined,
    });
  }

  /**
   * 获取光标位置
   * @param {'head' | 'anchor'} [type='head'] - 'head' 返回光标头部，'anchor' 返回锚点位置
   * @returns {number} 文档偏移量
   */
  getCursor(type = 'head') {
    return type === 'head' ? this.view.state.selection.main.head : this.view.state.selection.main.anchor;
  }

  /**
   * 设置光标位置
   * @param {number} pos - 文档偏移量
   * @returns {void}
   */
  setCursor(pos) {
    const docLength = this.view.state.doc.length;
    const safePos = Math.max(0, Math.min(pos, docLength));
    this.view.dispatch({ selection: { anchor: safePos } });
  }

  /**
   * 设置选区
   * @param {number} anchor - 选区锚点（文档偏移量）
   * @param {number} [head] - 选区头部（文档偏移量），不传则与 anchor 相同
   * @param {Object} [options]
   * @param {string} [options.userEvent] - 用户事件类型
   * @param {boolean} [options.scrollIntoView] - 是否滚动到选区位置
   * @returns {void}
   */
  setSelection(anchor, head, options = {}) {
    const docLength = this.view.state.doc.length;
    const headPos = head !== undefined ? head : anchor;
    const safeAnchor = Math.max(0, Math.min(anchor, docLength));
    const safeHead = Math.max(0, Math.min(headPos, docLength));
    const dispatchOptions = { selection: { anchor: safeAnchor, head: safeHead } };

    if (options.userEvent) {
      dispatchOptions.annotations = Transaction.userEvent.of(options.userEvent);
    }

    if (options.scrollIntoView) {
      dispatchOptions.effects = EditorView.scrollIntoView(safeHead);
    }

    this.view.dispatch(dispatchOptions);
  }

  /**
   * 获取所有选区
   * @returns {readonly SelectionRange[]} CM6 SelectionRange 数组
   */
  listSelections() {
    return this.view.state.selection.ranges;
  }

  /**
   * 获取指定行的内容
   * @param {number} lineNumber - 行号（1-indexed）
   * @returns {string}
   */
  getLine(lineNumber) {
    const lineObj = this.view.state.doc.line(lineNumber);
    return lineObj.text;
  }

  /**
   * 获取文档总行数
   * @returns {number}
   */
  lineCount() {
    return this.view.state.doc.lines;
  }

  /**
   * 获取指定范围的文本
   * @param {number} from - 起始位置（文档偏移量）
   * @param {number} to - 结束位置（文档偏移量）
   * @returns {string}
   */
  getRange(from, to) {
    return this.view.state.doc.sliceString(from, to);
  }

  /**
   * 替换指定范围的文本
   * @param {string} text - 替换文本
   * @param {number} from - 起始位置（文档偏移量）
   * @param {number} [to] - 结束位置（文档偏移量），不传则在 from 位置插入
   * @returns {void}
   */
  replaceRange(text, from, to) {
    const docLength = this.view.state.doc.length;
    const toPos = to !== undefined ? to : from;
    const safeFrom = Math.max(0, Math.min(from, docLength));
    const safeTo = Math.max(safeFrom, Math.min(toPos, docLength));
    this.view.dispatch({
      changes: { from: safeFrom, to: safeTo, insert: text },
    });
  }

  /**
   * 获取文档对象
   * @returns {CM6Adapter}
   */
  getDoc() {
    return this;
  }

  /**
   * 获取指定位置的屏幕坐标
   * @param {number} [pos] - 文档位置（偏移量），不传则使用当前光标位置
   * @returns {Rect | null} 坐标对象 {left, top, bottom, right} 或 null
   */
  cursorCoords(pos) {
    const position = pos !== undefined ? pos : this.view.state.selection.main.head;
    return this.view.coordsAtPos(position);
  }

  /**
   * 滚动到指定位置
   * @param {number | null} x - 水平滚动位置，null 表示不改变
   * @param {number | null} y - 垂直滚动位置，null 表示不改变
   * @returns {void}
   */
  scrollTo(x, y) {
    this.view.requestMeasure({
      read: () => ({ x, y }),
      write: ({ x: scrollX, y: scrollY }) => {
        if (scrollY !== null) {
          this.view.scrollDOM.scrollTop = scrollY;
        }
        if (scrollX !== null) {
          this.view.scrollDOM.scrollLeft = scrollX;
        }
      },
    });
  }

  /**
   * 将指定位置滚动到可视区域
   * @param {number} pos - 文档位置（偏移量）
   * @returns {void}
   */
  scrollIntoView(pos) {
    this.view.dispatch({
      effects: EditorView.scrollIntoView(pos),
    });
  }

  /**
   * 获取滚动信息
   * @returns {ScrollInfo} 包含滚动位置、尺寸等信息
   */
  getScrollInfo() {
    return {
      left: this.view.scrollDOM.scrollLeft,
      top: this.view.scrollDOM.scrollTop,
      height: this.view.scrollDOM.scrollHeight,
      width: this.view.scrollDOM.scrollWidth,
      clientHeight: this.view.scrollDOM.clientHeight,
      clientWidth: this.view.scrollDOM.clientWidth,
    };
  }

  /**
   * 获取编辑器包装元素
   * @returns {HTMLElement} 编辑器最外层 DOM
   */
  getWrapperElement() {
    return this.view.dom;
  }

  /**
   * 获取滚动容器元素
   * @returns {HTMLElement} 可滚动的 DOM 容器
   */
  getScrollerElement() {
    return this.view.scrollDOM;
  }

  /**
   * 刷新编辑器布局
   * @returns {void}
   */
  refresh() {
    this.view.requestMeasure();
  }

  /**
   * 聚焦编辑器
   * @returns {void}
   */
  focus() {
    this.view.focus();
  }

  /**
   * 设置编辑器选项
   * @param {'value' | 'keyMap' | string} option - 选项名称
   * @param {string | boolean | object} value - 选项值
   * @returns {void}
   */
  setOption(option, value) {
    switch (option) {
      case 'value':
        this.setValue(/** @type {string} */ (value));
        break;
      case 'keyMap':
        this.setKeyMap(/** @type {'sublime' | 'vim'} */ (value));
        break;
      default:
        break;
    }
  }

  /**
   * 设置键盘映射模式
   * @param {'sublime' | 'vim'} mode - 'sublime' 或 'vim' 模式
   * @returns {Promise<void>}
   */
  async setKeyMap(mode) {
    if (!this.vimCompartment) {
      console.warn('vimCompartment not available, cannot switch keyMap');
      return;
    }

    if (mode === 'vim') {
      try {
        const vimMod = await loadVimModule();
        this.view.dispatch({
          effects: this.vimCompartment.reconfigure(vimMod.vim()),
        });
        this.currentKeyMap = 'vim';
      } catch (e) {
        console.error('Failed to load vim module, falling back to sublime mode:', e);
        this.view.dispatch({
          effects: this.vimCompartment.reconfigure([]),
        });
        this.currentKeyMap = 'sublime';
        throw new Error('Failed to switch to vim mode. Using sublime mode instead.');
      }
    } else {
      this.view.dispatch({
        effects: this.vimCompartment.reconfigure([]),
      });
      this.currentKeyMap = 'sublime';
    }
  }

  /**
   * 获取编辑器选项
   * @param {'readOnly' | 'disableInput' | 'value' | string} option - 选项名称
   * @returns {string | boolean | object | null} 选项值
   */
  getOption(option) {
    switch (option) {
      case 'readOnly':
        return this.view.state.facet(EditorState.readOnly);
      case 'disableInput':
        return this.view.state.facet(EditorState.readOnly);
      case 'value':
        return this.getValue();
      default:
        return null;
    }
  }

  /**
   * 设置搜索查询并高亮匹配
   * @param {string} query - 搜索字符串或正则表达式
   * @param {boolean} [caseSensitive=false] - 是否区分大小写
   * @param {boolean} [isRegex=false] - 是否为正则表达式
   * @returns {void}
   */
  setSearchQuery(query, caseSensitive = false, isRegex = false) {
    if (!query || query.trim() === '') {
      this.clearSearchQuery();
      return;
    }

    let searchRe;
    if (isRegex) {
      try {
        searchRe = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } catch (e) {
        console.warn('Invalid regex:', e);
        return;
      }
    } else {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchRe = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
    }

    const plugin = this.view.plugin(searchHighlightField);
    if (plugin) {
      plugin.query = searchRe;
      this.view.dispatch({
        effects: setSearchHighlightEffect.of(Decoration.none),
      });
    }
  }

  /**
   * 清除搜索高亮
   * @returns {void}
   */
  clearSearchQuery() {
    const plugin = this.view.plugin(searchHighlightField);
    if (plugin) {
      plugin.query = null;
      this.view.dispatch({
        effects: setSearchHighlightEffect.of(Decoration.none),
      });
    }
  }

  /**
   * 标记指定范围的文本
   * @param {number} from - 起始位置（文档偏移量）
   * @param {number} to - 结束位置（文档偏移量）
   * @param {MarkTextOptions} options - 标记选项
   * @returns {TextMarker} 标记对象
   */
  markText(from, to, options) {
    this.markIdCounter += 1;
    const markId = `mark_${this.markIdCounter}`;

    const decoration = options.replacedWith
      ? Decoration.replace({
          widget: new ReplacementWidget(options.replacedWith),
          attributes: { 'data-mark-id': markId },
        })
      : Decoration.mark({
          class: options.className,
          attributes: {
            ...(options.title ? { title: options.title } : {}),
            'data-mark-id': markId,
          },
        });

    this.view.dispatch({
      effects: addMark.of({ from, to, decoration, options, markId }),
    });

    const { view } = this;
    const savedMarkId = markId;

    return {
      clear: () => {
        view.dispatch({
          effects: removeMark.of({ from, to, markId: savedMarkId }),
        });
      },
      find: () => {
        const marks = view.state.field(markField, false);
        if (!marks) return undefined;

        const iter = marks.iter();
        while (iter.value) {
          const attrMarkId = iter.value.spec?.attributes?.['data-mark-id'];
          if (attrMarkId === savedMarkId) {
            return { from: iter.from, to: iter.to };
          }
          iter.next();
        }

        return undefined;
      },
      className: options.className,
      markId: savedMarkId,
    };
  }

  /**
   * 查找指定范围内的标记
   * @param {number} from - 起始位置（文档偏移量）
   * @param {number} to - 结束位置（文档偏移量）
   * @returns {MarkInfo[]} 标记信息数组
   */
  findMarks(from, to) {
    const marks = this.view.state.field(markField, false);
    if (!marks) return [];

    /** @type {MarkInfo[]} */
    const result = [];
    const iter = marks.iter();
    while (iter.value) {
      if (iter.from <= to && iter.to >= from) {
        result.push({
          from: iter.from,
          to: iter.to,
          className: iter.value.spec?.class || '',
        });
      }
      iter.next();
    }
    return result;
  }

  /**
   * 获取搜索游标
   * @param {string | RegExp} query - 搜索字符串或正则表达式
   * @param {number} [pos=0] - 起始搜索位置（文档偏移量）
   * @param {boolean} [caseFold] - 是否忽略大小写（true 忽略，false 区分）
   * @returns {SearchCursor} 搜索游标对象
   */
  getSearchCursor(query, pos = 0, caseFold) {
    let searchStr = typeof query === 'string' ? query : query.source;
    let isRegexp = query instanceof RegExp;

    if (isRegexp) {
      try {
        new RegExp(searchStr, 'gimu');
      } catch (e) {
        console.error('Invalid regexp for CodeMirror Search:', searchStr, e.message);
        searchStr = '(?!.*)';
        isRegexp = true;
      }
    }

    const searchQuery = new SearchQuery({
      search: searchStr,
      regexp: isRegexp,
      caseSensitive: caseFold === false,
    });

    const { doc } = this.view.state;
    let cursor = searchQuery.getCursor(doc, pos);

    /** @type {{ from: number; to: number } | null} */
    let lastSearchResult = null;
    let currentPos = pos;

    const findPreviousMatch = (/** @type {number} */ fromPos) => {
      const prevCursor = searchQuery.getCursor(doc, 0);
      let lastMatch = null;

      let result = prevCursor.next();
      while (!result.done && result.value.from < fromPos) {
        lastMatch = result.value;
        result = prevCursor.next();
      }

      return lastMatch;
    };

    return {
      findNext: () => {
        const result = cursor.next();
        if (result.done) return false;

        currentPos = result.value.to;
        lastSearchResult = result.value;

        const matched = doc.sliceString(result.value.from, result.value.to);
        const matchArr = query instanceof RegExp ? matched.match(query) : [matched];
        return matchArr || false;
      },
      findPrevious: () => {
        const prevMatch = findPreviousMatch(currentPos);
        if (!prevMatch) return false;

        currentPos = prevMatch.from;
        lastSearchResult = prevMatch;
        cursor = searchQuery.getCursor(doc, currentPos);

        const matched = doc.sliceString(prevMatch.from, prevMatch.to);
        const matchResult = query instanceof RegExp ? matched.match(query) : [matched];
        return matchResult || false;
      },
      from: () => {
        if (!lastSearchResult) return null;
        return lastSearchResult.from;
      },
      to: () => {
        if (!lastSearchResult) return null;
        return lastSearchResult.to;
      },
      matches: (reverse, startPos) => {
        if (!lastSearchResult) {
          return { from: startPos, to: startPos };
        }
        return { from: lastSearchResult.from, to: lastSearchResult.to };
      },
    };
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {(...args: unknown[]) => void} handler - 事件处理函数
   * @returns {void}
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {(...args: unknown[]) => void} handler - 事件处理函数
   * @returns {void}
   */
  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {...unknown} args - 事件参数
   * @returns {void}
   */
  emit(event, ...args) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      if (event === 'change' && args[0]) {
        /** @type {import('@codemirror/view').ViewUpdate} */
        const update = /** @type {import('@codemirror/view').ViewUpdate} */ (args[0]);
        if (update.changes) {
          let origin;
          if (update.transactions.length > 0) {
            const tr = update.transactions[0];
            const userEvent = tr.annotation(Transaction.userEvent);
            if (userEvent) {
              if (userEvent === 'input' || userEvent.startsWith('input.')) origin = '+input';
              else if (userEvent === 'delete' || userEvent.startsWith('delete.')) origin = '+delete';
              else if (userEvent === 'undo' || userEvent.startsWith('undo.')) origin = 'undo';
              else if (userEvent === 'redo' || userEvent.startsWith('redo.')) origin = 'redo';
            }
          }

          const changes = [];
          update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
            changes.push({
              from: fromA,
              to: toA,
              text: inserted.toString().split('\n'),
              removed: update.startState.doc.sliceString(fromA, toA).split('\n'),
              origin,
            });
          });

          const changeObj =
            changes.length === 1
              ? changes[0]
              : {
                  from: changes[0]?.from ?? 0,
                  to: changes[changes.length - 1]?.to ?? 0,
                  text: changes.flatMap((c) => c.text),
                  removed: changes.flatMap((c) => c.removed),
                  origin,
                  changes,
                };

          handlers.forEach((handler) => handler(this, changeObj));
        } else {
          handlers.forEach((handler) => handler(this, ...args));
        }
      } else {
        handlers.forEach((handler) => handler(this, ...args));
      }
    }
  }
}

// 替换 Widget
class ReplacementWidget extends WidgetType {
  /**
   * @param {HTMLElement} dom - 要替换的 DOM 元素
   */
  constructor(dom) {
    super();
    /** @type {HTMLElement} */
    this.dom = dom;
  }

  /**
   * @returns {HTMLElement}
   */
  toDOM() {
    return /** @type {HTMLElement} */ (this.dom.cloneNode(true));
  }

  /**
   * @param {ReplacementWidget} other - 另一个 Widget 实例
   * @returns {boolean}
   */
  eq(other) {
    return this.dom === other.dom;
  }
}

// Mark 状态管理
/** @type {import('@codemirror/state').StateEffectType<MarkEffectValue>} */
const addMark = StateEffect.define();
/** @type {import('@codemirror/state').StateEffectType<{from: number, to: number, markId?: string}>} */
const removeMark = StateEffect.define();

const markField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(currentMarks, tr) {
    let updatedMarks = currentMarks.map(tr.changes);

    const toAdd = [];
    const removeFilters = [];

    for (const effect of tr.effects) {
      if (effect.is(addMark) && effect.value) {
        const decoration = effect.value.decoration.range(effect.value.from, effect.value.to);
        toAdd.push(decoration);
      } else if (effect.is(removeMark) && effect.value) {
        removeFilters.push(effect.value);
      }
    }

    if (toAdd.length > 0 || removeFilters.length > 0) {
      const removeMarkIdSet = new Set();
      const removeRangeSet = new Set();

      for (const filter of removeFilters) {
        if (filter.markId) {
          removeMarkIdSet.add(filter.markId);
        } else {
          removeRangeSet.add(`${filter.from}_${filter.to}`);
        }
      }

      if (toAdd.length > 1) {
        toAdd.sort((a, b) => a.from - b.from);
      }

      updatedMarks = updatedMarks.update({
        add: toAdd,
        filter:
          removeFilters.length > 0
            ? (from, to, value) => {
                const attrMarkId = value.spec?.attributes?.['data-mark-id'];
                if (attrMarkId && removeMarkIdSet.has(attrMarkId)) {
                  return false;
                }
                if (removeRangeSet.has(`${from}_${to}`)) {
                  return false;
                }
                return true;
              }
            : undefined,
      });
    }

    return updatedMarks;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/** @type {import('~types/editor')} */
export default class Editor {
  /**
   * @constructor
   * @param {Partial<EditorConfiguration>} options
   */
  constructor(options) {
    /**
     * @property
     * @type {EditorConfiguration}
     */
    this.options = {
      id: 'code', // textarea 的id属性值
      name: 'code', // textarea 的name属性值
      autoSave2Textarea: false,
      editorDom: document.createElement('div'),
      wrapperDom: null,
      autoScrollByCursor: true,
      convertWhenPaste: true,
      keyMap: 'sublime', // 快捷键风格: sublime | vim
      showFullWidthMark: true,
      showSuggestList: true,
      codemirror: {
        lineNumbers: false, // 显示行号
        placeholder: '', // 占位符文本
      },
      toolbars: {},
      onKeydown() {},
      onChange() {},
      onFocus() {},
      onBlur() {},
      onPaste: this.onPaste,
      onScroll: this.onScroll,
    };
    /** @type {CM6AdapterType | null} */
    this.editor = null;

    this.animation = {
      timer: 0,
      destinationTop: 0,
    };
    this.disableScrollListener = false;

    /** @type {Array<{elm: Element, evType: string, fn: Function, useCapture: boolean}>} */
    this.domEventListeners = [];

    /** @type {import('@codemirror/view').KeyBinding[]} */
    this.defaultKeymap = [];
    /** @type {boolean} */
    this.shortcutDisabled = false;

    /** @type {Compartment} */
    this.keymapCompartment = new Compartment();
    /** @type {Compartment} */
    this.vimCompartment = new Compartment();

    /** @type {NodeJS.Timeout | number} */
    this.dealSpecialWordsTimer = 0;
    /** @type {number} */
    this.dealSpecialWordsStartTime = 0;

    /** @type {boolean} */
    this.isDestroyed = false;

    /** @type {((key: string) => boolean) | null} */
    this.arrowKeyInterceptor = null;

    const { codemirror, ...restOptions } = options;
    if (codemirror) {
      Object.assign(this.options.codemirror, codemirror);
    }
    Object.assign(this.options, restOptions);
    this.$cherry = this.options.$cherry;
  }

  refresh() {
    if (this.editor) {
      this.editor.requestMeasure();
    }
  }

  /**
   * 禁用快捷键
   * @param {boolean} disable 是否禁用快捷键
   */
  disableShortcut = (disable = true) => {
    if (!this.editor || !this.editor.view) {
      return;
    }

    const { view } = this.editor;
    this.shortcutDisabled = disable;

    if (disable) {
      view.dispatch({
        effects: this.keymapCompartment.reconfigure([]),
      });
    } else {
      view.dispatch({
        effects: this.keymapCompartment.reconfigure(keymap.of(this.defaultKeymap)),
      });
    }
  };

  /**
   * 在onChange后处理draw.io的xml数据和图片的base64数据，对这种超大的数据增加省略号，
   * 以及对全角符号进行特殊染色。
   */
  dealSpecialWords = () => {
    const config = this.options.dealSpecialWordsConfig || {};
    const debounceMs = config.debounceMs ?? 200;
    const forceProcessMs = config.forceProcessMs ?? 1000;

    if (this.dealSpecialWordsTimer) {
      clearTimeout(this.dealSpecialWordsTimer);
    }

    if (!this.dealSpecialWordsStartTime) {
      this.dealSpecialWordsStartTime = Date.now();
    }

    const timeSinceStart = Date.now() - this.dealSpecialWordsStartTime;
    const remainingForceTime = forceProcessMs - timeSinceStart;
    const delay = remainingForceTime <= 0 ? 0 : Math.min(debounceMs, remainingForceTime);

    this.dealSpecialWordsTimer = setTimeout(() => {
      this.doDealSpecialWordsInternal();
      this.dealSpecialWordsTimer = 0;
      this.dealSpecialWordsStartTime = 0;
    }, delay);
  };

  /**
   * 实际执行特殊词处理的逻辑
   * @private
   */
  doDealSpecialWordsInternal = () => {
    if (this.$cherry?.status?.editor === 'hide' || this.isDestroyed) {
      return;
    }

    const lineCount = this.editor.lineCount();
    const largeDocConfig = this.options.largeDocumentConfig || {};
    const lineThreshold = largeDocConfig.lineThreshold ?? 10000;
    const strategy = largeDocConfig.strategy ?? 'degrade';

    if (lineCount > lineThreshold) {
      if (strategy === 'skip') {
        return;
      }
      if (strategy === 'degrade') {
        return this.doPartialMarkProcessing();
      }
    }

    const allMarkItems = [];
    const existingMarksSet = this.getExistingMarksSet();

    // 收集 paste-wrapper 标记
    this.collectMarkItems(
      pasteWrapperReg,
      'cm-url paste-wrapper',
      allMarkItems,
      (fromPos, matchResult) => {
        const whole = matchResult[0] ?? '';
        const id = matchResult[1] ?? '';
        const bigString = matchResult[2] ?? '';
        // 验证：ID 和 bigString 不应包含换行符（保持原正则 [^|\n] 的严格性）
        if (id.includes('\n') || bigString.includes('\n')) {
          return null;
        }
        const begin = fromPos;
        const end = fromPos + whole.length;
        return { bigString, begin, end, id };
      },
      existingMarksSet,
    );

    // 收集 base64 标记
    this.collectMarkItems(base64Reg, 'cm-url base64', allMarkItems, undefined, existingMarksSet);

    // 收集 drawio 标记
    this.collectMarkItems(imgDrawioXmlReg, 'cm-url drawio', allMarkItems, undefined, existingMarksSet);

    // 收集 URL 标记
    if (this.$cherry.options.editor.maxUrlLength > 10) {
      const [protocolUrlPattern, wwwUrlPattern] = createUrlReg(this.$cherry.options.editor.maxUrlLength);
      this.collectMarkItems(protocolUrlPattern, 'cm-url url-truncated', allMarkItems, undefined, existingMarksSet);
      this.collectMarkItems(wwwUrlPattern, 'cm-url url-truncated', allMarkItems, undefined, existingMarksSet);
    }

    // 收集全角字符标记
    if (this.options.showFullWidthMark) {
      this.collectFullWidthMarkItems(allMarkItems, existingMarksSet);
    }

    // 一次性应用所有装饰（单个 Transaction）
    if (allMarkItems.length > 0) {
      this.applyBatchMarks(this.editor, allMarkItems);
    }
  };

  /**
   * 大文档降级处理：仅处理高优先级标记，跳过低优先级标记以保证性能
   * @private
   */
  doPartialMarkProcessing = () => {
    const allMarkItems = [];
    const existingMarksSet = this.getExistingMarksSet();

    // 大文档降级：只处理高优先级标记（paste-wrapper 和 base64）
    this.collectMarkItems(
      pasteWrapperReg,
      'cm-url paste-wrapper',
      allMarkItems,
      (fromPos, matchResult) => {
        const whole = matchResult[0] ?? '';
        const id = matchResult[1] ?? '';
        const bigString = matchResult[2] ?? '';
        if (id.includes('\n') || bigString.includes('\n')) {
          return null;
        }
        const begin = fromPos;
        const end = fromPos + whole.length;
        return { bigString, begin, end, id };
      },
      existingMarksSet,
    );

    this.collectMarkItems(base64Reg, 'cm-url base64', allMarkItems, undefined, existingMarksSet);

    if (allMarkItems.length > 0) {
      this.applyBatchMarks(this.editor, allMarkItems);
    }
  };

  /**
   * 一次性收集所有已有标记（避免 O(n²) 检查）
   * @returns {Set<string>} 已有标记的键集合，格式为 "from_to_className"
   */
  getExistingMarksSet = () => {
    const marksSet = new Set();
    const { editor } = this;
    const marks = editor.findMarks(0, editor.getValue().length);

    marks.forEach((mark) => {
      const key = `${mark.from}_${mark.to}_${mark.className}`;
      marksSet.add(key);
    });

    return marksSet;
  };

  /**
   * @typedef {Object} MarkRange
   * @property {number} begin - 起始位置
   * @property {number} end - 结束位置
   * @property {string} [bigString] - 可选的大字符串（用于标记内容）
   * @property {string} [id] - 可选的 ID
   */

  /**
   * 收集标记项（不立即应用，用于批量处理）
   * @param {RegExp} reg - 正则表达式
   * @param {string} className - CSS 类名
   * @param {Array<import('../types/editor').BatchMarkItem>} targetArray - 目标数组，用于收集标记项
   * @param {(fromPos: number, matchResult: RegExpMatchArray) => MarkRange | null} [callback] - 可选的回调函数
   * @param {Set<string>} [existingMarksSet] - 已有标记集合（用于避免 O(n²) 检查）
   */
  collectMarkItems = (reg, className, targetArray, callback, existingMarksSet) => {
    const { editor } = this;
    const searcher = editor.getSearchCursor(reg);

    for (let matchResult = searcher.findNext(); matchResult !== false; matchResult = searcher.findNext()) {
      const item = this.collectMarkItem(editor, searcher, matchResult, className, callback, existingMarksSet);
      if (item) {
        targetArray.push(item);
      }
    }
  };

  /**
   * 收集全角字符标记项（不立即应用）
   * @param {Array} targetArray - 目标数组，用于收集标记项
   * @param {Set<string>} [existingMarksSet] - 已有标记集合（用于避免 O(n²) 检查）
   */
  collectFullWidthMarkItems = (targetArray, existingMarksSet) => {
    const regex = /[·￥、："【】（）《》]/;
    const { editor } = this;
    const searcher = editor.getSearchCursor(regex);

    let oneSearch = searcher.findNext();
    for (; oneSearch !== false; oneSearch = searcher.findNext()) {
      const fromPos = searcher.from();
      if (fromPos === null) {
        continue;
      }

      const toPos = fromPos + 1;
      const key = `${fromPos}_${toPos}_cm-fullWidth`;
      if (!existingMarksSet || !existingMarksSet.has(key)) {
        targetArray.push({
          from: fromPos,
          to: toPos,
          className: 'cm-fullWidth',
          options: {
            className: 'cm-fullWidth',
            title: '按住Ctrl/Cmd点击切换成半角（Hold down Ctrl/Cmd and click to switch to half-width）',
          },
        });
      }
    }
  };

  /**
   * 收集单个匹配结果的数据（不立即创建 mark）
   * @param {CM6Adapter} editor - 编辑器实例
   * @param {SearchCursor} searcher - 搜索游标
   * @param {Array} matchResult - 正则匹配结果
   * @param {string} className - CSS 类名
   * @param {Function} [callback] - 可选的回调函数，签名：callback(fromPos: number, matchResult: Array) -> {begin: number, end: number, bigString: string}
   * @param {Set<string>} [existingMarksSet] - 已有标记集合（用于避免 O(n²) 检查）
   * @returns {import('~types/editor').BatchMarkItem | null} 返回标记数据或 null（如果已存在或无效）
   */
  collectMarkItem = (editor, searcher, matchResult, className, callback, existingMarksSet) => {
    const fromPos = searcher.from();
    if (fromPos === null) return null;

    const range = this.calculateMarkRange(matchResult, fromPos, callback);
    if (!range) return null;

    const key = `${range.begin}_${range.end}_${className}`;
    if (existingMarksSet && existingMarksSet.has(key)) return null;

    const newSpan = createElement('span', `cm-string ${className}`, { title: range.bigString });
    newSpan.textContent = range.bigString;

    return {
      from: range.begin,
      to: range.end,
      className,
      replacedWith: newSpan,
      options: { replacedWith: newSpan, atomic: true },
    };
  };

  /**
   * 批量应用所有装饰（使用单个 Transaction）
   * @param {CM6Adapter} editor - 编辑器实例
   * @param {Array<import('~types/editor').BatchMarkItem>} markItems - 标记项数组
   * @returns {void}
   */
  applyBatchMarks = (editor, markItems) => {
    const effects = [];
    const { view } = editor;

    markItems.forEach((item) => {
      editor.markIdCounter += 1;
      const markId = `mark_${editor.markIdCounter}`;

      const decoration = item.options.replacedWith
        ? Decoration.replace({
            widget: new ReplacementWidget(item.options.replacedWith),
            attributes: { 'data-mark-id': markId },
          })
        : Decoration.mark({
            class: item.className,
            attributes: { 'data-mark-id': markId },
          });

      effects.push(addMark.of({ from: item.from, to: item.to, decoration, options: item.options, markId }));
    });

    if (effects.length > 0) {
      view.dispatch({ effects });
    }
  };

  /**
   * 计算 mark 范围
   * @param {Array} matchResult - 正则匹配结果
   * @param {number} fromPos - 匹配起始位置
   * @param {Function} [callback] - 可选的回调函数
   * @returns {{begin: number, end: number, bigString: string} | null}
   */
  calculateMarkRange = (matchResult, fromPos, callback) => {
    if (callback) {
      const result = callback(fromPos, matchResult);
      if (result?.begin === undefined || result?.end === undefined) return null;
      if (result.begin >= result.end) return null;
      if (result.begin < 0 || result.end > this.editor.getValue().length) return null;

      return {
        begin: result.begin,
        end: result.end,
        bigString: result.bigString ?? '',
      };
    }

    const bigString = matchResult[2] ?? '';
    const prefixLength = matchResult[1]?.length ?? 0;
    const begin = fromPos + prefixLength;

    return { begin, end: begin + bigString.length, bigString };
  };

  /**
   * 将全角符号转换为半角符号
   * @param {EditorView | CM6AdapterType} editorView - 编辑器实例
   * @param {MouseEvent} evt - 鼠标事件对象
   */
  toHalfWidth(editorView, evt) {
    const { target } = evt;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    // 按住 Ctrl/Cmd 并点击全角字符时触发转换
    if (target.classList.contains('cm-fullWidth') && (evt.ctrlKey || evt.metaKey) && evt.buttons === 1) {
      const rect = target.getBoundingClientRect();
      // 注意：posAtCoords 期望的是视口坐标（clientX/clientY），
      // getBoundingClientRect() 返回的 left/top 已经是视口坐标，无需再减去编辑器偏移
      const fromPos = editorView.posAtCoords({ x: rect.left, y: rect.top });
      if (fromPos === null) return;
      const line = editorView.state.doc.lineAt(fromPos);
      const from = { line: line.number - 1, ch: fromPos - line.from };
      const to = { line: from.line, ch: from.ch + 1 };
      const selection = EditorSelection.range(
        editorView.state.doc.line(from.line + 1).from + from.ch,
        editorView.state.doc.line(to.line + 1).from + to.ch,
      );
      editorView.dispatch({
        selection,
        scrollIntoView: true,
      });

      const replacementText = target.innerText
        .replace('·', '`')
        .replace('￥', '$')
        .replace('、', '/')
        .replace('：', ':')
        .replace('"', '"')
        .replace('"', '"')
        .replace('【', '[')
        .replace('】', ']')
        .replace('（', '(')
        .replace('）', ')')
        .replace('《', '<')
        .replace('》', '>');

      editorView.dispatch({
        changes: {
          from: editorView.state.selection.main.from,
          to: editorView.state.selection.main.to,
          insert: replacementText,
        },
        selection: { anchor: editorView.state.selection.main.from + replacementText.length },
        scrollIntoView: true,
      });
    }
  }
  /**
   *
   * @param {KeyboardEvent} e
   * @param {EditorView} editorView
   */
  /**
   * 处理键盘弹起事件（keyup），用于高亮预览区对应的行
   * @param {KeyboardEvent} e - 键盘事件对象
   * @param {EditorView} editorView - 编辑器实例
   */
  onKeyup = (e, editorView) => {
    const pos = editorView.state.selection.main.head;
    const line = editorView.state.doc.lineAt(pos).number;
    this.previewer.highlightLine(line);
  };

  /**
   *
   * @param {ClipboardEvent} e
   * @param {CM6AdapterType} editorView
   */
  onPaste(e, editorView) {
    let { clipboardData } = e;
    if (!clipboardData) {
      ({ clipboardData } = window);
    }
    const needHandlePaste = this.handleThirdPaste(e, clipboardData, editorView);
    if (needHandlePaste) {
      this.handlePaste(e, clipboardData, editorView);
    }
  }

  /**
   * 异步粘贴回调处理
   * @param {Object} params - 回调参数
   * @param {string} params.html - HTML 内容
   * @param {string} params.htmlText - 纯文本 HTML
   * @param {string} params.mdText - Markdown 文本
   * @param {string} params.randomId - 随机 ID
   * @param {CM6AdapterType} editorView - 编辑器视图
   */
  onPasteCallback({ html, htmlText, mdText, randomId }, editorView) {
    // 在 CM6 中，我们使用 markField 来存储装饰
    // 查找包含 randomId 的装饰
    const { state } = editorView;
    const marks = state.field(markField, false);
    if (!marks) return;

    // Bug Fix: 先收集匹配项，避免在遍历中修改状态
    // 这样确保所有匹配项都能被正确处理
    /** @type {Array<{from: number, to: number, markId: string}>} */
    const matchedMarks = [];

    marks.between(0, state.doc.length, (from, to, decoration) => {
      const markId = decoration.spec?.attributes?.['data-mark-id'];
      if (markId && markId.startsWith('paste-') && markId.includes(randomId)) {
        matchedMarks.push({ from, to, markId });
      }
    });

    // 统一处理收集到的匹配项
    for (const { from, to, markId } of matchedMarks) {
      if (mdText) {
        // Bug Fix: 合并为单个 transaction，保证操作原子性
        // 这样撤销时可以一次性撤销整个粘贴操作
        editorView.dispatch({
          changes: { from, to, insert: mdText },
          effects: removeMark.of({ from, to, markId }),
          selection: { anchor: from + mdText.length },
        });
      } else {
        // 先移除占位符装饰，同时记录当前位置
        editorView.dispatch({
          effects: removeMark.of({ from, to, markId }),
          selection: { anchor: from },
        });
        // Bug Fix: 使用当前选区位置，而不是传入可能已失效的 from/to
        // formatHtml2MdWhenPaste 内部会使用 editorView.state.selection.main
        this.formatHtml2MdWhenPaste(null, html, htmlText, editorView);
      }
    }
  }

  /**
   * 调用第三方的粘贴回调
   * @param {ClipboardEvent} event - 粘贴事件
   * @param {ClipboardEvent['clipboardData']} clipboardData - 剪贴板数据
   * @param {CM6AdapterType} editorView - 编辑器视图
   * @returns {boolean} true: 需要继续处理粘贴内容，false: 不需要继续处理粘贴内容
   */
  handleThirdPaste(event, clipboardData, editorView) {
    // 生成一个随机id，用于有可能的异步回调
    const randomId = `${Math.random().toString(36).slice(2)}${new Date().getTime()}`;
    const markId = `paste-${randomId}`;

    // 创建符合 onPaste 期望的回调函数（接收 string 参数）
    // 但我们改为接收对象，所以使用 any 进行转换
    /** @type {any} */
    const asyncCallback = ({ html, htmlText, mdText }) => {
      this.onPasteCallback({ html, htmlText, mdText, randomId }, editorView);
    };

    const onPasteRet = this.$cherry.options.callback.onPaste(clipboardData, this.$cherry, asyncCallback);

    if (onPasteRet !== false && typeof onPasteRet === 'string') {
      event.preventDefault();
      // 是否命中语法糖
      if (/^<<[\s\S]+>>$/.test(onPasteRet)) {
        const newText = `{{${randomId}|${onPasteRet.replace(/^<<([\s\S]+)>>$/, (whole, $1) => `<<${$1.replace(/[<>]/g, '')}>>`)}}}`;
        const selection = editorView.state.selection.main;
        // 创建粘贴占位符 Mark 装饰（范围装饰）
        // 注意：Decoration.widget 是点装饰，只应该有一个位置
        // 这里需要高亮整个粘贴范围，所以使用 Decoration.mark
        const placeholderMark = Decoration.mark({
          class: 'paste-wrapper',
          attributes: {
            'data-mark-id': markId,
            'data-paste-id': `paste-${randomId}`,
          },
        });
        editorView.dispatch({
          changes: { from: selection.from, to: selection.to, insert: newText },
          effects: addMark.of({
            from: selection.from,
            to: selection.from + newText.length,
            decoration: placeholderMark,
          }),
          selection: { anchor: selection.from + newText.length },
        });
      } else {
        // 直接插入内容
        const selection = editorView.state.selection.main;
        editorView.dispatch({
          changes: { from: selection.from, to: selection.to, insert: onPasteRet },
          selection: { anchor: selection.from + onPasteRet.length },
        });
      }
      return false;
    }
    return true;
  }

  /**
   *
   * @param {ClipboardEvent} event
   * @param {ClipboardEvent['clipboardData']} clipboardData
   * @param {CM6AdapterType} editorView
   * @returns {boolean | void}
   */
  handlePaste(event, clipboardData, editorView) {
    const onPasteRet = this.$cherry.options.callback.onPaste(clipboardData, this.$cherry);
    if (onPasteRet !== false && typeof onPasteRet === 'string') {
      event.preventDefault();
      // 替换选中内容
      editorView.dispatch({
        changes: {
          from: editorView.state.selection.main.from,
          to: editorView.state.selection.main.to,
          insert: onPasteRet,
        },
      });
      return;
    }
    let html = clipboardData.getData('Text/Html');
    const { items } = clipboardData;

    // 优先处理来自 Word 等应用的粘贴内容
    // 有效的内容通常由 StartFragment 和 EndFragment 标记包裹。
    html = html.replace(/^[\s\S]*<!--StartFragment-->|<!--EndFragment-->[\s\S]*$/g, '');

    // 删除其他无关的注释
    html = html.replace(/<!--[^>]+>/g, '');
    /**
     * 处理"右键复制图片"场景
     * 在这种场景下，我们希望粘贴进来的图片可以走文件上传逻辑，所以当检测到这种场景后，我们会清空html
     */
    if (
      /<body>\s*<img [^>]+>\s*<\/body>/.test(html) &&
      items[1]?.kind === 'file' &&
      items[1]?.type.match(/^image\//i)
    ) {
      html = '';
    }

    this.fileUploadCount = 0;
    // 只要有html内容，就不处理剪切板里的其他内容，这么做的后果是粘贴excel内容时，只会粘贴html内容，不会把excel对应的截图粘进来
    for (let i = 0; !html && i < items.length; i++) {
      const item = items[i];
      // 判断是否为图片数据
      if (item && item.kind === 'file' && item.type.match(/^image\//i)) {
        // 读取该图片
        const file = item.getAsFile();
        this.$cherry.options.callback.fileUpload(file, (url, params = {}) => {
          this.fileUploadCount += 1;
          if (typeof url !== 'string') {
            return;
          }
          const mdStr = `${this.fileUploadCount > 1 ? '\n' : ''}${handleFileUploadCallback(url, params, file)}`;
          // 插入内容
          editorView.dispatch({
            changes: {
              from: editorView.state.selection.main.from,
              to: editorView.state.selection.main.to,
              insert: mdStr,
            },
          });
        });
        event.preventDefault();
      }
    }

    // 复制html转换markdown
    const htmlText = clipboardData.getData('text/plain');
    if (!html || !this.options.convertWhenPaste) {
      return true;
    }
    this.formatHtml2MdWhenPaste(event, html, htmlText, editorView);
  }

  /**
   * 将粘贴的 HTML 转换为 Markdown 并插入编辑器
   * @param {ClipboardEvent | null} event - 粘贴事件（可能为 null，来自异步回调时）
   * @param {string} html - HTML 内容
   * @param {string} htmlText - 纯文本内容
   * @param {CM6AdapterType} editorView - CodeMirror 6 适配器
   * @param {number} [overrideFrom] - 可选，覆盖插入起始位置（用于异步回调场景）
   * @param {number} [overrideTo] - 可选，覆盖插入结束位置（用于异步回调场景）
   */
  formatHtml2MdWhenPaste(event, html, htmlText, editorView, overrideFrom, overrideTo) {
    let divObj = document.createElement('DIV');
    divObj.innerHTML = html;
    const mdText = htmlParser.run(divObj.innerHTML);
    if (typeof mdText === 'string' && mdText.trim().length > 0) {
      const selection = editorView.state.selection.main;
      // 使用传入的位置或当前选区位置
      const from = overrideFrom ?? selection.from;
      const to = overrideTo ?? selection.to;
      const currentCursor = from;

      // 替换选中内容
      editorView.dispatch({
        changes: {
          from,
          to,
          insert: mdText,
        },
      });

      pasteHelper.showSwitchBtnAfterPasteHtml(this.$cherry, currentCursor, editorView, htmlText, mdText);
      // 仅在 event 存在时调用 preventDefault，避免空指针异常
      if (event) {
        event.preventDefault();
      }
    }
    divObj = null;
  }

  /**
   *
   * @param {EditorView} editorView
   */
  onScroll = (editorView) => {
    this.$cherry.$event.emit('cleanAllSubMenus');
    if (this.disableScrollListener) {
      this.disableScrollListener = false;
      return;
    }
    const scroller = editorView.scrollDOM;
    if (scroller.scrollTop <= 0) {
      this.previewer.scrollToLineNum(0);
      return;
    }
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 20) {
      this.previewer.scrollToLineNum(null);
      return;
    }
    const currentTop = scroller.scrollTop;
    const targetLineBlock = editorView.lineBlockAtHeight(currentTop);
    const targetLine = editorView.state.doc.lineAt(targetLineBlock.from).number - 1;
    const lineHeight = targetLineBlock.height;
    const lineTop = targetLineBlock.top;
    const percent = (100 * (currentTop - lineTop)) / lineHeight / 100;
    this.previewer.scrollToLineNum(targetLine + 1, percent);
  };

  /**
   *
   * @param {EditorView} editorView - 当前的CodeMirror实例
   * @param {MouseEvent} evt
   */
  onMouseDown = (editorView, evt) => {
    this.$cherry.$event.emit('cleanAllSubMenus');

    if (!Number.isFinite(evt.clientX) || !Number.isFinite(evt.clientY)) {
      return;
    }

    const clickPos = editorView.posAtCoords({ x: evt.clientX, y: evt.clientY });
    if (clickPos === null) {
      return;
    }
    const line = editorView.state.doc.lineAt(clickPos);
    const targetLine = line.number - 1;
    const top = Math.abs(evt.y - editorView.scrollDOM.getBoundingClientRect().y);
    this.previewer.scrollToLineNumWithOffset(targetLine + 1, top);
    this.toHalfWidth(editorView, evt);
  };

  /**
   * 光标变化事件
   */
  onCursorActivity = () => {
    this.refreshWritingStatus();
  };

  /**
   *
   * @param {*} previewer
   */
  init(previewer) {
    const textArea = this.options.editorDom.querySelector(`#${this.options.id}`);
    if (!(textArea instanceof HTMLTextAreaElement)) {
      throw new Error('The specific element is not a textarea.');
    }

    const self = this;
    const filteredSearchKeymap = searchKeymap.filter((binding) => binding.key !== 'Mod-f');

    this.defaultKeymap = [
      { key: 'ArrowUp', run: () => self.arrowKeyInterceptor?.('ArrowUp') || false },
      { key: 'ArrowDown', run: () => self.arrowKeyInterceptor?.('ArrowDown') || false },
      { key: 'Escape', run: () => self.arrowKeyInterceptor?.('Escape') || false },
      {
        key: 'Enter',
        run: (view) => {
          if (self.arrowKeyInterceptor?.('Enter')) return true;
          const adapter = self.editor || new CM6Adapter(view, self.vimCompartment);
          return handleNewlineIndentList(adapter);
        },
      },
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
      ...filteredSearchKeymap,
      indentWithTab,
    ];

    const extensions = [
      cachedCherryHighlighting,
      markdown(),
      history(),
      search(),
      closeBrackets(),
      cachedDefaultHighlighting,

      drawSelection({
        cursorBlinkRate: 1200,
        drawRangeCursor: false,
      }),

      searchHighlightField,

      indentOnInput(),

      highlightActiveLine(),
      highlightActiveLineGutter(),
      rectangularSelection(),

      ...(this.options.codemirror.lineNumbers ? [foldGutter()] : []),
      ...(this.options.codemirror.lineNumbers ? [lineNumbers()] : []),

      this.keymapCompartment.of(keymap.of(this.defaultKeymap)),
      this.vimCompartment.of([]),

      EditorView.lineWrapping,

      ...(this.options.codemirror.placeholder ? [placeholder(this.options.codemirror.placeholder)] : []),

      markField,

      EditorState.changeFilter.of((tr) => {
        if (!tr.docChanged) return true;

        const adapter = this.editor;
        if (adapter) {
          let shouldCancel = false;

          const eventObj = {
            transaction: tr,
            cancel: () => {
              shouldCancel = true;
            },
          };

          adapter.emit('beforeChange', eventObj);

          if (shouldCancel) {
            return false;
          }
        }

        return true;
      }),

      EditorView.updateListener.of((update) => {
        const adapter = this.editor;
        if (!adapter) return;

        if (update.docChanged) {
          for (const tr of update.transactions) {
            if (tr.docChanged) {
              const userEvent = tr.annotation(Transaction.userEvent) || '';
              let origin = '';
              if (userEvent === 'input' || userEvent.startsWith('input.')) {
                origin = '+input';
              } else if (userEvent === 'delete' || userEvent.startsWith('delete.')) {
                origin = '+delete';
              } else if (userEvent === 'undo' || userEvent.startsWith('undo.')) {
                origin = '+undo';
              } else if (userEvent === 'redo' || userEvent.startsWith('redo.')) {
                origin = '+redo';
              } else if (userEvent === 'paste' || userEvent.startsWith('paste.')) {
                origin = '+paste';
              } else if (userEvent === 'drop' || userEvent.startsWith('drop.')) {
                origin = '+drop';
              }

              tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
                const changeEvent = {
                  text: inserted.lines > 1 ? inserted.toString().split('\n') : [inserted.toString()],
                  from: fromA,
                  to: toA,
                  origin,
                  _cm6: { transaction: tr, update },
                };
                adapter.emit('change', changeEvent);
              });
            }
          }
        }
        if (update.selectionSet) {
          const selection = update.state.selection.main;

          let isUserInteraction = false;

          const userEventAnno = update.transactions
            .map((tr) => tr.annotation(Transaction.userEvent))
            .find((anno) => anno !== null && anno !== undefined);

          if (userEventAnno) {
            const programmaticEvents = ['search.select', 'api', 'edit', 'list.edit', 'undo', 'redo'];
            const isSelectUserEvent = userEventAnno.startsWith('select');
            const isProgrammatic = programmaticEvents.some(
              (e) => userEventAnno === e || userEventAnno.startsWith(`${e}.`),
            );

            if (isSelectUserEvent && !isProgrammatic) {
              isUserInteraction = true;
            }
          }

          this.$cherry.$event.emit('beforeSelectionChange', {
            selection: { from: selection.from, to: selection.to },
            isUserInteraction,
          });
          adapter.emit('cursorActivity');
        }
      }),

      EditorView.domEventHandlers({
        keydown: (e) => {
          if (this.editor) {
            this.editor.emit('keydown', e);
            if (e.defaultPrevented) {
              return true;
            }
          }
          this.options.onKeydown(/** @type {KeyboardEvent} */ (e), this.editor);
          return false;
        },
        keyup: (e) => {
          if (this.editor) this.editor.emit('keyup', e);
          return false;
        },
        mousedown: (e) => {
          if (this.editor) this.editor.emit('mousedown', e);
          return false;
        },
        paste: (e) => {
          if (this.editor) this.editor.emit('paste', e);
          return false;
        },
        drop: (e) => {
          if (this.editor) this.editor.emit('drop', e);
          return false;
        },
        focus: (e) => {
          if (this.editor) this.editor.emit('focus', e);
          return false;
        },
        blur: (e) => {
          if (this.editor) this.editor.emit('blur', e);
          return false;
        },
        scroll: () => {
          if (this.editor) this.editor.emit('scroll');
          return false;
        },
      }),
    ];

    const state = EditorState.create({
      doc: this.options.value || textArea.value || '',
      extensions,
    });

    const { parentElement } = textArea;
    if (!parentElement) {
      throw new Error('Cannot create EditorView: textarea has no parent element');
    }

    const view = new EditorView({
      state,
      parent: parentElement,
    });

    textArea.style.display = 'none';

    const editor = new CM6Adapter(view, this.vimCompartment);
    this.previewer = previewer;
    this.editor = editor;

    // 绑定事件监听器
    editor.on('blur', (cm, evt) => {
      this.options.onBlur(/** @type {Event} */ (evt), editor);
      this.$cherry.$event.emit('blur', { evt, cherry: this.$cherry });
    });

    editor.on('focus', (cm, evt) => {
      this.options.onFocus(/** @type {Event} */ (evt), editor);
      this.$cherry.$event.emit('focus', { evt, cherry: this.$cherry });
    });

    editor.on('change', () => {
      this.options.onChange(null, editor);
      this.dealSpecialWords();
      if (this.options.autoSave2Textarea) {
        textArea.value = editor.getValue();
      }
    });

    editor.on('scroll', () => {
      this.$cherry.$event.emit('onScroll');
      this.onScroll(editor.view);
    });

    editor.on('paste', (cm, evt) => {
      this.onPaste(/** @type {ClipboardEvent} */ (evt), editor);
    });

    editor.on('mousedown', (cm, evt) => {
      this.onMouseDown(view, /** @type {MouseEvent} */ (evt));
    });

    editor.on('keyup', (cm, evt) => {
      this.onKeyup(/** @type {KeyboardEvent} */ (evt), view);
    });

    editor.on('cursorActivity', () => {
      this.onCursorActivity();
    });

    this.addTrackedEvent(
      this.getEditorDom(),
      'wheel',
      () => {
        this.disableScrollListener = false;
        cancelAnimationFrame(this.animation.timer);
        this.animation.timer = 0;
      },
      false,
    );

    if (this.options.writingStyle !== 'normal') {
      this.initWritingStyle();
    }

    if (this.options.keyMap === 'vim') {
      editor.setKeyMap('vim');
    }

    if (this.options.codemirror.autofocus) {
      editor.focus();
    }
  }

  /**
   *
   * @param {number | null} beginLine 起始行，传入null时跳转到文档尾部
   * @param {number} [endLine] 终止行
   * @param {number} [percent] 百分比，取值0~1
   */
  jumpToLine(beginLine, endLine = 0, percent = 0) {
    if (!this.editor || !this.editor.view) return;

    const { view } = this.editor;

    if (beginLine === null) {
      this.disableScrollListener = true;
      const { doc } = view.state;
      view.dispatch({
        effects: EditorView.scrollIntoView(doc.length, { y: 'end' }),
      });
      return;
    }

    const { doc } = view.state;
    const targetLineNumber = Math.min(beginLine + 1, doc.lines);
    const targetLine = doc.line(targetLineNumber);

    this.disableScrollListener = true;
    view.dispatch({
      effects: EditorView.scrollIntoView(targetLine.from, {
        y: 'center',
      }),
    });
  }

  /**
   *
   * @param {number | null} lineNum
   * @param {number} [endLine]
   * @param {number} [percent]
   */
  scrollToLineNum(lineNum, endLine, percent) {
    if (lineNum === null) {
      this.jumpToLine(null);
      return;
    }
    const $lineNum = Math.max(0, lineNum);
    this.jumpToLine($lineNum, endLine, percent);
    Logger.log('滚动预览区域，左侧应scroll to ', $lineNum);
  }

  /**
   *
   * @returns {HTMLElement}
   */
  getEditorDom() {
    return this.options.editorDom;
  }

  /**
   * 添加事件监听器
   * @param {string} event 事件名
   * @param {EditorEventCallback} callback 回调函数
   */
  addListener(event, callback) {
    if (this.editor) {
      this.editor.on(event, callback);
    }
  }

  /**
   * 初始化书写风格
   */
  initWritingStyle() {
    const { writingStyle } = this.options;
    const className = `cherry-editor-writing-style--${writingStyle}`;
    const editorDom = this.getEditorDom();
    // 重置状态
    Array.from(editorDom.classList)
      .filter((className) => className.startsWith('cherry-editor-writing-style--'))
      .forEach((className) => editorDom.classList.remove(className));
    if (writingStyle === 'normal') {
      return;
    }
    editorDom.classList.add(className);
    this.refreshWritingStatus();
  }

  /**
   * 刷新书写状态
   */
  refreshWritingStatus() {
    const { writingStyle } = this.options;
    if (writingStyle !== 'focus' && writingStyle !== 'typewriter') {
      return;
    }
    const className = `cherry-editor-writing-style--${writingStyle}`;
    /**
     * @type {HTMLStyleElement}
     */
    const style = document.querySelector('#cherry-editor-writing-style') || document.createElement('style');
    style.id = 'cherry-editor-writing-style';
    Array.from(document.head.childNodes).find((node) => node === style) || document.head.appendChild(style);
    const { sheet } = style;
    Array.from(Array(sheet.cssRules.length)).forEach(() => sheet.deleteRule(0));

    if (writingStyle === 'focus') {
      const editorDomRect = this.getEditorDom().getBoundingClientRect();
      const { view } = this.editor;
      const cursorPos = view.state.selection.main.head;
      const cursorCoords = view.coordsAtPos(cursorPos);

      let topHeight = 0;
      let bottomHeight = 0;

      if (cursorCoords) {
        topHeight = cursorCoords.top - editorDomRect.top;
        bottomHeight = editorDomRect.bottom - cursorCoords.bottom;
      }

      sheet.insertRule(`.${className}::before { height: ${topHeight > 0 ? topHeight : 0}px; }`, 0);
      sheet.insertRule(`.${className}::after { height: ${bottomHeight > 0 ? bottomHeight : 0}px; }`, 0);
    }

    if (writingStyle === 'typewriter') {
      const height = this.editor.scrollDOM.clientHeight / 2;
      sheet.insertRule(`.${className} .cm-editor .cm-scroller::before { height: ${height}px; }`, 0);
      sheet.insertRule(`.${className} .cm-editor .cm-scroller::after { height: ${height}px; }`, 0);
      this.editor.scrollDOM.scrollTop = height;
    }
  }

  /**
   * 修改书写风格
   */
  setWritingStyle(writingStyle) {
    this.options.writingStyle = writingStyle;
    this.initWritingStyle();
  }

  /**
   * 设置编辑器值
   */
  setValue(value = '') {
    if (this.editor) {
      this.editor.dispatch({
        changes: {
          from: 0,
          to: this.editor.state.doc.length,
          insert: value,
        },
      });
    }
  }

  /**
   * 获取编辑器值
   */
  getValue() {
    return this.editor ? this.editor.state.doc.toString() : '';
  }

  /**
   * 替换选中的文本
   */
  replaceSelections(text = []) {
    if (!this.editor) return;
    const selection = this.editor.state.selection.ranges;

    if (typeof text === 'string') {
      const changes = selection.map((range) => ({
        from: range.from,
        to: range.to,
        insert: text,
      }));
      this.editor.dispatch({ changes });
      return;
    }

    const changes = selection.map((range, index) => ({
      from: range.from,
      to: range.to,
      insert: text[index] || '',
    }));

    this.editor.dispatch({ changes });
  }

  /**
   * 获取光标位置
   */
  getCursor() {
    if (!this.editor) return { line: 0, ch: 0 };
    const pos = this.editor.state.selection.main.head;
    const line = this.editor.state.doc.lineAt(pos);
    return {
      line: line.number - 1,
      ch: pos - line.from,
    };
  }

  /**
   * 设置光标位置
   */
  setCursor(line, ch) {
    if (!this.editor) return;
    const { doc } = this.editor.state;
    const targetLine = doc.line(line + 1);
    const pos = targetLine.from + ch;
    this.editor.dispatch({
      selection: { anchor: pos, head: pos },
    });
  }

  /**
   * 聚焦编辑器
   */
  focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  /**
   * 获取选中的文本
   * @returns {string[]}
   */
  getSelections() {
    if (!this.editor) return [];
    const { view } = this.editor;
    const selections = view.state.selection.ranges.map((range) => view.state.doc.sliceString(range.from, range.to));
    return selections;
  }

  /**
   * 获取当前选中的文本
   * @returns {string}
   */
  getSelection() {
    if (!this.editor) return '';
    const { view } = this.editor;
    const selection = view.state.selection.main;
    return view.state.doc.sliceString(selection.from, selection.to);
  }

  /**
   * 设置选区
   * @param {Object} from - 起始位置 {line: number, ch: number}
   * @param {Object} to - 结束位置 {line: number, ch: number}
   */
  setSelection(from, to) {
    if (!this.editor) return;
    const { view } = this.editor;
    const { doc } = view.state;
    const lineCount = doc.lines;

    const fromLineNum = Math.max(1, Math.min(from.line + 1, lineCount));
    const toLineNum = Math.max(1, Math.min(to.line + 1, lineCount));

    const fromLine = doc.line(fromLineNum);
    const toLine = doc.line(toLineNum);

    const fromPos = fromLine.from + Math.max(0, Math.min(from.ch, fromLine.length));
    const toPos = toLine.from + Math.max(0, Math.min(to.ch, toLine.length));

    view.dispatch({
      selection: EditorSelection.range(fromPos, toPos),
    });
  }

  /**
   * 字数统计
   * @param {number} type - 统计类型：1-字符/单词/行数，2-段落/图片/代码块，3-中文/英文/数字/符号
   * @returns {Object} 统计结果
   */
  wordCount(type) {
    const markdown = this.$cherry.getMarkdown() || '';
    switch (type) {
      case 1: {
        const pattern =
          /[\u4e00-\u9fa5]|[\u3001\u3002\uff01\uff0c\uff1b\uff1a\u201c\u201d\u2018\u2019\u300a\u300b\u3008\u3009\u3010\u3011\u300e\u300f\u300c\u300d\uff08\uff09\u2014\u2026\u2013\uff0e]/g;
        const characters = markdown.replace(/\n|\s/g, '').length;
        const chineseWords = (markdown.match(pattern) || []).length;
        const englishWords = (markdown.match(/[a-zA-Z-]+/g) || []).length;
        const words = chineseWords + englishWords;
        const lines = markdown.split(/\n[\s\t\n]*/).length;
        return { characters, words, lines };
      }
      case 2: {
        const codeBlockReg = getCodeBlockRule().reg;
        const paragraphs = markdown.split(/\n{2,}/).filter((line) => line.trim() !== '').length;
        const codeblocks = (markdown.match(codeBlockReg) || []).length;
        const mdWithoutCode = markdown.replace(codeBlockReg, '\n');
        const images = (mdWithoutCode.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
        return { paragraphs, images, codeblocks };
      }
      case 3: {
        const chineseWords = (markdown.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (markdown.match(/[a-zA-Z-]+/g) || []).length;
        const numbers = (markdown.match(/\d+/g) || []).length;
        const symbols = (
          markdown.match(
            /[\u3001\u3002\uff01\uff0c\uff1b\uff1a\u201c\u201d\u2018\u2019\u300a\u300b\u3008\u3009\u3010\u3011\u300e\u300f\u300c\u300d\uff08\uff09\u2014\u2026\u2013\uff0e]/g,
          ) || []
        ).length;
        return { chineseWords, englishWords, numbers, symbols };
      }
      default:
        return {};
    }
  }

  /**
   * 销毁编辑器实例，清理资源
   */
  destroy() {
    this.isDestroyed = true;

    if (this.dealSpecialWordsTimer) {
      clearTimeout(this.dealSpecialWordsTimer);
      this.dealSpecialWordsTimer = 0;
    }
    this.dealSpecialWordsStartTime = 0;

    if (this.animation && this.animation.timer) {
      cancelAnimationFrame(this.animation.timer);
      this.animation.timer = 0;
    }

    if (this.domEventListeners && this.domEventListeners.length > 0) {
      this.domEventListeners.forEach(({ elm, evType, fn, useCapture }) => {
        removeEvent(elm, evType, fn, useCapture);
      });
      this.domEventListeners = [];
    }

    if (this.previewer && typeof this.previewer.destroy === 'function') {
      this.previewer.destroy();
      this.previewer = null;
    }

    if (this.editor && this.editor.view) {
      if (this.editor.eventHandlers) {
        this.editor.eventHandlers.clear();
      }
      this.editor.view.destroy();
      this.editor = null;
    }

    this.$cherry = null;
  }

  /**
   * 添加并跟踪 DOM 事件监听器
   * @param {Element} elm - DOM 元素
   * @param {string} evType - 事件类型
   * @param {Function} fn - 事件处理函数
   * @param {boolean} useCapture - 是否使用捕获
   */
  addTrackedEvent(elm, evType, fn, useCapture = false) {
    addEvent(elm, evType, fn, useCapture);
    this.domEventListeners.push({ elm, evType, fn, useCapture });
  }
}
