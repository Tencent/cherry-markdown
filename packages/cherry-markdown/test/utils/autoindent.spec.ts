import { EditorSelection, EditorState } from '@codemirror/state';
import { describe, expect, it, vi } from 'vitest';
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

  it('leaves an empty selection collection untouched', () => {
    const context = createAdapter('I. item', [{ anchor: 7 }]);
    context.adapter.listSelections.mockReturnValue([]);

    expect(handleNewlineIndentList(context.adapter as never)).toBe(false);
    expect(context.dispatch).not.toHaveBeenCalled();
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

  it('updates multiple valid cursors in one atomic transaction', () => {
    const doc = 'I. first\n二. second';
    const context = createAdapter(doc, [{ anchor: 8 }, { anchor: doc.length }]);

    expect(handleNewlineIndentList(context.adapter as never)).toBe(true);
    expect(context.getState().doc.toString()).toBe('I. first\nI. \n二. second\nI. ');
    expect(context.getState().selection.ranges.map((range) => range.head)).toEqual([12, 26]);
    expect(context.dispatch).toHaveBeenCalledOnce();
  });
});
