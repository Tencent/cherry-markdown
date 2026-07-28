import { describe, expect, it } from 'vitest';
import MenuBase from '../../../src/toolbars/MenuBase';
import Bold from '../../../src/toolbars/hooks/Bold';
import Br from '../../../src/toolbars/hooks/Br';
import Checklist from '../../../src/toolbars/hooks/CheckList';
import Code from '../../../src/toolbars/hooks/Code';
import H1 from '../../../src/toolbars/hooks/H1';
import H2 from '../../../src/toolbars/hooks/H2';
import H3 from '../../../src/toolbars/hooks/H3';
import Header from '../../../src/toolbars/hooks/Header';
import Hr from '../../../src/toolbars/hooks/Hr';
import InlineCode from '../../../src/toolbars/hooks/InlineCode';
import Italic from '../../../src/toolbars/hooks/Italic';
import Link from '../../../src/toolbars/hooks/Link';
import Ol from '../../../src/toolbars/hooks/Ol';
import QuickTable from '../../../src/toolbars/hooks/QuickTable';
import Quote from '../../../src/toolbars/hooks/Quote';
import Ruby from '../../../src/toolbars/hooks/Ruby';
import Split from '../../../src/toolbars/hooks/Split';
import Strikethrough from '../../../src/toolbars/hooks/Strikethrough';
import Sub from '../../../src/toolbars/hooks/Sub';
import Sup from '../../../src/toolbars/hooks/Sup';
import Ul from '../../../src/toolbars/hooks/Ul';
import Underline from '../../../src/toolbars/hooks/Underline';
import { createMenuContext } from '../../helpers/menu';

type MenuConstructor<T> = new (cherry: never) => T;

function createHook<T>(Hook: MenuConstructor<T>, text = 'text') {
  const context = createMenuContext(text);
  const hook = new Hook(context.cherry as never);
  return { hook, context };
}

