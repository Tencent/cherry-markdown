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
  dropCursor,
} from '@codemirror/view';
import { EditorState, StateEffect, StateField, EditorSelection, Transaction, Compartment } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { search, searchKeymap, SearchQuery } from '@codemirror/search';
import {
  history,
  historyKeymap,
  defaultKeymap,
  indentWithTab,
  moveLineUp,
  moveLineDown,
  copyLineDown,
  selectLine,
} from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { syntaxHighlighting, defaultHighlightStyle, foldGutter, indentOnInput } from '@codemirror/language';
import htmlParser from '@/utils/htmlparser';
import pasteHelper from '@/utils/pasteHelper';
import Logger from '@/Logger';
import { handleFileUploadCallback, handleDropType } from '@/utils/file';
import { tagHighlighter, tags } from '@lezer/highlight';
import { createElement } from './utils/dom';
import { base64Reg, imgDrawioXmlReg, createUrlReg, getCodeBlockRule } from './utils/regexp';
import { addEvent, removeEvent } from './utils/event';
import { handleNewlineIndentList } from './utils/autoindent';
import diff from 'fast-diff';

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
 * YAML frontmatter 装饰 ViewPlugin
 * 检测文档开头的 YAML frontmatter（首行为 `---`，至下一个独占一行的 `---` 之间的内容），
 * 给这些行打上 `cm-frontmatter` 的 line class，避免被 markdown 解析器渲染成 setext H2 样式。
 */
