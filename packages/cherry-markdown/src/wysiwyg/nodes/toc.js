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
  let dragStartX = 0;
  let dragFromLevel = 1;
  let dragLevelDelta = 0;

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

  /**
   * Get the section range for a heading: from the heading pos to the start
   * of the next heading at the same or higher level (or end of doc).
   */
  function getSectionRange(doc, headings, idx) {
    const start = headings[idx].pos;
    const level = headings[idx].level;
    // Find next heading at same or higher level
    for (let i = idx + 1; i < headings.length; i++) {
      if (headings[i].level <= level) {
        return { start, end: headings[i].pos };
      }
    }
    return { start, end: doc.content.size };
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'cherry-toc-toast';
    toast.textContent = message;
    dom.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('cherry-toc-toast-show'));
    setTimeout(() => {
      toast.classList.remove('cherry-toc-toast-show');
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }

  function countSectionContent(doc, headings, fromIdx) {
    const section = getSectionRange(doc, headings, fromIdx);
    let subHeadings = 0;
    let blocks = 0;
    doc.nodesBetween(section.start, section.end, (node, pos) => {
      if (pos === section.start) return true; // skip the heading itself
      if (node.isBlock && node.type.name !== 'doc') {
        if (node.type.name === 'heading') subHeadings++;
        else blocks++;
        return false;
      }
      return true;
    });
    return { subHeadings, blocks };
  }

  function moveHeading(fromIdx, toIdx, levelDelta) {
    const headings = collectHeadings(view.state.doc);
    if (fromIdx < 0 || fromIdx >= headings.length) return;
    if (toIdx < 0 || toIdx > headings.length) return;

    const { state } = view;
    const src = headings[fromIdx];
    const newLevel = Math.max(1, Math.min(6, src.level + (levelDelta || 0)));
    const needMove = fromIdx !== toIdx;
    const needLevel = newLevel !== src.level;
    if (!needMove && !needLevel) return;

    // Count section content before moving for user notification
    const { subHeadings, blocks } = countSectionContent(state.doc, headings, fromIdx);

    // Section = heading + all content until next same-or-higher-level heading
    const section = getSectionRange(state.doc, headings, fromIdx);

    let tr = state.tr;

    // Apply level changes to the heading and all sub-headings in the section
    if (needLevel) {
      const delta = newLevel - src.level;
      for (let i = fromIdx; i < headings.length; i++) {
        if (i > fromIdx && headings[i].level <= src.level) break;
        const h = headings[i];
        const adjusted = Math.max(1, Math.min(6, h.level + delta));
        if (adjusted !== h.level) {
          tr = tr.setNodeMarkup(tr.mapping.map(h.pos), undefined, { ...h.node.attrs, level: adjusted });
        }
      }
    }

    if (needMove) {
      let targetPos;
      if (toIdx < headings.length) {
        targetPos = headings[toIdx].pos;
      } else {
        targetPos = state.doc.content.size;
      }

      const mappedStart = tr.mapping.map(section.start);
      const mappedEnd = tr.mapping.map(section.end);
      const updatedSlice = tr.doc.slice(mappedStart, mappedEnd);

      if (fromIdx < toIdx) {
        const mappedTarget = tr.mapping.map(targetPos);
        tr = tr.insert(mappedTarget, updatedSlice.content);
        tr = tr.delete(tr.mapping.map(mappedStart), tr.mapping.map(mappedEnd));
      } else {
        tr = tr.delete(mappedStart, mappedEnd);
        const mappedTarget = tr.mapping.map(targetPos);
        tr = tr.insert(mappedTarget, updatedSlice.content);
      }
    }

    view.dispatch(tr);

    // Show toast if section had extra content
    if (subHeadings > 0 || blocks > 0) {
      const parts = [];
      if (subHeadings > 0) parts.push(tocLocale.subHeadingCount
        ? tocLocale.subHeadingCount.replace('{n}', subHeadings)
        : `${subHeadings} sub-heading(s)`);
      if (blocks > 0) parts.push(tocLocale.blockCount
        ? tocLocale.blockCount.replace('{n}', blocks)
        : `${blocks} block(s)`);
      const msg = tocLocale.sectionMoved
        ? tocLocale.sectionMoved.replace('{content}', parts.join(tocLocale.and || ', '))
        : `Moved with ${parts.join(', ')}`;
      showToast(msg);
    }
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
        dragStartX = e.clientX;
        dragFromLevel = h.level;
        dragLevelDelta = 0;
        e.dataTransfer.effectAllowed = 'move';
        li.classList.add('cherry-toc-dragging');
      });
      handle.addEventListener('dragend', () => {
        dragFromIndex = -1;
        dragLevelDelta = 0;
        li.classList.remove('cherry-toc-dragging');
        listEl.querySelectorAll('.cherry-toc-drop-above,.cherry-toc-drop-below').forEach(
          (el) => {
            el.classList.remove('cherry-toc-drop-above', 'cherry-toc-drop-below');
            el.style.removeProperty('--drop-indent');
          },
        );
      });
      li.appendChild(handle);

      // Content — rich rendering with ruby etc.
      const content = document.createElement('span');
      content.className = `level-${h.level} cherry-toc-entry`;
      const richContent = serializeInlineContent(h.node, view.state.schema);
      content.appendChild(richContent);
      content.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (editingIndex === idx) return;
        // Record click X position for cursor placement after DOM swap
        content._clickX = e.clientX;
      });

      content.addEventListener('click', (e) => {
        e.stopPropagation();
        if (editingIndex === idx) return;
        enterEditMode(content, idx, h.text, content._clickX);
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

        // Horizontal offset → level delta (every 20px = 1 level)
        const dx = e.clientX - dragStartX;
        const rawDelta = Math.round(dx / 20);
        dragLevelDelta = Math.max(1 - dragFromLevel, Math.min(6 - dragFromLevel, rawDelta));
        const targetLevel = dragFromLevel + dragLevelDelta;

        // Visual indicator — match the actual padding-left of the target level
        const indent = (targetLevel - 1) * 1.2;
        li.style.setProperty('--drop-indent', `calc(var(--md-toc-indicator-gap, 16px) + ${indent}em)`);

        // When target level is deeper than hovered heading, dropping on
        // top-half means "first child of this heading" → show below indicator.
        const isChild = targetLevel > h.level;
        if (isChild || e.clientY >= mid) {
          li.classList.add('cherry-toc-drop-below');
          li.classList.remove('cherry-toc-drop-above');
        } else {
          li.classList.add('cherry-toc-drop-above');
          li.classList.remove('cherry-toc-drop-below');
        }
      });
      li.addEventListener('dragleave', () => {
        li.classList.remove('cherry-toc-drop-above', 'cherry-toc-drop-below');
        li.style.removeProperty('--drop-indent');
      });
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('cherry-toc-drop-above', 'cherry-toc-drop-below');
        li.style.removeProperty('--drop-indent');
        if (dragFromIndex < 0) return;

        // Ignore drop onto own section's sub-headings
        const fromLevel = currentHeadings[dragFromIndex]?.level;
        if (idx > dragFromIndex && idx < currentHeadings.length) {
          let inSection = true;
          for (let i = dragFromIndex + 1; i <= idx; i++) {
            if (currentHeadings[i].level <= fromLevel) { inSection = false; break; }
          }
          if (inSection) { dragFromIndex = -1; dragLevelDelta = 0; return; }
        }

        const rect = li.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const targetLevel = dragFromLevel + dragLevelDelta;

        // If target level is deeper than hovered heading, always insert
        // after it (as its child), not before (which would land under
        // the previous parent).
        const isChild = targetLevel > h.level;
        const dropIdx = (isChild || e.clientY >= mid) ? idx + 1 : idx;
        const adjustedTarget = dragFromIndex < dropIdx ? dropIdx - 1 : dropIdx;
        moveHeading(dragFromIndex, adjustedTarget, dragLevelDelta);
        dragFromIndex = -1;
        dragLevelDelta = 0;
      });

      listEl.appendChild(li);
    });
  }

  function enterEditMode(contentEl, idx, originalText, clickX) {
    editingIndex = idx;

    // Wrap in an intermediate contentEditable container to isolate from
    // the outer contentEditable='false' div (which must stay to keep
    // ProseMirror node view behavior intact, including drag-and-drop).
    const editWrapper = document.createElement('span');
    editWrapper.contentEditable = 'true';
    editWrapper.className = 'cherry-toc-edit-wrapper';
    editWrapper.style.cssText = 'display:inline;outline:none;caret-color:auto;';
    contentEl.textContent = '';
    contentEl.appendChild(editWrapper);
    editWrapper.textContent = originalText;
    editWrapper.focus();

    // Place cursor at click position
    if (clickX !== undefined) {
      const rect = editWrapper.getBoundingClientRect();
      const y = rect.top + rect.height / 2;
      let caretRange;
      if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(clickX, y);
        if (pos) {
          caretRange = document.createRange();
          caretRange.setStart(pos.offsetNode, pos.offset);
          caretRange.collapse(true);
        }
      } else if (document.caretRangeFromPoint) {
        caretRange = document.caretRangeFromPoint(clickX, y);
      }
      if (caretRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(caretRange);
      }
    }

    const handleBlur = () => {
      const newText = editWrapper.textContent;
      editWrapper.removeEventListener('blur', handleBlur);
      editWrapper.removeEventListener('keydown', handleKey);
      editWrapper.removeEventListener('paste', handlePaste);
      const wasEditing = editingIndex;
      editingIndex = -1;
      syncTextToHeading(wasEditing, newText);
      requestAnimationFrame(() => render());
    };

    const handleKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        editWrapper.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        editWrapper.textContent = originalText;
        editingIndex = -1;
        editWrapper.blur();
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\n/g, ' ');
      document.execCommand('insertText', false, text);
    };

    editWrapper.addEventListener('blur', handleBlur);
    editWrapper.addEventListener('keydown', handleKey);
    editWrapper.addEventListener('paste', handlePaste);
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
