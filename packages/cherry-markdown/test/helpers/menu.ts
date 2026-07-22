import { EditorSelection, EditorState } from '@codemirror/state';
import { vi } from 'vitest';

export interface TestSelection {
  anchor: number;
  head?: number;
}

export function createMenuContext(doc = 'text', selections: TestSelection[] = [{ anchor: 0, head: doc.length }]) {
  let state = EditorState.create({
    doc,
    selection: EditorSelection.create(
      selections.map(({ anchor, head = anchor }) => EditorSelection.range(anchor, head)),
    ),
    extensions: EditorState.allowMultipleSelections.of(true),
  });
  const dispatch = vi.fn((spec) => {
    state = state.update(spec).state;
  });
  const focus = vi.fn();
  const eventHandlers = new Map<string, Array<(...args: unknown[]) => void>>();
  const $event = {
    on: vi.fn((name: string, handler: (...args: unknown[]) => void) => {
      const handlers = eventHandlers.get(name) ?? [];
      handlers.push(handler);
      eventHandlers.set(name, handlers);
    }),
    emit: vi.fn((name: string, ...args: unknown[]) => {
      eventHandlers.get(name)?.forEach((handler) => handler(...args));
    }),
  };
  const view = {
    get state() {
      return state;
    },
    dispatch,
    focus,
  };
  const editor = {
    editor: { view },
    getSelections: vi.fn(() => state.selection.ranges.map((range) => state.doc.sliceString(range.from, range.to))),
    previewer: {},
    $cherry: {
      options: {
        callback: {
          changeString2Pinyin: vi.fn((value: string) => value),
        },
      },
    },
  };
  const locale = new Proxy<Record<string, string>>(
    {},
    {
      get: (_target, key) => String(key),
    },
  );
  const cherry = {
    $currentMenuOptions: { name: 'custom', icon: 'custom' },
    editor,
    locale,
    instanceId: 'test-instance',
    $event,
  };

  return {
    cherry,
    editor,
    view,
    dispatch,
    focus,
    $event,
    getState: () => state,
  };
}
