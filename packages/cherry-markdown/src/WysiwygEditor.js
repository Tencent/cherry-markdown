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
import Logger from './Logger';

/**
 * WysiwygEditor - Milkdown Crepe 编辑器的包装类
 * 提供与 Cherry 集成所需的统一接口
 */
export default class WysiwygEditor {
  /**
   * @param {object} options
   * @param {import('./Cherry').default} options.$cherry Cherry 实例
   * @param {HTMLElement} options.editorDom WYSIWYG 编辑器挂载的 DOM 容器
   * @param {string} [options.value] 初始 markdown 内容
   */
  constructor(options) {
    this.$cherry = options.$cherry;
    this.editorDom = options.editorDom;
    this.value = options.value || '';
    /** @type {import('@milkdown/crepe').Crepe | null} */
    this.crepe = null;
    this.initialized = false;
    this.lastMarkdownText = '';
    /** @type {Map<string, string>} processed URL → original URL */
    this._urlReverseMap = new Map();
  }

  /**
   * 初始化 Milkdown Crepe 编辑器
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      return;
    }

    const wysiwygConfig = this.$cherry.options.wysiwyg;
    if (!wysiwygConfig?.Crepe) {
      Logger.error('WYSIWYG mode requires Milkdown Crepe. Use Cherry.usePlugin(MilkdownWysiwygPlugin, { Crepe }).');
      return;
    }

    const CrepeClass = wysiwygConfig.Crepe;
    const crepeOptions = wysiwygConfig.crepeOptions || {};

    this.crepe = new CrepeClass({
      root: this.editorDom,
      defaultValue: this.preprocessMarkdown(this.value),
      ...crepeOptions,
    });

    // 注册自定义 WYSIWYG 插件 (sup/sub/underline/highlight marks)
    const customPlugins = wysiwygConfig.customPlugins;
    if (customPlugins && Array.isArray(customPlugins)) {
      for (const plugin of customPlugins) {
        this.crepe.editor.use(plugin);
      }
    }

    // 注册内容变化监听
    this.crepe.on((listener) => {
      listener.markdownUpdated((ctx, markdown) => {
        const processed = this.postprocessMarkdown(markdown);
        if (processed !== this.lastMarkdownText) {
          this.lastMarkdownText = processed;
          const html = this.$cherry.engine.makeHtml(processed);
          this.$cherry.$event.emit('afterChange', { markdownText: processed, html });
        }
      });
    });

    await this.crepe.create();
    this.initialized = true;
    this.lastMarkdownText = this.value;

    // 监听选区变化，通知光标位置等 UI 组件
    this._onSelectionChange = () => {
      this.$cherry.$event.emit('wysiwygSelectionChange');
    };
    document.addEventListener('selectionchange', this._onSelectionChange);

    // 监听 WYSIWYG 区域滚动，通知 TOC 等组件更新高亮
    this._onScroll = () => {
      this.$cherry.$event.emit('wysiwygScroll');
    };
    this.editorDom.addEventListener('scroll', this._onScroll, true);
  }

  /**
   * 获取当前 markdown 内容
   * @returns {string}
   */
  getValue() {
    if (!this.crepe || !this.initialized) {
      return this.value;
    }
    return this.postprocessMarkdown(this.crepe.getMarkdown());
  }

  /**
   * 设置 markdown 内容（用于模式切换时同步内容）
   * @param {string} markdown
   */
  setValue(markdown) {
    this.value = markdown;
    this.lastMarkdownText = markdown;
    const processed = this.preprocessMarkdown(markdown);
    if (this.crepe && this.initialized) {
      const { replaceAll } = this.$cherry.options.wysiwyg;
      if (typeof replaceAll === 'function') {
        this.crepe.editor.action(replaceAll(processed));
      } else {
        Logger.warn('replaceAll not provided, recreating Crepe editor to update content.');
        this.destroy();
        this.editorDom.innerHTML = '';
        this.init();
      }
    }
  }

