import { describe, expect, it, vi } from 'vite-plus/test';
import List from '../../../src/toolbars/hooks/List';
import Panel from '../../../src/toolbars/hooks/Panel';
import { createMenuContext } from '../../helpers/menu';

function createHook<T>(Hook: new (cherry: never) => T, doc = 'text') {
  const context = createMenuContext(doc);
  return { context, hook: new Hook(context.cherry as never) };
}

describe('toolbars/hooks block insertion', () => {
  it('creates and removes titled panels', () => {
    const body = createHook(Panel, 'body').hook;
    const titled = createHook(Panel, 'Title\nbody').hook;
    const existing = createHook(Panel, '::: warning Title\nbody\n:::').hook;

    expect(body.onClick('body', 'warning')).toBe('::: warning 标题\nbody\n:::');
    expect(titled.onClick('Title\nbody', 'info')).toBe('::: info Title\nbody\n:::');
    expect(existing.onClick('::: warning Title\nbody\n:::', 'warning')).toBe('Title\nbody');
    expect(existing.onClick('::: warning Title\nbody\n:::', 'danger')).toBe('::: danger Title\nbody\n:::');
  });

  it('creates default two-column and three-column panel bodies', () => {
    const twoCols = createHook(Panel, '').hook;
    const threeCols = createHook(Panel, '').hook;

    expect(twoCols.onClick('', '2cols')).toBe('::: 2cols 第一列\n::\n第二列\n:::');
    expect(threeCols.onClick('', '3cols')).toBe('::: 3cols 第一列\n::\n第二列\n::\n第三列\n:::');
  });

  it('extracts panel names and titles from supported syntax', () => {
    const { hook } = createHook(Panel);

    expect(hook.$getNameFromStr('::: warning Important\nbody\n:::')).toBe('warning');
    expect(hook.$getNameFromStr('plain text')).toBe(false);
    expect(hook.$getTitle('::: warning Important\nbody\n:::')).toBe('');
    expect(hook.$getTitle('::: warning\nbody\n:::')).toBe('');
  });

  it('expands a cursor selection to a surrounding panel and runs cleanup callbacks', () => {
    const doc = 'before\n::: warning Title\nbody\n:::\nafter';
    const context = createMenuContext(doc, [{ anchor: doc.indexOf('body') }]);
    const hook = new Panel(context.cherry as never);
    hook.getMoreSelection = (_before, _after, callback) => {
      context.view.dispatch({ selection: { anchor: 0, head: doc.length } });
      callback();
    };
    const setLessSelection = vi.fn();
    hook.setLessSelection = setLessSelection;

    expect(hook.onClick('body', 'danger')).toContain('::: danger');
    hook.$afterClick();
    expect(setLessSelection).toHaveBeenCalledWith('::: ', '\n');

    const plainContext = createMenuContext('plain');
    const plain = new Panel(plainContext.cherry as never);
    const plainCleanup = vi.fn();
    plain.setLessSelection = plainCleanup;
    plain.onClick('plain', 'warning');
    plain.$afterClick();
    expect(plainCleanup).toHaveBeenCalledWith('::: ', '\n');
  });

  it('creates ordered, unordered, and checklist Markdown lists', () => {
    const { hook } = createHook(List, 'one\ntwo');

    expect(hook.onClick('one\ntwo', '1')).toBe('1. one\n2. two');
    expect(hook.onClick('one\ntwo', 'ul')).toBe('- one\n- two');
    expect(hook.onClick('one\ntwo', '3')).toBe('- [x] one\n- [x] two');
    expect(hook.onClick('one\ntwo', 'invalid' as never)).toBe('one\ntwo');
    expect(hook.getSubMenuConfig()).toHaveLength(3);
  });
});
