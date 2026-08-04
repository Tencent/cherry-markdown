import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorView, NodeView } from '@milkdown/kit/prose/view';
import type { SerializerState } from '@milkdown/kit/transformer';
import { $nodeSchema, $prose, $view } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import type { CherryWysiwygConfig } from './config.js';
import type { CherryVisualRendererResult } from './types.js';

let mermaidRenderId = 0;

async function renderMermaid(source: string) {
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({ securityLevel: 'strict', startOnLoad: false });
  mermaidRenderId += 1;
  return (await mermaid.render(`cherry-milkdown-mermaid-${mermaidRenderId}`, source)).svg;
}

function sourceAttr() {
  return { default: '', validate: 'string' as const };
}

function addCustomMarkdownNode(state: SerializerState, type: string, node: ProseNode) {
  state
    .openNode(type, undefined, { ...node.attrs })
    .next(node.content)
    .closeNode();
}

export const cherryCompoundItemSchema = $nodeSchema('cherry_compound_item', () => ({
  content: 'block+',
  defining: true,
  attrs: {
    role: sourceAttr(),
    label: sourceAttr(),
    open: { default: false, validate: 'boolean' as const },
  },
  parseDOM: [
    {
      tag: '[data-cherry-compound-item]',
      contentElement: '[data-cherry-compound-content]',
      getAttrs: (dom: HTMLElement) => ({
        role: dom.dataset.role ?? '',
        label: dom.dataset.label ?? '',
        open: dom.dataset.open === 'true',
      }),
    },
  ],
  toDOM: (node) => [
    'section',
    {
      'data-cherry-compound-item': '',
      'data-role': String(node.attrs.role),
      'data-label': String(node.attrs.label),
      'data-open': String(node.attrs.open),
    },
    ['header', String(node.attrs.label)],
    ['div', { 'data-cherry-compound-content': '' }, 0],
  ],
  parseMarkdown: {
    match: (node) => node.type === 'cherryCompoundItem',
    runner: (state, node, type) => {
      state
        .openNode(type, { role: String(node.role ?? ''), label: String(node.label ?? ''), open: Boolean(node.open) })
        .next(node.children)
        .closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'cherry_compound_item',
    runner: (state, node) => addCustomMarkdownNode(state, 'cherryCompoundItem', node),
  },
}));

function compoundSchema(name: 'cherry_panel' | 'cherry_detail', markdownType: 'cherryPanel' | 'cherryDetail') {
  return $nodeSchema(name, () => ({
    content: name === 'cherry_detail' ? 'cherry_compound_item+' : '(block | cherry_compound_item)+',
    group: 'block',
    defining: true,
    isolating: true,
    attrs: {
      kind: { default: name === 'cherry_detail' ? 'detail' : 'panel', validate: 'string' as const },
      rawType: sourceAttr(),
      title: sourceAttr(),
      source: sourceAttr(),
      originalBody: sourceAttr(),
    },
    parseDOM: [
      {
        tag: `[data-cherry-compound="${name}"]`,
        contentElement: '[data-cherry-compound-body]',
        getAttrs: (dom: HTMLElement) => ({
          kind: dom.dataset.kind ?? '',
          rawType: dom.dataset.rawType ?? '',
          title: dom.dataset.title ?? '',
          source: dom.dataset.source ?? '',
          originalBody: dom.dataset.originalBody ?? '',
        }),
      },
    ],
    toDOM: (node) => [
      'section',
      {
        'data-cherry-compound': name,
        'data-kind': String(node.attrs.kind),
        'data-raw-type': String(node.attrs.rawType),
        'data-title': String(node.attrs.title),
        'data-source': String(node.attrs.source),
        'data-original-body': String(node.attrs.originalBody),
      },
      ['div', { 'data-cherry-compound-body': '' }, 0],
    ],
    parseMarkdown: {
      match: (node) => node.type === markdownType,
      runner: (state, node, type) => {
        state
          .openNode(type, {
            kind: String(node.kind ?? (name === 'cherry_detail' ? 'detail' : 'panel')),
            rawType: String(node.rawType ?? ''),
            title: String(node.title ?? ''),
            source: String(node.source ?? ''),
            originalBody: String(node.originalBody ?? ''),
          })
          .next(node.children)
          .closeNode();
      },
    },
    toMarkdown: {
      match: (node) => node.type.name === name,
      runner: (state, node) => addCustomMarkdownNode(state, markdownType, node),
    },
  }));
}

export const cherryPanelSchema = compoundSchema('cherry_panel', 'cherryPanel');
export const cherryDetailSchema = compoundSchema('cherry_detail', 'cherryDetail');

function leafSchema(
  name: string,
  markdownType: string,
  inline = false,
  extraAttrs: Record<string, { default: string; validate: 'string' }> = {},
) {
  return $nodeSchema(name, () => ({
    atom: true,
    defining: !inline,
    draggable: !inline,
    group: inline ? 'inline' : 'block',
    inline,
    isolating: !inline,
    selectable: true,
    attrs: { source: sourceAttr(), ...extraAttrs },
    parseDOM: [
      {
        tag: `[data-cherry-node="${name}"]`,
        getAttrs: (dom: HTMLElement) => ({
          source: dom.dataset.source ?? '',
          ...Object.fromEntries(Object.keys(extraAttrs).map((key) => [key, dom.dataset[key] ?? ''])),
        }),
      },
    ],
    toDOM: (node) => [
      inline ? 'span' : 'div',
      {
        'data-cherry-node': name,
        'data-source': String(node.attrs.source),
        ...Object.fromEntries(Object.keys(extraAttrs).map((key) => [`data-${key}`, String(node.attrs[key] ?? '')])),
      },
    ],
    parseMarkdown: {
      match: (node) => node.type === markdownType,
      runner: (state, node, type) =>
        state.addNode(type, {
          source: String(node.source ?? node.value ?? ''),
          ...Object.fromEntries(Object.keys(extraAttrs).map((key) => [key, String(node[key] ?? '')])),
        }),
    },
    toMarkdown: {
      match: (node) => node.type.name === name,
      runner: (state, node) => state.addNode(markdownType, undefined, String(node.attrs.source), { ...node.attrs }),
    },
  }));
}

export const cherryTocSchema = leafSchema('cherry_toc', 'cherryToc');
export const cherryFrontmatterSchema = leafSchema('cherry_frontmatter', 'cherryFrontmatter');
export const cherryCommentDefinitionSchema = leafSchema('cherry_comment_definition', 'cherryCommentDefinition', false, {
  label: sourceAttr(),
  url: sourceAttr(),
  title: sourceAttr(),
});
export const cherryDiagramSchema = leafSchema('cherry_diagram', 'cherryDiagram', false, {
  diagramType: sourceAttr(),
  value: sourceAttr(),
});
export const cherryHtmlBlockSchema = leafSchema('cherry_html_block', 'cherryHtmlBlock');
export const cherryHtmlInlineSchema = leafSchema('cherry_html_inline', 'cherryHtmlInline', true);
export const cherryEmojiSchema = leafSchema('cherry_emoji', 'cherryEmoji', true);

class CompoundItemView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly label: HTMLInputElement;

  constructor(node: ProseNode, view: EditorView, getPos: () => number | undefined, readonly: boolean) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement('section');
    this.dom.className = 'cherry-compound-item';
    this.dom.dataset.role = String(node.attrs.role);
    const header = document.createElement('header');
    this.label = document.createElement('input');
    this.label.className = 'cherry-compound-item__label';
    this.label.value = String(node.attrs.label ?? '');
    this.label.placeholder = node.attrs.role === 'column' ? '列' : '标题';
    this.label.hidden = node.attrs.role === 'column';
    this.label.readOnly = readonly;
    this.label.addEventListener('input', this.updateLabel);
    const open = document.createElement('input');
    open.type = 'checkbox';
    open.checked = Boolean(node.attrs.open);
    open.title = '默认展开';
    open.hidden = node.attrs.role !== 'detail-item';
    open.disabled = readonly;
    open.addEventListener('change', () => this.updateAttrs({ open: open.checked }));
    const up = document.createElement('button');
    up.type = 'button';
    up.textContent = '↑';
    up.title = '向前移动';
    up.hidden = readonly;
    up.addEventListener('click', () => this.move(-1));
    const down = document.createElement('button');
    down.type = 'button';
    down.textContent = '↓';
    down.title = '向后移动';
    down.hidden = readonly;
    down.addEventListener('click', () => this.move(1));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.title = '删除项目';
    remove.hidden = readonly;
    remove.addEventListener('click', this.remove);
    header.append(open, this.label, up, down, remove);
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'cherry-compound-item__content';
    this.dom.append(header, this.contentDOM);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.label.value = String(node.attrs.label ?? '');
    this.dom.dataset.role = String(node.attrs.role);
    return true;
  }

  stopEvent(event: Event) {
    return event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement;
  }

  destroy() {
    this.label.removeEventListener('input', this.updateLabel);
  }

  private updateLabel = () => {
    this.updateAttrs({ label: this.label.value });
  };

  private updateAttrs(attrs: Record<string, unknown>) {
    const pos = this.getPos();
    if (typeof pos === 'number') {
      this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, ...attrs }));
    }
  }

  private remove = () => {
    const pos = this.getPos();
    if (typeof pos === 'number') this.view.dispatch(this.view.state.tr.delete(pos, pos + this.node.nodeSize));
  };

  private move(direction: -1 | 1) {
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    const resolved = this.view.state.doc.resolve(pos);
    const { parent } = resolved;
    const index = resolved.index();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= parent.childCount) return;
    const target = parent.child(targetIndex);
    const targetPos = direction < 0 ? pos - target.nodeSize : pos + this.node.nodeSize + target.nodeSize;
    const transaction = this.view.state.tr.delete(pos, pos + this.node.nodeSize);
    transaction.insert(direction < 0 ? targetPos : targetPos - this.node.nodeSize, this.node);
    this.view.dispatch(transaction);
  }
}