  /**
   * 执行 Milkdown 命令（供 Cherry 工具栏按钮在 WYSIWYG 模式下调用）
   * @param {string} buttonName Cherry 工具栏按钮名称
   * @param {string} [shortKey] 子菜单传递的快捷键/参数
   * @returns {boolean} 是否成功处理了命令
   */
  execCommand(buttonName, shortKey) {
    if (!this.crepe || !this.initialized) return false;
    const wysiwygConfig = this.$cherry.options.wysiwyg;
    const map = wysiwygConfig?.commandMap;
    if (!map) return false;

    // 需要完整 Milkdown ctx 的复杂命令（如 checklist）
    if (map.ctxCommands?.[buttonName]) {
      try {
        return this.crepe.editor.action((ctx) => map.ctxCommands[buttonName](ctx, shortKey)) !== false;
      } catch (e) {
        Logger.warn(`WYSIWYG ctx command failed: ${buttonName}`, e);
        return false;
      }
    }

    // 处理 ProseMirror history 命令（不走 commandsCtx）
    if (map.prosemirrorCommands?.[buttonName]) {
      try {
        const view = this.crepe.editor.action((ctx) => ctx.get(map.editorViewCtx));
        return map.prosemirrorCommands[buttonName](view) !== false;
      } catch (e) {
        Logger.warn(`WYSIWYG prosemirror command failed: ${buttonName}`, e);
        return false;
      }
    }

    // 处理标准 Milkdown 命令
    const entry = map.commands?.[buttonName];
    if (!entry) return false;

    try {
      return this.crepe.editor.action((ctx) => {
        const commands = ctx.get(map.commandsCtx);
        const payload = typeof entry.payload === 'function' ? entry.payload(shortKey) : entry.payload;
        return commands.call(entry.cmd.key, payload);
      });
    } catch (e) {
      Logger.warn(`WYSIWYG command failed: ${buttonName}`, e);
      return false;
    }
  }

  /**
   * 在 WYSIWYG 编辑器中插入表格
   * @param {number} row 行数
   * @param {number} col 列数
   * @returns {boolean}
   */
  insertTable(row, col) {
    if (!this.crepe || !this.initialized) return false;
    const map = this.$cherry.options.wysiwyg?.commandMap;
    if (!map?.commands?.table) return false;
    try {
      return this.crepe.editor.action((ctx) => {
        const commands = ctx.get(map.commandsCtx);
        return commands.call(map.commands.table.cmd.key, { row, col });
      });
    } catch (e) {
      Logger.warn('WYSIWYG insertTable failed', e);
      return false;
    }
  }

  /**
   * 在 WYSIWYG 编辑器中插入数学公式
   * @param {string} latex LaTeX 公式内容
   * @param {boolean} isBlock 是否为块级公式
   * @returns {boolean}
   */
  insertFormula(latex, isBlock) {
    if (!this.crepe || !this.initialized) return false;
    const map = this.$cherry.options.wysiwyg?.commandMap;
    if (!map) return false;
    try {
      return this.crepe.editor.action((ctx) => {
        const view = ctx.get(map.editorViewCtx);
        const { state, dispatch } = view;

        if (isBlock) {
          // 块级公式：插入 code_block，language 设为 LaTeX
          const codeBlockType = state.schema.nodes.code_block;
          if (!codeBlockType) return false;
          const node = codeBlockType.create(
            { language: 'LaTeX' },
            latex ? state.schema.text(latex) : null,
          );
          dispatch(state.tr.replaceSelectionWith(node));
          return true;
        }

        // 行内公式：插入 math_inline 节点
        const mathInlineType = state.schema.nodes.math_inline;
        if (!mathInlineType) return false;
        const node = mathInlineType.create({ value: latex });
        dispatch(state.tr.replaceSelectionWith(node));
        return true;
      }) !== false;
    } catch (e) {
      Logger.warn('WYSIWYG insertFormula failed', e);
      return false;
    }
  }

