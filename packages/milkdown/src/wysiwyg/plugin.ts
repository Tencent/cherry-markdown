import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { RemarkPluginRaw } from '@milkdown/kit/transformer';
import { Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import type { Node as ProseMirrorNode } from '@milkdown/kit/prose/model';
import { $prose, $remark } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import { cherryCodeBlock } from './code-block.js';
import { cherryImageView } from './image.js';
import { cherryImageControls } from './image-controls.js';
import { cherryLinkEditor } from './link-editor.js';
import { cherryMath } from './math.js';
import { cherryTextBubble } from './text-bubble.js';
import { cherryTableChartPreview } from './table-chart-plugin.js';
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

function createCustomMarkdownPlugin(sourceBlockTypes: readonly string[]): RemarkPluginRaw<unknown> {
  return function customMarkdownPlugin() {
    const data = this.data();
    const extensions = (data.toMarkdownExtensions ??= []) as Array<Record<string, unknown>>;
    extensions.push({
      handlers: {
        break: () => '  \n',
        cherryToc: (node: MarkdownNode) => String(node.source ?? '[[toc]]'),
        cherryFrontmatter: (node: MarkdownNode) => String(node.source ?? '---\n---'),
        cherryCommentDefinition: (node: MarkdownNode) => String(node.source ?? ''),
        cherryDiagram: (node: MarkdownNode) => String(node.source ?? ''),
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
        transformCherryWysiwygTree(parsed, source, parse, { ...options, sourceBlockTypes });
        return parsed.children ?? [];
      };
      transformCherryWysiwygTree(tree as MarkdownNode, String(file.value), parse, { sourceBlockTypes });
    };
  };
}

const cherryWysiwygRemark = $remark('cherryWysiwygRemark', (ctx) => {
  const renderers = ctx.get(cherryWysiwygConfigCtx.key).renderers ?? {};
  return createCustomMarkdownPlugin(Object.keys(renderers));
});

// Milkdown's GFM schema preserves `checked` on task list items but deliberately
// leaves their presentation to the host. Cherry's preview has a clickable
// checkbox, so provide the same small hit target without replacing the list
// node or interfering with normal text selection.
function toggleTaskItem(view: Parameters<NonNullable<Plugin['spec']['view']>>[0], event: MouseEvent): boolean {
  const target = event.target instanceof Element ? event.target : null;
  const item = target?.closest('li[data-item-type="task"]');
  // The handler is installed on this editor root in capture phase, before
  // ProseMirror can replace the checkbox decoration during selection updates.
  // Never recover a task item from document coordinates: on pages containing
  // several preview-only editors that could toggle a different Cherry instance.
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
  if (found?.node.attrs.checked === null || found?.node.attrs.checked === undefined) return false;
  const { position, node } = found;
  view.dispatch(
    view.state.tr.setNodeMarkup(position, undefined, {
      ...node.attrs,
      checked: !node.attrs.checked,
    }),
  );
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
  if (element?.parentElement !== view.dom) return undefined;
  let found: { from: number; node: ProseMirrorNode; element: HTMLElement } | undefined;
  view.state.doc.forEach((node, from) => {
    if (found || view.nodeDOM(from) !== element) return;
    found = { from, node, element };
  });
  return found;
}

// Cherry's ordinary paragraphs and blockquotes are supplied by Milkdown's
// stock schema without a drag handle. Add an explicit, layout-neutral handle:
// treating any pointer movement in a paragraph as block movement prevents the
// browser from performing normal text selection. Only direct document blocks
// participate; nested list/compound content keeps its normal selection and
// drag semantics.
const cherryBlockDragDrop = $prose((ctx) => {
  const config = ctx.get(cherryWysiwygConfigCtx.key);
  return new Plugin({
    props: {
      decorations: (state) => {
        if (config.readonly) return DecorationSet.empty;
        const decorations: Decoration[] = [];
        state.doc.forEach((node, position) => {
          // Lists already own their left gutter for markers and task
          // checkboxes. Placing a generic handle in that same hit area can
          // steal clicks from those native controls, so list movement stays
          // available through normal selection/cut/paste instead.
          // Cherry headings already reserve their left gutter for the heading
          // anchor. A second interactive control in that same gutter makes the
          // anchor impossible to click, so headings deliberately do not get a
          // Milkdown drag handle.
          if (!['paragraph', 'blockquote'].includes(node.type.name)) return;
          let handlePosition = node.isTextblock ? position + 1 : undefined;
          if (handlePosition === undefined) {
            node.descendants((child, offset) => {
              if (!child.isTextblock) return true;
              handlePosition = position + 1 + offset + 1;
              return false;
            });
          }
          if (handlePosition === undefined) return;
          decorations.push(
            Decoration.node(position, position + node.nodeSize, { class: 'cherry-milkdown-block' }),
            Decoration.widget(
              handlePosition,
              () => {
                const handle = document.createElement('span');
                handle.className = 'cherry-milkdown-block__drag-handle';
                handle.dataset.cherryBlockDragHandle = '';
                handle.contentEditable = 'false';
                handle.setAttribute('role', 'button');
                handle.setAttribute('aria-label', '移动内容块');
                handle.title = '拖动移动内容块';
                return handle;
              },
              { side: -1 },
            ),
          );
        });
        return DecorationSet.create(state.doc, decorations);
      },
    },
    view: (view) => {
      if (config.readonly) return {};
      let dragged: CherryDraggedBlock | undefined;
      let over: HTMLElement | undefined;
      let pointerId: number | undefined;
      let startX = 0;
      let startY = 0;
      let moved = false;

      const clearOver = () => {
        over?.classList.remove('cherry-drag-over');
        over = undefined;
      };
      const removePointerListeners = () => {
        view.dom.ownerDocument.removeEventListener('pointermove', onPointerMove, true);
        view.dom.ownerDocument.removeEventListener('pointerup', finishPointerDrag, true);
        view.dom.ownerDocument.removeEventListener('pointercancel', finishPointerDrag, true);
      };
      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        const handle = event.target instanceof Element ? event.target.closest('[data-cherry-block-drag-handle]') : null;
        if (!handle || !view.dom.contains(handle)) return;
        const block = topLevelBlockAt(view, event.target);
        if (!block) return;
        dragged = block;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        moved = false;
        block.element.classList.add('cherry-dragging');
        try {
          (handle as HTMLElement).setPointerCapture?.(event.pointerId);
        } catch {
          // Synthetic accessibility tests may not create a browser pointer
          // session. Real mouse/touch input still receives pointer capture.
        }
        view.dom.ownerDocument.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
        view.dom.ownerDocument.addEventListener('pointerup', finishPointerDrag, { capture: true, passive: false });
        view.dom.ownerDocument.addEventListener('pointercancel', finishPointerDrag, {
          capture: true,
          passive: false,
        });
        event.preventDefault();
      };
      const reorder = (target: ReturnType<typeof topLevelBlockAt>) => {
        if (!dragged || !target || target.from === dragged.from) return false;
        const mappedTargetFrom = dragged.from < target.from ? target.from - dragged.node.nodeSize : target.from;
        // Dropping a block onto its immediate next sibling maps that
        // sibling back to the source position after deletion. Inserting at
        // that mapped position is a no-op (notably in Firefox/WebKit), so
        // cross the adjacent sibling while retaining the existing
        // insert-before behavior for more distant targets.
        const insertAt =
          dragged.from < target.from && mappedTargetFrom === dragged.from
            ? mappedTargetFrom + target.node.nodeSize
            : mappedTargetFrom;
        view.dispatch(
          view.state.tr
            .delete(dragged.from, dragged.from + dragged.node.nodeSize)
            .insert(insertAt, dragged.node)
            .scrollIntoView(),
        );
        return true;
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!dragged || event.pointerId !== pointerId) return;
        if (!moved && Math.hypot(event.clientX - startX, event.clientY - startY) < 4) return;
        moved = true;
        event.preventDefault();
        const direct = topLevelBlockAt(view, event.target);
        const hit = topLevelBlockAt(view, view.dom.ownerDocument.elementFromPoint(event.clientX, event.clientY));
        const block = direct && direct.from !== dragged.from ? direct : hit;
        clearOver();
        if (block && block.from !== dragged.from) {
          over = block.element;
          over.classList.add('cherry-drag-over');
        }
      };
      const finishPointerDrag = (event: PointerEvent) => {
        if (!dragged || event.pointerId !== pointerId) return;
        event.preventDefault();
        if (moved) {
          const direct = topLevelBlockAt(view, event.target);
          const hit = topLevelBlockAt(view, view.dom.ownerDocument.elementFromPoint(event.clientX, event.clientY));
          const remembered = topLevelBlockAt(view, over ?? null);
          let target = remembered;
          if (direct && direct.from !== dragged.from) target = direct;
          else if (hit && hit.from !== dragged.from) target = hit;
          reorder(target);
        }
        dragged = undefined;
        pointerId = undefined;
        moved = false;
        removePointerListeners();
        clearOver();
        view.dom.querySelector('.cherry-dragging')?.classList.remove('cherry-dragging');
      };

      view.dom.addEventListener('pointerdown', onPointerDown);
      return {
        destroy: () => {
          view.dom.removeEventListener('pointerdown', onPointerDown);
          removePointerListeners();
          clearOver();
        },
      };
    },
  });
});

const cherryTaskListToggle = $prose((ctx) => {
  const config = ctx.get(cherryWysiwygConfigCtx.key);
  return new Plugin({
    // Capture on this editor root before ProseMirror changes selection. This
    // keeps multiple preview-only Cherry instances completely isolated.
    view: (view) => {
      if (config.readonly) return {};
      const onPointerDown = (event: PointerEvent) => toggleTaskItem(view, event);
      view.dom.addEventListener('pointerdown', onPointerDown, true);
      return {
        destroy: () => view.dom.removeEventListener('pointerdown', onPointerDown, true),
      };
    },
  });
});

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
            if (node.type.name !== 'list_item' || node.attrs.checked === null || node.attrs.checked === undefined)
              return;
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
  cherryImageControls,
  ...cherryStructureSchemas,
  ...cherryStructureViews,
  cherryLinkEditor,
  cherryTextBubble,
  cherryTaskListToggle,
  cherryTaskListPresentation,
  cherryTableChartPreview,
  cherryBlockDragDrop,
  ...cherryWysiwygRemark,
].flat();
