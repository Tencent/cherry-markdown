/**
 * Milkdown node plugin for Cherry [[toc]] syntax.
 * Renders a live table of contents that auto-updates when headings change.
 * Editing a TOC entry directly edits the original heading in the document.
 */
import { $nodeSchema, $command, $remark, $view, $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { getNodeText } from './utils';

const NODE_NAME = 'cherry_toc';
const MDAST_TYPE = 'cherryToc';
const tocPluginKey = new PluginKey('cherry-toc-refresh');

// ---------------------------------------------------------------------------
// 1. Remark plugin: transform [[toc]] / [toc] paragraph into cherryToc node
// ---------------------------------------------------------------------------
const TOC_PATTERN = /^\[{1,2}toc\]{1,2}$/i;

function remarkCherryToc() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE]() {
        return '[[toc]]';
      },
    },
  });

  return (tree) => {
    if (!tree.children) return;
    const newChildren = [];
    for (const child of tree.children) {
      if (child.type === 'paragraph') {
        const text = getNodeText(child).trim();
        if (TOC_PATTERN.test(text)) {
          newChildren.push({ type: MDAST_TYPE });
          continue;
        }
      }
      newChildren.push(child);
    }
    tree.children = newChildren;
  };
}

export const remarkTocPlugin = $remark('remarkCherryToc', () => remarkCherryToc);

// ---------------------------------------------------------------------------
// 2. Node schema: cherry_toc is an atom (leaf) block node
// ---------------------------------------------------------------------------
export const tocSchema = $nodeSchema(NODE_NAME, () => ({
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  isolating: true,
  attrs: {},
  parseDOM: [{ tag: 'div.cherry-toc-block' }],
  toDOM: () => ['div', { class: 'cherry-toc-block' }],
  parseMarkdown: {
    match: (node) => node.type === MDAST_TYPE,
    runner: (state, _node, type) => {
      state.addNode(type);
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === NODE_NAME,
    runner: (state) => {
      state.addNode(MDAST_TYPE);
    },
  },
}));

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------
function collectHeadings(doc) {
  const headings = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        level: node.attrs.level || 1,
        text: node.textContent,
        pos,
      });
    }
  });
  return headings;
}

// Global registry of active TOC views for the refresh plugin to notify
const activeTocViews = new Set();

// ---------------------------------------------------------------------------
// 4. NodeView: renders live TOC with editable entries
// ---------------------------------------------------------------------------
export const tocView = $view(tocSchema.node, () => (initialNode, view, getPos) => {
  const dom = document.createElement('div');
  dom.className = 'cherry-toc-block toc';
  dom.contentEditable = 'false';

  const titleEl = document.createElement('div');
  titleEl.className = 'toc-title';
  titleEl.textContent = 'Table of Contents';
  dom.appendChild(titleEl);

  const listEl = document.createElement('ul');
  listEl.className = 'cherry-toc-list';
  dom.appendChild(listEl);

  let currentHeadings = [];
  let editingIndex = -1; // track which entry is being edited to avoid re-render disruption

  function render() {
    const headings = collectHeadings(view.state.doc);

    // Skip re-render if an entry is being edited and headings haven't structurally changed
    if (editingIndex >= 0) {
      if (headings.length === currentHeadings.length) return;
    }

    currentHeadings = headings;
    listEl.innerHTML = '';

    if (headings.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'toc-li toc-empty';
      empty.textContent = '(No headings found)';
      listEl.appendChild(empty);
      return;
    }

    headings.forEach((h, idx) => {
      const li = document.createElement('li');
      li.className = `toc-li toc-li-${h.level}`;

      const span = document.createElement('span');
      span.className = `level-${h.level} cherry-toc-entry`;
      span.textContent = h.text;
      span.contentEditable = 'true';
      span.dataset.index = idx;
      span.setAttribute('spellcheck', 'false');

      span.addEventListener('mousedown', (e) => e.stopPropagation());
      span.addEventListener('focus', () => { editingIndex = idx; });
      span.addEventListener('blur', () => {
        const wasEditing = editingIndex;
        editingIndex = -1;
        syncToHeading(wasEditing, span.textContent);
        requestAnimationFrame(() => render());
      });
      span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          span.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          span.textContent = currentHeadings[idx]?.text || '';
          editingIndex = -1;
          span.blur();
        }
      });
      // Only allow plain text paste, strip newlines
      span.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\n/g, ' ');
        document.execCommand('insertText', false, text);
      });
      span.addEventListener('drop', (e) => e.preventDefault());

      li.appendChild(span);
      listEl.appendChild(li);
    });
  }

  function syncToHeading(index, newText) {
    const headings = collectHeadings(view.state.doc);
    if (index < 0 || index >= headings.length) return;
    const h = headings[index];
    if (h.text === newText) return;

    const { state } = view;
    const headingNode = state.doc.nodeAt(h.pos);
    if (!headingNode) return;
    const from = h.pos + 1;
    const to = from + headingNode.content.size;
    const tr = state.tr.replaceWith(from, to, newText ? state.schema.text(newText) : []);
    view.dispatch(tr);
  }

  render();

  const instance = { render };
  activeTocViews.add(instance);

  return {
    dom,
    update(updatedNode) {
      if (updatedNode.type.name !== NODE_NAME) return false;
      return true;
    },
    ignoreMutation() {
      return true;
    },
    stopEvent() {
      return true;
    },
    destroy() {
      activeTocViews.delete(instance);
    },
  };
});

// ---------------------------------------------------------------------------
// 5. ProseMirror Plugin: watch document changes and refresh all TOC views
// ---------------------------------------------------------------------------
export const tocRefreshPlugin = $prose(() => new Plugin({
  key: tocPluginKey,
  view() {
    return {
      update(editorView, prevState) {
        if (editorView.state.doc.eq(prevState.doc)) return;
        // Document changed — refresh all active TOC views
        for (const tocInstance of activeTocViews) {
          tocInstance.render();
        }
      },
    };
  },
}));

// ---------------------------------------------------------------------------
// 6. Command: insert a TOC node
// ---------------------------------------------------------------------------
export const insertTocCommand = $command('InsertToc', (ctx) => () =>
  (state, dispatch) => {
    const nodeType = state.schema.nodes[NODE_NAME];
    if (!nodeType) return false;
    const tocNode = nodeType.create();
    dispatch?.(state.tr.replaceSelectionWith(tocNode));
    return true;
  },
);

// ---------------------------------------------------------------------------
// 7. Export
// ---------------------------------------------------------------------------
export const toc = [remarkTocPlugin, tocSchema, insertTocCommand, tocView, tocRefreshPlugin].flat();
