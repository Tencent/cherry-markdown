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
 * 编辑区回车键的列表书写准则（端到端按键链路验证）
 *
 * 复现 Editor.js 中的按键装配方式：
 * - markdown({ addKeymap: false })：关闭 lang-markdown 内置的 markdownKeymap
 * - Prec.high(keymap.of(cherryMarkdownKeymap))：以相同优先级注册 Cherry 自定义准则
 * - 其后是 defaultKeymap（Enter -> insertNewlineAndIndent）作为兜底
 *
 * 验证紧凑列表的空列表项按回车时移除列表标记，而不是插入空行变成 loose list。
 */

import { describe, it, expect, afterEach } from 'vite-plus/test';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, EditorSelection, Prec } from '@codemirror/state';
import { markdown, deleteMarkupBackward } from '@codemirror/lang-markdown';
import { defaultKeymap } from '@codemirror/commands';
import { cherryInsertNewlineContinueMarkup } from '../../src/utils/autoindent';
import { createCm6View } from '../helpers/cM6View';

const createEditor = (doc: string, pos = doc.length): EditorView => {
  // 复用 helper 注入 jsdom 缺失的 API（Range.getClientRects 等）
  createCm6View('').destroy();

  return new EditorView({
    state: EditorState.create({
      doc,
      selection: EditorSelection.single(pos),
      extensions: [
        markdown({ addKeymap: false }),
        Prec.high(
          keymap.of([
            { key: 'Enter', run: cherryInsertNewlineContinueMarkup },
            { key: 'Backspace', run: deleteMarkupBackward },
          ]),
        ),
        keymap.of(defaultKeymap),
      ],
    }),
    parent: document.body,
  });
};

const pressEnter = (view: EditorView) => {
  view.contentDOM.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }),
  );
};

let view: EditorView | null = null;

afterEach(() => {
  view?.destroy();
  view = null;
});

describe('编辑区回车键：紧凑列表不转 loose list', () => {
  it('无序列表空列表项按回车应移除列表标记', () => {
    view = createEditor('- 123\n- ');

    pressEnter(view);

    expect(view.state.doc.toString()).toBe('- 123\n');
    expect(view.state.selection.main.head).toBe(6);
  });

  it('有序列表空列表项按回车应移除列表标记', () => {
    view = createEditor('1. 123\n2. ');

    pressEnter(view);

    expect(view.state.doc.toString()).toBe('1. 123\n');
    expect(view.state.selection.main.head).toBe(7);
  });

  it('列表续写行为保持不变', () => {
    view = createEditor('- 123');

    pressEnter(view);

    expect(view.state.doc.toString()).toBe('- 123\n- ');
  });

  it('普通段落按回车仍插入换行', () => {
    view = createEditor('ordinary text');

    pressEnter(view);

    expect(view.state.doc.toString()).toBe('ordinary text\n');
  });

  it('列表里已存在空行时，新建列表项不再自动补空行', () => {
    view = createEditor('- 123\n\n- 456');

    pressEnter(view);

    // 默认 CommonMark 行为会变成 "- 123\n\n- 456\n\n- "
    expect(view.state.doc.toString()).toBe('- 123\n\n- 456\n- ');
  });

  it('复现「空行后继续编辑」的完整按键序列，不再反复产生空行', () => {
    // 1. "- 123" 回车 -> 续写
    view = createEditor('- 123');
    pressEnter(view);
    expect(view.state.doc.toString()).toBe('- 123\n- ');

    // 2. 空列表项回车 -> 移除标记，光标停在空行
    pressEnter(view);
    expect(view.state.doc.toString()).toBe('- 123\n');

    // 3. 用户在空行再敲一次回车，然后输入新的列表项（此时列表已含空行）
    pressEnter(view);
    view.dispatch(view.state.replaceSelection('- 456'));
    expect(view.state.doc.toString()).toBe('- 123\n\n- 456');

    // 4. 继续回车续写：不应再自动插入空行
    pressEnter(view);
    expect(view.state.doc.toString()).toBe('- 123\n\n- 456\n- ');

    // 5. 空列表项回车：移除标记
    pressEnter(view);
    expect(view.state.doc.toString()).toBe('- 123\n\n- 456\n');
  });
});
