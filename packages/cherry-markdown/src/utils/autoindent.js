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

/**
 * CodeMirror 6: 处理回车时的列表自动缩进
 * @param {import('~types/editor').CM6Adapter} cm
 */
export function handleNewlineIndentList(cm) {
  if (handleCherryList(cm)) return true;
  // CodeMirror 6: 默认插入换行
  cm.replaceSelection('\n');
  return true;
}

function handleCherryList(cm) {
  const cherryListRE = /^(\s*)([I一二三四五六七八九十]+)\.(\s+)/;
  const cherryListEmptyRE = /^(\s*)([I一二三四五六七八九十]+)\.(\s+)$/;
  // CodeMirror 6: 检查是否只读
  if (cm.getOption('readOnly')) return false;
  const ranges = cm.listSelections();
  const replacements = [];
  for (let i = 0; i < ranges.length; i++) {
    const pos = ranges[i].head;
    const line = cm.getLine(pos.line);
    const match = cherryListRE.exec(line);
    const cursorBeforeBullet = /^\s*$/.test(line.slice(0, pos.ch));
    if (!ranges[i].empty() || cursorBeforeBullet || !match) return;
    if (cherryListEmptyRE.test(line)) {
      cm.replaceRange(
        '',
        {
          line: pos.line,
          ch: 0,
        },
        {
          line: pos.line,
          ch: pos.ch + 1,
        },
      );
      replacements[i] = '\n';
    } else {
      const indent = match[1];
      const after = match[3];
      replacements[i] = `\n${indent}I.${after}`;
    }
  }
  cm.replaceSelections(replacements);
  return true;
}
