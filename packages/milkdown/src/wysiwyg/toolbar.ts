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
  const actions = [
    ['标题 1', () => setHeading(view, 1)],
    ['标题 2', () => setHeading(view, 2)],
    ['表格', callTable],
    ['公式', () => insertNode(view, 'cherry_math_block')],
    ['Panel', () => insertNode(view, 'cherry_panel')],
    ['Detail', () => insertNode(view, 'cherry_detail')],
    ['目录', () => insertNode(view, 'cherry_toc')],
  ] as const;
  for (const [label, action] of actions) {
    menu.append(
      button(label, label, () => {
        const { $from } = view.state.selection;
        const text = $from.parent.textBetween(0, $from.parentOffset);
        if (text === '/') view.dispatch(view.state.tr.delete($from.pos - 1, $from.pos));
        menu.hidden = true;
        action();
      }),
    );
  }
  return menu;
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
      view.dom.parentElement?.prepend(slash);
      const updateSlash = () => {
        const { $from, empty } = view.state.selection;
        slash.hidden = !empty || !$from.parent.isTextblock || $from.parent.textBetween(0, $from.parentOffset) !== '/';
      };
      view.dom.addEventListener('keyup', updateSlash);
      return {
        update: updateSlash,
        destroy: () => {
          view.dom.removeEventListener('keyup', updateSlash);
          slash.remove();
        },
      };
    },
  });
});
