/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EditorSelection, countColumn } from '@codemirror/state';
import { indentUnit, syntaxTree } from '@codemirror/language';
import { insertNewlineContinueMarkup, markdownLanguage } from '@codemirror/lang-markdown';

// Context parsing, indentation and ordered numbering derive from CodeMirror
// @codemirror/lang-markdown 6.5.0 src/commands.ts (MIT).
// https://github.com/codemirror/lang-markdown/blob/6.5.0/src/commands.ts
// Cherry differences: no loose-list blank insertion; empty items exit immediately;
// exiting establishes paragraph boundaries on both sides; CRLF cursor offsets use Text.
// Delegate selections without list context to upstream. Quote planning below is
// only needed inside lists or alongside list cursors in the same transaction.
/*
MIT License

Copyright (C) 2018-2021 by Marijn Haverbeke <marijn@haverbeke.berlin> and others

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/** @typedef {import('@codemirror/state').EditorState} EditorState */
/** @typedef {import('@codemirror/state').SelectionRange} SelectionRange */
/** @typedef {import('@codemirror/state').Line} Line */
/** @typedef {import('@lezer/common').Tree} Tree */
/**
 * @typedef {Object} EnterContext
 * @property {number} pos Document offset of the cursor.
 * @property {Line} line
 * @property {MarkupContext[]} context Outer-to-inner markup; its from/to are line-relative.
 * @property {MarkupContext} inner
 * @property {boolean} emptyLine
 */
/**
 * @typedef {{range: SelectionRange, changes: import('@codemirror/state').ChangeSpec}} RangeEdit
 * Changes use original document offsets; range uses offsets after those changes. No dispatch here.
 */
function itemNumber(item, doc) {
  return /^(\s*)(\d+)(?=[.)])/.exec(doc.sliceString(item.from, item.from + 10));
}

class MarkupContext {
  /**
   * @param {import('@lezer/common').SyntaxNode} node
   * @param {number} from Line-relative marker start.
   * @param {number} to Line-relative content start.
   * @param {string} spaceBefore
   * @param {string} spaceAfter
   * @param {string} type Marker text, including task checkbox if present.
   * @param {import('@lezer/common').SyntaxNode | null} item
   */
  constructor(node, from, to, spaceBefore, spaceAfter, type, item) {
    this.node = node;
    this.from = from;
    this.to = to;
    this.spaceBefore = spaceBefore;
    this.spaceAfter = spaceAfter;
    this.type = type;
    this.item = item;
  }

  blank(maxWidth, trailing = true) {
    let result = this.spaceBefore + (this.node.name === 'Blockquote' ? '>' : '');
    if (maxWidth !== null && maxWidth !== undefined) {
      while (result.length < maxWidth) result += ' ';
      return result;
    }
    for (let i = this.to - this.from - result.length - this.spaceAfter.length; i > 0; i--) result += ' ';
    return result + (trailing ? this.spaceAfter : '');
  }

  marker(doc, add) {
    const number = this.node.name === 'OrderedList' ? String(+itemNumber(this.item, doc)[2] + add) : '';
    return this.spaceBefore + number + this.type + this.spaceAfter;
  }
}

function getMarkupContext(node, doc) {
  const nodes = [];
  const context = [];
  for (let current = node; current; current = current.parent) {
    if (current.name === 'FencedCode') return context;
    if (current.name === 'ListItem' || current.name === 'Blockquote') nodes.push(current);
  }
  for (let i = nodes.length - 1; i >= 0; i--) {
    const current = nodes[i];
    const line = doc.lineAt(current.from);
    const start = current.from - line.from;
    let match;
    if (current.name === 'Blockquote' && (match = /^ *>( ?)/.exec(line.text.slice(start)))) {
      context.push(new MarkupContext(current, start, start + match[0].length, '', match[1], '>', null));
    } else if (
      current.name === 'ListItem' &&
      current.parent.name === 'OrderedList' &&
      (match = /^( *)\d+([.)])( *)/.exec(line.text.slice(start)))
    ) {
      let [, , , after] = match;
      let { length } = match[0];
      if (after.length >= 4) {
        after = after.slice(0, -4);
        length -= 4;
      }
      context.push(new MarkupContext(current.parent, start, start + length, match[1], after, match[2], current));
    } else if (
      current.name === 'ListItem' &&
      current.parent.name === 'BulletList' &&
      (match = /^( *)([-+*])( {1,4}\[[ xX]\])?( +)/.exec(line.text.slice(start)))
    ) {
      let [, , , , after] = match;
      let { length } = match[0];
      if (after.length > 4) {
        after = after.slice(0, -4);
        length -= 4;
      }
      const type = match[2] + (match[3] ? match[3].replace(/[xX]/, ' ') : '');
      context.push(new MarkupContext(current.parent, start, start + length, match[1], after, type, current));
    }
  }
  return context;
}