class CompoundView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly title: HTMLInputElement;
  private readonly type: HTMLSelectElement;

  constructor(node: ProseNode, view: EditorView, getPos: () => number | undefined, readonly: boolean) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement('section');
    this.dom.className = `cherry-compound cherry-compound--${node.type.name === 'cherry_detail' ? 'detail' : String(node.attrs.kind)}`;
    this.dom.dataset.cherryCompound = node.type.name;
    const header = document.createElement('header');
    header.className = 'cherry-compound__toolbar';
    this.type = document.createElement('select');
    for (const value of node.type.name === 'cherry_detail'
      ? ['detail']
      : [
          'panel',
          'primary',
          'info',
          'warning',
          'danger',
          'success',
          'left',
          'center',
          'right',
          'justify',
          'cols',
          'tabs',
          'timeline',
        ]) {
      this.type.add(new Option(value, value));
    }
    this.type.value = String(node.attrs.kind ?? 'panel');
    this.type.disabled = readonly;
    this.type.setAttribute('aria-label', 'Cherry block type');
    this.title = document.createElement('input');
    this.title.value = String(node.attrs.title ?? '');
    this.title.placeholder = node.type.name === 'cherry_detail' ? '详情' : '标题';
    this.title.hidden = node.type.name === 'cherry_detail';
    this.title.readOnly = readonly;
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = '＋';
    add.title = '增加项目';
    add.hidden = readonly || !['cols', 'tabs', 'timeline', 'detail'].includes(String(node.attrs.kind));
    add.addEventListener('click', this.addItem);
    this.type.addEventListener('change', this.updateAttrs);
    this.title.addEventListener('input', this.updateAttrs);
    header.append(this.type, this.title, add);
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'cherry-compound__content';
    this.dom.append(header, this.contentDOM);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.type.value = String(node.attrs.kind ?? 'panel');
    this.title.value = String(node.attrs.title ?? '');
    this.dom.className = `cherry-compound cherry-compound--${node.type.name === 'cherry_detail' ? 'detail' : String(node.attrs.kind)}`;
    return true;
  }

  stopEvent(event: Event) {
    return event.target === this.type || event.target === this.title || event.target instanceof HTMLButtonElement;
  }

  private updateAttrs = () => {
    const pos = this.getPos();
    if (typeof pos === 'number') {
      this.view.dispatch(
        this.view.state.tr.setNodeMarkup(pos, undefined, {
          ...this.node.attrs,
          kind: this.type.value,
          rawType: this.type.value,
          title: this.title.value,
          source: '',
        }),
      );
    }
  };

  private addItem = () => {
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    const itemType = this.view.state.schema.nodes.cherry_compound_item;
    const { paragraph } = this.view.state.schema.nodes;
    if (!itemType || !paragraph) return;
    let role = 'timeline-item';
    if (this.node.type.name === 'cherry_detail') role = 'detail-item';
    else if (this.type.value === 'cols') role = 'column';
    else if (this.type.value === 'tabs') role = 'tab';
    const item = itemType.create({ role, label: '', open: false }, paragraph.create());
    this.view.dispatch(this.view.state.tr.insert(pos + this.node.nodeSize - 1, item));
  };
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
  nav.append(
    title,
    list.childElementCount
      ? list
      : Object.assign(document.createElement('span'), { textContent: '添加标题后生成目录' }),
  );
  return nav;
}