  /**
   * 在 WYSIWYG 编辑器中插入图片
   * @param {{ src: string, alt?: string, title?: string }} options
   * @returns {boolean}
   */
  insertImage({ src, alt, title }) {
    if (!this.crepe || !this.initialized) return false;
    const map = this.$cherry.options.wysiwyg?.commandMap;
    if (!map?.commands?.image) return false;
    try {
      return this.crepe.editor.action((ctx) => {
        const commands = ctx.get(map.commandsCtx);
        return commands.call(map.commands.image.cmd.key, { src, alt: alt || '', title: title || '' });
      });
    } catch (e) {
      Logger.warn('WYSIWYG insertImage failed', e);
      return false;
    }
  }

  /**
   * 在 WYSIWYG 编辑器光标位置插入纯文本
   * @param {string} text 要插入的文本
   * @returns {boolean}
   */
  insertText(text) {
    if (!this.crepe || !this.initialized) return false;
    const map = this.$cherry.options.wysiwyg?.commandMap;
    if (!map) return false;
    try {
      return this.crepe.editor.action((ctx) => {
        const view = ctx.get(map.editorViewCtx);
        const { state, dispatch } = view;
        dispatch(state.tr.insertText(text));
        return true;
      }) !== false;
    } catch (e) {
      Logger.warn('WYSIWYG insertText failed', e);
      return false;
    }
  }

  /**
   * 在 WYSIWYG 编辑器中插入带链接的文本
   * @param {string} text 链接文本
   * @param {string} href 链接地址
   * @returns {boolean}
   */
  insertLink(text, href) {
    if (!this.crepe || !this.initialized) return false;
    const map = this.$cherry.options.wysiwyg?.commandMap;
    if (!map) return false;
    try {
      return this.crepe.editor.action((ctx) => {
        const view = ctx.get(map.editorViewCtx);
        const { state, dispatch } = view;
        const linkMark = state.schema.marks.link?.create({ href });
        if (!linkMark) return false;
        const textNode = state.schema.text(text, [linkMark]);
        dispatch(state.tr.replaceSelectionWith(textNode, false));
        return true;
      }) !== false;
    } catch (e) {
      Logger.warn('WYSIWYG insertLink failed', e);
      return false;
    }
  }

  /**
   * 在 WYSIWYG 编辑器中插入代码块
   * @param {string} language 代码语言
   * @param {string} content 代码内容
   * @returns {boolean}
   */
  insertCodeBlock(language, content) {
    if (!this.crepe || !this.initialized) return false;
    const map = this.$cherry.options.wysiwyg?.commandMap;
    if (!map) return false;
    try {
      return this.crepe.editor.action((ctx) => {
        const view = ctx.get(map.editorViewCtx);
        const { state, dispatch } = view;
        const codeBlockType = state.schema.nodes.code_block;
        if (!codeBlockType) return false;
        const node = codeBlockType.create(
          { language },
          content ? state.schema.text(content) : null,
        );
        dispatch(state.tr.replaceSelectionWith(node));
        return true;
      }) !== false;
    } catch (e) {
      Logger.warn('WYSIWYG insertCodeBlock failed', e);
      return false;
    }
  }

  /**
   * 获取 WYSIWYG 编辑器中的光标位置信息
   * @returns {{ line: number, ch: number, selected: number }}
   */
  getCursorInfo() {
    if (!this.crepe || !this.initialized) return { line: 0, ch: 0, selected: 0 };
    const map = this.$cherry.options.wysiwyg?.commandMap;
    if (!map) return { line: 0, ch: 0, selected: 0 };
    try {
      return this.crepe.editor.action((ctx) => {
        const view = ctx.get(map.editorViewCtx);
        const { state } = view;
        const { from, to, $from } = state.selection;
        const line = $from.index(0) + 1;
        const ch = $from.parentOffset;
        const selected = to - from;
        return { line, ch, selected };
      });
    } catch (e) {
      return { line: 0, ch: 0, selected: 0 };
    }
  }

