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
import { insertNewlineContinueMarkupCommand, markdownLanguage } from '@codemirror/lang-markdown';

// Context, marker, indentation and numbering helpers derive from CodeMirror
// @codemirror/lang-markdown 6.5.0 src/commands.ts (MIT).
// https://github.com/codemirror/lang-markdown/blob/6.5.0/src/commands.ts
// Only intercept selections where upstream would add a loose-list blank line.
// Everything else uses the configured upstream command. Mixed markup cursors
// require per-range planning here: upstream exposes no per-range planner.
// Exit/quote planners preserve upstream behavior in that combined transaction;
// they never add paragraph separators. No upstream transaction is captured.
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

  blank(maxWidth) {
    const result = this.spaceBefore + (this.node.name === 'Blockquote' ? '>' : '');
    if (maxWidth !== null && maxWidth !== undefined) return result.padEnd(maxWidth, ' ');
    const padding = Math.max(0, this.to - this.from - result.length - this.spaceAfter.length);
    return result + ' '.repeat(padding) + this.spaceAfter;
  }

  marker(doc) {
    const number = this.node.name === 'OrderedList' ? String(+itemNumber(this.item, doc)[2] + 1) : '';
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
    } else if (current.name === 'ListItem') {
      const ordered = current.parent.name === 'OrderedList';
      if (!ordered && current.parent.name !== 'BulletList') continue;
      const pattern = ordered ? /^( *)\d+([.)])( *)/ : /^( *)([-+*])( {1,4}\[[ xX]\])?( +)/;
      match = pattern.exec(line.text.slice(start));
      if (!match) continue;
      let after = match[ordered ? 3 : 4];
      // Preserve upstream's different four-space boundary for ordered/bullet markers.
      const trim = ordered ? after.length >= 4 : after.length > 4;
      const length = match[0].length - (trim ? 4 : 0);
      if (trim) after = after.slice(0, -4);
      const type = match[2] + (!ordered && match[3] ? match[3].replace(/[xX]/, ' ') : '');
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
  const columns = countColumn(content, 4, blank);
  return '\t'.repeat(Math.floor(columns / 4)) + ' '.repeat(columns % 4) + content.slice(blank);
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
  if (!context.length) return null;
  const inner = context[context.length - 1];
  if (inner.to - inner.spaceAfter.length > pos - line.from) return null;
  const emptyLine = pos >= inner.to - inner.spaceAfter.length && !/\S/.test(line.text.slice(inner.to));
  return { pos, line, context, inner, emptyLine };
}

/**
 * Upstream empty-item exit, needed only alongside a loose continuation cursor.
 * @param {EditorState} state
 * @param {EnterContext} current
 * @returns {RangeEdit}
 */
function planListExit(state, { pos, line, context, inner }) {
  const { doc } = state;
  const parent = context.length > 1 ? context[context.length - 2] : null;
  let { from } = line;
  if (parent) from += parent.item ? parent.from : parent.to;
  const insert = parent?.item ? parent.marker(doc) : '';
  const edits = [{ from, to: pos, insert }];
  if (inner.node.name === 'OrderedList') renumberList(inner.item, doc, edits, -2);
  if (parent?.node.name === 'OrderedList') renumberList(parent.item, doc, edits);
  return { range: EditorSelection.cursor(from + state.toText(insert).length), changes: edits };
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
          ? context[i].marker(doc)
          : context[i].blank(
              i < context.length - 1 ? countColumn(line.text, 4, context[i + 1].from) - insert.length : null,
            );
    }
  }
  let from = pos;
  while (from > line.from && /\s/.test(line.text.charAt(from - line.from - 1))) from -= 1;
  const text = state.toText(state.lineBreak + normalizeIndent(insert, state));
  edits.push({ from, to: pos, insert: text });
  return { range: EditorSelection.cursor(from + text.length), changes: edits };
}

// Match the upstream loose-continuation condition, not a new CommonMark policy.
function needsLooseContinuation(current, doc) {
  if (!current || current.emptyLine) return false;
  const { node } = current.inner;
  if (node.name !== 'OrderedList' && node.name !== 'BulletList') return false;
  const first = node.firstChild;
  const second = node.getChild('ListItem', 'ListItem');
  if (!second) return false;
  const end = doc.lineAt(first.to);
  const start = doc.lineAt(second.from);
  return end.number + (/^[\s>]*$/.test(end.text) ? 0 : 1) < start.number;
}

const continueMarkup = insertNewlineContinueMarkupCommand({ nonTightLists: false });

/**
 * Omit only loose-continuation blank insertion; filters see one final transaction.
 * @type {import('@codemirror/state').StateCommand}
 */
export const cherryInsertNewlineContinueMarkup = ({ state, dispatch }) => {
  if (state.readOnly) return false;
  const tree = syntaxTree(state);
  const contexts = state.selection.ranges.map((range) => readEnterContext(state, range, tree));
  if (!contexts.some((current) => needsLooseContinuation(current, state.doc))) {
    return continueMarkup({ state, dispatch });
  }
  // Like upstream, unsupported ranges leave the entire selection to fallback.
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
