import { Fragment, Slice, type Node as ProseNode } from '@milkdown/kit/prose/model';
import { footnoteDefinitionSchema } from '@milkdown/kit/preset/gfm';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet, type EditorView, type NodeView } from '@milkdown/kit/prose/view';
import { $nodeSchema, $prose, $view } from '@milkdown/kit/utils';
import { cherryFootnoteReferenceSchema } from './node-schemas.js';

const footnoteNumbersKey = new PluginKey<DecorationSet>('cherry-footnote-numbers');

/** Derive visible numbering from document order without adding history steps. */
function footnoteNumberDecorations(doc: ProseNode): DecorationSet {
  const numbers = new Map<string, number>();
  const nodes: Array<{ node: ProseNode; position: number }> = [];
  doc.descendants((node, position) => {
    if (node.type.name !== 'cherry_footnote_reference' && node.type.name !== 'footnote_definition') return;
    nodes.push({ node, position });
    if (node.type.name === 'cherry_footnote_reference') {
      const label = String(node.attrs.label ?? '');
      if (!numbers.has(label)) numbers.set(label, numbers.size + 1);
    }
  });
  return DecorationSet.create(
    doc,
    nodes.map(({ node, position }) =>
      Decoration.node(
        position,
        position + node.nodeSize,
        {},
        {
          cherryFootnoteNumber: numbers.get(String(node.attrs.label ?? '')) ?? null,
        },
      ),
    ),
  );
}

export const cherryFootnoteNumbers = $prose(
  () =>
    new Plugin({
      key: footnoteNumbersKey,
      state: {
        init: (_, state) => footnoteNumberDecorations(state.doc),
        apply: (transaction, decorations) =>
          transaction.docChanged ? footnoteNumberDecorations(transaction.doc) : decorations,
      },
      props: { decorations: (state) => footnoteNumbersKey.getState(state) ?? null },
    }),
);

function visibleNumber(decorations: readonly Decoration[], fallback: number | null): number | null {
  const decoration = decorations.find((item) => 'cherryFootnoteNumber' in item.spec);
  return decoration ? decoration.spec.cherryFootnoteNumber : fallback;
}

class CherryFootnoteReferenceView implements NodeView {
  readonly dom: HTMLElement;
  private readonly reference: HTMLAnchorElement;

  constructor(node: ProseNode, decorations: readonly Decoration[]) {
    this.dom = document.createElement('sup');
    this.dom.className = 'cherry-footnote-number';
    this.reference = document.createElement('a');
    this.reference.className = 'footnote';
    this.reference.contentEditable = 'false';
    this.dom.append(this.reference);
    this.sync(node, decorations);
  }

  update(node: ProseNode, decorations: readonly Decoration[]) {
    if (node.type.name !== 'cherry_footnote_reference') return false;
    this.sync(node, decorations);
    return true;
  }

  ignoreMutation() {
    return true;
  }

  private sync(node: ProseNode, decorations: readonly Decoration[]) {
    const label = String(node.attrs.label ?? '');
    const number = visibleNumber(decorations, Number(node.attrs.number ?? 0)) ?? 0;
    this.dom.dataset.label = label;
    this.dom.dataset.number = String(number);
    this.reference.href = `#fn:${number}`;
    this.reference.id = `fnref:${number}`;
    this.reference.title = label;
    this.reference.dataset.index = String(number);
    this.reference.dataset.key = label;
    this.reference.textContent = `[${number}]`;
  }
}

export const cherryFootnoteReferenceView = $view(
  cherryFootnoteReferenceSchema.node,
  () => (node, _view, _getPos, decorations) => new CherryFootnoteReferenceView(node, decorations),
);

