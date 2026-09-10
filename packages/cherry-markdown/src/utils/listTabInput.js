import { syntaxTree } from '@codemirror/language';

/**
 * Filter native Tab insertion in an empty Markdown list prefix before indentMore runs.
 * Leave ordinary text, code, paste, replacement and programmatic transactions intact.
 * @param {import('@codemirror/state').Transaction} tr
 * @returns {boolean}
 */
export function allowListTabInput(tr) {
  if (!tr.isUserEvent('input.type') || tr.isUserEvent('input.type.compose') || !tr.docChanged) return true;

  let blocked = false;
  let otherChange = false;
  tr.changes.iterChanges((from, to, _fromB, _toB, inserted) => {
    const line = tr.startState.doc.lineAt(from);
    const marker = /^[ \t]*([*+-]|\d+[.)])[ \t]+$/.exec(line.text);
    if (from !== to || inserted.toString() !== '\t' || !marker || from > line.from + line.text.search(/\S/)) {
      otherChange = true;
      return;
    }
    let node = syntaxTree(tr.startState).resolveInner(line.from + line.text.search(/\S/) + 1, -1);
    while (node.parent && node.name !== 'ListItem') node = node.parent;
    if (node.name === 'ListItem') blocked = true;
    else otherChange = true;
  });
  return !blocked || otherChange;
}