function renumberList(after, doc, changes, offset = 0) {
  for (let previous = -1, node = after; ;) {
    if (node.name === 'ListItem') {
      const match = itemNumber(node, doc);
      const number = +match[2];
      if (previous >= 0) {
        if (number !== previous + 1) return;
        changes.push({
          from: node.from + match[1].length,
          to: node.from + match[0].length,
          insert: String(previous + 2 + offset),
        });
      }
      previous = number;
    }
    if (!node.nextSibling) break;
    node = node.nextSibling;
  }
}

function normalizeIndent(content, state) {
  const blank = /^[ \t]*/.exec(content)[0].length;
  if (!blank || state.facet(indentUnit) !== '\t') return content;
  let columns = countColumn(content, 4, blank);
  let result = '';
  while (columns > 0) {
    if (columns >= 4) {
      result += '\t';
      columns -= 4;
    } else {
      result += ' ';
      columns -= 1;
    }
  }
  return result + content.slice(blank);
}

function blankLine(context, state, line) {
  let insert = '';
  for (let i = 0; i <= context.length - 2; i++) {
    insert += context[i].blank(
      i < context.length - 2 ? countColumn(line.text, 4, context[i + 1].from) - insert.length : null,
      i < context.length - 2,
    );
  }
  return normalizeIndent(insert, state);
}

/**
 * @param {EditorState} state
 * @param {SelectionRange} range
 * @param {Tree} tree
 * @returns {EnterContext | null}
 */
function readEnterContext(state, range, tree) {
  const { doc } = state;
  if (
    !range.empty ||
    (!markdownLanguage.isActiveAt(state, range.from, -1) && !markdownLanguage.isActiveAt(state, range.from, 1))
  ) {
    return null;
  }
  const pos = range.from;
  const line = doc.lineAt(pos);
  const context = getMarkupContext(tree.resolveInner(pos, -1), doc);
  while (context.length && context[context.length - 1].from > pos - line.from) context.pop();
  if (!context.length) {
    return null;
  }
  const inner = context[context.length - 1];
  if (inner.to - inner.spaceAfter.length > pos - line.from) {
    return null;
  }
  const emptyLine = pos >= inner.to - inner.spaceAfter.length && !/\S/.test(line.text.slice(inner.to));
  return { pos, line, context, inner, emptyLine };
}

/**
 * Compute one empty-item exit, including a parent-list outdent or paragraph boundaries.
 * @param {EditorState} state
 * @param {EnterContext} current
 * @returns {RangeEdit}
 */
function planListExit(state, current) {
  const { doc } = state;
  const { pos, line, context, inner } = current;
  const parent = context.length > 1 ? context[context.length - 2] : null;
  const parentEnd = line.from + (parent ? parent.to : 0);
  const plan =
    parent && parent.item
      ? { from: line.from + parent.from, insert: parent.marker(doc, 1), beforeCursor: parent.marker(doc, 1) }
      : planParagraphExit(state, current, parentEnd);
  const edits = [{ from: plan.from, to: pos, insert: plan.insert }];
  if (inner.node.name === 'OrderedList') renumberList(inner.item, doc, edits, -2);
  if (parent && parent.node.name === 'OrderedList') renumberList(parent.item, doc, edits);
  return { range: EditorSelection.cursor(plan.from + state.toText(plan.beforeCursor).length), changes: edits };
}