/** A visual position left by a relocated definition is not Markdown content. */
export const cherryFootnoteGapSchema = $nodeSchema('cherry_footnote_gap', () => ({
  content: 'inline*',
  group: 'block',
  toDOM: () => ['p', { 'data-cherry-footnote-gap': '' }, 0],
  parseMarkdown: {
    match: (node) => node.type === 'cherryFootnoteGap',
    runner: (state, node, type) => {
      state.openNode(type);
      if (node.children) state.next(node.children);
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'cherry_footnote_gap',
    runner: (state, node) => {
      if (!node.content.size) return;
      state.openNode('paragraph').next(node.content).closeNode();
    },
  },
}));

/** Remove internal layout gaps without changing a valid copied selection. */
export function stripFootnoteGapsFromCopy(slice: Slice): Slice {
  const withoutGaps = (content: Fragment): Fragment => {
    const children: ProseNode[] = [];
    content.forEach((node) => {
      if (node.type.name === 'cherry_footnote_gap' && !node.content.size) return;
      if (!node.isLeaf) {
        const next = withoutGaps(node.content);
        // Never create an invalid parent when a gap was its only child.
        if (!next.eq(node.content) && node.type.validContent(next)) node = node.copy(next);
      }
      children.push(node);
    });
    return Fragment.fromArray(children);
  };
  const content = withoutGaps(slice.content);
  if (content.eq(slice.content)) return slice;
  if (!content.size) return Slice.empty;
  const maxOpen = Slice.maxOpen(content);
  return new Slice(content, Math.min(slice.openStart, maxOpen.openStart), Math.min(slice.openEnd, maxOpen.openEnd));
}

/** Once a user writes in a visual gap it becomes an ordinary paragraph. */
export const cherryFootnoteGapEditing = $prose(
  () =>
    new Plugin({
      props: { transformCopied: stripFootnoteGapsFromCopy },
      appendTransaction(transactions, _previous, state) {
        if (!transactions.some((transaction) => transaction.docChanged)) return null;
        const paragraph = state.schema.nodes.paragraph;
        let transaction = state.tr;
        state.doc.descendants((node, position) => {
          if (node.type.name === 'cherry_footnote_gap' && node.content.size)
            transaction = transaction.setNodeMarkup(position, paragraph);
        });
        return transaction.docChanged ? transaction : null;
      },
    }),
);

class CherryFootnoteDefinitionView implements NodeView {
  readonly dom: HTMLElement;
  readonly contentDOM: HTMLElement;
  private node: ProseNode;
  private decorations: readonly Decoration[];
  private readonly reference: HTMLAnchorElement;

  constructor(
    node: ProseNode,
    private readonly view: EditorView,
    decorations: readonly Decoration[],
  ) {
    this.node = node;
    this.decorations = decorations;
    this.dom = document.createElement('div');
    this.dom.className = 'footnote cherry-footnote-definition';
    this.dom.dataset.type = 'footnote_definition';
    const item = document.createElement('div');
    item.className = 'one-footnote';
    this.reference = document.createElement('a');
    this.reference.className = 'footnote-ref';
    this.reference.contentEditable = 'false';
    this.reference.addEventListener('click', this.navigateToReference);
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'cherry-footnote-definition__content';
    item.append(this.reference, this.contentDOM);
    this.dom.append(item);
    this.sync();
  }

  update(node: ProseNode, decorations: readonly Decoration[]) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.decorations = decorations;
    this.sync();
    return true;
  }

  stopEvent(event: Event) {
    return event.target === this.reference;
  }

  destroy() {
    this.reference.removeEventListener('click', this.navigateToReference);
  }

  private sync() {
    const label = String(this.node.attrs.label ?? '');
    const number = visibleNumber(this.decorations, null);
    this.dom.dataset.label = label;
    if (number === null) {
      this.reference.removeAttribute('href');
      this.reference.removeAttribute('id');
    } else {
      this.reference.href = `#fnref:${number}`;
      this.reference.id = `fn:${number}`;
    }
    this.reference.title = label;
    this.reference.textContent = number === null ? `[^${label}]` : `[${number}]`;
  }

  private navigateToReference = (event: MouseEvent) => {
    if (!this.reference.hasAttribute('href')) return;
    const target = this.view.dom.querySelector<HTMLElement>(`#${CSS.escape(this.reference.hash.slice(1))}`);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: 'nearest' });
  };
}

export const cherryFootnoteDefinitionView = $view(
  footnoteDefinitionSchema.node,
  () => (node, view, _getPos, decorations) => new CherryFootnoteDefinitionView(node, view, decorations),
);

export const cherryFootnoteNavigationPlugin = $prose(
  () =>
    new Plugin({
      view: (view) => {
        const onClick = (event: MouseEvent) => {
          const target = event.target instanceof Element ? event.target.closest('a.footnote') : null;
          if (!(target instanceof HTMLAnchorElement)) return;
          const label = target.dataset.key ?? '';
          const definition = [...view.dom.querySelectorAll<HTMLElement>('[data-type="footnote_definition"]')].find(
            (element) => element.dataset.label === label,
          );
          if (!definition) return;
          event.preventDefault();
          event.stopPropagation();
          definition.scrollIntoView({ block: 'nearest' });
        };
        view.dom.addEventListener('click', onClick, true);
        return { destroy: () => view.dom.removeEventListener('click', onClick, true) };
      },
    }),
);
