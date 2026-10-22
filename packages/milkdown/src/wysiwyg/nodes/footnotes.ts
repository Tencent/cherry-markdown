import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { footnoteDefinitionSchema } from '@milkdown/kit/preset/gfm';
import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorView, NodeView } from '@milkdown/kit/prose/view';
import { $prose, $view } from '@milkdown/kit/utils';

class CherryFootnoteDefinitionView implements NodeView {
  readonly dom: HTMLElement;
  readonly contentDOM: HTMLElement;
  private node: ProseNode;
  private readonly reference: HTMLAnchorElement;

  constructor(
    node: ProseNode,
    private readonly view: EditorView,
  ) {
    this.node = node;
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

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.sync();
    return true;
  }

  stopEvent(event: Event) {
    return event.target === this.reference;
  }

  destroy() {
    this.reference.removeEventListener('click', this.navigateToReference);
  }

  private number() {
    const label = String(this.node.attrs.label ?? '');
    let result = 0;
    this.view.state.doc.descendants((candidate) => {
      if (result || candidate.type.name !== 'cherry_footnote_reference') return;
      if (String(candidate.attrs.label ?? '') === label) result = Number(candidate.attrs.number ?? 0);
    });
    return result || 1;
  }

  private sync() {
    const label = String(this.node.attrs.label ?? '');
    const number = this.number();
    this.dom.dataset.label = label;
    this.reference.href = `#fnref:${number}`;
    this.reference.id = `fn:${number}`;
    this.reference.title = label;
    this.reference.textContent = `[${number}]`;
  }

  private navigateToReference = (event: MouseEvent) => {
    const target = this.view.dom.querySelector<HTMLElement>(`#${CSS.escape(this.reference.hash.slice(1))}`);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: 'nearest' });
  };
}

export const cherryFootnoteDefinitionView = $view(
  footnoteDefinitionSchema.node,
  () => (node, view) => new CherryFootnoteDefinitionView(node, view),
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
