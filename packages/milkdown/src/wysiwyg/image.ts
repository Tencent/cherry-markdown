import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { imageSchema } from '@milkdown/kit/preset/commonmark';
import type { NodeView } from '@milkdown/kit/prose/view';
import { $view } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import type { CherryWysiwygConfig } from './config.js';

function imageMarkdown(node: ProseNode) {
  const alt = String(node.attrs.alt ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\]/g, '\\]');
  const src = String(node.attrs.src ?? '').replace(/\s/g, '%20');
  const title = node.attrs.title ? ` "${String(node.attrs.title).replace(/"/g, '\\"')}"` : '';
  return `![${alt}](${src}${title})`;
}

export function cherryImagePresentation(node: ProseNode, config: CherryWysiwygConfig) {
  const template = document.createElement('template');
  template.innerHTML = config.engine.makeHtml(imageMarkdown(node));
  const rendered = template.content.querySelector('img');
  if (!rendered) return undefined;
  return Array.from(rendered.attributes).map(({ name, value }) => [name, value] as const);
}

class CherryImageView implements NodeView {
  dom: HTMLImageElement;

  constructor(
    private node: ProseNode,
    private readonly config: CherryWysiwygConfig,
  ) {
    this.dom = document.createElement('img');
    this.render();
  }

  private render() {
    const selected = this.dom.classList.contains('ProseMirror-selectednode');
    for (const attribute of Array.from(this.dom.attributes)) this.dom.removeAttribute(attribute.name);
    const presentation = cherryImagePresentation(this.node, this.config);
    if (presentation) {
      for (const [name, value] of presentation) this.dom.setAttribute(name, value);
    } else {
      this.dom.src = String(this.node.attrs.src ?? '');
      this.dom.alt = String(this.node.attrs.alt ?? '');
      if (this.node.attrs.title) this.dom.title = String(this.node.attrs.title);
    }
    this.dom.contentEditable = 'false';
    this.dom.draggable = true;
    if (selected) this.dom.classList.add('ProseMirror-selectednode');
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.render();
    return true;
  }

  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode');
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
  }

  ignoreMutation() {
    return true;
  }
}

export const cherryImageView = $view(
  imageSchema.node,
  (ctx) => (node) => new CherryImageView(node, ctx.get(cherryWysiwygConfigCtx.key)),
);
