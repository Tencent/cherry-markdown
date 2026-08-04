import { commandsCtx } from '@milkdown/kit/core';
import { setBlockType, toggleMark, wrapIn } from '@milkdown/kit/prose/commands';
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

function applyMark(view: EditorView, name: string, attrs?: Record<string, string>) {
  const type = view.state.schema.marks[name];
  if (type) run(view, toggleMark(type, attrs));
}

function setHeading(view: EditorView, level?: number) {
  const type = view.state.schema.nodes[level ? 'heading' : 'paragraph'];
  if (type) run(view, setBlockType(type, level ? { level } : undefined));
}

function wrap(view: EditorView, name: string) {
  const type = view.state.schema.nodes[name];
  if (type) run(view, wrapIn(type));
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

function createToolbar(view: EditorView, callTable: () => void) {
  const toolbar = document.createElement('div');
  toolbar.className = 'cherry-milkdown-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.append(
    button('¶', '正文', () => setHeading(view)),
    button('H1', '一级标题', () => setHeading(view, 1)),
    button('H2', '二级标题', () => setHeading(view, 2)),
    button('B', '粗体', () => applyMark(view, 'strong')),
    button('I', '斜体', () => applyMark(view, 'emphasis')),
    button('U', '下划线', () => applyMark(view, 'cherry_underline')),
    button('==', '高亮', () => applyMark(view, 'cherry_highlight')),
    button('x₂', '下标', () => applyMark(view, 'cherry_subscript')),
    button('x²', '上标', () => applyMark(view, 'cherry_superscript')),
    button('❝', '引用', () => wrap(view, 'blockquote')),
    button('•', '无序列表', () => wrap(view, 'bullet_list')),
    button('1.', '有序列表', () => wrap(view, 'ordered_list')),
    button('表格', '插入表格', callTable),
    button('公式', '插入公式', () => insertNode(view, 'cherry_math_block')),
    button('Panel', '插入 Panel', () => insertNode(view, 'cherry_panel')),
    button('Detail', '插入 Detail', () => insertNode(view, 'cherry_detail')),
    button('TOC', '插入目录', () => insertNode(view, 'cherry_toc')),
  );
  const color = document.createElement('input');
  color.type = 'color';
  color.title = '文字颜色';
  color.setAttribute('aria-label', '文字颜色');
  color.addEventListener('change', () => applyMark(view, 'cherry_color', { color: color.value }));
  const size = document.createElement('select');
  size.title = '字号';
  size.setAttribute('aria-label', '字号');
  for (const value of ['12', '14', '16', '18', '20', '24', '32']) size.add(new Option(`${value}px`, value));
  size.value = '16';
  size.addEventListener('change', () => applyMark(view, 'cherry_font_size', { size: size.value }));
  const ruby = document.createElement('input');
  ruby.className = 'cherry-milkdown-toolbar__ruby';
  ruby.placeholder = '注音';
  ruby.setAttribute('aria-label', 'Ruby 注音');
  ruby.addEventListener('change', () => ruby.value && applyMark(view, 'cherry_ruby', { annotation: ruby.value }));
  toolbar.append(color, size, ruby);
  return toolbar;
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
      const toolbar = createToolbar(view, callTable);
      const slash = createSlashMenu(view, callTable);
      view.dom.parentElement?.prepend(toolbar, slash);
      const updateSlash = () => {
        const { $from, empty } = view.state.selection;
        slash.hidden = !empty || !$from.parent.isTextblock || $from.parent.textBetween(0, $from.parentOffset) !== '/';
      };
      view.dom.addEventListener('keyup', updateSlash);
      return {
        update: updateSlash,
        destroy: () => {
          view.dom.removeEventListener('keyup', updateSlash);
          toolbar.remove();
          slash.remove();
        },
      };
    },
  });
});
