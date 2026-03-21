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

import { EditorSelection } from '@codemirror/state';

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
