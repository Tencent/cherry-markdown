import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { imageSchema } from '@milkdown/kit/preset/commonmark';
import type { NodeView } from '@milkdown/kit/prose/view';
import { $view } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import type { CherryWysiwygConfig } from './config.js';
import { isSafeImageSource, sanitizedEngineFragment } from './html-sanitizer.js';
import { reportRendererError } from './renderer-cleanup.js';

function imageMarkdown(node: ProseNode) {
  const alt = String(node.attrs.alt ?? '').replace(/[\r\n[\]\\]/g, (character) => `&#${character.charCodeAt(0)};`);
  // These are decoded ProseMirror attributes, not Markdown source. Encode
  // destination delimiters for Cherry's parser without changing the document
  // or skipping its URL processor / beforeImageMounted callback.
  const src = String(node.attrs.src ?? '').replace(/[\s()"<>\\]/g, (character) =>
    encodeURIComponent(character).replace(
      /[()]/g,
      (delimiter) => `%${delimiter.charCodeAt(0).toString(16).toUpperCase()}`,
    ),
  );
  return `![${alt}](${src})`;
}

export function cherryImagePresentation(node: ProseNode, config: CherryWysiwygConfig) {
  const fragment = sanitizedEngineFragment(config.engine.makeHtml(imageMarkdown(node)));
  const rendered = fragment.querySelector('img');
  if (!rendered) return undefined;
  // Titles are already parsed text. Sending quoted text through a second
  // Markdown parse can discard the entire Cherry presentation.
  rendered.setAttribute('alt', String(node.attrs.alt ?? ''));
  if (node.attrs.title) rendered.setAttribute('title', String(node.attrs.title));
  return Array.from(rendered.attributes).map(({ name, value }) => [name, value] as const);
}

class CherryImageView implements NodeView {
  dom: HTMLImageElement;
  private generation = 0;
  private destroyed = false;

  constructor(
    private node: ProseNode,
    private readonly config: CherryWysiwygConfig,
  ) {
    this.dom = document.createElement('img');
    this.render();
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

  destroy() {
    this.destroyed = true;
    this.generation += 1;
  }

  private render() {
    const generation = ++this.generation;
    const node = this.node;
    let presentation: ReturnType<typeof cherryImagePresentation>;
    try {
      presentation = cherryImagePresentation(node, this.config);
    } catch (error) {
      if (this.destroyed || this.config.isDestroyed?.() || generation !== this.generation) return;
      reportRendererError(error, (cause) => this.config.onError?.(cause, 'render'));
    }
    if (this.destroyed || this.config.isDestroyed?.() || generation !== this.generation) return;
    const selected = this.dom.classList.contains('ProseMirror-selectednode');
    for (const attribute of Array.from(this.dom.attributes)) this.dom.removeAttribute(attribute.name);
    if (presentation) {
      for (const [name, value] of presentation) this.dom.setAttribute(name, value);
    } else {
      const src = String(node.attrs.src ?? '');
      if (isSafeImageSource(src)) this.dom.src = src;
      this.dom.alt = String(node.attrs.alt ?? '');
      if (node.attrs.title) this.dom.title = String(node.attrs.title);
    }
    this.dom.contentEditable = 'false';
    this.dom.draggable = true;
    if (selected) this.dom.classList.add('ProseMirror-selectednode');
  }
}

export const cherryImageView = $view(
  imageSchema.node,
  (ctx) => (node) => new CherryImageView(node, ctx.get(cherryWysiwygConfigCtx.key)),
);
