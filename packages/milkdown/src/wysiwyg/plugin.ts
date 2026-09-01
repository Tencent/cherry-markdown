import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { RemarkPluginRaw } from '@milkdown/kit/transformer';
import { Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import type { Node as ProseMirrorNode } from '@milkdown/kit/prose/model';
import { $prose, $remark } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import { cherryCodeBlock } from './code-block.js';
import { cherryImageView } from './image.js';
import { cherryMath } from './math.js';
import { cherryWysiwygMarkInputRules, cherryWysiwygMarkSchemas } from './marks.js';
import { cherryStructureSchemas, cherryStructureViews } from './nodes.js';
import { transformCherryWysiwygTree, type MarkdownNode } from './transform.js';

interface MarkdownState {
  containerFlow(node: MarkdownNode, info: unknown): string;
  containerPhrasing(node: MarkdownNode, info: unknown): string;
}

function markHandler(open: (node: MarkdownNode) => string, close: string) {
  return (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) =>
    `${open(node)}${node.value ?? state.containerPhrasing(node, info)}${close}`;
}

function normalize(value: string) {
  return value.replace(/\r\n/g, '\n').trim();
}

const customMarkdownPlugin: RemarkPluginRaw<unknown> = function customMarkdownPlugin() {
  const data = this.data();
  const extensions = (data.toMarkdownExtensions ??= []) as Array<Record<string, unknown>>;
  extensions.push({
    handlers: {
      break: () => '  \n',
      cherryToc: (node: MarkdownNode) => String(node.source ?? '[[toc]]'),
      cherryFrontmatter: (node: MarkdownNode) => String(node.source ?? '---\n---'),
      cherryCommentDefinition: (node: MarkdownNode) => String(node.source ?? ''),
      cherryDiagram: (node: MarkdownNode) => String(node.source ?? ''),
      cherryTableChart: (node: MarkdownNode) => String(node.source ?? ''),
      cherryNativeBlock: (node: MarkdownNode) => String(node.source ?? ''),
      cherryHtmlBlock: (node: MarkdownNode) => String(node.source ?? node.value ?? ''),
      cherryHtmlInline: (node: MarkdownNode) => String(node.source ?? node.value ?? ''),
      cherryEmoji: (node: MarkdownNode) => String(node.source ?? node.value ?? ''),
      cherryLinkTarget: (node: MarkdownNode) => String(node.source ?? ''),
      cherry_background_color: markHandler((node) => `!!!${String(node.color ?? '')} `, '!!!'),
      cherry_color: markHandler((node) => `!!${String(node.color ?? '')} `, '!!'),
      cherry_font_size: markHandler((node) => `!${String(node.size ?? '')} `, '!'),
      cherry_subscript: markHandler(() => '^^', '^^'),
      cherry_superscript: markHandler(() => '^', '^'),
      cherry_ruby: (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) =>
        `{${node.value ?? state.containerPhrasing(node, info)}|${String(node.annotation ?? '')}}`,
      cherry_underline: markHandler(() => '/', '/'),
      cherry_highlight: markHandler(() => '==', '=='),
      cherryCompoundItem: (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) => {
        const body = state.containerFlow(node, info).trim();
        const role = String(node.role ?? '');
        const label = String(node.label ?? '');
        if (role === 'column') return body;
        if (role === 'detail-item') return `${node.open ? '++-' : '++'} ${label}\n${body}`.trim();
        return `:: ${label}\n${body}`.trim();
      },
      cherryPanel: (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) => {
        const body = state.containerFlow(node, info).trim();
        const source = String(node.source ?? '');
        const originalBody = String(node.originalBody ?? '');
        if (source && normalize(body) === normalize(originalBody)) return source;
        const type = String(node.rawType || node.kind || 'panel');
        const title = String(node.title ?? '');
        return `:::${type}${title ? ` ${title}` : ''}\n${body}\n:::`;
      },
      cherryDetail: (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) => {
        const body = state.containerFlow(node, info).trim();
        const first = body.replace(/^\+\+(-?)\s+/, '+++$1 ');
        return `${first}\n+++`;
      },
    },
  });
  return (tree, file) => {
    const parse = (source: string, options?: { supplementalDefinitions?: boolean }) => {
      const parsed = this.parse(source) as MarkdownNode;
      transformCherryWysiwygTree(parsed, source, parse, options);
      return parsed.children ?? [];
    };
    transformCherryWysiwygTree(tree as MarkdownNode, String(file.value), parse);
  };
};

const cherryWysiwygRemark = $remark('cherryWysiwygRemark', () => customMarkdownPlugin);

// Milkdown's GFM schema preserves `checked` on task list items but deliberately
// leaves their presentation to the host. Cherry's preview has a clickable
// checkbox, so provide the same small hit target without replacing the list
// node or interfering with normal text selection.
function toggleTaskItem(
  view: Parameters<NonNullable<Plugin['spec']['view']>>[0],
  event: MouseEvent,
): boolean {
  const target = event.target instanceof Element ? event.target : null;
  let item = target?.closest('li[data-item-type="task"]');
  // A Cherry preview control can briefly sit above the editor while a
  // transaction is being applied. In that case the event target is outside
  // the ProseMirror root; recover the task item from the pointer coordinates
  // so a second click cannot be lost during the re-render.
  if (!(item instanceof HTMLElement) || !view.dom.contains(item)) {
    item = [...view.dom.querySelectorAll('li[data-item-type="task"]')].find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
    }) ?? null;
  }
  if (!(item instanceof HTMLElement)) return false;
  const rect = item.getBoundingClientRect();
  if (event.clientX - rect.left > 28) return false;

  // Resolve the DOM node back to its exact document position. This is more
  // reliable than `posAtDOM(li, 0)`, which can point at a list boundary (or the
  // paragraph) depending on the ProseMirror version.
  let found: { position: number; node: ProseMirrorNode } | undefined;
  view.state.doc.descendants((candidate, candidatePosition) => {
    if (found || candidate.type.name !== 'list_item') return;
    if (view.nodeDOM(candidatePosition) === item) {
      found = { position: candidatePosition, node: candidate };
    }
  });
  if (!found || found.node.attrs.checked == null) return false;
  const { position, node } = found;
  view.dispatch(view.state.tr.setNodeMarkup(position, undefined, {
    ...node.attrs,
    checked: !node.attrs.checked,
  }));
  event.preventDefault();
  event.stopPropagation();
  return true;
}

