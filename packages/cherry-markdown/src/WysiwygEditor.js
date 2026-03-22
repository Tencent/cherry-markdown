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
    /** @type {Map<string, string>} link URL → Cherry link attributes (e.g. {target=_blank}) */
    this._linkAttrMap = new Map();
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

    // Auto-configure Mermaid preview if MermaidCodeEngine is registered
    this._configureMermaidPreview(crepeOptions);

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

    // Strip Cherry link attributes like {target=_blank} that Milkdown doesn't understand
    // Skip !video/!audio attrs (e.g. {poster=...}) since they're handled by the media remark plugin
    this._linkAttrMap.clear();
    processed = this._replaceOutsideCodeFence(
      processed,
      /(!(video|audio))?\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})/g,
      (match, mediaPrefix, mediaType, text, url, attrs) => {
        if (mediaPrefix) {
          // !video or !audio — keep attrs intact for remark plugin
          return match;
        }
        this._linkAttrMap.set(url, attrs);
        return `[${text}](${url})`;
      },
    );

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

    // Ensure Panel (:::type) and Detail (+++ title) delimiters are separate paragraphs
    // remark needs blank lines around block-level custom syntax
    processed = this._ensureBlankLinesAroundDelimiters(processed);

    // Move footnote definitions to end of document (matching Cherry preview behavior)
    processed = this._moveFootnoteDefinitionsToEnd(processed);

    return processed;
  }

  /**
   * 后处理 markdown，还原 urlProcessor 转换的图片 URL
   * @param {string} md
   * @returns {string}
   */
  postprocessMarkdown(md) {
    let result = md;

    // Restore urlProcessor-transformed image URLs
    if (this._urlReverseMap.size > 0) {
      for (const [processed, original] of this._urlReverseMap) {
        result = result.split(processed).join(original);
      }
    }

    // Restore Cherry link attributes (e.g. {target=_blank})
    if (this._linkAttrMap.size > 0) {
      for (const [url, attrs] of this._linkAttrMap) {
        result = result.replaceAll(`](${url})`, `](${url})${attrs}`);
      }
    }

    return result;
  }

  /**
   * 确保 Panel (:::) 和 Detail (+++) 分隔符前后有空行，
   * 使 remark 能将它们解析为独立段落
   * @param {string} md
   * @returns {string}
   */
  _ensureBlankLinesAroundDelimiters(md) {
    const lines = md.split('\n');
    const result = [];
    let inCodeFence = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();

      if (/^(`{3,}|~{3,})/.test(trimmed)) {
        inCodeFence = !inCodeFence;
        result.push(line);
        continue;
      }

      if (inCodeFence) {
        result.push(line);
        continue;
      }

      // Panel opening: :::type [title]
      // Panel closing: :::
      // Detail opening: +++[-] title
      // Detail closing: +++
      const isDelimiter = /^:::\w/.test(trimmed) || /^:::\s*$/.test(trimmed)
        || /^\+\+\+/.test(trimmed);

      if (isDelimiter) {
        // Ensure blank line before (if prev line is not blank and not start)
        if (result.length > 0 && result[result.length - 1].trim() !== '') {
          result.push('');
        }
        result.push(line);
        // Ensure blank line after
        const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
        if (nextLine !== null && nextLine.trim() !== '') {
          result.push('');
        }
      } else {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * 将脚注定义 [^label]: content 移到文档末尾，
   * 与 Cherry 预览模式行为保持一致（脚注始终显示在文档底部）
   * @param {string} md
   * @returns {string}
   */
  _moveFootnoteDefinitionsToEnd(md) {
    const lines = md.split('\n');
    const bodyLines = [];
    const footnoteDefs = [];
    let inCodeFence = false;
    let inFootnoteDef = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();

      // Track code fence state
      if (/^(`{3,}|~{3,})/.test(trimmed)) {
        inCodeFence = !inCodeFence;
        inFootnoteDef = false;
        bodyLines.push(line);
        continue;
      }

      if (inCodeFence) {
        bodyLines.push(line);
        continue;
      }

      // Footnote definition start: [^label]: content
      if (/^\[\^[^\]]+\]:/.test(trimmed)) {
        inFootnoteDef = true;
        footnoteDefs.push(line);
        continue;
      }

      // Continuation line of a footnote definition (indented by 2+ spaces or tab)
      if (inFootnoteDef && /^(\s{2,}|\t)/.test(line) && line.trim() !== '') {
        footnoteDefs.push(line);
        continue;
      }

      // Blank line inside footnote definition block (could be between defs)
      if (inFootnoteDef && line.trim() === '') {
        // Peek ahead to see if next non-blank line is another footnote def
        let nextNonBlank = i + 1;
        while (nextNonBlank < lines.length && lines[nextNonBlank].trim() === '') {
          nextNonBlank++;
        }
        if (nextNonBlank < lines.length && /^\[\^[^\]]+\]:/.test(lines[nextNonBlank].trimStart())) {
          footnoteDefs.push(line);
          continue;
        }
        // Not followed by another def, end footnote block
        inFootnoteDef = false;
        bodyLines.push(line);
        continue;
      }

      inFootnoteDef = false;
      bodyLines.push(line);
    }

    if (footnoteDefs.length === 0) return md;

    // Group footnote definition lines by label (a definition may span multiple lines)
    const defGroups = []; // [{ label, lines: string[] }]
    for (const line of footnoteDefs) {
      const m = line.trimStart().match(/^\[\^([^\]]+)\]:/);
      if (m) {
        defGroups.push({ label: m[1], lines: [line] });
      } else if (defGroups.length > 0) {
        defGroups[defGroups.length - 1].lines.push(line);
      }
    }

    // Scan body for footnote references [^label] to determine encounter order
    const bodyText = bodyLines.join('\n');
    const refOrder = new Map();
    let counter = 0;
    const refRegex = /\[\^([^\]]+)\]/g;
    let refMatch;
    while ((refMatch = refRegex.exec(bodyText)) !== null) {
      // Skip if followed by : (that's a definition, not a reference)
      if (bodyText[refMatch.index + refMatch[0].length] === ':') continue;
      const label = refMatch[1];
      if (!refOrder.has(label)) {
        refOrder.set(label, ++counter);
      }
    }

    // Deduplicate definitions (keep first occurrence of each label)
    const seen = new Set();
    const uniqueDefs = defGroups.filter((g) => {
      if (seen.has(g.label)) return false;
      seen.add(g.label);
      return true;
    });

    // Sort by reference encounter order; unreferenced definitions go last
    uniqueDefs.sort((a, b) => {
      const oa = refOrder.get(a.label) ?? Infinity;
      const ob = refOrder.get(b.label) ?? Infinity;
      return oa - ob;
    });

    // Remove trailing blank lines from body, then append sorted footnotes
    while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') {
      bodyLines.pop();
    }

    const sortedDefs = uniqueDefs.map((g) => g.lines.join('\n')).join('\n\n');
    return bodyLines.join('\n') + '\n\n' + sortedDefs + '\n';
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
   * 自动检测并配置 Mermaid 图表预览
   * 如果 Cherry 已注册 MermaidCodeEngine，将其 mermaid API 注入到 Crepe 的
   * CodeMirror 代码块预览中，使 language=mermaid 的代码块能渲染为 SVG 图表。
   * 默认以预览模式展示，可通过 toggle 按钮切换到编辑模式。
   * @param {object} crepeOptions Crepe 配置对象（会被原地修改）
   */
  _configureMermaidPreview(crepeOptions) {
    const mermaidEngine = this.$cherry.options.engine?.syntax?.codeBlock?.customRenderer?.mermaid;
    if (!mermaidEngine || !mermaidEngine.mermaidAPIRefs) return;

    const mermaidAPI = mermaidEngine.mermaidAPIRefs;
    const isAsync = mermaidAPI.render.length <= 3;

    // 自定义主题配置，在每次渲染前应用（避免被 Cherry 预览区渲染重置）
    // mermaid base 主题变量派生链（mermaid.js:7413-7509）：
    //   primaryTextColor → textColor / nodeTextColor / actorTextColor / taskTextColor / ...
    //   nodeTextColor → .label { color } → 同时影响节点文字和 edgeLabel 文字
    // 因此 primaryTextColor 必须设为深色，否则 edgeLabel 等在浅色背景上不可见。
    // 不要单独设 nodeTextColor，它会覆盖 .label 全局颜色（包括 edgeLabel）。
    this._mermaidThemeConfig = {
      theme: 'base',
      themeVariables: {
        primaryColor: '#30D158',
        primaryTextColor: '#1a1a1a',
        primaryBorderColor: '#28b84c',
        lineColor: '#30D158',
        secondaryColor: '#e8fbe9',
        secondaryTextColor: '#1a1a1a',
        tertiaryColor: '#f0fff0',
        tertiaryTextColor: '#1a1a1a',
        edgeLabelBackground: '#f8f8f8',
        clusterBkg: '#e8fbe9',
        clusterBorder: '#28b84c',
        titleColor: '#1a1a1a',
      },
    };

    if (!crepeOptions.featureConfigs) crepeOptions.featureConfigs = {};
    const codeMirrorConfig = crepeOptions.featureConfigs['code-mirror'] || {};
    const existingRenderPreview = codeMirrorConfig.renderPreview;

    // Mermaid 渲染需要一个隐藏的 canvas 容器
    this._mermaidCanvas = null;

    // 渲染队列：mermaid v9 同步渲染不能并发，需要串行处理
    let renderQueue = Promise.resolve();
    let counter = 0;

    crepeOptions.featureConfigs['code-mirror'] = {
      ...codeMirrorConfig,
      // 有预览面板的代码块（mermaid/LaTeX）默认只显示预览，可切换到编辑
      previewOnlyByDefault: true,
      renderPreview: (language, content, applyPreview) => {
        if (language.toLowerCase() === 'mermaid' && content.length > 0) {
          // 通过队列串行渲染，避免 mermaid 并发渲染冲突
          renderQueue = renderQueue.then(() =>
            this._renderMermaid(mermaidAPI, isAsync, content, ++counter)
              .then((svg) => applyPreview(svg))
              .catch(() => applyPreview(null)),
          );
          return undefined; // async — Crepe 会显示 "Loading..."
        }
        if (existingRenderPreview) {
          return existingRenderPreview(language, content, applyPreview);
        }
        return null;
      },
    };
  }

  /**
   * 确保 mermaid 隐藏渲染容器存在
   * @returns {HTMLElement}
   */
  _ensureMermaidCanvas() {
    if (this._mermaidCanvas && document.body.contains(this._mermaidCanvas)) {
      return this._mermaidCanvas;
    }
    this._mermaidCanvas = document.createElement('div');
    this._mermaidCanvas.style.cssText = 'width:1024px;opacity:0;position:fixed;top:100%;';
    (this.$cherry.wrapperDom || document.body).appendChild(this._mermaidCanvas);
    return this._mermaidCanvas;
  }

  /**
   * 调用 mermaid API 渲染图表
   * @param {object} mermaidAPI mermaid 实例
   * @param {boolean} isAsync 是否为 v10+ 异步版本
   * @param {string} content mermaid 源码
   * @param {number} id 渲染计数器
   * @returns {Promise<string>} 渲染后的 SVG HTML
   */
  async _renderMermaid(mermaidAPI, isAsync, content, id) {
    // 每次渲染前重新应用主题，防止被其他 mermaid 渲染（如预览区）重置
    if (this._mermaidThemeConfig) {
      mermaidAPI.initialize(this._mermaidThemeConfig);
    }
    const canvas = this._ensureMermaidCanvas();
    const graphId = `mermaid-wysiwyg-${id}-${Date.now()}`;

    let svg;
    if (isAsync) {
      const result = await mermaidAPI.render(graphId, content, canvas);
      svg = result.svg;
    } else {
      svg = await new Promise((resolve, reject) => {
        try {
          mermaidAPI.render(graphId, content, (svgCode) => resolve(svgCode), canvas);
        } catch (e) {
          reject(e);
        }
      });
    }

    // 修正 SVG 属性并转为 <img> data URL
    // Crepe 的 PreviewPanel 使用 DOMPurify 清理 HTML，会移除 SVG 中的 foreignObject 元素
    // （mermaid 用 foreignObject 渲染文字标签），因此需要将 SVG 编码为 data URL 图片
    const fixedSvg = svg
      .replace(/\s*markerUnits="0"/g, '')
      .replace(/\s*x="NaN"/g, '')
      .replace(/<br>/g, '<br/>');

    // 解析 SVG，将 width/height="100%" 替换为 viewBox 的实际尺寸
    // 参考预览模式 cherry-code-block-mermaid-plugin.js:convertMermaidSvgToImg
    let finalSvg = fixedSvg;
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(fixedSvg, 'image/svg+xml');
      const svgEl = svgDoc.documentElement;
      if (svgEl.tagName.toLowerCase() === 'svg') {
        const shadowSvg = document.getElementById(graphId);
        let box;
        if (shadowSvg && shadowSvg.getBBox) {
          box = shadowSvg.getBBox();
        }
        if (!svgEl.hasAttribute('viewBox') && box) {
          svgEl.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
        }
        const vb = svgEl.viewBox?.baseVal;
        if (vb && vb.width > 0) {
          if (svgEl.getAttribute('width') === '100%') svgEl.setAttribute('width', `${vb.width}`);
          if (svgEl.getAttribute('height') === '100%') svgEl.setAttribute('height', `${vb.height}`);
        }
        finalSvg = svgEl.outerHTML;
      }
    } catch (_) { /* 解析失败时使用原始 fixedSvg */ }

    const dataUrl = `data:image/svg+xml,${encodeURIComponent(finalSvg)}`;
    return `<img style="max-width:100%;height:auto;" src="${dataUrl}" />`;
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
