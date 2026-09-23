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

import { ChangeSet, EditorSelection, Transaction } from '@codemirror/state';
import { insertNewlineContinueMarkupCommand } from '@codemirror/lang-markdown';

/** @type {import('@codemirror/state').StateCommand} */
const continueMarkupKeepTightList = insertNewlineContinueMarkupCommand({ nonTightLists: false });

const LOOSE_LIST_BLANK_LINE_RE = /^(\r\n|[\n\r])([ \t>]*)\1[ \t>]*(?:[-*+](?:[ \t]{1,4}\[[ xX]\])?|\d+[.)])[ \t]+$/;
const TOP_LEVEL_EMPTY_LIST_MARKER_RE = /^[ \t]{0,3}(?:[-*+](?:[ \t]{1,4}\[[ xX]\])?|\d+[.)])[ \t]+$/;

/**
 * 准则二的实现：删掉上游为维持 loose list 而多插入的空行。
 * @param {import('@codemirror/state').Transaction} tr 上游命令产生的事务
 * @returns {Array<{ from: number, to: number }>} 新文档中需要删除的范围
 */
function stripLooseListBlankLine(tr) {
  const deletions = [];

  tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
    const match = LOOSE_LIST_BLANK_LINE_RE.exec(inserted.toString());
    // 剥离「换行 + 空行」，保留其后的「换行 + 列表标记」
    if (match) deletions.push({ from: fromB, to: fromB + match[1].length + match[2].length });
  });

  return deletions;
}

/**
 * 顶层空列表项在文档末尾退出时补足块级分隔，避免后续文本成为 lazy continuation。
 * @param {import('@codemirror/state').Transaction} tr 上游命令产生的事务
 * @returns {Array<{ from: number, to: number, insert?: string }>} 需要追加的变更
 */
function preserveExitedListBoundary(tr) {
  let exitedTopLevelList = false;
  tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    const line = tr.startState.doc.lineAt(fromA);
    if (
      inserted.length === 0 &&
      fromA === line.from &&
      toA === line.to &&
      TOP_LEVEL_EMPTY_LIST_MARKER_RE.test(tr.startState.doc.sliceString(fromA, toA))
    ) {
      exitedTopLevelList = true;
    }
  });
  if (!exitedTopLevelList) return [];

  const { newDoc, newSelection } = tr;
  const endRange = newSelection.ranges.find((range) => range.empty && range.head === newDoc.length);
  if (!endRange) return [];

  const cursor = endRange.head;
  const line = newDoc.lineAt(cursor);
  if (!/^[ \t]*$/.test(line.text)) return [];

  const text = newDoc.toString();
  if (!/\S/.test(text) || /(?:\n[ \t]*){2}$/.test(text)) return [];

  return [{ from: cursor, to: cursor, insert: '\n' }];
}

/**
 * 把上游事务改写成最终只派发一次的事务描述。
 * @param {import('@codemirror/state').Transaction} tr 上游命令产生的事务
 * @returns {import('@codemirror/state').TransactionSpec}
 */
function finalizeContinueMarkupTransaction(tr) {
  const rewrites = [...stripLooseListBlankLine(tr), ...preserveExitedListBoundary(tr)];

  if (rewrites.length === 0) {
    return {
      changes: tr.changes,
      selection: tr.newSelection,
      scrollIntoView: tr.scrollIntoView,
      userEvent: tr.annotation(Transaction.userEvent) || 'input',
    };
  }

  const postProcess = ChangeSet.of(rewrites, tr.newDoc.length);
  return {
    // 在原事务的变更之上叠加改写，合成单个变更集（撤销仍为一步）
    changes: tr.changes.compose(postProcess),
    // 插入列表边界时光标应落在新空行；删除 loose 空行时其余选区也能正确映射
    selection: tr.newSelection.map(postProcess, 1),
    scrollIntoView: tr.scrollIntoView,
    // 与默认命令保持一致，Cherry 依赖 userEvent 推导 change 事件的 origin
    userEvent: tr.annotation(Transaction.userEvent) || 'input',
  };
}

/**
 * 捕获上游命令生成的未过滤事务；组合完成后再由真实 state 统一执行 filters。
 * @param {import('@codemirror/state').EditorState} state
 * @returns {import('@codemirror/state').EditorState}
 */
function createPlanningState(state) {
  return new Proxy(state, {
    get(target, property) {
      if (property === 'update') {
        return (...specs) => target.update(...specs, { filter: false });
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

/** Cherry 定制的 Markdown Enter 命令。 */
export function cherryInsertNewlineContinueMarkup(target) {
  const { state } = target;
  // 只读状态下不修改文档（上游命令未做该检查）
  if (state.readOnly) return false;

  /** @type {import('@codemirror/state').Transaction | null} */
  let transaction = null;
  // 在跳过 filters 的 state 上规划事务，避免 beforeChange 等过滤器观察到中间结果
  const handled = continueMarkupKeepTightList({
    state: createPlanningState(state),
    dispatch: (tr) => {
      transaction = tr;
    },
  });
  if (!handled || !transaction) return false;

  target.dispatch(finalizeContinueMarkupTransaction(transaction));
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
