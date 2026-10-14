import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import type { EditorView, NodeView, ViewMutationRecord } from '@milkdown/kit/prose/view';
import { $prose, $view } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from '../config.js';
import { readEditableSource, selectEditableSource } from '../node-view-utils.js';
import {
  cherryTocSchema,
  cherryFrontmatterSchema,
  cherryCommentDefinitionSchema,
  cherryLinkTargetSchema,
} from './node-schemas.js';

const headingNavigationTasks = new WeakMap<
  EditorView,
  { frames: number[]; timers: Array<ReturnType<typeof setTimeout>> }
>();

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
    this.source.addEventListener('keydown', selectEditableSource);
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
    this.source?.removeEventListener('input', this.commitSource);
    this.source?.removeEventListener('keydown', selectEditableSource);
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
    const source = readEditableSource(this.source);
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
            const rawHref = link.getAttribute('href') ?? '';
            const marker = link?.nextElementSibling;
            const target = marker?.classList.contains('cherry-link-target')
              ? (marker.getAttribute('data-target') ?? '')
              : '';

            // Never mutate attributes on ProseMirror-owned link DOM here.
            // Its DOMObserver would parse the whole paragraph again and turn
            // preserved Markdown newlines between inline nodes into spaces,
            // visibly moving the focused link onto the preceding line.
            if (!view.editable) {
              if (!target || target === '_self') return false;
              event.preventDefault();
              event.stopPropagation();
              if (/^(?:https?:|mailto:|tel:)/i.test(rawHref)) {
                window.open(link.href, target, target === '_blank' ? 'noopener' : undefined);
              }
              return true;
            }

            event.preventDefault();
            if (!/^(?:https?:|mailto:|tel:)/i.test(rawHref)) {
              if (event.metaKey || event.ctrlKey) return true;
              const id = decodeURIComponent(link.hash.slice(1));
              if (!id || !navigateToHeading(view, id)) return true;
              try {
                window.location.hash = encodeURIComponent(id);
              } catch {
                // Embedded opaque-origin previews can still scroll without a hash.
              }
              return true;
            }
            if (!event.metaKey && !event.ctrlKey) return false;

            event.stopPropagation();
            if (!/^(?:https?:|mailto:|tel:)/i.test(link.href)) return true;
            window.open(link.href, target || '_blank', target === '_blank' || !target ? 'noopener' : undefined);
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
          const usedIds = new Map<string, number>();
          state.doc.descendants((node, position) => {
            if (node.type.name !== 'heading') return;
            const id = headingId(node, usedIds);
            if (!id) return;
            // Milkdown's heading schema does not always serialize an id. Add
            // the same stable runtime anchor contract as Cherry without
            // mutating the document or its Markdown.
            anchors.push(Decoration.node(position, position + node.nodeSize, { id }));
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
