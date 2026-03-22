/**
 * Milkdown node plugin for Cherry [[toc]] syntax.
 * Renders a live table of contents that auto-updates when headings change.
 * Features: edit entries, drag-and-drop reorder, adjust heading level,
 * add/delete headings, rich content rendering (ruby/pinyin).
 */
import { $nodeSchema, $command, $remark, $view, $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { DOMSerializer } from '@milkdown/kit/prose/model';
import { getNodeText } from './utils';

const NODE_NAME = 'cherry_toc';
const MDAST_TYPE = 'cherryToc';
const tocPluginKey = new PluginKey('cherry-toc-refresh');

let tocLocale = { toc: 'Table of Contents' };

export function setTocLocale(locale) {
  if (locale) tocLocale = locale;
}

// ---------------------------------------------------------------------------
// 1. Remark plugin
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
// 2. Node schema
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
      headings.push({ level: node.attrs.level || 1, text: node.textContent, pos, node });
    }
  });
  return headings;
}

function serializeInlineContent(headingNode, schema) {
  const serializer = DOMSerializer.fromSchema(schema);
  const fragment = serializer.serializeFragment(headingNode.content);
  const wrapper = document.createElement('span');
  wrapper.appendChild(fragment);
  return wrapper;
}

const activeTocViews = new Set();

