import { parserCtx } from '@milkdown/kit/core';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import { Slice, type Node as ProseNode } from '@milkdown/kit/prose/model';
import { NodeSelection, Plugin } from '@milkdown/kit/prose/state';
import type { EditorView, NodeView } from '@milkdown/kit/prose/view';
import { $ctx, $node, $prose, $remark, $view } from '@milkdown/kit/utils';
import { transformCherryRawTree } from './transform.js';
import type { CherryRawConfig, CherryRawEditRequest, CherryRawKind } from './types.js';

const defaultConfig: CherryRawConfig = { patterns: [] };

export const cherryRawConfigCtx = $ctx<CherryRawConfig, 'cherryRawConfig'>(defaultConfig, 'cherryRawConfig');

function createRawSchema(kind: CherryRawKind) {
  const nodeName = kind === 'block' ? 'cherryRawBlock' : 'cherryRawInline';
  return $node(nodeName, () => ({
    atom: true,
    defining: true,
    draggable: true,
    group: kind,
    inline: kind === 'inline',
    isolating: true,
    selectable: true,
    attrs: {
      syntax: { default: 'raw', validate: 'string' },
      source: { default: '', validate: 'string' },
    },
    parseDOM: [
      {
        tag: `[data-cherry-raw-${kind}]`,
        getAttrs: (dom) => ({
          syntax: dom.getAttribute('data-syntax') ?? 'raw',
          source: dom.getAttribute('data-source') ?? '',
        }),
      },
    ],
    toDOM: (node) => [
      kind === 'block' ? 'div' : 'span',
      {
        [`data-cherry-raw-${kind}`]: '',
        'data-syntax': String(node.attrs.syntax),
        'data-source': String(node.attrs.source),
      },
      String(node.attrs.source),
    ],
    parseMarkdown: {
      match: (node) => node.type === nodeName,
      runner: (state, node, type) => {
        state.addNode(type, {
          syntax: typeof node.syntax === 'string' ? node.syntax : 'raw',
          source: typeof node.value === 'string' ? node.value : '',
        });
      },
    },
    toMarkdown: {
      match: (node) => node.type.name === nodeName,
      runner: (state, node) => {
        state.addNode('html', undefined, String(node.attrs.source));
      },
    },
  }));
}

export const cherryRawBlockSchema = createRawSchema('block');
export const cherryRawInlineSchema = createRawSchema('inline');

function summarize(source: string) {
  const firstLine = source.trim().split(/\r?\n/, 1)[0] ?? '';
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
}

class CherryRawNodeView implements NodeView {
  dom: HTMLElement;
  private node: ProseNode;
  private readonly getPos: () => number | undefined;
  private readonly view: EditorView;
  private readonly kind: CherryRawKind;
  private readonly editSource?: (request: CherryRawEditRequest) => void;
  private readonly badge: HTMLElement;
  private readonly summary: HTMLElement;

  constructor(
    node: ProseNode,
    view: EditorView,
    getPos: () => number | undefined,
    kind: CherryRawKind,
    editSource?: (request: CherryRawEditRequest) => void,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.kind = kind;
    this.editSource = editSource;
    this.dom = document.createElement(kind === 'block' ? 'div' : 'span');
    this.dom.className = `cherry-milkdown-raw cherry-milkdown-raw--${kind}`;
    this.dom.dataset.cherryRaw = kind;
    this.dom.draggable = true;
    this.badge = document.createElement('span');
    this.badge.className = 'cherry-milkdown-raw__badge';
    this.summary = document.createElement('code');
    this.summary.className = 'cherry-milkdown-raw__summary';
    this.dom.append(this.badge, this.summary);
    this.render();
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.dom.addEventListener('dblclick', this.handleDoubleClick);
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
    return event.type === 'dblclick';
  }

  destroy() {
    this.dom.removeEventListener('dblclick', this.handleDoubleClick);
  }

  private render() {
    this.dom.dataset.syntax = String(this.node.attrs.syntax);
    this.badge.textContent = String(this.node.attrs.syntax);
    this.summary.textContent = summarize(String(this.node.attrs.source));
    this.dom.title = String(this.node.attrs.source);
  }

  private handleDoubleClick(event: MouseEvent) {
    event.preventDefault();
    if (!this.editSource) return;
    this.editSource({
      kind: this.kind,
      syntax: String(this.node.attrs.syntax),
      source: String(this.node.attrs.source),
      save: (source) => {
        const pos = this.getPos();
        if (typeof pos !== 'number') return;
        this.view.dispatch(
          this.view.state.tr.setNodeMarkup(pos, undefined, {
            ...this.node.attrs,
            source,
          }),
        );
      },
    });
  }
}

function createRawView(kind: CherryRawKind, nodeSchema: typeof cherryRawBlockSchema) {
  return $view(nodeSchema, (ctx) => (node, view, getPos) => {
    const config = ctx.get(cherryRawConfigCtx.key);
    return new CherryRawNodeView(node, view, getPos, kind, config.editSource);
  });
}

export const cherryRawBlockView = createRawView('block', cherryRawBlockSchema);
export const cherryRawInlineView = createRawView(
  'inline',
  cherryRawInlineSchema as unknown as typeof cherryRawBlockSchema,
);

const cherryRawRemark = $remark('cherryRawRemark', (ctx) => () => (tree, file) => {
  const config = ctx.get(cherryRawConfigCtx.key);
  transformCherryRawTree(tree as Parameters<typeof transformCherryRawTree>[0], String(file.value), config.patterns);
});

const cherryRawClipboard = $prose(
  (ctx) =>
    new Plugin({
      props: {
        handleDOMEvents: {
          copy(view, event) {
            const { selection } = view.state;
            if (!(selection instanceof NodeSelection) || !selection.node.type.name.startsWith('cherryRaw'))
              return false;
            const { node } = selection;
            event.preventDefault();
            event.clipboardData?.setData('text/plain', String(node.attrs.source));
            return true;
          },
          cut(view, event) {
            const { selection } = view.state;
            if (!(selection instanceof NodeSelection) || !selection.node.type.name.startsWith('cherryRaw'))
              return false;
            const { node } = selection;
            event.preventDefault();
            event.clipboardData?.setData('text/plain', String(node.attrs.source));
            view.dispatch(view.state.tr.deleteSelection());
            return true;
          },
        },
        handlePaste(view, event) {
          const markdown = event.clipboardData?.getData('text/plain');
          if (!markdown) return false;
          const doc = ctx.get(parserCtx)(markdown);
          let hasRaw = false;
          doc.descendants((node) => {
            if (node.type.name.startsWith('cherryRaw')) hasRaw = true;
            return !hasRaw;
          });
          if (!hasRaw) return false;
          event.preventDefault();
          view.dispatch(view.state.tr.replaceSelection(new Slice(doc.content, 0, 0)).scrollIntoView());
          return true;
        },
      },
    }),
);

export const cherryRaw: MilkdownPlugin[] = [
  cherryRawConfigCtx,
  cherryRawBlockSchema,
  cherryRawInlineSchema,
  cherryRawBlockView,
  cherryRawInlineView,
  ...cherryRawRemark,
  cherryRawClipboard,
];
