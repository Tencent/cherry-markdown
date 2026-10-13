/// <reference lib="es2022.intl" />
import { Plugin, TextSelection } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';

/** Uses the platform's Unicode word boundaries, never another Markdown parser. */
export function tableWordRange(text: string, offset: number) {
  if (typeof Intl.Segmenter === 'undefined') return undefined;
  for (const word of new Intl.Segmenter(undefined, { granularity: 'word' }).segment(text)) {
    const to = word.index + word.segment.length;
    if (word.isWordLike && offset >= word.index && offset <= to) return { from: word.index, to };
  }
  return undefined;
}

/** Table Block owns layout/controls; this plugin owns document text focus only. */
export const cherryTableFocusPlugin = $prose(
  () =>
    new Plugin({
      props: {
        handleDoubleClick: (view, position, event) => {
          const { target } = event;
          if (!view.editable || event.metaKey || event.ctrlKey || !(target instanceof Element)) return false;
          if (!target.closest('.milkdown-table-block td, .milkdown-table-block th')) return false;
          const { $from: caret } = TextSelection.near(view.state.doc.resolve(position));
          if (!caret.parent.isTextblock || caret.parent.type.spec.code) return false;
          if (
            !Array.from({ length: caret.depth }, (_, index) => caret.node(index + 1).type.name).some(
              (name) => name === 'table_cell' || name === 'table_header',
            )
          )
            return false;
          const text = caret.parent.textBetween(0, caret.parent.content.size, '', '\ufffc');
          const word = tableWordRange(text, caret.parentOffset);
          if (!word) return false;
          // Table Block can activate a paragraph selection on mouse down.
          // Use ProseMirror's semantic selection, without rewriting its DOM
          // or depending on deferred component focus effects.
          view.dispatch(
            view.state.tr.setSelection(
              TextSelection.create(view.state.doc, caret.start() + word.from, caret.start() + word.to),
            ),
          );
          view.focus();
          return true;
        },
      },
      view: (view) => {
        const selectCellAtPointer = (event: PointerEvent) => {
          const { target } = event;
          if (!(target instanceof Element) || !target.closest('.milkdown-table-block td, .milkdown-table-block th')) {
            return;
          }
          const position = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (!position) return;
          const selection = TextSelection.near(view.state.doc.resolve(position.pos));
          if (!view.state.selection.eq(selection)) view.dispatch(view.state.tr.setSelection(selection));
        };
        view.dom.addEventListener('pointerdown', selectCellAtPointer, true);
        return { destroy: () => view.dom.removeEventListener('pointerdown', selectCellAtPointer, true) };
      },
    }),
);
