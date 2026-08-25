import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorView, NodeView, ViewMutationRecord } from '@milkdown/kit/prose/view';
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

function iconButton(label: string, title: string, action: () => void, readonly = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.title = title;
  button.setAttribute('aria-label', title);
  button.hidden = readonly;
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', action);
  return button;
}

function editableLabel(className: string, value: string, placeholder: string, readonly: boolean, commit: () => void) {
  const label = document.createElement('span');
  label.className = className;
  label.textContent = value;
  label.dataset.placeholder = placeholder;
  label.contentEditable = String(!readonly);
  label.spellcheck = false;
  label.addEventListener('input', commit);
  label.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      label.blur();
    }
  });
  return label;
}

function editableSourceText(source: HTMLElement) {
  return source.innerText || source.textContent || '';
}

class CompoundItemView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly label: HTMLElement;
  private readonly disclosure: HTMLButtonElement;

  constructor(node: ProseNode, view: EditorView, getPos: () => number | undefined, readonly: boolean) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement('section');
    this.dom.className = 'cherry-compound-item';
    this.dom.dataset.role = String(node.attrs.role);
    const header = document.createElement('header');
    header.className = 'cherry-compound-item__header';
    this.disclosure = iconButton(
      node.attrs.open ? '⌄' : '›',
      '切换默认展开状态',
      () => {
        this.updateAttrs({ open: !this.node.attrs.open });
      },
      readonly,
    );
    this.disclosure.className = 'cherry-compound-item__disclosure';
    this.disclosure.hidden = node.attrs.role !== 'detail-item';
    this.label = editableLabel(
      'cherry-compound-item__label',
      String(node.attrs.label ?? ''),
      node.attrs.role === 'column' ? '' : '直接输入标题',
      readonly,
      () => this.updateAttrs({ label: this.label.textContent ?? '' }),
    );
    this.label.hidden = node.attrs.role === 'column';
    const actions = document.createElement('span');
    actions.className = 'cherry-node-actions';
    actions.append(
      iconButton('←', '向前移动', () => this.move(-1), readonly),
      iconButton('→', '向后移动', () => this.move(1), readonly),
      iconButton('×', '删除项目', this.remove, readonly),
    );
    header.append(this.disclosure, this.label, actions);
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'cherry-compound-item__content';
    this.dom.append(header, this.contentDOM);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    if (document.activeElement !== this.label) this.label.textContent = String(node.attrs.label ?? '');
    this.dom.dataset.role = String(node.attrs.role);
    this.disclosure.textContent = node.attrs.open ? '⌄' : '›';
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
  }

  stopEvent(event: Event) {
    return Boolean((event.target as HTMLElement).closest('.cherry-compound-item__header'));
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return this.label.contains(mutation.target);
  }

  private updateAttrs(attrs: Record<string, unknown>) {
    const pos = this.getPos();
    if (typeof pos === 'number') {
      this.view.dispatch(
        this.view.state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, ...attrs, source: '' }),
      );
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

const PANEL_KINDS = ['panel', 'primary', 'info', 'warning', 'danger', 'success'];

