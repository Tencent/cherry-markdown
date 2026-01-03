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
 * 获取用户选中的文本内容，如果没有选中文本，则返回光标所在的位置的内容
 * @param {import('@codemirror/view').EditorView} view CodeMirror 6 EditorView实例
 * @param {string} selection 当前选中的文本内容
 * @param {string} type  'line': 当没有选择文本时，获取光标所在行的内容； 'word': 当没有选择文本时，获取光标所在单词的内容
 * @param {boolean} focus true；强行选中光标处的内容，否则只获取选中的内容
 * @returns {string}
 */
export function getSelection(view, selection, type = 'word', focus = false) {
  // 获取 state（EditorView 直接有 state 属性）
  const state = view?.state;
  if (!view || !state) {
    return selection || '';
  }

  const { ranges } = state.selection;

  // 多光标模式下不做处理
  if (ranges.length > 1) {
    return selection;
  }

  if (selection && !focus) {
    return selection;
  }

  const range = ranges[0];
  const { doc } = state;

  // 安全检查文档长度
  if (doc.length === 0) {
    return selection || '';
  }

  // 获取光标所在行的内容，同时选中所在行
  if (type === 'line') {
    try {
      const { from, to } = range;

      // 确保位置在有效范围内
      const safeFrom = Math.max(0, Math.min(from, doc.length));
      const safeTo = Math.max(0, Math.min(to, doc.length));

      // 如果已经有选中内容，扩展到完整行
      if (safeFrom !== safeTo) {
        const startLine = doc.lineAt(safeFrom);
        const endLine = doc.lineAt(safeTo);

        view.dispatch({
          selection: EditorSelection.range(startLine.from, endLine.to),
        });

        return doc.sliceString(startLine.from, endLine.to);
      }

      // 如果没有选中内容，选中当前光标所在行
      const pos = Math.max(0, Math.min(range.head, doc.length - 1));

      // 如果文档为空或只有一个字符，直接返回整个文档
      if (doc.length <= 1) {
        return doc.toString();
      }

      const line = doc.lineAt(pos);

      view.dispatch({
        selection: EditorSelection.range(line.from, line.to),
      });

      return doc.sliceString(line.from, line.to);
    } catch (error) {
      console.warn('Error in getSelection line mode:', error);
      // 如果出错，返回当前选中的文本或整个文档
      return selection || doc.toString();
    }
  }

  // 获取光标所在单词的内容，同时选中所在单词
  if (type === 'word') {
    try {
      const pos = Math.max(0, Math.min(range.head, doc.length - 1));

      // 如果文档为空或只有一个字符，直接返回
      if (doc.length <= 1) {
        return doc.toString();
      }

      const line = doc.lineAt(pos);
      const lineText = line.text;
      const lineStart = line.from;
      const relativePos = pos - lineStart;

      // 查找单词边界
      let wordStart = Math.max(0, relativePos);
      let wordEnd = Math.min(lineText.length, relativePos);

      // 向前查找单词开始位置
      while (wordStart > 0 && /\w/.test(lineText[wordStart - 1])) {
        wordStart -= 1;
      }

      // 向后查找单词结束位置
      while (wordEnd < lineText.length && /\w/.test(lineText[wordEnd])) {
        wordEnd += 1;
      }

      const absoluteStart = lineStart + wordStart;
      const absoluteEnd = lineStart + wordEnd;

      // 设置选择范围为单词
      view.dispatch({
        selection: EditorSelection.range(absoluteStart, absoluteEnd),
      });

      return doc.sliceString(absoluteStart, absoluteEnd);
    } catch (error) {
      console.warn('Error in getSelection word mode:', error);
      return selection || '';
    }
  }

  return selection;
}
