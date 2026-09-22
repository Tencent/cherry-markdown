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

/**
 * ============================================================================
 * 编辑区回车键的列表书写准则
 * ============================================================================
 * Cherry 在 CodeMirror 内置的 CommonMark 行为之上定制了两条列表准则，二者都只影响
 * 编辑区产出的文本，渲染引擎（Engine / core/hooks/List）不参与、也未做任何改动：
 *
 *   准则一：在紧凑列表（tight list，列表项之间没有空行）的空列表项上按回车时，
 *          移除该空列表项的列表标记（顶层列表退出列表，嵌套列表回退一层），
 *          而不是在其上方插入空行、把列表改写成 loose list。
 *   准则二：在已经是 loose list 的列表里按回车新建列表项时，不再自动补一个空行
 *          来维持松散风格，直接紧跟着上一项插入新的列表标记。
 *
 * 实现策略：复用上游命令 `insertNewlineContinueMarkup`，仅在其结果上做最小干预，
 * 而不自行重写列表续写逻辑。因此序号重排、任务框重置、缩进归一化、多光标、
 * 引用嵌套等行为全部继承上游，升级依赖时无需同步维护这些细节。
 *   - 准则一：上游提供了 `nonTightLists: false` 配置，直接启用即可
 *   - 准则二：上游无配置项，故在其产出的事务上叠加一次「删除多余空行」
 *
 * 入口是 `cherryInsertNewlineContinueMarkup`，由 Editor.js 绑定到 Enter 键。
 * ============================================================================
 */

/**
 * 启用了准则一的上游命令：`nonTightLists: false` 让空列表项回车走「删除一级标记」
 * 分支，而不是「插入空行改成 loose list」分支。
 * @type {import('@codemirror/state').StateCommand}
 */
const continueMarkupKeepTightList = insertNewlineContinueMarkupCommand({ nonTightLists: false });

/**
 * 匹配「为维持 loose list 而多插入的空行」，即 CodeMirror 在已是 loose list 的列表里
 * 新建列表项时插入的 `换行 + 空行 + 换行 + 列表标记`：
 * - 捕获组 1 为换行符，并以反向引用要求两处换行一致（兼容 \n 与 \r\n）
 * - 捕获组 2 为空行内容（只允许缩进与引用标记）
 * - 末尾要求恰好只剩一个列表标记（`-`/`*`/`+`，可带任务框；或 `1.`/`1)`），
 *   借此与「列表项内的段落续写」区分开——后者的空行是段落分隔所必需的。
 */
const LOOSE_LIST_BLANK_LINE_RE = /^(\r\n|[\n\r])([ \t>]*)\1[ \t>]*(?:[-*+](?:[ \t]{1,4}\[[ xX]\])?|\d+[.)])[ \t]+$/;

/**
 * 准则二的实现：删掉上游为维持 loose list 而多插入的空行。
 * @param {import('@codemirror/state').Transaction} tr 上游命令产生的事务
 * @returns {import('@codemirror/state').TransactionSpec | null} 改写后的事务描述，无需改写时返回 null
 */
function stripLooseListBlankLine(tr) {
  /** @type {Array<{ from: number, to: number }>} 新文档中多余空行的范围 */
  const deletions = [];

  tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
    const match = LOOSE_LIST_BLANK_LINE_RE.exec(inserted.toString());
    // 剥离「换行 + 空行」，保留其后的「换行 + 列表标记」
    if (match) deletions.push({ from: fromB, to: fromB + match[1].length + match[2].length });
  });

  // 没有多余空行（例如空列表项退出列表、段落续写、序号重排等），沿用原事务
  if (deletions.length === 0) return null;

  const strip = ChangeSet.of(deletions, tr.newDoc.length);
  return {
    // 在原事务的变更之上叠加删除，合成单个变更集（撤销仍为一步）
    changes: tr.changes.compose(strip),
    // 交由 CodeMirror 映射选区，多光标与 anchor/head 方向均自动保持
    selection: tr.newSelection.map(strip),
    scrollIntoView: true,
    // 与默认命令保持一致，Cherry 依赖 userEvent 推导 change 事件的 origin
    userEvent: tr.annotation(Transaction.userEvent) || 'input',
  };
}

/**
 * Cherry 定制版的 `insertNewlineContinueMarkup`（见本文件顶部的准则说明）。
 * 由 Editor.js 绑定到 Enter 键，替代 lang-markdown 内置 markdownKeymap 的同名命令。
 * 返回 false 时（非 Markdown 上下文、代码块内、有选区、只读）交回后续按键处理。
 * @param {{ state: import('@codemirror/state').EditorState, dispatch: (tr: any) => void }} target 编辑器或适配器实例
 * @returns {boolean} 是否处理了该事件
 */
export function cherryInsertNewlineContinueMarkup(target) {
  const { state } = target;
  // 只读状态下不修改文档（上游命令未做该检查）
  if (state.readOnly) return false;

  /** @type {import('@codemirror/state').Transaction | null} */
  let transaction = null;
  // 拦下上游命令生成的事务（不直接派发），以便按准则二改写后只派发一个事务（撤销仍为一步）
  const handled = continueMarkupKeepTightList({
    state,
    dispatch: (tr) => {
      transaction = tr;
    },
  });
  if (!handled || !transaction) return false;

  target.dispatch(stripLooseListBlankLine(transaction) || transaction);
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