class CompoundView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly title: HTMLElement;
  private readonly kind: HTMLButtonElement;

  constructor(node: ProseNode, view: EditorView, getPos: () => number | undefined, readonly: boolean) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement('section');
    this.dom.dataset.cherryCompound = node.type.name;
    const header = document.createElement('header');
    header.className = 'cherry-compound__header';
    this.kind = iconButton(String(node.attrs.kind), '切换块类型', this.cycleKind, readonly);
    this.kind.className = 'cherry-compound__kind';
    this.title = editableLabel(
      'cherry-compound__title',
      String(node.attrs.title ?? ''),
      '直接输入标题',
      readonly,
      this.updateTitle,
    );
    this.title.hidden = node.type.name === 'cherry_detail';
    const actions = document.createElement('span');
    actions.className = 'cherry-node-actions';
    actions.append(iconButton('＋', '增加项目', this.addItem, readonly));
    header.append(this.kind, this.title, actions);
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'cherry-compound__content';
    this.dom.append(header, this.contentDOM);
    this.sync(node);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.sync(node);
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
  }

  stopEvent(event: Event) {
    return Boolean((event.target as HTMLElement).closest('.cherry-compound__header'));
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return this.title.contains(mutation.target);
  }

  private sync(node: ProseNode) {
    const kind = node.type.name === 'cherry_detail' ? 'detail' : String(node.attrs.kind);
    this.dom.className = `cherry-compound cherry-compound--${kind}`;
    this.kind.textContent = kind;
    if (document.activeElement !== this.title) this.title.textContent = String(node.attrs.title ?? '');
  }

  private setAttrs(attrs: Record<string, unknown>) {
    const pos = this.getPos();
    if (typeof pos === 'number') {
      this.view.dispatch(
        this.view.state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, ...attrs, source: '' }),
      );
    }
  }

  private updateTitle = () => this.setAttrs({ title: this.title.textContent ?? '' });

  private cycleKind = () => {
    if (this.node.type.name === 'cherry_detail') return;
    const current = PANEL_KINDS.indexOf(String(this.node.attrs.kind));
    if (current < 0) return;
    const kind = PANEL_KINDS[(current + 1) % PANEL_KINDS.length] ?? 'panel';
    this.setAttrs({ kind, rawType: kind });
  };

  private addItem = () => {
    const kind = String(this.node.attrs.kind);
    if (this.node.type.name !== 'cherry_detail' && !['cols', 'tabs', 'timeline'].includes(kind)) return;
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    const itemType = this.view.state.schema.nodes.cherry_compound_item;
    const { paragraph } = this.view.state.schema.nodes;
    if (!itemType || !paragraph) return;
    let role = 'timeline-item';
    if (this.node.type.name === 'cherry_detail') role = 'detail-item';
    else if (kind === 'cols') role = 'column';
    else if (kind === 'tabs') role = 'tab';
    const item = itemType.create({ role, label: '', open: false }, paragraph.create());
    this.view.dispatch(this.view.state.tr.insert(pos + this.node.nodeSize - 1, item).scrollIntoView());
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

class SourceLeafView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly source?: HTMLElement;

  constructor(node: ProseNode, view: EditorView, getPos: () => number | undefined, readonly: boolean) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement('section');
    this.dom.className = `cherry-source-node cherry-source-node--${node.type.name}`;
    if (node.type.name === 'cherry_toc') {
      this.dom.append(renderToc(view));
      return;
    }
    const header = document.createElement('header');
    header.className = 'cherry-source-node__header';
    const label = document.createElement('span');
    label.textContent = node.type.name === 'cherry_frontmatter' ? '文档属性' : '引用定义';
    const hint = document.createElement('span');
    hint.className = 'cherry-source-node__hint';
    hint.textContent = node.type.name === 'cherry_frontmatter' ? '点击原位编辑' : '';
    header.append(label, hint);
    this.source = document.createElement('code');
    this.source.className = 'cherry-source-node__source';
    this.source.contentEditable = String(!readonly);
    this.source.spellcheck = false;
    this.source.textContent = String(node.attrs.source ?? '');
    this.source.hidden = node.type.name === 'cherry_frontmatter';
    this.source.addEventListener('input', this.commitSource);
    if (node.type.name === 'cherry_frontmatter' && !readonly) {
      header.tabIndex = 0;
      header.setAttribute('role', 'button');
      header.addEventListener('click', () => {
        if (!this.source) return;
        this.source.hidden = !this.source.hidden;
        this.dom.classList.toggle('is-expanded', !this.source.hidden);
        if (!this.source.hidden) this.source.focus();
      });
    }
    this.dom.append(header, this.source);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    if (this.source && document.activeElement !== this.source) {
      this.source.textContent = String(node.attrs.source ?? '');
    }
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
    if (this.source && this.node.type.name === 'cherry_frontmatter') this.source.hidden = true;
  }

  stopEvent(event: Event) {
    return Boolean(this.source?.contains(event.target as Node));
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return Boolean(this.source?.contains(mutation.target));
  }

  private commitSource = () => {
    if (!this.source) return;
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    const source = editableSourceText(this.source);
    const attrs: Record<string, unknown> = { ...this.node.attrs, source };
    if (this.node.type.name === 'cherry_comment_definition') {
      const parsed = /^\s*\[([^\]]+)\]:\s*(\S+)(?:\s+["'(](.*?)["')])?\s*$/.exec(source);
      attrs.label = parsed?.[1] ?? '';
      attrs.url = parsed?.[2] ?? '';
      attrs.title = parsed?.[3] ?? '';
    }
    this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, attrs));
  };
}

