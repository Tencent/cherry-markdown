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
 * - 复用生产 createMarkdownKeymap()，并通过真实 Editor.init() 验证完整拦截链路
 * - 其后是 defaultKeymap（Enter -> insertNewlineAndIndent）作为兜底
 *
 * 验证列表项续写和退出后的独立段落边界。
 */

import { describe, it, expect, afterEach, vi } from 'vite-plus/test';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, EditorSelection, Prec } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, undo } from '@codemirror/commands';
import { createMarkdownKeymap } from '../../src/utils/markdownKeymap';
import Editor from '../../src/Editor';
import type Cherry from '../../src/index';
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
        Prec.high(keymap.of(createMarkdownKeymap())),
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
  it('退出列表后普通文本成为独立段落', () => {
    view = createEditor('- 123\n- ');

    pressEnter(view);
    view.dispatch(view.state.replaceSelection('ordinary text'));

    expect(view.state.doc.toString()).toBe('- 123\n\nordinary text');
    const engine: any = new CherryEngine({});
    const container = document.createElement('div');
    container.innerHTML = engine.makeHtml(view.state.doc.toString());
    expect(container.querySelector('ul')?.textContent).toBe('123');
    expect(container.querySelector(':scope > p')?.textContent).toBe('ordinary text');
  });

  it('退出列表仍可通过一次撤销恢复空列表项', () => {
    view = createEditor('- 123\n- ');

    pressEnter(view);
    expect(view.state.doc.toString()).toBe('- 123\n\n');

    expect(undo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe('- 123\n- ');
  });
});

describe('列表按键链路边界', () => {
  it.each([
    ['无序列表', '- a\n- ', 'ul'],
    ['有序列表', '1. a\n2. ', 'ol'],
    ['任务列表', '- [x] a\n- [ ] ', 'ul'],
  ])('%s退出后生成独立段落', (_name, source, tag) => {
    view = createEditor(source);
    pressEnter(view);
    view.dispatch(view.state.replaceSelection('text'));
    const engine: any = new CherryEngine({});
    const container = document.createElement('div');
    container.innerHTML = engine.makeHtml(view.state.doc.toString());
    expect(container.querySelector(`:scope > ${tag}`)?.textContent?.trim()).toBe('a');
    expect(container.querySelector(':scope > p')?.textContent).toBe('text');
  });

  it('文档中部退出后普通文本分开前后两个列表', () => {
    view = createEditor('- a\n- \n- c', 6);
    pressEnter(view);
    view.dispatch(view.state.replaceSelection('text'));
    expect(view.state.doc.toString()).toBe('- a\n\ntext\n\n- c');
    const engine: any = new CherryEngine({});
    const container = document.createElement('div');
    container.innerHTML = engine.makeHtml(view.state.doc.toString());
    expect([...container.querySelectorAll(':scope > ul')].map((list) => list.textContent)).toEqual(['a', 'c']);
    expect(container.querySelector(':scope > p')?.textContent).toBe('text');
  });

  it('引用中退出后普通文本留在引用内并位于列表外', () => {
    view = createEditor('> - a\n> - ');
    pressEnter(view);
    view.dispatch(view.state.replaceSelection('text'));
    expect(view.state.doc.toString()).toBe('> - a\n>\n> text');
    const engine: any = new CherryEngine({});
    const container = document.createElement('div');
    container.innerHTML = engine.makeHtml(view.state.doc.toString());
    expect(container.querySelector('blockquote > ul')?.textContent).toBe('a');
    expect(container.querySelector('blockquote > p')?.textContent).toBe('text');
  });

  it.each(['- ', '1. ', '> '])('Backspace 保留上游 %s 标记删除行为', (source) => {
    view = createEditor(source);
    view.contentDOM.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Backspace',
        code: 'Backspace',
        keyCode: 8,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(view.state.doc.toString()).toBe('');
  });
});

describe('真实 Editor 的 Enter 装配', () => {
  let editor: Editor | null = null;
  let host: HTMLDivElement;
  const createActualEditor = (source: string) => {
    createCm6View('').destroy();
    host = document.createElement('div');
    const textarea = document.createElement('textarea');
    textarea.id = 'enter-integration';
    textarea.value = source;
    host.appendChild(textarea);
    document.body.appendChild(host);
    const cherry = { status: { editor: 'hide' }, $event: { emit: vi.fn() } };
    editor = new Editor({
      id: textarea.id,
      editorDom: host,
      writingStyle: 'normal',
      autoScrollByCursor: false,
      $cherry: cherry as unknown as Cherry,
    });
    editor.init({ highlightLine: vi.fn(), scrollToLineNum: vi.fn() });
    const actualView = editor.editor!.view;
    actualView.dispatch({ selection: { anchor: source.length } });
    return actualView;
  };

  afterEach(() => {
    editor?.destroy();
    editor = null;
    host?.remove();
  });

  it.each(['- a', '一. a', 'ordinary text'])('建议框接受 Enter 时优先于 %s 的续写', (source) => {
    const actualView = createActualEditor(source);
    const accept = vi.fn(() => true);
    editor!.arrowKeyInterceptor = accept;
    pressEnter(actualView);
    expect(accept).toHaveBeenCalledExactlyOnceWith('Enter');
    expect(actualView.state.doc.toString()).toBe(source);
  });

  it('建议框未处理时仅调用一次拦截，然后续写 Markdown 列表', () => {
    const actualView = createActualEditor('- a');
    const accept = vi.fn(() => false);
    editor!.arrowKeyInterceptor = accept;
    pressEnter(actualView);
    expect(accept).toHaveBeenCalledExactlyOnceWith('Enter');
    expect(actualView.state.doc.toString()).toBe('- a\n- ');
  });

  it('建议框关闭后重新使用当前的 Enter 链路', () => {
    const actualView = createActualEditor('- a');
    editor!.arrowKeyInterceptor = () => true;
    pressEnter(actualView);
    editor!.arrowKeyInterceptor = null;
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe('- a\n- ');
  });

  it.each(['一.', 'I.'])('中文列表 %s 续写和退出保留独立段落', (marker) => {
    const actualView = createActualEditor(`${marker} a`);
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe(`${marker} a\nI. `);
    pressEnter(actualView);
    actualView.dispatch(actualView.state.replaceSelection('text'));
    expect(actualView.state.doc.toString()).toBe(`${marker} a\n\ntext`);
    const engine: any = new CherryEngine({});
    const container = document.createElement('div');
    container.innerHTML = engine.makeHtml(actualView.state.doc.toString());
    expect(container.querySelector('ol')?.textContent).toBe('a');
    expect(container.querySelector(':scope > p')?.textContent).toBe('text');
  });

  it('普通文本最终交给默认 Enter，拦截器不会重复调用', () => {
    const actualView = createActualEditor('ordinary text');
    const accept = vi.fn(() => false);
    editor!.arrowKeyInterceptor = accept;
    pressEnter(actualView);
    expect(accept).toHaveBeenCalledExactlyOnceWith('Enter');
    expect(actualView.state.doc.toString()).toBe('ordinary text\n');
  });

  it('真实 beforeChange 只观察一次最终退出变更，并可以整体取消', () => {
    const actualView = createActualEditor('- a\n- ');
    const observed: string[] = [];
    editor!.editor!.on('beforeChange', (_cm, event: any) => {
      observed.push(event.transaction.newDoc.toString());
      event.cancel();
    });
    pressEnter(actualView);
    expect(observed).toEqual(['- a\n\n']);
    expect(actualView.state.doc.toString()).toBe('- a\n- ');
  });
});