describe('toolbars/hooks formatting', () => {
  it.each([
    ['bold', Bold, '**text**', 'text'],
    ['italic', Italic, '*text*', 'text'],
    ['strikethrough', Strikethrough, '~~text~~', 'text'],
    ['underline', Underline, ' /text/ ', 'text'],
    ['sub', Sub, '^^text^^', 'text'],
    ['sup', Sup, '^text^', 'text'],
  ])('toggles %s syntax', (_name, Hook, wrapped, plain) => {
    const add = createHook(Hook as MenuConstructor<MenuBase>, plain);
    add.hook.isSelections = true;
    expect(add.hook.onClick(plain)).toBe(wrapped);
    expect(add.hook.afterClickCb).toBeTypeOf('function');

    const remove = createHook(Hook as MenuConstructor<MenuBase>, wrapped);
    remove.hook.isSelections = true;
    expect(remove.hook.onClick(wrapped)).toBe(plain);
  });

  it('adds the expected menu names and shortcut metadata', () => {
    const bold = createHook(Bold).hook;
    const italic = createHook(Italic).hook;
    const strike = createHook(Strikethrough).hook;
    const underline = createHook(Underline).hook;

    expect(bold.name).toBe('bold');
    expect(italic.name).toBe('italic');
    expect(strike.name).toBe('strikethrough');
    expect(underline.name).toBe('underline');
    expect(Object.keys(bold.shortcutKeyMap)).toHaveLength(1);
    expect(Object.keys(italic.shortcutKeyMap)).toHaveLength(1);
    expect(Object.keys(strike.shortcutKeyMap)).toHaveLength(1);
    expect(Object.keys(underline.shortcutKeyMap)).toHaveLength(1);
  });

  it('formats empty, single-line, and multiline inline code', () => {
    const { hook } = createHook(InlineCode);

    expect(hook.onClick('')).toBe('``');
    expect(hook.onClick('const value = 1')).toBe('`const value = 1`');
    expect(hook.onClick('one\ntwo')).toBe('`one`\n`two`');
    expect(Object.keys(hook.shortcutKeyMap)).toEqual(['Control-Backquote']);
  });

  it('creates fenced code blocks with defaults and selected content', () => {
    const { hook } = createHook(Code);

    expect(hook.onClick('')).toBe('\n``` \ncode...\n```\n');
    expect(hook.onClick('const value = 1')).toBe('\n``` \nconst value = 1\n```\n');
    expect(hook.afterClickCb).toBeTypeOf('function');
  });

  it.each([
    [H1, '# text', 'h1'],
    [H2, '## text', 'h2'],
    [H3, '### text', 'h3'],
  ])('adds, changes, and removes fixed heading levels', (Hook, expected, name) => {
    const plain = createHook(Hook, 'text').hook;
    expect(plain.onClick('text')).toBe(expected);
    expect(plain.name).toBe(name);

    const same = createHook(Hook, expected).hook;
    expect(same.onClick(expected)).toBe('text');

    const changed = createHook(Hook, '###### text').hook;
    expect(changed.onClick('###### text')).toBe(expected);
  });

  it.each([
    [H1, '# one\n## two\n### three', '# one\n# two\n# three'],
    [H2, '## one\n### two\n#### three', '## one\n## two\n## three'],
    [H3, '### one\n#### two\n##### three', '### one\n### two\n### three'],
  ])('normalizes mixed heading levels across a selection', (Hook, input, expected) => {
    expect(createHook(Hook, input).hook.onClick(input)).toBe(expected);
  });

  it.each([
    [H1, '# h1'],
    [H2, '## h2'],
    [H3, '### h3'],
  ])('uses localized heading placeholders for empty selections', (Hook, expected) => {
    expect(createHook(Hook, '').hook.onClick('')).toBe(expected);
  });

  it('derives dynamic heading levels from shortcuts', () => {
    const { hook } = createHook(Header, 'text');

    expect(hook.$getFlagStr('Control-Digit3')).toBe('###');
    expect(hook.$getFlagStr('')).toBe('#');
    expect(hook.onClick('text', 'Control-Digit3')).toBe('### text');
    expect(hook.getSubMenuConfig()).toHaveLength(5);
    expect(Object.keys(hook.shortcutKeyMap)).toHaveLength(5);
  });

  it('toggles block quote markers on every line', () => {
    const add = createHook(Quote, 'one\ntwo').hook;
    expect(add.onClick('one\ntwo')).toBe('> one\n> two');

    const remove = createHook(Quote, '> one\n> two').hook;
    expect(remove.onClick('> one\n> two')).toBe('one\ntwo');

    expect(createHook(Quote, '').hook.onClick('')).toBe('> quote');
  });

  it('creates unordered, ordered, and checklist structures', () => {
    const input = 'first\nsecond';

    expect(createHook(Ul, input).hook.onClick(input)).toBe('- first\n- second');
    expect(createHook(Ol, input).hook.onClick(input)).toBe('1. first\n2. second');
    expect(createHook(Checklist, input).hook.onClick(input)).toBe('- [x] first\n- [x] second');
  });

  it('uses default list templates for empty selections', () => {
    expect(createHook(Ul, '').hook.onClick('')).toBe('- Item 1\n    - Item 1.1\n- Item 2');
    expect(createHook(Ol, '').hook.onClick('')).toBe('1. Item 1\n    1. Item 1.1\n2. Item 2');
    expect(createHook(Checklist, '').hook.onClick('')).toBe('- [x] Item 1\n    - [x] Item 1.1\n- [x] Item 2');
  });

  it('creates links from URLs, labels, and empty selections', () => {
    const { hook } = createHook(Link);

    expect(hook.onClick('https://example.com')).toBe('[link](https://example.com)');
    expect(hook.onClick('Cherry')).toBe('[Cherry](http://url.com) ');
    expect(hook.onClick('')).toBe('[link](http://url.com) ');
  });

  it('inserts line breaks, rules, quick tables, and toolbar separators', () => {
    expect(createHook(Br).hook.onClick('text')).toBe('text<br>');
    expect(createHook(Hr).hook.onClick('text')).toBe('text\n\n---\n');
    expect(createHook(QuickTable).hook.onClick('prefix')).toContain('prefix| LeftAlignedCol');
    const split = createHook(Split).hook.createBtn();
    expect(split.tagName).toBe('I');
    expect(split.className).toContain('cherry-toolbar-split');
  });

  it('adds and removes ruby annotations through the configured callback', () => {
    const add = createHook(Ruby, '中文').hook;
    add.isSelections = true;
    expect(add.onClick('中文')).toBe(' { 中文 | 中文 } ');

    const remove = createHook(Ruby, '{ 中文 | zhong wen }').hook;
    remove.isSelections = true;
    expect(remove.onClick('{ 中文 | zhong wen }')).toBe('中文');
  });
});
