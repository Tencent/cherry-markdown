/**
 * WYSIWYG footnote plugin for Cherry Markdown.
 *
 * - ProseMirror decorations: assigns sequential data-index to refs/defs,
 *   inserts "脚注" title widget before first definition.
 * - Click handler: pops a bubble card showing footnote content near the reference.
 *
 * Node schemas come from @milkdown/preset-gfm. CSS in cherry.scss styles them.
 */
import { $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';

const footnoteKey = new PluginKey('cherryFootnote');

/** Singleton bubble element, reused across clicks */
let bubbleEl = null;

function removeBubble() {
  if (bubbleEl && bubbleEl.parentNode) {
    bubbleEl.parentNode.removeChild(bubbleEl);
  }
}

/**
 * Show a floating bubble card near the clicked footnote reference.
 */
function showFootnoteBubble(supEl, num, label, content, editorDom) {
  removeBubble();

  if (!bubbleEl) {
    bubbleEl = document.createElement('div');
    bubbleEl.className = 'cherry-fn-bubble';
  }

  bubbleEl.innerHTML = `
    <div class="cherry-fn-bubble__title">[${num}] ${label}</div>
    <div class="cherry-fn-bubble__content">${content}</div>
  `;

  // Position relative to the WYSIWYG container
  const container = editorDom.closest('.cherry-wysiwyg') || editorDom.parentElement;
  container.appendChild(bubbleEl);

  const supRect = supEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  let top = supRect.bottom - containerRect.top + container.scrollTop + 4;
  let left = supRect.left - containerRect.left;

  // Ensure bubble doesn't overflow right edge
  const bubbleWidth = Math.min(400, containerRect.width - 20);
  if (left + bubbleWidth > containerRect.width) {
    left = containerRect.width - bubbleWidth - 10;
  }
  if (left < 0) left = 10;

  bubbleEl.style.top = `${top}px`;
  bubbleEl.style.left = `${left}px`;
  bubbleEl.style.maxWidth = `${bubbleWidth}px`;

  // Remove on next click outside
  const onClickOutside = (e) => {
    if (!bubbleEl.contains(e.target)) {
      removeBubble();
      document.removeEventListener('click', onClickOutside, true);
    }
  };
  setTimeout(() => document.addEventListener('click', onClickOutside, true), 0);
}

/**
 * Scan document for footnote nodes and build numbering state.
 */
function computeFootnoteState(doc) {
  const labelToNum = new Map();
  const references = [];
  const definitions = [];
  let counter = 0;
  let firstDefPos = null;

  doc.descendants((node, pos) => {
    if (node.type.name === 'footnote_reference') {
      if (!labelToNum.has(node.attrs.label)) {
        labelToNum.set(node.attrs.label, ++counter);
      }
      references.push({ pos, size: node.nodeSize, label: node.attrs.label });
    }
    if (node.type.name === 'footnote_definition') {
      if (firstDefPos === null) firstDefPos = pos;
      definitions.push({ pos, size: node.nodeSize, label: node.attrs.label });
    }
  });

  for (const def of definitions) {
    if (!labelToNum.has(def.label)) {
      labelToNum.set(def.label, ++counter);
    }
  }

  return { labelToNum, references, definitions, firstDefPos };
}

export const footnotePlugin = $prose(() => {
  return new Plugin({
    key: footnoteKey,
    props: {
      decorations(state) {
        const { labelToNum, references, definitions, firstDefPos } = computeFootnoteState(state.doc);
        if (references.length === 0 && definitions.length === 0) {
          return DecorationSet.empty;
        }

        const decorations = [];

        // Widget: "脚注" title before first definition
        if (firstDefPos !== null) {
          decorations.push(
            Decoration.widget(
              firstDefPos,
              () => {
                const div = document.createElement('div');
                div.className = 'cherry-fn-title';
                div.textContent = '脚注';
                return div;
              },
              { side: -1, key: 'cherry-fn-title' },
            ),
          );
        }

        // Node decorations: data-index on references
        for (const ref of references) {
          const num = labelToNum.get(ref.label);
          if (num != null) {
            decorations.push(Decoration.node(ref.pos, ref.pos + ref.size, { 'data-index': String(num) }));
          }
        }

        // Node decorations: data-index on definitions
        for (const def of definitions) {
          const num = labelToNum.get(def.label);
          if (num != null) {
            decorations.push(Decoration.node(def.pos, def.pos + def.size, { 'data-index': String(num) }));
          }
        }

        return DecorationSet.create(state.doc, decorations);
      },

      handleClick(view, pos, event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return false;

        const sup = target.closest('sup[data-type="footnote_reference"]');
        if (!sup) return false;

        const label = sup.dataset.label;
        if (!label) return false;

        // Find definition content from ProseMirror document
        let defContent = '';
        view.state.doc.descendants((node) => {
          if (node.type.name === 'footnote_definition' && node.attrs.label === label) {
            defContent = node.textContent;
          }
        });

        if (!defContent) return true;

        // Get sequential number from decoration
        const num = sup.getAttribute('data-index') || '?';

        // Sanitize content for display (plain text only)
        const safeContent = defContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        showFootnoteBubble(sup, num, label, safeContent, view.dom);
        return true;
      },
    },
  });
});

export const footnote = [footnotePlugin].flat();
