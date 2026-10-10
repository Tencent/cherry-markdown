import { EditorSelection, EditorState } from '@codemirror/state';
import { describe, expect, it, vi } from 'vite-plus/test';
import { handleNewlineIndentList } from '../../src/utils/autoindent';

const createAdapter = (
  doc: string,
  ranges: Array<{ anchor: number; head?: number }>,
  options: { readOnly?: boolean } = {},
) => {
  let state = EditorState.create({
    doc,
    selection: EditorSelection.create(ranges.map(({ anchor, head = anchor }) => EditorSelection.range(anchor, head))),
    extensions: EditorState.allowMultipleSelections.of(true),
  });
  const dispatch = vi.fn((spec) => {
    state = state.update(spec).state;
  });

  return {
    adapter: {
      get state() {
        return state;
      },
      getOption: vi.fn((name: string) => name === 'readOnly' && !!options.readOnly),
      listSelections: vi.fn(() => state.selection.ranges),
      dispatch,
    },
    dispatch,
    getState: () => state,
  };
};

describe('utils/autoindent', () => {
  it('leaves read-only and ordinary lines to CodeMirror', () => {
    const readOnly = createAdapter('I. item', [{ anchor: 7 }], { readOnly: true });
    const ordinary = createAdapter('ordinary text', [{ anchor: 13 }]);

    expect(handleNewlineIndentList(readOnly.adapter as never)).toBe(false);
    expect(handleNewlineIndentList(ordinary.adapter as never)).toBe(false);
    expect(readOnly.dispatch).not.toHaveBeenCalled();
    expect(ordinary.dispatch).not.toHaveBeenCalled();
  });

  it('rejects selections and cursors positioned before the list marker', () => {
    const selection = createAdapter('I. item', [{ anchor: 3, head: 7 }]);
    const beforeMarker = createAdapter('  I. item', [{ anchor: 1 }]);

    expect(handleNewlineIndentList(selection.adapter as never)).toBe(false);
    expect(handleNewlineIndentList(beforeMarker.adapter as never)).toBe(false);
  });

  it('inserts a normalized marker while preserving indentation and spacing', () => {
    const context = createAdapter('  一.  item', [{ anchor: 10 }]);

    expect(handleNewlineIndentList(context.adapter as never)).toBe(true);
    expect(context.getState().doc.toString()).toBe('  一.  item\n  I.  ');
    expect(context.getState().selection.main.head).toBe(17);
    expect(context.dispatch).toHaveBeenCalledOnce();
  });

  it('exits an empty cherry list item', () => {
    const context = createAdapter('I. ', [{ anchor: 3 }]);

    expect(handleNewlineIndentList(context.adapter as never)).toBe(true);
    expect(context.getState().doc.toString()).toBe('\n');
    expect(context.getState().selection.main.head).toBe(1);
  });
});