interface CherryDraggedBlock {
  from: number;
  node: ProseMirrorNode;
  element: HTMLElement;
}

function topLevelBlockAt(view: Parameters<NonNullable<Plugin['spec']['view']>>[0], target: EventTarget | null) {
  let element = target instanceof Element ? (target as HTMLElement) : null;
  while (element && element.parentElement !== view.dom) element = element.parentElement;
  if (!element || element.parentElement !== view.dom) return undefined;
  let found: { from: number; node: ProseMirrorNode; element: HTMLElement } | undefined;
  view.state.doc.forEach((node, from) => {
    if (found || view.nodeDOM(from) !== element) return;
    found = { from, node, element };
  });
  return found;
}

// Cherry's ordinary paragraphs, headings and lists are supplied by Milkdown's
// stock schema without a drag handle. Implement block movement at the editor
// boundary using the pointer lifecycle, instead of rewriting upstream schema
// nodes or mutating every rendered element. Only direct document blocks
// participate; nested list/compound content keeps its normal text-selection
// and drag semantics.
const cherryBlockDragDrop = $prose(
  () =>
    new Plugin({
      view: (view) => {
        let dragged: CherryDraggedBlock | undefined;
        let over: HTMLElement | undefined;
        let pointerCandidate: (CherryDraggedBlock & { x: number; y: number; pointerId: number }) | undefined;

        const clearOver = () => {
          over?.classList.remove('cherry-drag-over');
          over = undefined;
        };
        const onDragStart = (event: DragEvent) => {
          const block = topLevelBlockAt(view, event.target);
          if (!block) return;
          dragged = block;
          event.dataTransfer?.setData('application/x-cherry-milkdown-node', String(block.from));
          if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
          block.element.classList.add('cherry-dragging');
        };
        const reorder = (target: ReturnType<typeof topLevelBlockAt>) => {
          if (!dragged || !target || target.from === dragged.from) return false;
          const insertAt = dragged.from < target.from ? target.from - dragged.node.nodeSize : target.from;
          view.dispatch(view.state.tr.delete(dragged.from, dragged.from + dragged.node.nodeSize)
            .insert(insertAt, dragged.node)
            .scrollIntoView());
          return true;
        };
        const onPointerDown = (event: PointerEvent) => {
          if (event.button !== 0 && event.pointerType === 'mouse') return;
          const target = event.target instanceof HTMLElement ? event.target : undefined;
          // NodeView controls (image resize, Mermaid/ECharts actions, table
          // buttons and inline source editors) own their pointer lifecycle.
          // Never turn those interactions into a top-level block move.
          if (
            target?.closest(
                'button,input,textarea,select,[contenteditable="false"],.cherry-embed,' +
                '.cherry-previewer-img-size-handler,.cherry-previewer-img-tool-handler,.cherry-node-actions,' +
                '[data-cherry-table-control],img,a,table,pre,code,math-field',
            )
          ) return;
          const block = topLevelBlockAt(view, event.target);
          if (!block) return;
          if (block.element.querySelector('img,button,input,textarea,select,math-field,.cherry-embed')) return;
          pointerCandidate = { ...block, x: event.clientX, y: event.clientY, pointerId: event.pointerId };
        };
        const onPointerMove = (event: PointerEvent) => {
          if (!pointerCandidate || event.pointerId !== pointerCandidate.pointerId) return;
          if (!(event.target instanceof Node) || !view.dom.contains(event.target)) {
            pointerCandidate = undefined;
            return;
          }
          const distance = Math.hypot(event.clientX - pointerCandidate.x, event.clientY - pointerCandidate.y);
          if (!dragged && distance < 6) return;
          if (!dragged) {
            dragged = pointerCandidate;
            pointerCandidate.element.classList.add('cherry-dragging');
          }
          event.preventDefault();
          const target = topLevelBlockAt(view, document.elementFromPoint(event.clientX, event.clientY));
          clearOver();
          const current = dragged;
          if (target && current && target.from !== current.from) {
            over = target.element;
            over.classList.add('cherry-drag-over');
          }
        };
        const onPointerUp = (event: PointerEvent) => {
          if (!pointerCandidate || event.pointerId !== pointerCandidate.pointerId) return;
          const wasDragging = Boolean(dragged);
          const target = topLevelBlockAt(view, document.elementFromPoint(event.clientX, event.clientY));
          if (wasDragging) {
            event.preventDefault();
            reorder(target);
            onDragEnd();
          }
          pointerCandidate = undefined;
        };
        const onDragOver = (event: DragEvent) => {
          if (!dragged) return;
          const block = topLevelBlockAt(view, event.target);
          if (!block || block.from === dragged.from) return;
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
          clearOver();
          over = block.element;
          over.classList.add('cherry-drag-over');
        };
        const onDrop = (event: DragEvent) => {
          if (!dragged) return;
          const target = topLevelBlockAt(view, event.target);
          if (!target || target.from === dragged.from) return;
          event.preventDefault();
          reorder(target);
          dragged = undefined;
          clearOver();
        };
        const onDragEnd = () => {
          dragged = undefined;
          clearOver();
          view.dom.querySelector('.cherry-dragging')?.classList.remove('cherry-dragging');
        };

        view.dom.addEventListener('dragstart', onDragStart);
        view.dom.addEventListener('pointerdown', onPointerDown);
        // Keep pointer tracking scoped to the editor surface. Cherry's image
        // resize handles and diagram controls live outside `.ProseMirror`;
        // listening on window would compete with their drag lifecycle.
        view.dom.addEventListener('pointermove', onPointerMove, { passive: false });
        view.dom.addEventListener('pointerup', onPointerUp, { passive: false });
        view.dom.addEventListener('pointercancel', onPointerUp, { passive: false });
        view.dom.addEventListener('dragover', onDragOver);
        view.dom.addEventListener('drop', onDrop);
        view.dom.addEventListener('dragend', onDragEnd);
        return {
          destroy: () => {
            view.dom.removeEventListener('dragstart', onDragStart);
            view.dom.removeEventListener('pointerdown', onPointerDown);
            view.dom.removeEventListener('pointermove', onPointerMove);
            view.dom.removeEventListener('pointerup', onPointerUp);
            view.dom.removeEventListener('pointercancel', onPointerUp);
            view.dom.removeEventListener('dragover', onDragOver);
            view.dom.removeEventListener('drop', onDrop);
            view.dom.removeEventListener('dragend', onDragEnd);
            clearOver();
          },
        };
      },
    }),
);