// ---------------------------------------------------------------------------
// 4. NodeView
// ---------------------------------------------------------------------------
export const tocView = $view(tocSchema.node, () => (initialNode, view, getPos) => {
  const dom = document.createElement('div');
  dom.className = 'cherry-toc-block toc';
  dom.contentEditable = 'false';

  const titleEl = document.createElement('div');
  titleEl.className = 'toc-title';
  titleEl.textContent = tocLocale.toc || 'Table of Contents';
  dom.appendChild(titleEl);

  const listEl = document.createElement('ul');
  listEl.className = 'cherry-toc-list';
  dom.appendChild(listEl);

  let currentHeadings = [];
  let editingIndex = -1;
  let dragFromIndex = -1;

  // --- Document operations ---

  function syncTextToHeading(index, newText) {
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

  function changeHeadingLevel(index, delta) {
    const headings = collectHeadings(view.state.doc);
    if (index < 0 || index >= headings.length) return;
    const h = headings[index];
    const newLevel = Math.max(1, Math.min(6, h.level + delta));
    if (newLevel === h.level) return;
    const { state } = view;
    const tr = state.tr.setNodeMarkup(h.pos, undefined, { ...h.node.attrs, level: newLevel });
    view.dispatch(tr);
  }

  function addHeadingAfter(index) {
    const { state } = view;
    const headings = collectHeadings(state.doc);
    let insertPos;
    let level = 2;
    if (index >= 0 && index < headings.length) {
      const h = headings[index];
      level = h.level;
      insertPos = h.pos + h.node.nodeSize;
    } else {
      insertPos = state.doc.content.size;
    }
    const heading = state.schema.nodes.heading.create(
      { level },
      state.schema.text(tocLocale.newHeading || 'New Heading'),
    );
    const tr = state.tr.insert(insertPos, heading);
    view.dispatch(tr);
  }

  function deleteHeading(index) {
    const headings = collectHeadings(view.state.doc);
    if (index < 0 || index >= headings.length) return;
    const h = headings[index];
    const { state } = view;
    const tr = state.tr.delete(h.pos, h.pos + h.node.nodeSize);
    view.dispatch(tr);
  }

  function moveHeading(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    const headings = collectHeadings(view.state.doc);
    if (fromIdx < 0 || fromIdx >= headings.length) return;
    if (toIdx < 0 || toIdx > headings.length) return;

    const { state } = view;
    const src = headings[fromIdx];
    const srcNode = state.doc.nodeAt(src.pos);
    if (!srcNode) return;

    // Determine insert position: before the target heading, or at doc end
    let targetPos;
    if (toIdx < headings.length) {
      targetPos = headings[toIdx].pos;
    } else {
      targetPos = state.doc.content.size;
    }

    let tr = state.tr;
    // If moving forward, delete first then insert; if backward, insert first then delete
    if (fromIdx < toIdx) {
      // Insert copy at target, then delete original
      const insertPos = toIdx < headings.length ? headings[toIdx].pos : state.doc.content.size;
      tr = tr.insert(insertPos, srcNode);
      tr = tr.delete(tr.mapping.map(src.pos), tr.mapping.map(src.pos + srcNode.nodeSize));
    } else {
      // Delete original, then insert at target
      tr = tr.delete(src.pos, src.pos + srcNode.nodeSize);
      const mappedTarget = tr.mapping.map(targetPos);
      tr = tr.insert(mappedTarget, srcNode);
    }
    view.dispatch(tr);
  }

  // --- Render ---

  function render() {
    const headings = collectHeadings(view.state.doc);

    if (editingIndex >= 0 && headings.length === currentHeadings.length) return;

    currentHeadings = headings;
    listEl.innerHTML = '';

    if (headings.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'toc-li toc-empty';
      empty.textContent = tocLocale.emptyToc || '(No headings)';
      const addBtn = createIconButton('+', 'cherry-toc-btn cherry-toc-add', () => addHeadingAfter(-1));
      empty.appendChild(addBtn);
      listEl.appendChild(empty);
      return;
    }

    headings.forEach((h, idx) => {
      const li = document.createElement('li');
      li.className = `toc-li toc-li-${h.level}`;
      li.dataset.index = idx;

      // Drag handle
      const handle = document.createElement('span');
      handle.className = 'cherry-toc-handle';
      handle.textContent = '⠿';
      handle.draggable = true;
      handle.addEventListener('dragstart', (e) => {
        dragFromIndex = idx;
        e.dataTransfer.effectAllowed = 'move';
        li.classList.add('cherry-toc-dragging');
      });
      handle.addEventListener('dragend', () => {
        dragFromIndex = -1;
        li.classList.remove('cherry-toc-dragging');
        listEl.querySelectorAll('.cherry-toc-drop-above,.cherry-toc-drop-below').forEach(
          (el) => { el.classList.remove('cherry-toc-drop-above', 'cherry-toc-drop-below'); },
        );
      });
      li.appendChild(handle);

      // Content — rich rendering with ruby etc.
      const content = document.createElement('span');
      content.className = `level-${h.level} cherry-toc-entry`;
      const richContent = serializeInlineContent(h.node, view.state.schema);
      content.appendChild(richContent);
      content.addEventListener('mousedown', (e) => e.stopPropagation());

      // Double-click to edit as plain text
      content.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        enterEditMode(content, idx, h.text);
      });

      li.appendChild(content);

      // Action buttons
      const actions = document.createElement('span');
      actions.className = 'cherry-toc-actions';

      actions.appendChild(createIconButton('←', 'cherry-toc-btn', () => changeHeadingLevel(idx, -1)));
      actions.appendChild(createIconButton('→', 'cherry-toc-btn', () => changeHeadingLevel(idx, 1)));
      actions.appendChild(createIconButton('+', 'cherry-toc-btn cherry-toc-add', () => addHeadingAfter(idx)));
      actions.appendChild(createIconButton('×', 'cherry-toc-btn cherry-toc-del', () => deleteHeading(idx)));

      li.appendChild(actions);

      // Drop zone
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = li.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
          li.classList.add('cherry-toc-drop-above');
          li.classList.remove('cherry-toc-drop-below');
        } else {
          li.classList.add('cherry-toc-drop-below');
          li.classList.remove('cherry-toc-drop-above');
        }
      });
      li.addEventListener('dragleave', () => {
        li.classList.remove('cherry-toc-drop-above', 'cherry-toc-drop-below');
      });
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('cherry-toc-drop-above', 'cherry-toc-drop-below');
        if (dragFromIndex < 0) return;
        const rect = li.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dropIdx = e.clientY < mid ? idx : idx + 1;
        const adjustedTarget = dragFromIndex < dropIdx ? dropIdx - 1 : dropIdx;
        moveHeading(dragFromIndex, adjustedTarget);
        dragFromIndex = -1;
      });

      listEl.appendChild(li);
    });
  }

  function enterEditMode(contentEl, idx, originalText) {
    editingIndex = idx;
    contentEl.textContent = originalText;
    contentEl.contentEditable = 'true';
    contentEl.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(contentEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const handleBlur = () => {
      contentEl.contentEditable = 'false';
      contentEl.removeEventListener('blur', handleBlur);
      contentEl.removeEventListener('keydown', handleKey);
      contentEl.removeEventListener('paste', handlePaste);
      const wasEditing = editingIndex;
      editingIndex = -1;
      syncTextToHeading(wasEditing, contentEl.textContent);
      requestAnimationFrame(() => render());
    };

    const handleKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        contentEl.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        contentEl.textContent = originalText;
        editingIndex = -1;
        contentEl.blur();
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\n/g, ' ');
      document.execCommand('insertText', false, text);
    };

    contentEl.addEventListener('blur', handleBlur);
    contentEl.addEventListener('keydown', handleKey);
    contentEl.addEventListener('paste', handlePaste);
  }

  function createIconButton(text, className, onClick) {
    const btn = document.createElement('button');
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
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
    ignoreMutation() { return true; },
    stopEvent() { return true; },
    destroy() { activeTocViews.delete(instance); },
  };
});

// ---------------------------------------------------------------------------
// 5. Refresh plugin
// ---------------------------------------------------------------------------
export const tocRefreshPlugin = $prose(() => new Plugin({
  key: tocPluginKey,
  view() {
    return {
      update(editorView, prevState) {
        if (editorView.state.doc.eq(prevState.doc)) return;
        for (const tocInstance of activeTocViews) {
          tocInstance.render();
        }
      },
    };
  },
}));

// ---------------------------------------------------------------------------
// 6. Command
// ---------------------------------------------------------------------------
export const insertTocCommand = $command('InsertToc', (ctx) => () =>
  (state, dispatch) => {
    const nodeType = state.schema.nodes[NODE_NAME];
    if (!nodeType) return false;
    dispatch?.(state.tr.replaceSelectionWith(nodeType.create()));
    return true;
  },
);

// ---------------------------------------------------------------------------
// 7. Export
// ---------------------------------------------------------------------------
export const toc = [remarkTocPlugin, tocSchema, insertTocCommand, tocView, tocRefreshPlugin].flat();
