import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorView, NodeView } from '@milkdown/kit/prose/view';
import { $ctx, $node, $prose, $view } from '@milkdown/kit/utils';
import type { CherryVisualNodeAttrs, CherryWysiwygConfig } from './types.js';

const fallbackConfig: CherryWysiwygConfig = {
  engine: { makeHtml: (markdown) => markdown },
  readonly: false,
};

let mermaidRenderId = 0;

function fencedBody(source: string) {
  const lines = source.split(/\r?\n/);
  return lines.slice(1, -1).join('\n');
}

async function renderMermaid(source: string) {
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({ securityLevel: 'strict', startOnLoad: false });
  mermaidRenderId += 1;
  const result = await mermaid.render(`cherry-milkdown-mermaid-${mermaidRenderId}`, fencedBody(source));
  return result.svg;
}

export const cherryWysiwygConfigCtx = $ctx<CherryWysiwygConfig, 'cherryWysiwygConfig'>(
  fallbackConfig,
  'cherryWysiwygConfig',
);

export const cherryVisualBlockSchema = $node('cherry_visual_block', () => ({
  atom: true,
  defining: true,
  draggable: true,
  group: 'block',
  isolating: true,
  selectable: true,
  attrs: {
    syntax: { default: 'extension', validate: 'string' },
    source: { default: '', validate: 'string' },
  },
  parseDOM: [
    {
      tag: '[data-cherry-visual-block]',
      getAttrs: (dom) => ({ syntax: dom.dataset.syntax ?? 'extension', source: dom.dataset.source ?? '' }),
    },
  ],
  toDOM: (node) => [
    'div',
    {
      'data-cherry-visual-block': '',
      'data-syntax': String(node.attrs.syntax),
      'data-source': String(node.attrs.source),
    },
  ],
  parseMarkdown: {
    match: (node) => node.type === 'cherry_visual_block',
    runner: (state, node, type) => {
      state.addNode(type, { syntax: String(node.syntax ?? 'extension'), source: String(node.value ?? '') });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'cherry_visual_block',
    runner: (state, node) => state.addNode('html', undefined, String(node.attrs.source)),
  },
}));

export const cherryVisualInlineSchema = $node('cherry_visual_inline', () => ({
  atom: true,
  group: 'inline',
  inline: true,
  selectable: true,
  attrs: {
    syntax: { default: 'extension', validate: 'string' },
    source: { default: '', validate: 'string' },
  },
  parseDOM: [
    {
      tag: '[data-cherry-visual-inline]',
      getAttrs: (dom) => ({ syntax: dom.dataset.syntax ?? 'extension', source: dom.dataset.source ?? '' }),
    },
  ],
  toDOM: (node) => [
    'span',
    {
      'data-cherry-visual-inline': '',
      'data-syntax': String(node.attrs.syntax),
      'data-source': String(node.attrs.source),
    },
  ],
  parseMarkdown: {
    match: (node) => node.type === 'cherry_visual_inline',
    runner: (state, node, type) => {
      state.addNode(type, { syntax: String(node.syntax ?? 'extension'), source: String(node.value ?? '') });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'cherry_visual_inline',
    runner: (state, node) => state.addNode('text', undefined, String(node.attrs.source)),
  },
}));

function stripParagraph(html: string) {
  const match = /^\s*<p>([\s\S]*)<\/p>\s*$/.exec(html);
  return match?.[1] ?? html;
}

function renderFrontmatter(source: string) {
  const rows = source
    .replace(/^---[^\n]*\n|\n---[^\n]*$/g, '')
    .split(/\r?\n/)
    .map((line) => line.match(/^([^:#][^:]*):\s*(.*)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match));
  const table = document.createElement('dl');
  table.className = 'cherry-wysiwyg-frontmatter';
  for (const row of rows) {
    const key = document.createElement('dt');
    const value = document.createElement('dd');
    key.textContent = row[1] ?? '';
    value.textContent = row[2] ?? '';
    table.append(key, value);
  }
  if (!rows.length) table.textContent = 'Document metadata';
  return table;
}

function renderToc(view: EditorView) {
  const nav = document.createElement('nav');
  nav.className = 'cherry-wysiwyg-toc';
  const title = document.createElement('strong');
  title.textContent = '目录';
  const list = document.createElement('ol');
  view.state.doc.descendants((node) => {
    if (node.type.name !== 'heading') return;
    const item = document.createElement('li');
    item.textContent = node.textContent;
    item.dataset.level = String(node.attrs.level ?? 1);
    list.append(item);
  });
  if (!list.childElementCount) {
    const empty = document.createElement('span');
    empty.className = 'cherry-wysiwyg-empty';
    empty.textContent = '添加标题后将在这里生成目录';
    nav.append(title, empty);
  } else {
    nav.append(title, list);
  }
  return nav;
}

class CherryVisualNodeView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly config: CherryWysiwygConfig;
  private readonly body: HTMLElement;
  private readonly editButton: HTMLButtonElement;
  private renderVersion = 0;
  private renderCleanup?: () => void;

  constructor(
    node: ProseNode,
    view: EditorView,
    getPos: () => number | undefined,
    config: CherryWysiwygConfig,
    inline: boolean,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.config = config;
    this.dom = document.createElement(inline ? 'span' : 'div');
    this.dom.className = `cherry-wysiwyg-node cherry-wysiwyg-node--${inline ? 'inline' : 'block'}`;
    this.dom.dataset.cherryVisual = inline ? 'inline' : 'block';
    this.body = document.createElement(inline ? 'span' : 'div');
    this.body.className = 'cherry-wysiwyg-node__body';
    this.editButton = document.createElement('button');
    this.editButton.type = 'button';
    this.editButton.className = 'cherry-wysiwyg-node__edit';
    this.editButton.textContent = '编辑';
    this.editButton.hidden = config.readonly;
    this.editButton.addEventListener('click', this.openEditor);
    this.dom.addEventListener('dblclick', this.openEditor);
    this.dom.append(this.body, this.editButton);
    this.render();
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.render();
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
  }

  stopEvent(event: Event) {
    return event.target instanceof HTMLButtonElement || event.target instanceof HTMLTextAreaElement;
  }

  ignoreMutation() {
    return true;
  }

  destroy() {
    this.renderVersion += 1;
    this.renderCleanup?.();
    this.editButton.removeEventListener('click', this.openEditor);
    this.dom.removeEventListener('dblclick', this.openEditor);
  }

  private render() {
    this.renderVersion += 1;
    const version = this.renderVersion;
    this.renderCleanup?.();
    this.renderCleanup = undefined;
    const attrs = this.node.attrs as CherryVisualNodeAttrs;
    this.dom.dataset.syntax = attrs.syntax;
    this.dom.dataset.source = attrs.source;
    this.body.className = 'cherry-wysiwyg-node__body';
    this.body.replaceChildren();
    if (attrs.syntax === 'toc') {
      this.body.append(renderToc(this.view));
      return;
    }
    if (attrs.syntax === 'frontmatter') {
      this.body.append(renderFrontmatter(attrs.source));
      return;
    }
    const renderer =
      this.config.renderers?.[attrs.syntax] ??
      (attrs.syntax === 'mermaid' ? ({ source }: { source: string }) => renderMermaid(source) : undefined);
    if (renderer) {
      this.body.classList.add('is-loading');
      this.body.textContent = '正在渲染…';
      Promise.resolve(renderer({ container: this.body, engine: this.config.engine, ...attrs }))
        .then((result) => {
          if (version !== this.renderVersion) {
            if (typeof result === 'function') result();
            return;
          }
          this.body.classList.remove('is-loading');
          if (typeof result === 'string') this.body.innerHTML = result;
          if (typeof result === 'function') this.renderCleanup = result;
        })
        .catch((error) => {
          if (version !== this.renderVersion) return;
          this.body.classList.remove('is-loading');
          this.body.textContent = `${attrs.syntax} 渲染失败`;
          this.config.onError?.(error, 'render');
        });
      return;
    }
    if (attrs.syntax === 'plantuml' || attrs.syntax === 'echarts') {
      this.body.className = 'cherry-wysiwyg-node__body cherry-wysiwyg-node__placeholder';
      this.body.textContent = `${attrs.syntax} 图表 · 请配置 renderers.${attrs.syntax}`;
      return;
    }
    try {
      const html = this.config.engine.makeHtml(attrs.source);
      this.body.innerHTML = this.node.isInline ? stripParagraph(html) : html;
      if (!this.body.textContent?.trim() && !this.body.querySelector('*')) {
        this.body.textContent = attrs.syntax === 'comment-reference' ? '注释定义' : attrs.syntax;
      }
    } catch (error) {
      this.body.textContent = `${attrs.syntax} 渲染失败`;
      this.config.onError?.(error, 'render');
    }
  }

  private openEditor = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    if (this.config.readonly || this.dom.querySelector('textarea')) return;
    const attrs = this.node.attrs as CherryVisualNodeAttrs;
    const editor = document.createElement('span');
    editor.className = 'cherry-wysiwyg-node__source-editor';
    const textarea = document.createElement('textarea');
    textarea.value = attrs.source;
    textarea.setAttribute('aria-label', `${attrs.syntax} source`);
    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = '完成';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = '取消';
    const close = () => {
      editor.remove();
      this.body.hidden = false;
      this.editButton.hidden = false;
    };
    save.addEventListener('click', () => {
      const pos = this.getPos();
      if (typeof pos === 'number') {
        this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, { ...attrs, source: textarea.value }));
      }
      close();
    });
    cancel.addEventListener('click', close);
    textarea.addEventListener('keydown', (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') close();
      if ((keyboardEvent.metaKey || keyboardEvent.ctrlKey) && keyboardEvent.key === 'Enter') save.click();
    });
    editor.append(textarea, cancel, save);
    this.body.hidden = true;
    this.editButton.hidden = true;
    this.dom.append(editor);
    textarea.focus();
    textarea.select();
  };
}

export const cherryVisualBlockView = $view(
  cherryVisualBlockSchema,
  (ctx) => (node, view, getPos) =>
    new CherryVisualNodeView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key), false),
);

export const cherryVisualInlineView = $view(
  cherryVisualInlineSchema,
  (ctx) => (node, view, getPos) =>
    new CherryVisualNodeView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key), true),
);

export const cherryTocRefreshPlugin = $prose(
  () =>
    new Plugin({
      view: () => ({
        update: (view, previousState) => {
          if (previousState.doc.eq(view.state.doc)) return;
          view.dom
            .querySelectorAll<HTMLElement>('[data-syntax="toc"] .cherry-wysiwyg-node__body')
            .forEach((body) => body.replaceChildren(renderToc(view)));
        },
      }),
    }),
);