const cherryTaskListToggle = $prose(
  () =>
    new Plugin({
      // Capture the physical pointer event at the document level. A
      // document update after the first toggle can otherwise cause the second
      // click to be consumed by the editor's selection handler before a
      // ProseMirror prop runs. The listener is scoped to this view and removed
      // on destroy, so multiple Cherry instances remain isolated.
      view: (view) => {
        const onMouseUp = (event: MouseEvent) => toggleTaskItem(view, event);
        document.addEventListener('mouseup', onMouseUp, true);
        return {
          destroy: () => document.removeEventListener('mouseup', onMouseUp, true),
        };
      },
    }),
);

// Cherry renders task markers as its icon-font spans inside the paragraph:
// `<span class="ch-icon ch-icon-square"></span>`.  Milkdown's stock GFM
// renderer intentionally has no presentation for `checked`, so a CSS glyph
// (`☐`/`☑`) would drift from Cherry in font, baseline and hit-box.  Keep the
// GFM node and its Markdown serializer untouched and add the exact native
// marker as a widget decoration instead.
const cherryTaskListPresentation = $prose(
  () =>
    new Plugin({
      props: {
        decorations: (state) => {
          const decorations: Decoration[] = [];
          state.doc.descendants((node, position) => {
            if (node.type.name !== 'list_item' || node.attrs.checked == null) return;
            decorations.push(
              Decoration.node(position, position + node.nodeSize, {
                class: 'cherry-list-item check-list-item',
              }),
            );
            // A task list item always starts with a paragraph in Milkdown's
            // GFM schema.  Position + 2 is the paragraph's text start and
            // keeps the marker inline with Cherry's `<p>` output.
            decorations.push(
              Decoration.widget(
                position + 2,
                () => {
                  const icon = document.createElement('span');
                  icon.className = `ch-icon ${node.attrs.checked ? 'ch-icon-check' : 'ch-icon-square'}`;
                  icon.contentEditable = 'false';
                  icon.dataset.cherryTaskCheckbox = '';
                  icon.setAttribute('role', 'checkbox');
                  icon.setAttribute('aria-checked', String(Boolean(node.attrs.checked)));
                  icon.setAttribute('aria-label', node.attrs.checked ? '已完成' : '未完成');
                  // Cherry's renderer emits a literal space after the icon.
                  // Keep that text node in the widget so task text starts at
                  // the same sub-pixel position in visual comparisons.
                  const fragment = document.createDocumentFragment();
                  fragment.append(icon, document.createTextNode(' '));
                  return fragment;
                },
                { side: -1 },
              ),
            );
          });
          return DecorationSet.create(state.doc, decorations);
        },
      },
    }),
);

export const cherryWysiwyg: MilkdownPlugin[] = [
  cherryWysiwygConfigCtx,
  ...cherryWysiwygMarkSchemas,
  ...cherryWysiwygMarkInputRules,
  ...cherryMath,
  ...cherryCodeBlock,
  cherryImageView,
  ...cherryStructureSchemas,
  ...cherryStructureViews,
  cherryTaskListToggle,
  cherryTaskListPresentation,
  cherryBlockDragDrop,
  ...cherryWysiwygRemark,
].flat();