const frontMatterDecorationPlugin = ViewPlugin.fromClass(
  class {
    /**
     * @param {EditorView} view
     */
    constructor(view) {
      /** @type {import('@codemirror/view').DecorationSet} */
      this.decorations = this.buildDecorations(view);
    }

    /**
     * @param {import('@codemirror/view').ViewUpdate} update
     */
    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    /**
     * 构造 frontmatter 行装饰
     * @param {EditorView} view
     * @returns {import('@codemirror/view').DecorationSet}
     */
    buildDecorations(view) {
      const { doc } = view.state;
      if (doc.length === 0) return Decoration.none;

      // frontmatter 必须从文档第一行的 `---` 开始
      const firstLine = doc.line(1);
      if (firstLine.text.trim() !== '---') return Decoration.none;

      // 查找闭合的 `---`
      let endLineNum = -1;
      const totalLines = doc.lines;
      for (let i = 2; i <= totalLines; i++) {
        const line = doc.line(i);
        if (line.text.trim() === '---') {
          endLineNum = i;
          break;
        }
      }
      // 没有找到闭合行，认为不是合法 frontmatter
      if (endLineNum === -1) return Decoration.none;

      const lineDeco = Decoration.line({ class: 'cm-frontmatter' });
      const decorations = [];
      for (let i = 1; i <= endLineNum; i++) {
        const line = doc.line(i);
        decorations.push(lineDeco.range(line.from));
      }
      return Decoration.set(decorations);
    }

    destroy() {
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
   * @param {Compartment} [readOnlyCompartment] - 只读状态的 Compartment（可选，用于动态切换只读）
   * @param {Compartment} [historyCompartment] - 历史记录的 Compartment（可选，用于清空 undo/redo 栈）
   */
  constructor(view, vimCompartment, readOnlyCompartment, historyCompartment) {
    /** @type {EditorView} */
    this.view = view;
    /** @type {Map<string, Array<(...args: unknown[]) => void>>} */
    this.eventHandlers = new Map();
    /** @type {'sublime' | 'vim'} */
    this.currentKeyMap = 'sublime';
    /** @type {Compartment | null} */
    this.vimCompartment = vimCompartment || null;
    /** @type {Compartment | null} */
    this.readOnlyCompartment = readOnlyCompartment || null;
    /** @type {Compartment | null} */
    this.historyCompartment = historyCompartment || null;
    /** @type {number} 实例级 markId 计数器 */
    this.markIdCounter = 0;
  }

  /**
   * 清空 undo/redo 历史栈
   * 通过 Compartment 先将 history 扩展重置为空，再重新装载 history() 实现
   * @returns {void}
   */
  clearHistory() {
    if (!this.historyCompartment) {
      console.warn('historyCompartment not available, cannot clear undo/redo history');
      return;
    }
    // 先卸载 history 扩展，清空其内部维护的 undo/redo 栈
    this.view.dispatch({
      effects: this.historyCompartment.reconfigure([]),
    });
    // 再重新装载 history()，从当前状态开始重新记录
    this.view.dispatch({
      effects: this.historyCompartment.reconfigure(history()),
    });
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
   * @CM5_COMPAT 兼容 CodeMirror 5 API，返回自身以便链式调用
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
   * 将指定位置滚动到可视区域
   * @CM5_COMPAT 兼容 CodeMirror 5 API，内部已改用 EditorView.scrollIntoView effect
   * @param {number} pos - 文档位置（偏移量）
   * @returns {void}
   */
  scrollIntoView(pos) {
    this.view.dispatch({
      effects: EditorView.scrollIntoView(pos),
    });
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
        this.view.dispatch({
          changes: { from: 0, to: this.view.state.doc.length, insert: /** @type {string} */ (value) },
        });
        break;
      case 'keyMap':
        this.setKeyMap(/** @type {'sublime' | 'vim'} */ (value));
        break;
      case 'readOnly':
      case 'disableInput':
        this.setReadOnly(/** @type {boolean} */ (value));
        break;
      default:
        break;
    }
  }

  /**
   * 动态设置编辑器的只读状态
   * 开启后：
   *   - 用户键盘输入、粘贴、拖拽等所有会修改文档的操作都会被拒绝；
   *   - 通过 API（如 setOption('value', ...)）主动派发的变更仍会被拒绝，如需强制写入请先关闭只读；
   *   - 光标依然可以移动，文本依然可以选中和复制。
   * @param {boolean} readOnly - 是否只读
   * @returns {void}
   */
  setReadOnly(readOnly) {
    if (!this.readOnlyCompartment) {
      console.warn('readOnlyCompartment not available, cannot toggle readOnly');
      return;
    }
    this.view.dispatch({
      effects: this.readOnlyCompartment.reconfigure(EditorState.readOnly.of(Boolean(readOnly))),
    });
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
        return this.view.state.doc.toString();
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

    const markAttributes = {
      ...(options.title ? { title: options.title } : {}),
      'data-mark-id': markId,
    };

    const decoration = options.replacedWith
      ? Decoration.replace({
          widget: new ReplacementWidget(options.replacedWith),
          attributes: markAttributes,
        })
      : Decoration.mark({
          class: options.className,
          atomic: true,
          attributes: markAttributes,
        });

    this.view.dispatch({
      effects: addMark.of({ from, to, decoration, options }),
    });

    const { view } = this;
    const savedMarkId = markId;

    return {
      clear: () => {
        view.dispatch({
          effects: removeMark.of(savedMarkId),
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
    const searchQuery = new SearchQuery({
      search: query instanceof RegExp ? query.source : query,
      regexp: query instanceof RegExp,
      caseSensitive: caseFold === false,
    });
    const req = query instanceof RegExp ? new RegExp(query.source, query.flags.replace('g', '')) : new RegExp('');

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
        const matchArr = query instanceof RegExp ? matched.match(req) : [matched];
        return matchArr || false;
      },
      findPrevious: () => {
        const prevMatch = findPreviousMatch(currentPos);
        if (!prevMatch) return false;

        currentPos = prevMatch.from;
        lastSearchResult = prevMatch;
        cursor = searchQuery.getCursor(doc, currentPos);

        const matched = doc.sliceString(prevMatch.from, prevMatch.to);
        const matchResult = query instanceof RegExp ? matched.match(req) : [matched];
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
/** @type {import('@codemirror/state').StateEffectType<string>} */
const removeMark = StateEffect.define();

const markField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(currentMarks, tr) {
    let updatedMarks = currentMarks.map(tr.changes);

    const toAdd = [];
    const removeMarkIds = new Set();

    for (const effect of tr.effects) {
      if (effect.is(addMark) && effect.value) {
        const { from, to, decoration } = effect.value;
        if (decoration) {
          toAdd.push(decoration.range(from, to));
        }
      } else if (effect.is(removeMark) && effect.value) {
        removeMarkIds.add(effect.value);
      }
    }

    if (toAdd.length > 0 || removeMarkIds.size > 0) {
      if (toAdd.length > 1) {
        toAdd.sort((a, b) => a.from - b.from);
      }

      updatedMarks = updatedMarks.update({
        add: toAdd,
        filter:
          removeMarkIds.size > 0
            ? (from, to, value) => {
                const attrMarkId = value.spec?.attributes?.['data-mark-id'];
                if (removeMarkIds.has(attrMarkId)) {
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
   * typewriter 模式下光标行在视口中的垂直锚点位置（占视口高度的比例）。
   * 0.5 表示正中间；实际使用 0.4（距顶部 40%），参考 iA Writer / Typora / Ulysses 等主流写作应用，
   * 视觉焦点自然落在屏幕上方 1/3~1/2 区间，比 1/2 正中央体验更佳。
   */
  static TYPEWRITER_ANCHOR_RATIO = 0.4;

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
    /** @type {Compartment} */
    this.readOnlyCompartment = new Compartment();
    /** @type {Compartment} */
    this.historyCompartment = new Compartment();

    /** @type {ReturnType<typeof setTimeout> | number} */
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
   * @param {boolean} force 是否强制处理
   */
  dealSpecialWords = (force = false) => {
    if (force) {
      this.doDealSpecialWordsInternal();
      return;
    }
    const config = this.options.dealSpecialWordsConfig || {};
    const debounceMs = config.debounceMs ?? 200;
    const forceProcessMs = config.forceProcessMs ?? 1000;

    if (this.dealSpecialWordsTimer) {
      clearTimeout(/** @type {number} */ (this.dealSpecialWordsTimer));
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

    const lineCount = this.editor.view.state.doc.lines;

    /**
     * 如果编辑器行数超过10000，则不再处理
     * 增加这个逻辑是为了避免性能问题，当超过1w行时，formatBigData2Mark耗费的性能会明显增加。后续在优化后可以去掉这个降级逻辑
     * 允许降级的理由：超过1w行的md基本已经不关心base64等数据是否缩略展示了
     */
    if (lineCount > 10000) {
      return;
    }

    const allMarkItems = [];
    const existingMarksSet = this.getExistingMarksSet();

    // 收集 base64 标记
    this.collectMarkItems(base64Reg, 'cm-url base64', allMarkItems, existingMarksSet);

    // 收集 drawio 标记
    this.collectMarkItems(imgDrawioXmlReg, 'cm-url drawio', allMarkItems, existingMarksSet);

    // 收集 URL 标记
    if (this.$cherry.options.editor.maxUrlLength > 10) {
      const [protocolUrlPattern, wwwUrlPattern] = createUrlReg(this.$cherry.options.editor.maxUrlLength);
      this.collectMarkItems(protocolUrlPattern, 'cm-url url-truncated', allMarkItems, existingMarksSet);
      this.collectMarkItems(wwwUrlPattern, 'cm-url url-truncated', allMarkItems, existingMarksSet);
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
   * 一次性收集所有已有标记（避免 O(n²) 检查）
   * @returns {Set<string>} 已有标记的键集合，格式为 "from_to_className"
   */
  getExistingMarksSet = () => {
    const marksSet = new Set();
    const marks = this.editor.view.state.field(markField, false);
    if (!marks) return marksSet;

    const iter = marks.iter();
    while (iter.value) {
      const { from, to } = iter;
      const className = iter.value.spec?.class || '';
      marksSet.add(`${from}_${to}_${className}`);
      iter.next();
    }
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
   * @param {Set<string>} [existingMarksSet] - 已有标记集合（用于避免 O(n²) 检查）
   */
  collectMarkItems = (reg, className, targetArray, existingMarksSet) => {
    const { editor } = this;
    const searcher = editor.getSearchCursor(reg);

    for (let matchResult = searcher.findNext(); matchResult !== false; matchResult = searcher.findNext()) {
      const fromPos = searcher.from();
      if (fromPos === null) continue;

      const range = this.calculateMarkRange(matchResult, fromPos);
      if (!range) continue;

      const key = `${range.begin}_${range.end}_${className}`;
      if (existingMarksSet && existingMarksSet.has(key)) continue;
      const newSpan = createElement('span', `cm-string ${className}`, { title: range.bigString });
      newSpan.textContent = range.bigString;
      targetArray.push({
        from: range.begin,
        to: range.end,
        className,
        replacedWith: newSpan,
      });
    }
  };

  /**
   * 收集全角字符标记项（不立即应用）
   * @param {Array} targetArray - 目标数组，用于收集标记项
   * @param {Set<string>} [existingMarksSet] - 已有标记集合（用于避免 O(n²) 检查）
   */
  collectFullWidthMarkItems = (targetArray, existingMarksSet) => {
    const regex = /[·￥、："【】（）《》「」]/;
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
          title: '按住Ctrl/Cmd点击切换成半角（Hold down Ctrl/Cmd and click to switch to half-width）',
        });
      }
    }
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

      const decoration = item.replacedWith
        ? Decoration.replace({
            atomic: true,
            widget: new ReplacementWidget(item.replacedWith),
            attributes: { 'data-mark-id': markId },
          })
        : Decoration.mark({
            class: item.className,
            atomic: true,
            attributes: { 'data-mark-id': markId, title: item.title ?? '' },
          });

      effects.push(addMark.of({ from: item.from, to: item.to, decoration }));
    });

    if (effects.length > 0) {
      view.dispatch({ effects });
    }
  };

  /**
   * 计算 mark 范围
   * @param {Array} matchResult - 正则匹配结果
   * @param {number} fromPos - 匹配起始位置
   * @returns {{begin: number, end: number, bigString: string} | null}
   */
  calculateMarkRange = (matchResult, fromPos) => {
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
    const isFullWidth = target.classList.contains('cm-fullWidth') || target.closest('.cm-fullWidth');
    if (isFullWidth && (evt.ctrlKey || evt.metaKey) && evt.buttons === 1) {
      const rect = target.getBoundingClientRect();
      const fromPos = editorView.posAtCoords({ x: rect.left, y: rect.top });
      if (fromPos === null) return;
      const from = fromPos;
      const to = fromPos + 1;
      // 根据from和to找到对应的装饰器的markId
      let markId = '';
      const marks = editorView.state.field(markField, false);
      if (!marks) return;
      const iter = marks.iter();
      while (iter.value) {
        if (iter.from === from && iter.to === to) {
          markId = iter.value.spec.attributes['data-mark-id'];
          break;
        }
        iter.next();
      }

      const insert = target.innerText
        .replace('·', '`')
        .replace('￥', '$')
        .replace('、', '/')
        .replace('：', ':')
        .replace('"', '"')
        .replace('"', '"')
        .replace('【', '[')
        .replace('】', ']')
        .replace('「', '{')
        .replace('」', '}')
        .replace('（', '(')
        .replace('）', ')')
        .replace('《', '<')
        .replace('》', '>');

      editorView.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from, head: to },
        effects: markId ? removeMark.of(markId) : [],
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
    const { state } = editorView;
    const marks = state.field(markField, false);
    if (!marks) return;

    const iter = marks.iter();
    while (iter.value) {
      const markId = iter.value.spec?.attributes?.['data-mark-id'];
      const { from, to } = iter;
      if (markId !== randomId) {
        iter.next();
        continue;
      }
      // 去掉装饰（from/to 不包含前后的 \u200B，需要扩展范围）
      const docLen = editorView.state.doc.length;
      const rangeFrom = Math.max(0, from - 1);
      const rangeTo = Math.min(docLen, to + 1);
      if (mdText) {
        editorView.dispatch({
          changes: { from: rangeFrom, to: rangeTo, insert: mdText },
          effects: removeMark.of(markId),
          selection: { anchor: rangeFrom + mdText.length },
        });
      } else {
        editorView.dispatch({
          effects: removeMark.of(markId),
          selection: { anchor: rangeFrom, head: rangeTo },
        });
        this.formatHtml2MdWhenPaste(null, html, htmlText, editorView);
      }
      iter.next();
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
    const randomId = `cherry-paste-${Math.random().toString(36).slice(2)}${new Date().getTime()}`;

    // 创建符合 onPaste 期望的回调函数（接收 string 参数）
    // 但我们改为接收对象，所以使用 any 进行转换
    /** @type {any} */
    const asyncCallback = ({ html, htmlText, mdText }) => {
      this.onPasteCallback({ html, htmlText, mdText, randomId }, editorView);
    };

    const onPasteRet = this.$cherry.options.callback.onPaste(clipboardData, this.$cherry, asyncCallback);

    if (onPasteRet !== false && typeof onPasteRet === 'string') {
      event.preventDefault();
      // 是否命中语法糖，详情见这个 [issue #1595](https://github.com/Tencent/cherry-markdown/issues/1595)
      if (/^<<[\s\S]+>>$/.test(onPasteRet)) {
        // 增加前后零宽空格，避免mark后导致前后无法编辑，同时不影响Markdown解析
        const newText = `\u200B${onPasteRet.replace(/^<<([\s\S]+)>>$/, '$1')}\u200B`;
        const selection = editorView.state.selection.main;
        // 创建装饰
        const decoration = Decoration.mark({
          class: 'paste-wrapper',
          atomic: true,
          attributes: {
            'data-mark-id': randomId,
          },
        });
        editorView.dispatch({
          changes: { from: selection.from, to: selection.to, insert: newText },
          effects: addMark.of({
            from: selection.from + 1,
            to: selection.from + newText.length - 1,
            decoration,
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
    const { items, types } = clipboardData;

    // 判断是否来自 vscode 粘贴
    if (types.includes('vscode-editor-data')) {
      return;
    }

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
   */
  formatHtml2MdWhenPaste(event, html, htmlText, editorView) {
    let divObj = document.createElement('DIV');
    divObj.innerHTML = html;
    const mdText = htmlParser.run(divObj.innerHTML);
    if (typeof mdText === 'string' && mdText.trim().length > 0) {
      const selection = editorView.state.selection.main;
      // 使用传入的位置或当前选区位置
      const { from, to } = selection;

      // 替换选中内容
      editorView.dispatch({
        changes: {
          from,
          to,
          insert: mdText,
        },
        selection: {
          anchor: from,
          head: from + mdText.length,
        },
      });

      pasteHelper.showSwitchBtnAfterPasteHtml(this.$cherry, from, editorView, htmlText, mdText);
      // 仅在 event 存在时调用 preventDefault，避免空指针异常
      if (event) {
        event.preventDefault();
      }
    }
    divObj = null;
  }

  /**
   * 判断文件是否为"可直接读取文本内容插入"的类型（.txt/.md 等纯文本）
   * @param {File} file 拖拽的文件
   * @returns {boolean}
   */
  isTextContentFile(file) {
    return /\.(txt|md|markdown|mdx)$/i.test(file.name) || /^text\//i.test(file.type);
  }

  /**
   * 处理拖拽文件到编辑区的逻辑（支持批量拖拽）
   * 规则：
   *  - 图片文件（image/*）：按图片语法 ![name](url) 写入
   *  - 纯文本/Markdown 文件（.txt/.md）：直接把文件内容读取并插入编辑器
   *  - 其他文件：按超链接语法 [name](url) 写入
   * 为保证多个文件按拖拽的原始顺序写入，会先并行收集所有片段，全部完成后统一插入。
   * @param {DragEvent} event 拖拽事件
   * @param {EditorView} editorView CodeMirror 6 视图实例
   * @returns {boolean} 是否拦截并处理了本次 drop 事件
   */
  handleDrop(event, editorView) {
    const { dataTransfer } = event;
    if (!dataTransfer) {
      return false;
    }
    const files = Array.from(dataTransfer.files || []);
    if (files.length === 0) {
      return false;
    }
    // 拖拽的是文件，阻止浏览器默认的"打开文件/文本拖入"行为
    event.preventDefault();

    // 拖放落点（没有有效落点时回退到当前光标位置）
    let dropPos = editorView.state.selection.main.from;
    try {
      const pos = editorView.posAtCoords({ x: event.clientX, y: event.clientY });
      if (typeof pos === 'number' && pos >= 0) {
        dropPos = pos;
      }
    } catch {
      // 忽略坐标换算失败，沿用当前光标位置
    }

    // 按原始拖拽顺序收集每个文件对应的片段
    const orderedSegments = new Array(files.length);
    // 需要走上传逻辑的文件（图片/其他），记录其原始下标以便回填
    const uploadOrigIdx = [];
    const uploadFiles = [];

    // 1. 文本/Markdown 文件：读取内容（异步），按原始下标回填
    const textPromises = [];
    files.forEach((file, index) => {
      if (this.isTextContentFile(file)) {
        textPromises.push(
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              let content = String(reader.result ?? '');
              if (!content.endsWith('\n')) {
                content += '\n';
              }
              orderedSegments[index] = content;
              resolve();
            };
            reader.onerror = () => {
              orderedSegments[index] = '';
              resolve();
            };
            reader.readAsText(file);
          }),
        );
      } else {
        uploadOrigIdx.push(index);
        uploadFiles.push(file);
      }
    });

    // 2. 需要上传的文件：批量上传，回调中按原始下标回填对应 markdown 语法
    const uploadPromise = new Promise((resolve) => {
      if (uploadFiles.length === 0) {
        resolve();
        return;
      }
      this.$cherry.options.callback.fileUploadMulti(uploadFiles, (arr) => {
        const list = (Array.isArray(arr) ? arr : []) || [];
        list.forEach((item, k) => {
          const { url } = item || {};
          const file = item?.file || uploadFiles[k];
          const origIdx = uploadOrigIdx[k];
          if (typeof url === 'string' && url && file) {
            orderedSegments[origIdx] = `${handleDropType(file, url)}\n`;
          } else {
            orderedSegments[origIdx] = '';
          }
        });
        resolve();
      });
    });

    // 3. 所有片段就绪后，按原始顺序统一插入一次，避免多次异步插入互相覆盖/错序
    Promise.all([...textPromises, uploadPromise]).then(() => {
      const insertText = orderedSegments.join('');
      if (!insertText) {
        return;
      }
      editorView.dispatch({
        changes: { from: dropPos, to: dropPos, insert: insertText },
        selection: { anchor: dropPos + insertText.length },
      });
    });

    return true;
  }

  /**
   *
   * @param {EditorView} editorView
   */
  onScroll = (editorView) => {
    this.$cherry.$event.emit('cleanAllSubMenus');
    if (this.disableScrollListener) {
      if (!this.animation.timer) {
        this.disableScrollListener = false;
      }
      return;
    }
    const scroller = editorView.scrollDOM;
    const { scrollTop } = scroller;
    if (scrollTop <= 0) {
      this.previewer.scrollToLineNum(0);
      return;
    }
    if (scrollTop + scroller.clientHeight >= scroller.scrollHeight - 20) {
      this.previewer.scrollToLineNum(null);
      return;
    }
    const isTypewriter = this.options.writingStyle === 'typewriter';
    const currentTop = scrollTop;
    const targetLineBlock = editorView.lineBlockAtHeight(currentTop);
    if (isTypewriter) {
      const targetLine = editorView.state.doc.lineAt(targetLineBlock.from).number;
      this.previewer.scrollToLineNumWithOffset(targetLine, scroller.clientHeight * Editor.TYPEWRITER_ANCHOR_RATIO);
      return;
    }
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
    if (this.options.writingStyle === 'typewriter') {
      return;
    }
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
    // 过滤掉与自定义快捷键冲突的 searchKeymap 绑定：
    // - Mod-f: 由 Cherry 工具栏搜索按钮处理
    // - Mod-Shift-l: 与自定义的 Ctrl-Shift-L(分别选中每行) 冲突，selectSelectionMatches 改用 Alt-F3
    const filteredSearchKeymap = searchKeymap.filter(
      (binding) => binding.key !== 'Mod-f' && binding.key !== 'Mod-Shift-l',
    );

    this.defaultKeymap = [
      { key: 'ArrowUp', run: () => self.arrowKeyInterceptor?.('ArrowUp') || false },
      { key: 'ArrowDown', run: () => self.arrowKeyInterceptor?.('ArrowDown') || false },
      { key: 'Escape', run: () => self.arrowKeyInterceptor?.('Escape') || false },
      {
        key: 'Enter',
        run: (view) => {
          if (self.arrowKeyInterceptor?.('Enter')) return true;
          const adapter = self.editor || new CM6Adapter(view, self.vimCompartment, self.readOnlyCompartment);
          return handleNewlineIndentList(adapter);
        },
      },
      // Sublime Text style keybindings
      // Ctrl-Shift-L / Cmd-Shift-L: 将选区拆分为多个光标，在每行末尾各放一个光标（Sublime split into lines）
      {
        key: 'Ctrl-Shift-l',
        mac: 'Cmd-Shift-l',
        run: (view) => {
          const { state } = view;
          const selections = state.selection.ranges;
          const cursorRanges = [];
          const visitedLines = new Set();
          for (const range of selections) {
            const startLine = state.doc.lineAt(range.from).number;
            const endLine = state.doc.lineAt(range.to).number;
            for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
              if (visitedLines.has(lineNum)) continue;
              visitedLines.add(lineNum);
              const line = state.doc.line(lineNum);
              cursorRanges.push({ anchor: line.to });
            }
          }
          if (cursorRanges.length === 0) return false;
          view.dispatch({
            selection: EditorSelection.create(cursorRanges.map((r) => EditorSelection.cursor(r.anchor))),
          });
          return true;
        },
      },
      // Ctrl-Shift-↑ / Cmd-Shift-↑: 将当前行与上方行互换位置
      { key: 'Ctrl-Shift-ArrowUp', mac: 'Cmd-Shift-ArrowUp', run: moveLineUp },
      // Ctrl-Shift-↓ / Cmd-Shift-↓: 将当前行与下方行互换位置
      { key: 'Ctrl-Shift-ArrowDown', mac: 'Cmd-Shift-ArrowDown', run: moveLineDown },
      // Ctrl-Shift-D / Cmd-Shift-D: 复制当前行到下方
      { key: 'Ctrl-Shift-d', mac: 'Cmd-Shift-d', run: copyLineDown },
      // Ctrl-L / Cmd-L: 选中当前行（重复按可依次选中下一行）
      { key: 'Ctrl-l', mac: 'Cmd-l', run: selectLine },
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
      ...filteredSearchKeymap,
      indentWithTab,
    ];

    const extensions = [
      cachedCherryHighlighting,
      markdown(),
      this.historyCompartment.of(history()),
      search(),
      closeBrackets(),
      cachedDefaultHighlighting,

      drawSelection({
        cursorBlinkRate: 1200,
        drawRangeCursor: false,
      }),
      // 拖拽文件时实时显示插入位置光标
      dropCursor(),

      searchHighlightField,

      frontMatterDecorationPlugin,

      indentOnInput(),

      highlightActiveLine(),
      highlightActiveLineGutter(),
      rectangularSelection(),

      ...(this.options.codemirror.lineNumbers ? [foldGutter()] : []),
      ...(this.options.codemirror.lineNumbers ? [lineNumbers()] : []),

      this.keymapCompartment.of(keymap.of(this.defaultKeymap)),
      this.vimCompartment.of([]),
      this.readOnlyCompartment.of(EditorState.readOnly.of(false)),
      EditorState.allowMultipleSelections.of(true),
      EditorView.lineWrapping,

      ...(this.options.codemirror.placeholder ? [placeholder(this.options.codemirror.placeholder)] : []),

      markField,

      EditorState.changeFilter.of((tr) => {
        if (!tr.docChanged) return true;

        // 所有定义了atomic=true 的装饰器都被认为是原子装饰器，不允许局部修改和局部删除
        const marks = tr.startState.field(markField, false);
        if (marks && marks !== Decoration.none) {
          let blocked = false;
          tr.changes.iterChanges((fromA, toA) => {
            if (blocked) return;
            // 从变更起始位置开始迭代，跳过之前的 marks 以提升性能
            const iter = marks.iter(fromA);
            while (iter.value) {
              const markFrom = iter.from;
              // 如果 mark 起始位置已经超过变更结束位置，后续 marks 不可能有交集
              if (markFrom >= toA) break;
              const markTo = iter.to;
              const isAtomic = iter.value.spec?.atomic === true;
              if (isAtomic) {
                const overlaps = fromA < markTo && toA > markFrom;
                const fullyCovers = fromA <= markFrom && toA >= markTo;
                if (overlaps && !fullyCovers) {
                  blocked = true;
                  return;
                }
              }
              iter.next();
            }
          });
          if (blocked) return false;
        }

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
        dragover: (e) => {
          // 仅当拖拽内容为文件时才阻止默认行为，从而允许在编辑区内触发 drop
          if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
            e.preventDefault();
          }
          return false;
        },
        drop: (e) => {
          if (this.editor) this.editor.emit('drop', e);
          // 如果存在拖拽文件，则拦截并由 handleDrop 统一处理（支持批量）
          return this.handleDrop(/** @type {DragEvent} */ (e), this.editor.view);
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

    const editor = new CM6Adapter(view, this.vimCompartment, this.readOnlyCompartment, this.historyCompartment);
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
        textArea.value = editor.view.state.doc.toString();
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
      editor.view.focus();
    }
    this.dealSpecialWords(true);
  }

  setReadOnly(readOnly) {
    if (this.editor) {
      this.editor.setReadOnly(readOnly);
    }
  }

  isReadOnly() {
    if (this.editor) {
      return this.editor.getOption('readOnly');
    }
    return false;
  }

  /**
   * 跳转到指定行，支持行内百分比偏移
   * @param {number | null} beginLine 起始行（0-indexed），传入null时跳转到文档尾部
   * @param {number} [endLine] 终止行（保留参数，当前未使用）
   * @param {number} [percent] 行内百分比偏移，取值0~1
   */
  jumpToLine(beginLine, endLine = 0, percent = 0) {
    if (!this.editor || !this.editor.view) return;

    const { view } = this.editor;
    const { doc } = view.state;
    const scroller = view.scrollDOM;

    // 边界处理：跳转到文档末尾
    if (beginLine === null) {
      cancelAnimationFrame(this.animation.timer);
      this.disableScrollListener = true;
      const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTop = maxScrollTop;
      this.animation.timer = 0;
      return;
    }

    const targetBeginLine = doc.line(Math.min(Math.max(1, beginLine + 1), doc.lines));
    const targetEndLine = doc.line(Math.min(Math.max(1, endLine + beginLine + 1), doc.lines));

    const beginLineBlock = view.lineBlockAt(targetBeginLine.from);
    const endLineBlock = view.lineBlockAt(targetEndLine.from);

    // 计算精确的滚动位置：行顶部位置 + 行高 * 百分比偏移
    const targetScrollTop = beginLineBlock.top + (endLineBlock.top - beginLineBlock.top) * percent - 15;
    const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    this.animation.destinationTop = Math.ceil(Math.max(0, Math.min(maxScrollTop, targetScrollTop)));
    if (this.animation.timer) {
      return;
    }

    const animationHandler = () => {
      const currentTop = view.scrollDOM.scrollTop;
      const delta = this.animation.destinationTop - currentTop;
      // 100毫秒内完成动画
      const move = Math.ceil(Math.min(Math.abs(delta), Math.max(1, Math.abs(delta) / (100 / 16.7))));
      if (delta > 0) {
        if (currentTop >= this.animation.destinationTop) {
          this.animation.timer = 0;
          return;
        }
        this.disableScrollListener = true;
        view.scrollDOM.scrollTop = currentTop + move;
      } else if (delta < 0) {
        if (currentTop <= this.animation.destinationTop || currentTop <= 0) {
          this.animation.timer = 0;
          return;
        }
        this.disableScrollListener = true;
        view.scrollDOM.scrollTop = currentTop - move;
      } else {
        this.animation.timer = 0;
        return;
      }
      // 无法再继续滚动
      if (currentTop === view.scrollDOM.scrollTop || move >= Math.abs(delta)) {
        this.animation.timer = 0;
        return;
      }
      this.animation.timer = requestAnimationFrame(animationHandler);
    };
    this.animation.timer = requestAnimationFrame(animationHandler);
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
    // 先卸载 typewriter 模式的监听器，避免残留
    this.uninstallTypewriterListener();
    if (writingStyle === 'normal') {
      return;
    }
    editorDom.classList.add(className);
    this.refreshWritingStatus();
    if (writingStyle === 'typewriter') {
      this.installTypewriterListener();
    }
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
    const dom = this.getEditorDom();
    /**
     * @type {HTMLStyleElement}
     */
    const style = dom.querySelector('#cherry-editor-writing-style') || document.createElement('style');
    style.id = 'cherry-editor-writing-style';
    dom.querySelector('#cherry-editor-writing-style') || dom.appendChild(style);
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
      // 由于 CodeMirror 6 的 .cm-scroller 默认是 flex-direction: row，
      // 直接给 ::before/::after 加 height 无法撑开垂直空间。这里改用 padding 实现
      // 上下留白，让首行能滚到锚点、末行也能滚到锚点（padding 会计入 scrollHeight）。
      // 锚点为距顶部 TYPEWRITER_ANCHOR_RATIO（默认 40%）的位置：
      //   - padding-top  = 视口 * ratio      （让首行能落在锚点）
      //   - padding-bottom = 视口 * (1-ratio)（让末行能落在锚点）
      const { clientHeight } = this.editor.scrollDOM;
      const ratio = Editor.TYPEWRITER_ANCHOR_RATIO;
      const paddingTop = clientHeight * ratio;
      const paddingBottom = clientHeight * (1 - ratio);
      sheet.insertRule(
        `.${className} .cm-editor .cm-scroller { padding-top: ${paddingTop}px; padding-bottom: ${paddingBottom}px; box-sizing: border-box; }`,
        0,
      );
      // padding 变化需要下一帧才会影响 CodeMirror 的坐标度量，这里延迟到下一帧再执行滚动
      requestAnimationFrame(() => this.scrollCursorToCenter());
    }
  }

  /**
   * 将当前光标所在行滚动到编辑区可视区域的垂直中间（typewriter 模式）
   */
  scrollCursorToCenter() {
    if (!this.editor || !this.editor.view) {
      return;
    }
    const { view } = this.editor;
    const { scrollDOM } = view;
    if (!scrollDOM) {
      return;
    }
    const cursorPos = view.state.selection.main.head;
    const cursorCoords = view.coordsAtPos(cursorPos);
    if (!cursorCoords) {
      return;
    }
    const scrollRect = scrollDOM.getBoundingClientRect();
    // 光标当前视口位置相对于 scrollDOM 顶部的距离
    const cursorTopInScroll = cursorCoords.top - scrollRect.top + scrollDOM.scrollTop;
    const lineHeight = cursorCoords.bottom - cursorCoords.top;
    // 目标：让光标行位于可视区域距顶部 TYPEWRITER_ANCHOR_RATIO 的位置
    const anchorY = scrollDOM.clientHeight * Editor.TYPEWRITER_ANCHOR_RATIO;
    const targetScrollTop = cursorTopInScroll - anchorY + lineHeight / 2;
    // 限制在 [0, maxScrollTop] 之间，避免负值
    const maxScrollTop = Math.max(0, scrollDOM.scrollHeight - scrollDOM.clientHeight);
    const finalTop = Math.max(0, Math.min(maxScrollTop, Math.round(targetScrollTop)));
    if (Math.abs(scrollDOM.scrollTop - finalTop) > 1) {
      scrollDOM.scrollTop = finalTop;
    }
  }

  /**
   * 安装 typewriter 模式的事件监听器：光标变化 / 窗口尺寸变化时重新居中
   */
  installTypewriterListener() {
    if (!this.editor || this._typewriterInstalled) {
      return;
    }
    this._typewriterInstalled = true;

    // 光标或选区变化时重新居中
    this._typewriterCursorHandler = () => {
      // 使用 rAF 让 DOM 更新后再取坐标，避免拿到旧的位置
      if (this._typewriterRaf) {
        cancelAnimationFrame(this._typewriterRaf);
      }
      this._typewriterRaf = requestAnimationFrame(() => {
        this._typewriterRaf = null;
        this.scrollCursorToCenter();
      });
    };
    this.editor.on('cursorActivity', this._typewriterCursorHandler);
    // 文档变化（如输入、粘贴）也需要重新居中
    this.editor.on('change', this._typewriterCursorHandler);

    // 窗口尺寸变化时需要重算 padding 高度并重新居中
    this._typewriterResizeHandler = () => {
      this.refreshWritingStatus();
    };
    window.addEventListener('resize', this._typewriterResizeHandler);
  }

  /**
   * 卸载 typewriter 模式的事件监听器
   */
  uninstallTypewriterListener() {
    if (!this._typewriterInstalled) {
      return;
    }
    this._typewriterInstalled = false;
    if (this._typewriterRaf) {
      cancelAnimationFrame(this._typewriterRaf);
      this._typewriterRaf = null;
    }
    if (this.editor && this._typewriterCursorHandler) {
      try {
        this.editor.off('cursorActivity', this._typewriterCursorHandler);
        this.editor.off('change', this._typewriterCursorHandler);
      } catch (e) {
        // ignore
      }
    }
    this._typewriterCursorHandler = null;
    if (this._typewriterResizeHandler) {
      window.removeEventListener('resize', this._typewriterResizeHandler);
      this._typewriterResizeHandler = null;
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
   * @param {string} value 新内容
   * @param {boolean} [keepCursor=false] 是否保持光标位置
   *
   * 协作场景说明：
   *  - keepCursor 为 true 时，会基于 fast-diff 计算新旧内容之间的最小变更集，
   *    并通过 EditorView.dispatch({ changes }) 让 CodeMirror 6 自身的 ChangeSet
   *    机制自动映射当前 selection（包括多光标/选区端点）。
   */
  setValue(value = '', keepCursor = false) {
    if (!this.editor) {
      return;
    }

    if (keepCursor === false) {
      this.editor.dispatch({
        changes: {
          from: 0,
          to: this.editor.state.doc.length,
          insert: value,
        },
      });
      return;
    }

    // const currentScrollTop = this.editor.scrollDOM.scrollTop;
    const old = this.editor.state.doc.toString();

    // 内容完全一致时无需 dispatch
    if (old === value) {
      return;
    }

    // 基于 fast-diff 生成最小化的 changes 列表
    const changes = this.computeMinimalChanges(old, value);

    if (changes.length === 0) {
      return;
    }

    // 不指定 selection，CodeMirror 会基于 changes 自动映射当前光标/选区
    this.editor.dispatch({ changes });

    this.dealSpecialWords();
    // this.editor.scrollDOM.scrollTop = currentScrollTop;
  }

  /**
   * 基于 fast-diff 计算两段文本的最小变更集合，供 EditorView.dispatch 使用
   * @private
   * @param {string} oldStr 旧内容
   * @param {string} newStr 新内容
   * @returns {{from: number, to: number, insert: string}[]}
   */
  computeMinimalChanges(oldStr, newStr) {
    const diffs = diff(oldStr, newStr);
    /** @type {{from: number, to: number, insert: string}[]} */
    const changes = [];
    // pos 是相对“旧文档”的位置游标
    let pos = 0;
    for (let i = 0; i < diffs.length; i++) {
      const [op, text] = diffs[i];
      if (op === diff.EQUAL) {
        pos += text.length;
      } else if (op === diff.DELETE) {
        changes.push({ from: pos, to: pos + text.length, insert: '' });
        pos += text.length;
      } else if (op === diff.INSERT) {
        changes.push({ from: pos, to: pos, insert: text });
        // INSERT 不消耗旧文档位置，pos 不变
      }
    }
    return changes;
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
    // 与 setSelection 保持一致，对行号和列号做边界钳制，避免越界时 CodeMirror 抛异常
    const lineNum = Math.max(1, Math.min(line + 1, doc.lines));
    const targetLine = doc.line(lineNum);
    const pos = targetLine.from + Math.max(0, Math.min(ch, targetLine.length));
    this.editor.dispatch({
      selection: { anchor: pos, head: pos },
    });
  }

  /**
   * 聚焦编辑器
   */
  focus() {
    if (this.editor) {
      this.editor.view.focus();
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
      clearTimeout(/** @type {number} */ (this.dealSpecialWordsTimer));
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

  /**
   * 清空undo/redo栈
   * 通过重置 CodeMirror 6 的 history 扩展来清除全部撤销/重做历史，
   * 清空后当前文档状态将作为新的初始状态，无法再撤销到此前的修改。
   */
  clearUndoRedo() {
    const cm6Adapter = this.editor;
    if (cm6Adapter && typeof cm6Adapter.clearHistory === 'function') {
      cm6Adapter.clearHistory();
    }
  }
}
