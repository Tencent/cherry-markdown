/**
 * WYSIWYG footnote plugin for Cherry Markdown.
 *
 * - ProseMirror decorations: assigns sequential data-index to refs/defs,
 *   inserts "脚注" title widget before first definition.
 * - Click handler: pops a bubble card showing footnote content near the reference.
 *
 * Node schemas come from @milkdown/preset-gfm. CSS in cherry.scss styles them.
 */
import { $prose, $command } from '@milkdown/kit/utils';
import { Plugin, PluginKey, Selection } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';

const footnoteKey = new PluginKey('cherryFootnote');

/** Singleton bubble element, reused across clicks */
let bubbleEl = null;
let activeClickOutsideHandler = null;

function removeBubble() {
  if (activeClickOutsideHandler) {
    document.removeEventListener('click', activeClickOutsideHandler, true);
    activeClickOutsideHandler = null;
  }
  if (bubbleEl && bubbleEl.parentNode) {
    bubbleEl.parentNode.removeChild(bubbleEl);
  }
}

/**
 * Update a footnote_definition node's content in ProseMirror.
 */
function updateFootnoteDefinition(view, label, newContent) {
  const { state } = view;
  let targetPos = null;
  let targetNode = null;
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'footnote_definition' && node.attrs.label === label) {
      targetPos = pos;
      targetNode = node;
    }
  });
  if (targetPos == null || !targetNode) return;

  const paragraph = state.schema.nodes.paragraph.create(
    null,
    newContent ? state.schema.text(newContent) : null,
  );
  const tr = state.tr.replaceWith(targetPos + 1, targetPos + targetNode.content.size + 1, paragraph);
  view.dispatch(tr);
}

/**
 * Show a floating bubble card near the clicked footnote reference.
 * Content is editable; changes sync back to the ProseMirror document on close.
 */
function showFootnoteBubble(supEl, num, label, content, editorDom, view) {
  removeBubble();

  if (!bubbleEl) {
    bubbleEl = document.createElement('div');
    bubbleEl.className = 'cherry-fn-bubble';
  }

  const safeLabel = label.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  bubbleEl.innerHTML = `
    <div class="cherry-fn-bubble__title">[${num}] ${safeLabel}</div>
    <div class="cherry-fn-bubble__content" contenteditable="true"></div>
  `;

  // Set content as text (not innerHTML) to avoid XSS
  const contentEl = bubbleEl.querySelector('.cherry-fn-bubble__content');
  contentEl.textContent = content;

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

  // Focus the content area for immediate editing
  contentEl.focus();

  // On close: sync edited content back to ProseMirror document
  const onClickOutside = (e) => {
    if (!bubbleEl.contains(e.target)) {
      const newContent = contentEl.textContent;
      if (newContent !== content) {
        updateFootnoteDefinition(view, label, newContent);
      }
      removeBubble();
    }
  };
  activeClickOutsideHandler = onClickOutside;
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
    view() {
      return { destroy() { removeBubble(); } };
    },
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

      handleKeyDown(view, event) {
        if (event.key !== 'Enter') return false;

        const { state } = view;
        const { $from } = state.selection;
        const { definitions, firstDefPos } = computeFootnoteState(state.doc);
        if (definitions.length === 0 || firstDefPos === null) return false;

        // Only intercept if cursor is inside a footnote_definition node
        let insideFootnoteDef = false;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'footnote_definition') { insideFootnoteDef = true; break; }
        }
        if (!insideFootnoteDef) return false;

        // Insert a new paragraph before the first footnote definition and move cursor there
        const paragraph = state.schema.nodes.paragraph.create();
        const tr = state.tr.insert(firstDefPos, paragraph);
        tr.setSelection(Selection.near(tr.doc.resolve(firstDefPos + 1)));
        view.dispatch(tr);
        return true;
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

        showFootnoteBubble(sup, num, label, defContent, view.dom, view);
        return true;
      },
    },
  });
});

/**
 * Command: insert a footnote reference at cursor + definition at document end.
 * Payload: { label?: string } — auto-generates label if omitted.
 */
export const insertFootnoteCommand = $command('InsertFootnote', (ctx) => (opts = {}) =>
  (state, dispatch) => {
    const refType = state.schema.nodes.footnote_reference;
    const defType = state.schema.nodes.footnote_definition;
    if (!refType || !defType) return false;

    // Determine next available label
    const { labelToNum } = computeFootnoteState(state.doc);
    const nextNum = labelToNum.size + 1;
    const label = opts.label || `fn${nextNum}`;

    // Insert reference at cursor
    const refNode = refType.create({ label });
    let tr = state.tr.replaceSelectionWith(refNode);

    // Insert definition at document end
    const paragraph = state.schema.nodes.paragraph.create(null, state.schema.text('脚注内容'));
    const defNode = defType.create({ label }, paragraph);
    tr = tr.insert(tr.doc.content.size, defNode);

    dispatch?.(tr.scrollIntoView());
    return true;
  },
);

export const footnote = [footnotePlugin, insertFootnoteCommand].flat();
