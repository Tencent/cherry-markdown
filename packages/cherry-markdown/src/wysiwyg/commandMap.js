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
  insertHardbreakCommand,
  insertImageCommand,
  listItemSchema,
  wrapInBlockTypeCommand,
  clearTextInCurrentBlockCommand,
} from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand, insertTableCommand } from '@milkdown/kit/preset/gfm';
import { undo, redo } from '@milkdown/kit/prose/history';
import {
  toggleSuperscriptCommand,
  toggleSubscriptCommand,
  toggleUnderlineCommand,
  toggleHighlightCommand,
  toggleFontColorCommand,
  toggleBgColorCommand,
  toggleFontSizeCommand,
} from './marks';
import { insertRubyCommand, insertPanelCommand, insertDetailCommand, insertFootnoteCommand } from './nodes';

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
      sup: { cmd: toggleSuperscriptCommand },
      sub: { cmd: toggleSubscriptCommand },
      underline: { cmd: toggleUnderlineCommand },
      highlight: { cmd: toggleHighlightCommand },

      // 标题
      header: { cmd: wrapInHeadingCommand, payload: (shortKey) => parseHeadingLevel(shortKey) },
      h1: { cmd: wrapInHeadingCommand, payload: 1 },
      h2: { cmd: wrapInHeadingCommand, payload: 2 },
      h3: { cmd: wrapInHeadingCommand, payload: 3 },

      // 列表
      ul: { cmd: wrapInBulletListCommand },
      ol: { cmd: wrapInOrderedListCommand },
      list: { cmd: wrapInBulletListCommand },

      // 块级元素
      quote: { cmd: wrapInBlockquoteCommand },
      code: { cmd: createCodeBlockCommand },
      hr: { cmd: insertHrCommand },
      br: { cmd: insertHardbreakCommand },
      table: { cmd: insertTableCommand },
      image: { cmd: insertImageCommand },
    },
    // 需要 Milkdown ctx 的复杂命令（接收 ctx 和 shortKey 参数）
    ctxCommands: {
      // "插入"下拉菜单：根据 shortKey 路由到对应命令
      insert: (ctx, shortKey) => {
        const commands = ctx.get(commandsCtx);
        switch (shortKey) {
          case 'hr':
            return commands.call(insertHrCommand.key);
          case 'br':
            return commands.call(insertHardbreakCommand.key);
          case 'code':
            return commands.call(createCodeBlockCommand.key);
          case 'link':
            return commands.call(toggleLinkCommand.key, { href: '' });
          default:
            // table/image/formula/checklist 等需要特殊 UI 交互，返回 false
            return false;
        }
      },
      // 颜色按钮：从 shortKey 中解析颜色类型和值
      color: (ctx, shortKey) => {
        if (!shortKey || !/(color|background-color)\s*:/.test(shortKey)) return false;
        const commands = ctx.get(commandsCtx);
        const isBg = /background-color\s*:/.test(shortKey);
        const color = shortKey.replace(/(color|background-color)\s*:\s*([#0-9a-zA-Z]+).*$/, '$2').trim();
        if (isBg) {
          return commands.call(toggleBgColorCommand.key, color);
        }
        return commands.call(toggleFontColorCommand.key, color);
      },
      // 字号按钮：从 shortKey 中解析字号值
      size: (ctx, shortKey) => {
        if (!shortKey || !/^[0-9]+$/.test(shortKey)) return false;
        const commands = ctx.get(commandsCtx);
        return commands.call(toggleFontSizeCommand.key, shortKey);
      },
      // 注音按钮：插入 ruby inline node
      ruby: (ctx, shortKey) => {
        const commands = ctx.get(commandsCtx);
        const view = ctx.get(editorViewCtx);
        const { state } = view;
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to) || '拼音';
        const annotation = shortKey || 'pīn yīn';
        return commands.call(insertRubyCommand.key, { text: selectedText, annotation });
      },
      // 面板按钮：包裹选中内容为 panel 节点
      panel: (ctx, shortKey) => {
        const commands = ctx.get(commandsCtx);
        return commands.call(insertPanelCommand.key, shortKey || 'primary');
      },
      // 手风琴按钮：包裹选中内容为 detail 节点
      detail: (ctx, shortKey) => {
        const commands = ctx.get(commandsCtx);
        return commands.call(insertDetailCommand.key, shortKey || '');
      },
      // 脚注按钮：在光标处插入引用 + 文档末尾插入定义
      footnote: (ctx, shortKey) => {
        const commands = ctx.get(commandsCtx);
        return commands.call(insertFootnoteCommand.key, { label: shortKey || '' });
      },
      checklist: (ctx) => {
        const commands = ctx.get(commandsCtx);
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        const { $from } = state.selection;

        // 查找当前所在的 list_item
        let listItemPos = null;
        let listItemNode = null;
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === 'list_item') {
            listItemPos = $from.before(d);
            listItemNode = node;
            break;
          }
        }

        if (listItemNode) {
          // 已经在列表中 — toggle checked attribute
          const tr = state.tr;
          if (listItemNode.attrs.checked != null) {
            // 已经是 task list -> 转回普通列表
            tr.setNodeMarkup(listItemPos, undefined, { ...listItemNode.attrs, checked: null });
          } else {
            // 普通列表 -> 转为 task list (unchecked)
            tr.setNodeMarkup(listItemPos, undefined, { ...listItemNode.attrs, checked: false });
          }
          dispatch(tr);
          return true;
        }

        // 不在列表中 — 通过 Milkdown 命令创建带 checked 属性的任务列表
        const listItem = listItemSchema.type(ctx);
        commands.call(clearTextInCurrentBlockCommand.key);
        commands.call(wrapInBlockTypeCommand.key, {
          nodeType: listItem,
          attrs: { checked: false },
        });
        return true;
      },
    },
    // undo/redo 使用 ProseMirror history 命令
    prosemirrorCommands: {
      undo: (view) => undo(view.state, view.dispatch),
      redo: (view) => redo(view.state, view.dispatch),
    },
  };
}
