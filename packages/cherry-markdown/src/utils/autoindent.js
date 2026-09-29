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
import { markdownLanguage } from '@codemirror/lang-markdown';

// Markdown Enter follows CodeMirror's context rules, but directly creates a tight next item.
// Based on @codemirror/lang-markdown 6.5.0's MIT-licensed insertNewlineContinueMarkup.
function itemNumber(item, doc) {
  return /^(\s*)(\d+)(?=[.)])/.exec(doc.sliceString(item.from, item.from + 10));
}

class MarkupContext {
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
    if (maxWidth != null) {
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
    } else if (current.name === 'ListItem' && current.parent.name === 'OrderedList' &&
      (match = /^( *)\d+([.)])( *)/.exec(line.text.slice(start)))) {
      let after = match[3];
      let length = match[0].length;
      if (after.length >= 4) {
        after = after.slice(0, -4);
        length -= 4;
      }
      context.push(new MarkupContext(current.parent, start, start + length, match[1], after, match[2], current));
    } else if (current.name === 'ListItem' && current.parent.name === 'BulletList' &&
      (match = /^( *)([-+*])( {1,4}\[[ xX]\])?( +)/.exec(line.text.slice(start)))) {
      let after = match[4];
      let length = match[0].length;
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
  for (let previous = -1, node = after;;) {
    if (node.name === 'ListItem') {
      const match = itemNumber(node, doc);
      const number = +match[2];
      if (previous >= 0) {
        if (number !== previous + 1) return;
        changes.push({ from: node.from + match[1].length, to: node.from + match[0].length, insert: String(previous + 2 + offset) });
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
      columns--;
    }
  }
  return result + content.slice(blank);
}

function isLooseList(node, doc) {
  if (node.name !== 'OrderedList' && node.name !== 'BulletList') return false;
  const first = node.firstChild;
  const second = node.getChild('ListItem', 'ListItem');
  if (!second) return false;
  const firstLine = doc.lineAt(first.to);
  const secondLine = doc.lineAt(second.from);
  return firstLine.number + (/^[\s>]*$/.test(firstLine.text) ? 0 : 1) < secondLine.number;
}

function blankLine(context, state, line) {
  let insert = '';
  for (let i = 0; i <= context.length - 2; i++) {
    insert += context[i].blank(i < context.length - 2
      ? countColumn(line.text, 4, context[i + 1].from) - insert.length : null, i < context.length - 2);
  }
  return normalizeIndent(insert, state);
}

/** CodeMirror Markdown Enter with Cherry's two-Enter list exit and tight item continuation. */
export function cherryInsertNewlineContinueMarkup({ state, dispatch }) {
  if (state.readOnly) return false;
  const tree = syntaxTree(state);
  const { doc } = state;
  let unsupported = false;
  const changes = state.changeByRange((range) => {
    if (!range.empty || !markdownLanguage.isActiveAt(state, range.from, -1) &&
      !markdownLanguage.isActiveAt(state, range.from, 1)) {
      unsupported = true;
      return { range };
    }
    const pos = range.from;
    const line = doc.lineAt(pos);
    const context = getMarkupContext(tree.resolveInner(pos, -1), doc);
    while (context.length && context[context.length - 1].from > pos - line.from) context.pop();
    if (!context.length) {
      unsupported = true;
      return { range };
    }
    const inner = context[context.length - 1];
    if (inner.to - inner.spaceAfter.length > pos - line.from) {
      unsupported = true;
      return { range };
    }
    const emptyLine = pos >= inner.to - inner.spaceAfter.length && !/\S/.test(line.text.slice(inner.to));
    if (inner.item && emptyLine) {
      const next = context.length > 1 ? context[context.length - 2] : null;
      const delTo = next && next.item ? line.from + next.from : line.from + (next ? next.to : 0);
      const insert = next && next.item ? next.marker(doc, 1) : '';
      const edits = [{ from: delTo, to: pos, insert }];
      if (inner.node.name === 'OrderedList') renumberList(inner.item, doc, edits, -2);
      if (next && next.node.name === 'OrderedList') renumberList(next.item, doc, edits);
      return { range: EditorSelection.cursor(delTo + insert.length), changes: edits };
    }
    if (inner.node.name === 'Blockquote' && emptyLine && line.from) {
      const previous = doc.lineAt(line.from - 1);
      const quoted = />\s*$/.exec(previous.text);
      if (quoted && quoted.index === inner.from) {
        const edits = state.changes([{ from: previous.from + quoted.index, to: previous.to },
          { from: line.from + inner.from, to: line.to }]);
        return { range: range.map(edits), changes: edits };
      }
    }
    const edits = [];
    if (inner.node.name === 'OrderedList') renumberList(inner.item, doc, edits);
    const continued = inner.item && inner.item.from < line.from;
    let insert = '';
    if (!continued || /^[\s\d.)\-+*>]*/.exec(line.text)[0].length >= inner.to) {
      for (let i = 0; i < context.length; i++) {
        insert += i === context.length - 1 && !continued ? context[i].marker(doc, 1)
          : context[i].blank(i < context.length - 1
            ? countColumn(line.text, 4, context[i + 1].from) - insert.length : null);
      }
    }
    let from = pos;
    while (from > line.from && /\s/.test(line.text.charAt(from - line.from - 1))) from--;
    insert = normalizeIndent(insert, state);
    // A new list item is always written directly. Paragraphs inside loose lists keep their separator.
    if (isLooseList(inner.node, doc) && continued) insert = blankLine(context, state, line) + state.lineBreak + insert;
    edits.push({ from, to: pos, insert: state.lineBreak + insert });
    return { range: EditorSelection.cursor(from + insert.length + state.lineBreak.length), changes: edits };
  });
  if (unsupported) return false;
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
  return true;
}

