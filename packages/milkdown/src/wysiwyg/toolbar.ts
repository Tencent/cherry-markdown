import { commandsCtx } from '@milkdown/kit/core';
import { setBlockType } from '@milkdown/kit/prose/commands';
import type { EditorState, Transaction } from '@milkdown/kit/prose/state';
import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { insertTableCommand } from '@milkdown/kit/preset/gfm';
import { $prose } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';

type ViewCommand = (state: EditorState, dispatch?: (transaction: Transaction) => void) => boolean;

function button(label: string, title: string, run: () => void) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.title = title;
  element.addEventListener('mousedown', (event) => event.preventDefault());
  element.addEventListener('click', run);
  return element;
}

function run(view: EditorView, command: ViewCommand) {
  command(view.state, view.dispatch);
  view.focus();
}

function setHeading(view: EditorView, level?: number) {
  const type = view.state.schema.nodes[level ? 'heading' : 'paragraph'];
  if (type) run(view, setBlockType(type, level ? { level } : undefined));
}

function setCodeBlock(view: EditorView) {
  const type = view.state.schema.nodes.code_block;
  if (type) run(view, setBlockType(type, { language: '' }));
}

function insertNode(view: EditorView, name: string) {
  const { schema } = view.state;
  const type = schema.nodes[name];
  const { paragraph } = schema.nodes;
  if (!type || !paragraph) return;
  let node;
  if (name === 'cherry_panel')
    node = type.create({ kind: 'info', rawType: 'info', title: '', source: '', originalBody: '' }, paragraph.create());
  else if (name === 'cherry_detail') {
    const item = schema.nodes.cherry_compound_item?.create(
      { role: 'detail-item', label: '详情', open: false },
      paragraph.create(),
    );
    node = item
      ? type.create({ kind: 'detail', rawType: 'detail', title: '', source: '', originalBody: '' }, item)
      : undefined;
  } else if (name === 'cherry_toc') node = type.create({ source: '[[toc]]' });
  else if (name === 'cherry_math_block') node = type.create({ value: '', source: '' });
  if (!node) return;
  view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
  view.focus();
}

function createSlashMenu(view: EditorView, callTable: () => void) {
  const menu = document.createElement('div');
  menu.className = 'cherry-milkdown-slash';
  menu.hidden = true;
  menu.setAttribute('role', 'listbox');
  const actions = [
    ['正文', () => setHeading(view)],
    ['标题 1', () => setHeading(view, 1)],
    ['标题 2', () => setHeading(view, 2)],
    ['标题 3', () => setHeading(view, 3)],
    ['标题 4', () => setHeading(view, 4)],
    ['标题 5', () => setHeading(view, 5)],
    ['标题 6', () => setHeading(view, 6)],
    ['代码块', () => setCodeBlock(view)],
    ['表格', callTable],
    ['公式', () => insertNode(view, 'cherry_math_block')],
    ['Panel', () => insertNode(view, 'cherry_panel')],
    ['Detail', () => insertNode(view, 'cherry_detail')],
    ['目录', () => insertNode(view, 'cherry_toc')],
  ] as const;
  let activeIndex = 0;
  const buttons = actions.map(([label], index) => {
    const item = button(label, label, () => runAction(index));
    item.setAttribute('role', 'option');
    item.tabIndex = -1;
    menu.append(item);
    return item;
  });

  function setActive(index: number) {
    activeIndex = (index + buttons.length) % buttons.length;
    buttons.forEach((item, itemIndex) => {
      const active = itemIndex === activeIndex;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    buttons[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }

  function runAction(index: number) {
    const { $from } = view.state.selection;
    const text = $from.parent.textBetween(0, $from.parentOffset);
    if (text === '/') view.dispatch(view.state.tr.delete($from.pos - 1, $from.pos));
    menu.hidden = true;
    actions[index]?.[1]();
  }

  const update = () => {
    const { $from, empty } = view.state.selection;
    const visible = empty && $from.parent.isTextblock && $from.parent.textBetween(0, $from.parentOffset) === '/';
    menu.hidden = !visible;
    if (!visible) return;
    const host = view.dom.parentElement;
    if (host) {
      const coordinates = view.coordsAtPos($from.pos);
      const hostRect = host.getBoundingClientRect();
      menu.style.left = `${Math.max(0, coordinates.left - hostRect.left)}px`;
      menu.style.top = `${Math.max(0, coordinates.bottom - hostRect.top + 4)}px`;
    }
    setActive(0);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (menu.hidden) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runAction(activeIndex);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      menu.hidden = true;
    }
  };

  setActive(0);
  return { menu, onKeydown, update };
}

export const cherryToolbar = $prose((ctx) => {
  const config = ctx.get(cherryWysiwygConfigCtx.key);
  return new Plugin({
    view: (view) => {
      if (config.readonly) return {};
      const callTable = () => {
        ctx.get(commandsCtx).call(insertTableCommand.key, { row: 3, col: 3 });
        view.focus();
      };
      const slash = createSlashMenu(view, callTable);
      view.dom.parentElement?.prepend(slash.menu);
      view.dom.addEventListener('keydown', slash.onKeydown, true);
      return {
        update: slash.update,
        destroy: () => {
          view.dom.removeEventListener('keydown', slash.onKeydown, true);
          slash.menu.remove();
        },
      };
    },
  });
});
