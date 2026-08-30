import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { NodeSelection, Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import type { EditorView, NodeView, ViewMutationRecord } from '@milkdown/kit/prose/view';
import type { SerializerState } from '@milkdown/kit/transformer';
import { $nodeSchema, $prose, $view } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import type { CherryWysiwygConfig } from './config.js';
import type { CherryVisualRendererResult } from './types.js';

let mermaidRenderId = 0;
const headingNavigationTasks = new WeakMap<
  EditorView,
  { frames: number[]; timers: Array<ReturnType<typeof setTimeout>> }
>();

async function renderMermaid(source: string) {
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({ securityLevel: 'strict', startOnLoad: false });
  mermaidRenderId += 1;
  return (await mermaid.render(`cherry-milkdown-mermaid-${mermaidRenderId}`, source)).svg;
}

function sanitizedEngineFragment(html: string, inline = false): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script, iframe, object, embed, base, meta, form').forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (
        name.startsWith('on') ||
        (['href', 'src', 'xlink:href', 'formaction', 'srcset'].includes(name) &&
          /^(?:javascript|data:text\/html)/.test(value)) ||
        (name === 'style' && /(?:expression\s*\(|javascript\s*:)/.test(value))
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  if (inline && template.content.childElementCount === 1 && template.content.firstElementChild?.tagName === 'P') {
    const fragment = document.createDocumentFragment();
    fragment.append(...Array.from(template.content.firstElementChild.childNodes));
    return fragment;
  }
  return template.content;
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
  selectable: true,
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
    selectable: true,
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
export const cherryTableChartSchema = leafSchema('cherry_table_chart', 'cherryTableChart', false, {
  chartType: sourceAttr(),
});
export const cherryNativeBlockSchema = leafSchema('cherry_native_block', 'cherryNativeBlock');
export const cherryHtmlBlockSchema = leafSchema('cherry_html_block', 'cherryHtmlBlock');
export const cherryHtmlInlineSchema = leafSchema('cherry_html_inline', 'cherryHtmlInline', true);
export const cherryEmojiSchema = leafSchema('cherry_emoji', 'cherryEmoji', true);
export const cherryLinkTargetSchema = leafSchema('cherry_link_target', 'cherryLinkTarget', true, {
  target: sourceAttr(),
});

class LinkTargetView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;

  constructor(node: ProseNode) {
    this.node = node;
    this.dom = document.createElement('span');
    this.dom.className = 'cherry-link-target';
    this.dom.contentEditable = 'false';
    this.sync();
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.sync();
    return true;
  }

  ignoreMutation() {
    return true;
  }

  private sync() {
    this.dom.dataset.target = String(this.node.attrs.target ?? '');
  }
}

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
    const role = String(node.attrs.role);
    this.dom = document.createElement(role === 'detail-item' ? 'details' : 'section');
    this.dom.className = 'cherry-compound-item';
    this.dom.dataset.role = role;
    if (this.dom instanceof HTMLDetailsElement) {
      this.dom.open = Boolean(node.attrs.open);
      this.dom.addEventListener('toggle', () => {
        if (this.dom instanceof HTMLDetailsElement && this.dom.open !== Boolean(this.node.attrs.open)) {
          this.updateAttrs({ open: this.dom.open });
        }
      });
    }
    const header = document.createElement(role === 'detail-item' ? 'summary' : 'header');
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
    if (role === 'detail-item') {
      this.label.addEventListener('click', (event) => event.preventDefault());
    }
    const actions = document.createElement('span');
    actions.className = 'cherry-node-actions';
    actions.append(
      iconButton('←', '向前移动', () => this.move(-1), readonly),
      iconButton('→', '向后移动', () => this.move(1), readonly),
      iconButton('×', '删除项目', this.remove, readonly),
    );
    header.append(this.disclosure, this.label, actions);
    header.addEventListener('mousedown', (event) => {
      if (event.target !== header) return;
      const pos = this.getPos();
      if (typeof pos !== 'number') return;
      event.preventDefault();
      this.view.dispatch(this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)));
      this.view.focus();
    });
    if (role === 'detail-item') {
      this.disclosure.addEventListener('click', (event) => event.preventDefault());
    }
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = `cherry-compound-item__content${
      role === 'detail-item' ? ' cherry-detail-body' : role === 'column' ? ' cherry-panel--col' : ''
    }`;
    this.dom.append(header, this.contentDOM);
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    if (document.activeElement !== this.label) this.label.textContent = String(node.attrs.label ?? '');
    this.dom.dataset.role = String(node.attrs.role);
    this.disclosure.textContent = node.attrs.open ? '⌄' : '›';
    if (this.dom instanceof HTMLDetailsElement && this.dom.open !== Boolean(node.attrs.open)) {
      this.dom.open = Boolean(node.attrs.open);
    }
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
  }

  stopEvent(event: Event) {
    const target = event.target as HTMLElement;
    return this.label.contains(target) || Boolean(target.closest('button'));
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
    actions.append(this.kind, iconButton('＋', '增加项目', this.addItem, readonly));
    header.append(this.title, actions);
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
    const target = event.target as HTMLElement;
    return this.title.contains(target) || Boolean(target.closest('button'));
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return this.title.contains(mutation.target);
  }

  private sync(node: ProseNode) {
    const kind = node.type.name === 'cherry_detail' ? 'detail' : String(node.attrs.kind);
    const isPanel = node.type.name !== 'cherry_detail' && /^(panel|primary|info|warning|danger|success)$/.test(kind);
    const cherryClass =
      node.type.name === 'cherry_detail'
        ? 'cherry-detail'
        : isPanel
          ? `cherry-panel cherry-panel__${kind === 'panel' ? 'primary' : kind}`
          : kind === 'cols'
            ? 'cherry-panel-cols cherry-panel-cols__cols'
            : kind === 'tabs'
              ? 'cherry-tabs'
              : '';
    this.dom.className = `cherry-compound cherry-compound--${kind} ${cherryClass}`.trim();
    const header = this.title.parentElement;
    if (header) {
      header.className = `cherry-compound__header${isPanel ? ' cherry-panel--title' : ''}${
        isPanel && node.attrs.title ? ' cherry-panel--title__not-empty' : ''
      }`;
    }
    this.contentDOM.className = `cherry-compound__content${isPanel ? ' cherry-panel--body' : ''}`;
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

function headingId(node: ProseNode, usedIds: Map<string, number>) {
  const explicitId = String(node.attrs.id ?? '');
  if (explicitId) return explicitId;
  const baseId = node.textContent.toLowerCase().trim().replace(/\s+/g, '-');
  if (!baseId) return '';
  const occurrence = (usedIds.get(baseId) ?? 0) + 1;
  usedIds.set(baseId, occurrence);
  return occurrence === 1 ? baseId : `${baseId}-#${occurrence}`;
}

function navigateToHeading(view: EditorView, id: string) {
  const target = Array.from(view.dom.querySelectorAll<HTMLElement>('[id]')).find((element) => element.id === id);
  if (!target) return false;
  view.dom.blur();
  const scroll = () => {
    if (!target.isConnected) return;
    let container = target.parentElement;
    while (container && container !== document.body) {
      const style = getComputedStyle(container);
      if (/^(?:auto|scroll)$/.test(style.overflowY) && container.scrollHeight > container.clientHeight) {
        const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top;
        container.scrollTop += offset - (Number.parseFloat(style.paddingTop) || 0);
        return;
      }
      container = container.parentElement;
    }
    target.scrollIntoView({ block: 'start' });
  };
  const previous = headingNavigationTasks.get(view);
  previous?.frames.forEach(cancelAnimationFrame);
  previous?.timers.forEach(clearTimeout);
  const task: { frames: number[]; timers: Array<ReturnType<typeof setTimeout>> } = { frames: [], timers: [] };
  headingNavigationTasks.set(view, task);
  scroll();
  task.frames.push(
    requestAnimationFrame(() => {
      scroll();
      task.frames.push(requestAnimationFrame(scroll));
    }),
  );
  task.timers.push(setTimeout(scroll, 100), setTimeout(scroll, 350));
  return true;
}

function cancelHeadingNavigation(view: EditorView) {
  const task = headingNavigationTasks.get(view);
  task?.frames.forEach(cancelAnimationFrame);
  task?.timers.forEach(clearTimeout);
  headingNavigationTasks.delete(view);
}

function renderToc(view: EditorView) {
  const nav = document.createElement('div');
  nav.className = 'toc';
  const title = document.createElement('div');
  title.className = 'toc-title';
  title.textContent = '目录';
  const list = document.createElement('ul');
  const usedIds = new Map<string, number>();
  view.state.doc.descendants((node) => {
    if (node.type.name !== 'heading') return;
    const item = document.createElement('li');
    item.className = 'toc-li';
    const link = document.createElement('a');
    const level = Number(node.attrs.level ?? 1);
    link.className = `level-${level}`;
    const id = headingId(node, usedIds);
    link.setAttribute('href', id ? `#${encodeURIComponent(id)}` : '#');
    link.target = '_self';
    link.textContent = node.textContent;
    item.append(link);
    list.append(item);
  });
  nav.append(title, list.childElementCount ? list : Object.assign(document.createElement('span'), { textContent: '' }));
  return nav;
}

class SourceLeafView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly source?: HTMLElement;
  private tocRefreshFrame?: number;
  private destroyed = false;

  constructor(node: ProseNode, view: EditorView, getPos: () => number | undefined, readonly: boolean) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement('section');
    this.dom.className = `cherry-source-node cherry-source-node--${node.type.name}`;
    if (node.type.name === 'cherry_toc') {
      this.dom.addEventListener('mousedown', this.prepareTocNavigation);
      this.dom.addEventListener('click', this.navigateToc);
      this.refreshToc();
      this.scheduleTocRefresh();
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
    if (node.type.name === 'cherry_toc') this.scheduleTocRefresh();
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
    if (this.node.type.name === 'cherry_toc') {
      return Boolean((event.target as Element | null)?.closest('a'));
    }
    return Boolean(this.source?.contains(event.target as Node));
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    if (this.node.type.name === 'cherry_toc') return true;
    return Boolean(this.source?.contains(mutation.target));
  }

  destroy() {
    this.destroyed = true;
    this.dom.removeEventListener('mousedown', this.prepareTocNavigation);
    this.dom.removeEventListener('click', this.navigateToc);
    if (this.tocRefreshFrame !== undefined) cancelAnimationFrame(this.tocRefreshFrame);
  }

  private refreshToc = () => {
    if (this.destroyed || this.node.type.name !== 'cherry_toc') return;
    this.dom.replaceChildren(renderToc(this.view));
  };

  private scheduleTocRefresh = () => {
    if (this.tocRefreshFrame !== undefined) cancelAnimationFrame(this.tocRefreshFrame);
    this.tocRefreshFrame = requestAnimationFrame(() => {
      this.tocRefreshFrame = undefined;
      this.refreshToc();
    });
  };

  private navigateToc = (event: Event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!(link instanceof HTMLAnchorElement)) return;
    event.preventDefault();
    event.stopPropagation();
    const id = decodeURIComponent(link.hash.slice(1));
    if (!id) return;
    if (!navigateToHeading(this.view, id)) return;
    try {
      window.location.hash = encodeURIComponent(id);
    } catch {
      // Navigation is still complete when history is unavailable (for example,
      // an embedded file preview with an opaque origin).
    }
  };

  private prepareTocNavigation = (event: MouseEvent) => {
    if (event.button !== 0) return;
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
  };

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
  private visibilityObserver?: IntersectionObserver;
  private renderActivated = false;
  private destroyed = false;

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
    this.source.addEventListener('blur', this.flushSourceRender);
    this.sourcePanel.append(this.source);
    this.dom.append(this.preview, controls, this.sourcePanel);
    this.scheduleRender();
    this.syncSource();
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.syncSource();
    if ((this.renderActivated || node.type.name !== 'cherry_diagram') && document.activeElement !== this.source) {
      this.render();
    }
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
    this.destroyed = true;
    this.renderVersion += 1;
    this.visibilityObserver?.disconnect();
    this.dom.removeEventListener('pointerdown', this.activateRender);
    if (this.timer) clearTimeout(this.timer);
    this.cleanup?.();
  }

  private scheduleRender() {
    if (this.node.type.name !== 'cherry_diagram' || typeof IntersectionObserver === 'undefined') {
      this.activateRender();
      return;
    }
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this.activateRender();
      },
      { rootMargin: '500px 0px' },
    );
    this.visibilityObserver.observe(this.dom);
    this.dom.addEventListener('pointerdown', this.activateRender, { once: true });
  }

  private activateRender = () => {
    if (this.destroyed || this.renderActivated) return;
    this.renderActivated = true;
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = undefined;
    this.dom.removeEventListener('pointerdown', this.activateRender);
    this.render();
  };

  private syncSource() {
    if (document.activeElement === this.source) return;
    this.source.textContent =
      this.node.type.name === 'cherry_diagram'
        ? String(this.node.attrs.value ?? '')
        : String(this.node.attrs.source ?? '');
  }

  private updateSource = () => {
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    const value = editableSourceText(this.source);
    const attrs = { ...this.node.attrs };
    if (this.node.type.name === 'cherry_diagram') {
      attrs.value = value;
      attrs.source = `\`\`\`${attrs.diagramType}\n${value}\n\`\`\``;
    } else attrs.source = value;
    this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, attrs));
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (this.renderActivated || this.node.type.name !== 'cherry_diagram') this.render();
    }, this.config.debounce);
  };

  private flushSourceRender = () => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (this.renderActivated || this.node.type.name !== 'cherry_diagram') this.render();
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
    if (this.node.type.name.startsWith('cherry_html') || this.node.type.name === 'cherry_native_block') {
      try {
        const html = this.config.engine.makeHtml(String(this.node.attrs.source));
        this.preview.replaceChildren(sanitizedEngineFragment(html, this.node.isInline));
      } catch {
        this.preview.textContent = String(this.node.attrs.source);
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
        if (this.destroyed || version !== this.renderVersion) {
          if (typeof result === 'function') result();
          return;
        }
        this.preview.classList.remove('is-loading');
        if (typeof result === 'string') this.preview.innerHTML = result;
        if (typeof result === 'function') this.cleanup = result;
      })
      .catch((error: unknown) => {
        if (this.destroyed || version !== this.renderVersion) return;
        this.preview.classList.remove('is-loading');
        this.preview.dataset.renderError = 'true';
        this.config.onError?.(error, 'render');
      });
  }
}