/**
 * CodeMirror 6: 处理回车时的列表自动缩进
 * @param {import('~types/editor').CM6Adapter} cm
 * @returns {boolean} 是否处理了该事件
 */
export function handleNewlineIndentList(cm) {
  // 如果是 cherry list（中文列表），使用自定义处理
  if (handleCherryList(cm)) return true;
  // 否则返回 false，让 CodeMirror 的默认行为（如 insertNewlineAndIndent）接管
  return false;
}

function handleCherryList(cm) {
  const cherryListRE = /^(\s*)([I一二三四五六七八九十]+)\.(\s+)/;
  const cherryListEmptyRE = /^(\s*)([I一二三四五六七八九十]+)\.(\s+)$/;
  // CodeMirror 6: 检查是否只读
  if (cm.getOption('readOnly')) return false;
  const ranges = cm.listSelections();
  const { doc } = cm.state;

  // 先检查所有选区是否都符合条件
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const headPos = range.head;
    const lineObj = doc.lineAt(headPos);
    const ch = headPos - lineObj.from;
    const lineText = lineObj.text;

    const match = cherryListRE.exec(lineText);
    const cursorBeforeBullet = /^\s*$/.test(lineText.slice(0, ch));

    // 如果任一选区不符合条件，直接返回 false
    if (range.from !== range.to || cursorBeforeBullet || !match) return false;
  }

  // 收集所有要替换的内容和范围，使用单一原子操作
  const changes = [];
  const newSelections = [];

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const headPos = range.head;
    const lineObj = doc.lineAt(headPos);
    const lineText = lineObj.text;
    const match = cherryListRE.exec(lineText);

    if (cherryListEmptyRE.test(lineText)) {
      // 空列表项：删除整行并插入换行
      // 删除从行首到光标位置的内容，然后插入换行
      changes.push({ from: lineObj.from, to: headPos, insert: '\n' });
      // 新光标位置在下一行开头
      newSelections.push(EditorSelection.cursor(lineObj.from + 1));
    } else {
      const indent = match[1];
      const after = match[3];
      const insertText = `\n${indent}I.${after}`;
      changes.push({ from: headPos, to: headPos, insert: insertText });
      // 新光标位置在新行的内容之后
      newSelections.push(EditorSelection.cursor(headPos + insertText.length));
    }
  }

  // 使用单一事务应用所有更改
  cm.dispatch({
    changes,
    selection: EditorSelection.create(newSelections, ranges.length > 0 ? 0 : undefined),
  });

  return true;
}
