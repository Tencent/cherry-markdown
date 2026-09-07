import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { Plugin, type Selection } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';

type SelectionBookmark = ReturnType<Selection['getBookmark']>;

interface PendingSelection {
  bookmark: SelectionBookmark;
  released: boolean;
}

/**
 * Maps saved selections through every ProseMirror transaction. Cherry menus
 * such as image/file pickers may finish asynchronously; their result must be
 * inserted at the selection that opened the picker instead of being dropped
 * or applied at a newer caret position.
 */
export function createSelectionTracker(): {
  plugin: MilkdownPlugin;
  track(selection: Selection): { resolve(): Selection | null; release(): void };
} {
  const pending = new Set<PendingSelection>();
  let currentDocument: ProseNode | null = null;

  const plugin = $prose(
    () =>
      new Plugin({
        state: {
          init: (_, state) => {
            currentDocument = state.doc;
            return null;
          },
          apply: (transaction) => {
            currentDocument = transaction.doc;
            if (transaction.docChanged) {
              pending.forEach((entry) => {
                entry.bookmark = entry.bookmark.map(transaction.mapping);
              });
            }
            return null;
          },
        },
        view: () => ({
          destroy() {
            pending.forEach((entry) => {
              entry.released = true;
            });
            pending.clear();
            currentDocument = null;
          },
        }),
      }),
  );

  return {
    plugin,
    track(selection) {
      const entry: PendingSelection = { bookmark: selection.getBookmark(), released: false };
      pending.add(entry);
      return {
        resolve() {
          if (entry.released || !currentDocument) return null;
          try {
            return entry.bookmark.resolve(currentDocument);
          } catch {
            return null;
          }
        },
        release() {
          entry.released = true;
          pending.delete(entry);
        },
      };
    },
  };
}