  /**
   * 预处理 markdown，将 Cherry 特有语法转为 remark 兼容格式
   * - 块级公式：将 `text$$` 拆分为 `text\n\n$$`（remark-math 要求 $$ 独占一行）
   * - 图片 URL：通过 urlProcessor 转换为可访问的路径
   * @param {string} md
   * @returns {string}
   */
  preprocessMarkdown(md) {
    const urlProcessor = this.$cherry.options.callback?.urlProcessor;

    // Process image URLs with urlProcessor
    let processed = md;
    if (typeof urlProcessor === 'function') {
      this._urlReverseMap.clear();
      // Match ![alt](url) or ![alt](url "title") outside code fences
      processed = this._replaceOutsideCodeFence(processed, /!\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g, (match, alt, url, rest) => {
        const newUrl = urlProcessor(url, 'image');
        if (newUrl && newUrl !== url) {
          this._urlReverseMap.set(newUrl, url);
          return `![${alt}](${newUrl}${rest})`;
        }
        return match;
      });
    }

    // Fix block math: split "text$$" into "text\n\n$$"
    processed = this._replaceOutsideCodeFence(processed, null, null, (line) => {
      // Opening $$: if line has text before $$ at end, split into two lines
      const openMatch = line.match(/^(.+?)\$\$\s*$/);
      if (openMatch && openMatch[1].trim() !== '') {
        return [openMatch[1], '', '$$'];
      }
      // Closing $$: if line has text after $$ at start, split
      const closeMatch = line.match(/^\$\$\s*(.+)$/);
      if (closeMatch && closeMatch[1].trim() !== '') {
        return ['$$', '', closeMatch[1]];
      }
      return null;
    });

    return processed;
  }

  /**
   * 后处理 markdown，还原 urlProcessor 转换的图片 URL
   * @param {string} md
   * @returns {string}
   */
  postprocessMarkdown(md) {
    if (this._urlReverseMap.size === 0) return md;
    let result = md;
    for (const [processed, original] of this._urlReverseMap) {
      // Replace all occurrences of the processed URL back to original
      result = result.split(processed).join(original);
    }
    return result;
  }

  /**
   * 在代码块之外执行替换操作
   * @param {string} md markdown 文本
   * @param {RegExp|null} pattern 用于全文替换的正则（如图片 URL），在非代码块行上执行
   * @param {Function|null} replacer pattern 的替换函数
   * @param {Function|null} lineTransform 逐行变换函数，返回 string[] 表示拆分行，null 表示不变
   * @returns {string}
   */
  _replaceOutsideCodeFence(md, pattern, replacer, lineTransform) {
    const lines = md.split('\n');
    const result = [];
    let inCodeFence = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Track code fence state (``` or ~~~)
      if (/^(`{3,}|~{3,})/.test(line.trimStart())) {
        inCodeFence = !inCodeFence;
        result.push(line);
        continue;
      }

      if (inCodeFence) {
        result.push(line);
        continue;
      }

      // Apply regex pattern replacement
      if (pattern && replacer) {
        line = line.replace(pattern, replacer);
      }

      // Apply line transform (e.g., splitting $$ lines)
      if (lineTransform) {
        const transformed = lineTransform(line);
        if (transformed) {
          result.push(...transformed);
          continue;
        }
      }

      result.push(line);
    }

    return result.join('\n');
  }

  /**
   * 销毁 Milkdown 实例
   */
  destroy() {
    if (this._onSelectionChange) {
      document.removeEventListener('selectionchange', this._onSelectionChange);
      this._onSelectionChange = null;
    }
    if (this._onScroll) {
      this.editorDom.removeEventListener('scroll', this._onScroll, true);
      this._onScroll = null;
    }
    if (this.crepe) {
      this.crepe.destroy();
      this.crepe = null;
      this.initialized = false;
    }
  }
}