/**
 * Leave a list in the current quote container and separate the next paragraph on both sides.
 * The cursor stays before the following separator, ready for ordinary text.
 * @param {EditorState} state
 * @param {EnterContext} current
 * @param {number} parentEnd Document offset after the enclosing quote markers.
 * @returns {{from: number, insert: string, beforeCursor: string}}
 */
function planParagraphExit(state, { line, context, inner }, parentEnd) {
  const { doc } = state;
  const prefix = line.text.slice(0, parentEnd - line.from);
  const separator = blankLine(context, state, line);
  const needsBefore = inner.node.from < line.from && doc.lineAt(line.from - 1).text.trim() !== separator.trim();
  const needsAfter = line.to < doc.length && doc.lineAt(line.to + 1).text.trim() !== separator.trim();
  const beforeCursor = (needsBefore ? separator + state.lineBreak : '') + prefix;
  return {
    from: line.from,
    insert: beforeCursor + (needsAfter ? state.lineBreak + separator : ''),
    beforeCursor,
  };
}

/**
 * @param {EditorState} state
 * @param {SelectionRange} range
 * @param {EnterContext} current
 * @returns {RangeEdit | null}
 */
function planQuoteExit(state, range, { line, inner, emptyLine }) {
  const { doc } = state;
  if (inner.node.name === 'Blockquote' && emptyLine && line.from) {
    const previous = doc.lineAt(line.from - 1);
    const quoted = />\s*$/.exec(previous.text);
    if (quoted && quoted.index === inner.from) {
      const edits = state.changes([
        { from: previous.from + quoted.index, to: previous.to },
        { from: line.from + inner.from, to: line.to },
      ]);
      return { range: range.map(edits), changes: edits };
    }
  }
  return null;
}

/**
 * @param {EditorState} state
 * @param {EnterContext} current
 * @returns {RangeEdit}
 */
function planContinuation(state, { pos, line, context, inner }) {
  const { doc } = state;
  const edits = [];
  if (inner.node.name === 'OrderedList') renumberList(inner.item, doc, edits);
  const continued = inner.item && inner.item.from < line.from;
  let insert = '';
  if (!continued || /^[\s\d.)\-+*>]*/.exec(line.text)[0].length >= inner.to) {
    for (let i = 0; i < context.length; i++) {
      insert +=
        i === context.length - 1 && !continued
          ? context[i].marker(doc, 1)
          : context[i].blank(
              i < context.length - 1 ? countColumn(line.text, 4, context[i + 1].from) - insert.length : null,
            );
    }
  }
  let from = pos;
  while (from > line.from && /\s/.test(line.text.charAt(from - line.from - 1))) from -= 1;
  insert = normalizeIndent(insert, state);
  edits.push({ from, to: pos, insert: state.lineBreak + insert });
  return { range: EditorSelection.cursor(from + state.toText(state.lineBreak + insert).length), changes: edits };
}

/**
 * Cherry Markdown Enter. Each cursor computes an edit; dispatch only the combined final transaction.
 * @type {import('@codemirror/state').StateCommand}
 */
export const cherryInsertNewlineContinueMarkup = ({ state, dispatch }) => {
  if (state.readOnly) return false;
  const tree = syntaxTree(state);
  const contexts = state.selection.ranges.map((range) => readEnterContext(state, range, tree));
  // Quote-only selections need no Cherry list policy. Keep the upstream command
  // responsible for their continuation and exit, including multiple cursors.
  if (!contexts.some((current) => current?.context.some((markup) => markup.item))) {
    return insertNewlineContinueMarkup({ state, dispatch });
  }
  // Mixed list/quote cursors are planned together so filters and undo see one
  // final transaction. Unsupported cursors leave the whole selection to fallback.
  if (contexts.some((current) => !current)) return false;
  let index = 0;
  const changes = state.changeByRange((range) => {
    const current = contexts[index];
    index += 1;
    if (current.inner.item && current.emptyLine) return planListExit(state, current);
    return planQuoteExit(state, range, current) || planContinuation(state, current);
  });
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
  return true;
};
