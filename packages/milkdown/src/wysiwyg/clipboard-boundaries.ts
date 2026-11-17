import { DOMParser, DOMSerializer, Fragment, Slice } from '@milkdown/kit/prose/model';
import { isTextOnlySlice } from '@milkdown/kit/prose';
import { Plugin, TextSelection, type Transaction } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { parserCtx } from '@milkdown/kit/core';
import { closeHistory } from '@milkdown/kit/prose/history';

const correctedPaste = 'cherry-milkdown:corrected-paste';

function finishCorrectedPaste(transaction: Transaction) {
  return closeHistory(transaction)
    .scrollIntoView()
    .setMeta('paste', true)
    .setMeta('uiEvent', 'paste')
    .setMeta(correctedPaste, true);
}

function missingBoundarySpaces(source: string, rendered: string) {
  const before = source.match(/^ */)![0];
  const after = source.match(/ *$/)![0];
  return {
    leading: before.slice(Math.min(rendered.match(/^ */)![0].length, before.length)),
    trailing: after.slice(Math.min(rendered.match(/ *$/)![0].length, after.length)),
  };
}

/** Preserve inline clipboard boundary spaces without changing Markdown or HTML marks. */
export const cherryClipboardBoundaries = $prose(
  (ctx) =>
    new Plugin({
      appendTransaction(transactions, _oldState, newState) {
        return transactions.some((transaction) => transaction.getMeta(correctedPaste))
          ? closeHistory(newState.tr)
          : null;
      },
      props: {
        handleDOMEvents: {
          paste(view) {
            if (
              !view.editable ||
              view.composing ||
              !view.hasFocus() ||
              !(view.state.selection instanceof TextSelection)
            )
              return false;
            const selection = view.dom.ownerDocument.getSelection();
            if (
              !selection?.anchorNode ||
              !selection.focusNode ||
              !view.dom.contains(selection.anchorNode) ||
              !view.dom.contains(selection.focusNode)
            )
              return false;
            try {
              const anchor = view.state.doc.resolve(view.posAtDOM(selection.anchorNode, selection.anchorOffset));
              const head = view.state.doc.resolve(view.posAtDOM(selection.focusNode, selection.focusOffset));
              if (!anchor.parent.inlineContent || !head.parent.inlineContent) return false;
              const next = TextSelection.between(anchor, head);
              if (!next.eq(view.state.selection))
                view.dispatch(view.state.tr.setSelection(next).setMeta('addToHistory', false));
            } catch {
              // A pending DOM mutation or detached node makes this selection unsafe to map.
            }
            return false;
          },
        },
        handlePaste(view, event, slice) {
          const { $from, $to } = view.state.selection;
          if (
            !view.editable ||
            !$from.parent.isTextblock ||
            !$to.parent.isTextblock ||
            $from.parent.type.spec.code ||
            $to.parent.type.spec.code ||
            !event.clipboardData
          )
            return false;
          const text = event.clipboardData.getData('text/plain');
          if (/[\r\n]/.test(text)) return false;
          if (!event.clipboardData.getData('text/html')) {
            if (event.clipboardData.getData('vscode-editor-data') || !text || !/^ | $/.test(text)) return false;
            const trimmed = text.replace(/^ +| +$/g, '');
            if (trimmed) {
              const parsed = ctx.get(parserCtx)(text);
              if (!parsed || typeof parsed === 'string' || parsed.childCount !== 1) return false;
              const paragraph = parsed.firstChild;
              const content = paragraph?.firstChild;
              if (paragraph?.type.name !== 'paragraph') return false;
              if (paragraph.childCount !== 1 || !content?.isText || content.marks.length || content.text !== trimmed) {
                const dom = DOMSerializer.fromSchema(view.state.schema).serializeFragment(parsed.content);
                const slice = DOMParser.fromSchema(view.state.schema).parseSlice(dom);
                const inline = slice.content.firstChild;
                if (
                  slice.openStart !== 1 ||
                  slice.openEnd !== 1 ||
                  slice.content.childCount !== 1 ||
                  inline?.type.name !== 'paragraph'
                )
                  return false;
                const rendered = inline.textContent;
                const { leading, trailing } = missingBoundarySpaces(text, rendered);
                if (!leading && !trailing) return false;
                const start = leading ? Fragment.from(view.state.schema.text(leading)) : Fragment.empty;
                const end = trailing ? Fragment.from(view.state.schema.text(trailing)) : Fragment.empty;
                const corrected = new Slice(start.append(inline.content).append(end), 0, 0);
                view.dispatch(finishCorrectedPaste(view.state.tr.replaceSelection(corrected)));
                return true;
              }
            }
            view.dispatch(finishCorrectedPaste(view.state.tr.insertText(text)));
            return true;
          }
          if (slice.openStart !== 0 || slice.openEnd !== 0 || !slice.content.childCount) return false;
          let allText = true;
          slice.content.forEach((node) => {
            if (!node.isText) allText = false;
          });
          if (!allText) return false;
          const parsed = slice.content.textBetween(0, slice.content.size);
          const { leading, trailing } = missingBoundarySpaces(text, parsed);
          if ((!leading && !trailing) || text !== `${leading}${parsed}${trailing}`) return false;
          const start = leading ? Fragment.from(view.state.schema.text(leading)) : Fragment.empty;
          const end = trailing ? Fragment.from(view.state.schema.text(trailing)) : Fragment.empty;
          const content = start.append(slice.content).append(end);
          const corrected = new Slice(content, 0, 0);
          const textOnly = isTextOnlySlice(corrected);
          const transaction = textOnly
            ? view.state.tr.replaceSelectionWith(textOnly, true)
            : view.state.tr.replaceSelection(corrected);
          view.dispatch(finishCorrectedPaste(transaction));
          return true;
        },
      },
    }),
);