class FormLeafView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;

  constructor(node: ProseNode, view: EditorView, getPos: () => number | undefined, readonly: boolean) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement('section');
    this.dom.className = `cherry-leaf-form cherry-leaf-form--${node.type.name}`;
    this.render(readonly);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    return true;
  }

  stopEvent(event: Event) {
    return this.dom.contains(event.target as Node);
  }

  ignoreMutation() {
    return true;
  }

  private commit(attrs: Record<string, unknown>) {
    const pos = this.getPos();
    if (typeof pos === 'number') this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, attrs));
  }

  private render(readonly: boolean) {
    if (this.node.type.name === 'cherry_toc') {
      this.dom.append(renderToc(this.view));
      return;
    }
    const title = document.createElement('strong');
    title.textContent = this.node.type.name === 'cherry_frontmatter' ? 'Document metadata' : 'Reference definition';
    this.dom.append(title);
    if (this.node.type.name === 'cherry_comment_definition') {
      for (const key of ['label', 'url', 'title'] as const) {
        const input = document.createElement('input');
        input.value = String(this.node.attrs[key] ?? '');
        input.placeholder = key;
        input.readOnly = readonly;
        input.addEventListener('input', () => {
          const attrs = { ...this.node.attrs, [key]: input.value };
          attrs.source = `[${attrs.label}]: ${attrs.url}${attrs.title ? ` "${attrs.title}"` : ''}`;
          this.commit(attrs);
        });
        this.dom.append(input);
      }
      return;
    }
    const rows = String(this.node.attrs.source ?? '')
      .replace(/^---[^\n]*\n|\n---[^\n]*$/g, '')
      .split(/\r?\n/)
      .map((line) => line.match(/^([^:#][^:]*):\s*(.*)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match));
    const table = document.createElement('div');
    const values = rows.map((row) => ({ key: row[1] ?? '', value: row[2] ?? '' }));
    const sync = () =>
      this.commit({ source: `---\n${values.map((entry) => `${entry.key}: ${entry.value}`).join('\n')}\n---` });
    const addRow = (key = '', value = '') => {
      const entry = { key, value };
      values.push(entry);
      const row = document.createElement('div');
      row.className = 'cherry-frontmatter-row';
      const keyInput = document.createElement('input');
      const valueInput = document.createElement('input');
      keyInput.value = key;
      valueInput.value = value;
      keyInput.placeholder = 'key';
      valueInput.placeholder = 'value';
      keyInput.readOnly = readonly;
      valueInput.readOnly = readonly;
      keyInput.addEventListener('input', () => {
        entry.key = keyInput.value;
        sync();
      });
      valueInput.addEventListener('input', () => {
        entry.value = valueInput.value;
        sync();
      });
      row.append(keyInput, valueInput);
      if (!readonly) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '×';
        remove.title = '删除字段';
        remove.addEventListener('click', () => {
          values.splice(values.indexOf(entry), 1);
          row.remove();
          sync();
        });
        row.append(remove);
      }
      table.append(row);
    };
    const initial = [...values];
    values.length = 0;
    initial.forEach(({ key, value }) => addRow(key, value));
    if (!initial.length) addRow();
    this.dom.append(table);
    if (!readonly) {
      const add = document.createElement('button');
      add.type = 'button';
      add.textContent = '增加字段';
      add.addEventListener('click', () => addRow());
      this.dom.append(add);
    }
  }
}

class EmbedView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly preview: HTMLElement;
  private readonly inspector: HTMLElement;
  private timer?: ReturnType<typeof setTimeout>;
  private renderVersion = 0;
  private cleanup?: () => void;

  constructor(
    node: ProseNode,
    view: EditorView,
    getPos: () => number | undefined,
    private readonly config: CherryWysiwygConfig,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement(node.isInline ? 'span' : 'figure');
    this.dom.className = `cherry-embed cherry-embed--${node.type.name}`;
    this.preview = document.createElement(node.isInline ? 'span' : 'div');
    this.preview.className = 'cherry-embed__preview';
    this.inspector = document.createElement(node.isInline ? 'span' : 'div');
    this.inspector.className = 'cherry-embed__inspector';
    this.inspector.hidden = true;
    this.dom.append(this.preview, this.inspector);
    this.render();
    this.buildInspector();
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.buildInspector();
    this.render();
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
    this.inspector.hidden = this.config.readonly || this.node.type.name === 'cherry_emoji';
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
    this.inspector.hidden = true;
  }

  stopEvent(event: Event) {
    return this.inspector.contains(event.target as Node);
  }

  ignoreMutation() {
    return true;
  }

  destroy() {
    if (this.timer) clearTimeout(this.timer);
    this.cleanup?.();
  }

  private buildInspector() {
    this.inspector.replaceChildren();
    if (this.node.type.name === 'cherry_emoji') return;
    const textarea = document.createElement('textarea');
    textarea.value =
      this.node.type.name === 'cherry_diagram'
        ? String(this.node.attrs.value ?? '')
        : String(this.node.attrs.source ?? '');
    textarea.readOnly = this.config.readonly;
    textarea.setAttribute('aria-label', `${this.node.type.name} configuration`);
    textarea.addEventListener('input', () => {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        const pos = this.getPos();
        if (typeof pos !== 'number') return;
        const attrs = { ...this.node.attrs };
        if (this.node.type.name === 'cherry_diagram') {
          attrs.value = textarea.value;
          attrs.source = `\`\`\`${attrs.diagramType}\n${textarea.value}\n\`\`\``;
        } else attrs.source = textarea.value;
        this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, attrs));
      }, this.config.debounce);
    });
    this.inspector.append(textarea);
  }

  private render() {
    this.renderVersion += 1;
    const version = this.renderVersion;
    this.cleanup?.();
    this.cleanup = undefined;
    if (this.node.type.name === 'cherry_emoji') {
      try {
        this.preview.innerHTML = this.config.engine.makeHtml(String(this.node.attrs.source));
      } catch {
        this.preview.textContent = String(this.node.attrs.source);
      }
      return;
    }
    if (this.node.type.name.startsWith('cherry_html')) {
      if (this.node.isInline) {
        this.preview.textContent = String(this.node.attrs.source);
      } else {
        const frame = document.createElement('iframe');
        frame.className = 'cherry-embed__html-frame';
        frame.setAttribute('sandbox', '');
        frame.srcdoc = String(this.node.attrs.source);
        this.preview.replaceChildren(frame);
      }
      return;
    }
    const diagramType = String(this.node.attrs.diagramType);
    const renderer =
      this.config.renderers?.[diagramType] ??
      (diagramType === 'mermaid' ? ({ source }: { source: string }) => renderMermaid(source) : undefined);
    if (!renderer) {
      this.preview.textContent = `${diagramType} · 请配置 renderers.${diagramType}`;
      return;
    }
    this.preview.classList.add('is-loading');
    Promise.resolve(
      renderer({
        container: this.preview,
        engine: this.config.engine,
        syntax: diagramType,
        source: String(this.node.attrs.value),
      }),
    )
      .then((result: CherryVisualRendererResult) => {
        if (version !== this.renderVersion) {
          if (typeof result === 'function') result();
          return;
        }
        this.preview.classList.remove('is-loading');
        if (typeof result === 'string') this.preview.innerHTML = result;
        if (typeof result === 'function') this.cleanup = result;
      })
      .catch((error: unknown) => {
        if (version !== this.renderVersion) return;
        this.preview.classList.remove('is-loading');
        this.preview.dataset.renderError = 'true';
        this.config.onError?.(error, 'render');
      });
  }
}

