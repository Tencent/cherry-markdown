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
 * Milkdown 命令映射表
 * 将 Cherry 工具栏按钮名映射到 Milkdown ProseMirror 命令
 *
 * 注意：Milkdown 的 $command 返回的 plugin 对象的 .key 属性是在编辑器初始化后才赋值的，
 * 因此这里存储 command 对象引用，在执行时通过 cmd.key 获取实际的命令 key。
 */
import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  createCodeBlockCommand,
  insertHrCommand,
  toggleLinkCommand,
} from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { undo, redo } from '@milkdown/kit/prose/history';

/**
 * 从 Header 按钮的 shortKey 中解析标题级别
 */
function parseHeadingLevel(shortKey) {
  const level = parseInt(shortKey, 10);
  return level >= 1 && level <= 6 ? level : 1;
}

/**
 * 创建 WYSIWYG 命令映射表
 * @returns {object} commandMap 对象
 */
export function createWysiwygCommandMap() {
  return {
    commandsCtx,
    editorViewCtx,
    commands: {
      // 行内格式化 — 存储 command 对象引用，运行时取 .key
      bold: { cmd: toggleStrongCommand },
      italic: { cmd: toggleEmphasisCommand },
      strikethrough: { cmd: toggleStrikethroughCommand },
      inlineCode: { cmd: toggleInlineCodeCommand },
      link: { cmd: toggleLinkCommand, payload: { href: '' } },

      // 标题
      header: { cmd: wrapInHeadingCommand, payload: (shortKey) => parseHeadingLevel(shortKey) },
      h1: { cmd: wrapInHeadingCommand, payload: 1 },
      h2: { cmd: wrapInHeadingCommand, payload: 2 },
      h3: { cmd: wrapInHeadingCommand, payload: 3 },

      // 列表
      ul: { cmd: wrapInBulletListCommand },
      ol: { cmd: wrapInOrderedListCommand },
      list: { cmd: wrapInBulletListCommand },
      checklist: { cmd: wrapInBulletListCommand },

      // 块级元素
      quote: { cmd: wrapInBlockquoteCommand },
      code: { cmd: createCodeBlockCommand },
      hr: { cmd: insertHrCommand },
    },
    // undo/redo 使用 ProseMirror history 命令
    prosemirrorCommands: {
      undo: (view) => undo(view.state, view.dispatch),
      redo: (view) => redo(view.state, view.dispatch),
    },
  };
}
