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
 * 验证紧凑列表的空列表项按回车时移除列表标记，并保留结束列表所需的块级分隔。
 */

import { describe, it, expect, afterEach } from 'vite-plus/test';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, EditorSelection, Prec } from '@codemirror/state';
import { markdown, markdownKeymap } from '@codemirror/lang-markdown';
import { defaultKeymap, history, undo } from '@codemirror/commands';
import { cherryInsertNewlineContinueMarkup } from '../../src/utils/autoindent';
import CherryEngine from '../../src/index.engine.core';
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
          keymap.of(
            markdownKeymap.map((binding) =>
              binding.key === 'Enter' ? { ...binding, run: cherryInsertNewlineContinueMarkup } : binding,
            ),
          ),
        ),
        history(),
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
  it('退出列表后输入普通文本应渲染为列表外段落', () => {
    view = createEditor('- 123\n- ');

    pressEnter(view);
    view.dispatch(view.state.replaceSelection('ordinary text'));

    expect(view.state.doc.toString()).toBe('- 123\n\nordinary text');
    const engine: any = new CherryEngine({});
    const container = document.createElement('div');
    container.innerHTML = engine.makeHtml(view.state.doc.toString());
    expect(container.querySelector('ul')?.textContent).toBe('123');
    expect(container.querySelector(':scope > p')?.textContent).toBe('ordinary text');
    expect(container.querySelector('li br')).toBeNull();
  });

  it('退出列表仍可通过一次撤销恢复空列表项', () => {
    view = createEditor('- 123\n- ');

    pressEnter(view);
    expect(view.state.doc.toString()).toBe('- 123\n\n');

    expect(undo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe('- 123\n- ');
  });
});