class TableChartView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly preview: HTMLElement;
  private readonly source: HTMLElement;
  private readonly sourcePanel: HTMLElement;
  private observer?: IntersectionObserver;
  private destroyed = false;
  private editingSource = false;

  constructor(
    node: ProseNode,
    private readonly view: EditorView,
    private readonly getPos: () => number | undefined,
    private readonly config: CherryWysiwygConfig,
  ) {
    this.node = node;
    this.dom = document.createElement('figure');
    this.dom.className = 'cherry-embed cherry-table-chart';
    this.preview = document.createElement('div');
    this.preview.className = 'cherry-embed__preview cherry-table-chart__preview';
    // An empty, lazy NodeView has a zero-area intersection rectangle and can
    // therefore never enter the viewport. Reserve the same minimum height as
    // Cherry's native ECharts wrapper until the first native render completes.
    this.preview.style.minHeight = '300px';
    const controls = document.createElement('figcaption');
    controls.className = 'cherry-embed__controls';
    const type = document.createElement('span');
    type.textContent = String(node.attrs.chartType);
    const edit = iconButton('源码', '在节点内编辑表格图表源码', this.openSource, config.readonly);
    controls.append(type, edit);
    this.sourcePanel = document.createElement('pre');
    this.sourcePanel.className = 'cherry-embed__source cherry-table-chart__source';
    this.sourcePanel.hidden = true;
    this.source = document.createElement('code');
    this.source.contentEditable = String(!config.readonly);
    this.source.spellcheck = false;
    this.source.textContent = String(node.attrs.source ?? '');
    this.source.addEventListener('input', this.commitSource);
    this.source.addEventListener('blur', this.finishSourceEdit);
    this.sourcePanel.append(this.source);
    this.dom.append(this.preview, controls, this.sourcePanel);
    this.dom.addEventListener('mousedown', this.selectFromEmptyArea, true);
    this.dom.addEventListener('click', this.selectFromEmptyArea, true);
    this.scheduleRender();
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    const sourceChanged = node.attrs.source !== this.node.attrs.source;
    this.node = node;
    if (document.activeElement !== this.source) this.source.textContent = String(node.attrs.source ?? '');
    if (sourceChanged) this.render();
    return true;
  }

  selectNode() {
    this.dom.classList.add('is-selected');
    if (!this.config.readonly) this.sourcePanel.hidden = false;
  }

  deselectNode() {
    this.dom.classList.remove('is-selected');
    if (!this.editingSource) this.sourcePanel.hidden = true;
  }

  stopEvent(event: Event) {
    return (
      this.sourcePanel.contains(event.target as Node) ||
      Boolean((event.target as HTMLElement).closest('.cherry-embed__controls'))
    );
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return this.sourcePanel.contains(mutation.target);
  }

  destroy() {
    this.destroyed = true;
    this.observer?.disconnect();
    this.dom.removeEventListener('mousedown', this.selectFromEmptyArea, true);
    this.dom.removeEventListener('click', this.selectFromEmptyArea, true);
    this.config.engine.destroyRenderedContent?.(this.preview);
  }

  private scheduleRender() {
    if (typeof IntersectionObserver === 'undefined') {
      this.render();
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.observer?.disconnect();
        this.observer = undefined;
        this.render();
      },
      { rootMargin: '500px 0px' },
    );
    this.observer.observe(this.dom);
  }

  private selectFromEmptyArea = (event: MouseEvent) => {
    if (
      this.sourcePanel.contains(event.target as Node) ||
      (event.target as HTMLElement).closest('.cherry-embed__controls')
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    // Native chart children (canvas/SVG) may own their pointer interaction.
    // Reflect selection immediately, then let the real NodeSelection keep it
    // in sync with subsequent keyboard and blur behavior.
    this.selectNode();
    const pos = this.resolvePos();
    if (typeof pos !== 'number') return;
    this.view.dispatch(this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)));
    this.view.focus();
  };

  private openSource = () => {
    this.editingSource = true;
    this.dom.classList.add('is-editing');
    this.selectNode();
    const pos = this.resolvePos();
    if (typeof pos === 'number') {
      this.view.dispatch(this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)));
    }
  };

  private finishSourceEdit = () => {
    this.commitSource();
    this.editingSource = false;
    this.dom.classList.remove('is-editing');
    if (!this.dom.classList.contains('is-selected')) this.sourcePanel.hidden = true;
  };

  private commitSource = () => {
    if (this.config.readonly) return;
    const pos = this.resolvePos();
    if (typeof pos !== 'number') return;
    const source = editableSourceText(this.source);
    if (source === this.node.attrs.source) return;
    const firstLine = source.split(/\r?\n/, 1)[0]?.trim().replace(/^\|/, '') ?? '';
    const chartType = /^:(\w+):/.exec(firstLine)?.[1] ?? String(this.node.attrs.chartType ?? '');
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        source,
        chartType,
      }),
    );
  };

  private resolvePos() {
    try {
      const direct = this.getPos();
      if (typeof direct === 'number') return direct;
    } catch {
      // Fall through while this NodeView is between ProseMirror mappings.
    }
    try {
      const domPosition = this.view.posAtDOM(this.dom, 0);
      for (const candidate of [domPosition, domPosition - 1]) {
        if (candidate >= 0 && this.view.state.doc.nodeAt(candidate)?.type === this.node.type) return candidate;
      }
    } catch {
      // The DOM may temporarily be detached during an external update.
    }
    let matched: number | undefined;
    this.view.state.doc.descendants((node, position) => {
      if (
        matched === undefined &&
        node.type === this.node.type &&
        node.attrs.source === this.node.attrs.source &&
        node.attrs.chartType === this.node.attrs.chartType
      ) {
        matched = position;
      }
    });
    return matched;
  }

  private render() {
    if (this.destroyed) return;
    this.config.engine.destroyRenderedContent?.(this.preview);
    try {
      const html = this.config.engine.makeHtml(String(this.node.attrs.source ?? ''));
      this.preview.replaceChildren(sanitizedEngineFragment(html));
      this.preview.style.removeProperty('min-height');
      delete this.preview.dataset.renderError;
    } catch (error) {
      this.preview.textContent = String(this.node.attrs.source ?? '');
      this.preview.dataset.renderError = 'true';
      this.config.onError?.(error, 'render');
    }
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
export const cherryTableChartView = $view(
  cherryTableChartSchema.node,
  (ctx) => (node, view, getPos) => new TableChartView(node, view, getPos, ctx.get(cherryWysiwygConfigCtx.key)),
);
export const cherryHtmlBlockView = embedView(cherryHtmlBlockSchema);
export const cherryNativeBlockView = embedView(cherryNativeBlockSchema);
export const cherryHtmlInlineView = embedView(cherryHtmlInlineSchema);
export const cherryEmojiView = embedView(cherryEmojiSchema);
export const cherryLinkTargetView = $view(cherryLinkTargetSchema.node, () => (node) => new LinkTargetView(node));

// Applying target during NodeView construction mutates DOM owned by
// ProseMirror. With many links that mutation is observed as an edit, redraws
// the marker and schedules the same mutation again. Resolve the adjacent
// marker only for the user's actual click, before the browser follows it.
export const cherryLinkTargetClickPlugin = $prose(
  () =>
    new Plugin({
      props: {
        handleDOMEvents: {
          click: (view, event) => {
            const origin = event.target;
            const link = origin instanceof Element ? origin.closest('a') : null;
            if (!(link instanceof HTMLAnchorElement) || link.closest('.cherry-source-node--cherry_toc')) return false;
            const marker = link?.nextElementSibling;
            if (marker?.classList.contains('cherry-link-target')) {
              const target = marker.getAttribute('data-target') ?? '';
              if (target && link.target !== target) link.target = target;
              if (target === '_blank' && !link.rel.includes('noopener')) link.rel = `${link.rel} noopener`.trim();
            }

            if (!view.editable) return false;
            event.preventDefault();
            link.title = '按 Ctrl/⌘ 点击打开链接';
            if (!event.metaKey && !event.ctrlKey) return false;

            event.stopPropagation();
            if (!/^(?:https?:|mailto:|tel:)/i.test(link.href)) return true;
            window.open(link.href, '_blank', 'noopener');
            return true;
          },
        },
      },
      view: (view) => {
        const restoreHash = () => {
          const id = decodeURIComponent(window.location.hash.slice(1));
          if (id) navigateToHeading(view, id);
        };
        const restoreTimer = setTimeout(restoreHash, 350);
        return {
          destroy: () => {
            clearTimeout(restoreTimer);
            cancelHeadingNavigation(view);
          },
        };
      },
    }),
);

export const cherryTocRefreshPlugin = $prose(
  () =>
    new Plugin({
      props: {
        decorations(state) {
          const anchors: Decoration[] = [];
          state.doc.descendants((node, position) => {
            if (node.type.name !== 'heading') return;
            const id = String(node.attrs.id ?? '');
            if (!id) return;
            anchors.push(
              Decoration.widget(
                position + 1,
                () => {
                  const anchor = document.createElement('a');
                  anchor.className = 'anchor';
                  anchor.href = `#${id}`;
                  anchor.target = '_self';
                  anchor.contentEditable = 'false';
                  anchor.setAttribute('aria-label', `定位到 ${node.textContent}`);
                  return anchor;
                },
                { side: -1 },
              ),
            );
          });
          return DecorationSet.create(state.doc, anchors);
        },
      },
      view: () => {
        let refreshFrame: number | undefined;
        return {
          update: (view, previousState) => {
            if (previousState.doc.eq(view.state.doc)) return;
            const refresh = () =>
              view.dom
                .querySelectorAll<HTMLElement>('.cherry-source-node--cherry_toc')
                .forEach((dom) => dom.replaceChildren(renderToc(view)));
            refresh();
            if (refreshFrame !== undefined) cancelAnimationFrame(refreshFrame);
            refreshFrame = requestAnimationFrame(() => {
              refreshFrame = undefined;
              refresh();
            });
          },
          destroy: () => {
            if (refreshFrame !== undefined) cancelAnimationFrame(refreshFrame);
          },
        };
      },
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
  cherryTableChartSchema,
  cherryNativeBlockSchema,
  cherryHtmlBlockSchema,
  cherryHtmlInlineSchema,
  cherryEmojiSchema,
  cherryLinkTargetSchema,
];

export const cherryStructureViews = [
  cherryCompoundItemView,
  cherryPanelView,
  cherryDetailView,
  cherryTocView,
  cherryFrontmatterView,
  cherryCommentDefinitionView,
  cherryDiagramView,
  cherryTableChartView,
  cherryNativeBlockView,
  cherryHtmlBlockView,
  cherryHtmlInlineView,
  cherryEmojiView,
  cherryLinkTargetView,
  cherryLinkTargetClickPlugin,
  cherryTocRefreshPlugin,
];