class EmbedView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly preview: HTMLElement;
  private readonly sourcePanel: HTMLElement;
  private readonly source: HTMLElement;
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
    const controls = document.createElement(node.isInline ? 'span' : 'figcaption');
    controls.className = 'cherry-embed__controls';
    controls.hidden = node.type.name === 'cherry_emoji';
    const type = document.createElement('span');
    type.className = 'cherry-embed__type';
    type.textContent = node.type.name === 'cherry_diagram' ? String(node.attrs.diagramType) : 'HTML';
    const edit = iconButton(
      '源码',
      '在节点内编辑源码',
      () => {
        this.sourcePanel.hidden = !this.sourcePanel.hidden;
        if (!this.sourcePanel.hidden) this.source.focus();
      },
      config.readonly,
    );
    controls.append(type, edit);
    this.sourcePanel = document.createElement(node.isInline ? 'span' : 'pre');
    this.sourcePanel.className = 'cherry-embed__source';
    this.sourcePanel.hidden = true;
    this.source = document.createElement('code');
    this.source.contentEditable = String(!config.readonly);
    this.source.spellcheck = false;
    this.source.addEventListener('input', this.updateSource);
    this.sourcePanel.append(this.source);
    this.dom.append(this.preview, controls, this.sourcePanel);
    this.render();
    this.syncSource();
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.syncSource();
    this.render();
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
    this.sourcePanel.hidden = true;
  }

  stopEvent(event: Event) {
    return (
      this.sourcePanel.contains(event.target as Node) ||
      Boolean((event.target as HTMLElement).closest('.cherry-embed__controls'))
    );
  }

  ignoreMutation() {
    return true;
  }

  destroy() {
    if (this.timer) clearTimeout(this.timer);
    this.cleanup?.();
  }

  private syncSource() {
    if (document.activeElement === this.source) return;
    this.source.textContent =
      this.node.type.name === 'cherry_diagram'
        ? String(this.node.attrs.value ?? '')
        : String(this.node.attrs.source ?? '');
  }

  private updateSource = () => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const pos = this.getPos();
      if (typeof pos !== 'number') return;
      const value = editableSourceText(this.source);
      const attrs = { ...this.node.attrs };
      if (this.node.type.name === 'cherry_diagram') {
        attrs.value = value;
        attrs.source = `\`\`\`${attrs.diagramType}\n${value}\n\`\`\``;
      } else attrs.source = value;
      this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, attrs));
    }, this.config.debounce);
  };

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
  (ctx) => (node, view, getPos) => new SourceLeafView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
export const cherryFrontmatterView = $view(
  cherryFrontmatterSchema.node,
  (ctx) => (node, view, getPos) => new SourceLeafView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
);
export const cherryCommentDefinitionView = $view(
  cherryCommentDefinitionSchema.node,
  (ctx) => (node, view, getPos) => new SourceLeafView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key).readonly),
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
            .querySelectorAll<HTMLElement>('.cherry-source-node--cherry_toc')
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