export const cherryCompoundItemView = $view(
  cherryCompoundItemSchema.node,
  (ctx) => (node, view, getPos) =>
    new CompoundItemView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
export const cherryPanelView = $view(
  cherryPanelSchema.node,
  (ctx) => (node, view, getPos) => new CompoundView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
export const cherryDetailView = $view(
  cherryDetailSchema.node,
  (ctx) => (node, view, getPos) => new CompoundView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
export const cherryTocView = $view(
  cherryTocSchema.node,
  (ctx) => (node, view, getPos) => new FormLeafView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
export const cherryFrontmatterView = $view(
  cherryFrontmatterSchema.node,
  (ctx) => (node, view, getPos) => new FormLeafView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
export const cherryCommentDefinitionView = $view(
  cherryCommentDefinitionSchema.node,
  (ctx) => (node, view, getPos) => new FormLeafView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);

function embedView(schema: ReturnType<typeof leafSchema>) {
  return $view(
    schema.node,
    (ctx) => (node, view, getPos) => new EmbedView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key)),
  );
}

export const cherryDiagramView = embedView(cherryDiagramSchema);
export const cherryHtmlBlockView = embedView(cherryHtmlBlockSchema);
export const cherryHtmlInlineView = embedView(cherryHtmlInlineSchema);
export const cherryEmojiView = embedView(cherryEmojiSchema);

export const cherryTocRefreshPlugin = $prose(
  () =>
    new Plugin({
      view: () => ({
        update: (view, previousState) => {
          if (previousState.doc.eq(view.state.doc)) return;
          view.dom
            .querySelectorAll<HTMLElement>('.cherry-leaf-form--cherry_toc')
            .forEach((dom) => dom.replaceChildren(renderToc(view)));
        },
      }),
    }),
);

export const cherryStructureSchemas = [
  cherryCompoundItemSchema,
  cherryPanelSchema,
  cherryDetailSchema,
  cherryTocSchema,
  cherryFrontmatterSchema,
  cherryCommentDefinitionSchema,
  cherryDiagramSchema,
  cherryHtmlBlockSchema,
  cherryHtmlInlineSchema,
  cherryEmojiSchema,
];

export const cherryStructureViews = [
  cherryCompoundItemView,
  cherryPanelView,
  cherryDetailView,
  cherryTocView,
  cherryFrontmatterView,
  cherryCommentDefinitionView,
  cherryDiagramView,
  cherryHtmlBlockView,
  cherryHtmlInlineView,
  cherryEmojiView,
  cherryTocRefreshPlugin,
];
