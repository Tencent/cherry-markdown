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
 * 验证 loose 续写不补空行、上游退出和光标位置。
 */

import { describe, it, expect, afterEach, vi } from 'vite-plus/test';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, EditorSelection, Prec } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, undo, redo } from '@codemirror/commands';
import { createMarkdownKeymap } from '../../src/utils/markdownKeymap';
import Editor from '../../src/Editor';
import type Cherry from '../../src/index';
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
  it('空列表项直接删除标记，不自动添加段落空行', () => {
    view = createEditor('- 123\n- ');

    pressEnter(view);
    view.dispatch(view.state.replaceSelection('ordinary text'));

    expect(view.state.doc.toString()).toBe('- 123\nordinary text');
    expect(view.state.selection.main.head).toBe(view.state.doc.length);
  });

  it('退出列表仍可通过一次撤销恢复空列表项', () => {
    view = createEditor('- 123\n- ');

    pressEnter(view);
    expect(view.state.doc.toString()).toBe('- 123\n');

    expect(undo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe('- 123\n- ');
  });
});

describe('列表按键链路边界', () => {
  it.each([
    ['无序列表', '- a\n\n- b', '- a\n\n- b\n- '],
    ['有序列表', '1. a\n\n2. b', '1. a\n\n2. b\n3. '],
    ['任务列表', '- [ ] a\n\n- [x] b', '- [ ] a\n\n- [x] b\n- [ ] '],
    ['引用内列表', '> - a\n>\n> - b', '> - a\n>\n> - b\n> - '],
  ])('%s续写仅省略上游自动补出的空行', (_name, source, expected) => {
    view = createEditor(source);
    pressEnter(view);
    expect(view.state.doc.toString()).toBe(expected);
    expect(view.state.selection.main.head).toBe(expected.length);
  });

  it.each([
    ['无序列表', '- a\n- ', '- a\ntext'],
    ['有序列表', '1. a\n2. ', '1. a\ntext'],
    ['任务列表', '- [x] a\n- [ ] ', '- [x] a\ntext'],
  ])('%s退出后直接删除空列表标记', (_name, source, expected) => {
    view = createEditor(source);
    pressEnter(view);
    view.dispatch(view.state.replaceSelection('text'));
    expect(view.state.doc.toString()).toBe(expected);
    expect(view.state.selection.main.head).toBe(expected.length);
  });

  it('文档中部退出时不额外添加空行', () => {
    view = createEditor('- a\n- \n- c', 6);
    pressEnter(view);
    view.dispatch(view.state.replaceSelection('text'));
    expect(view.state.doc.toString()).toBe('- a\ntext\n- c');
    expect(view.state.selection.main.head).toBe('- a\ntext'.length);
  });

  it('引用内退出仅删除列表标记', () => {
    view = createEditor('> - a\n> - ');
    pressEnter(view);
    view.dispatch(view.state.replaceSelection('text'));
    expect(view.state.doc.toString()).toBe('> - a\n> text');
    expect(view.state.selection.main.head).toBe(view.state.doc.length);
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

  it.each([
    ['1. a|\n2. b|\n3. c', '1. a\n2. |\n3. b\n4. |\n5. c'],
    ['1. a\n   body|\n2. b|\n3. c', '1. a\n   body\n   |\n2. b\n3. |\n4. c'],
    ['1. a|\n2. |\n3. c', '1. a\n2. |\n|\n3. c'],
    ['1. parent\n   1. child\n   2. |\n   3. |\n2. after', '1. parent\n   1. child\n2. |\n3. |\n4. after'],
    ['9. a|\n10. b|\n11. c\n\n> quote|', '9. a\n10. |\n11. b\n12. |\n13. c\n\n> quote\n> |'],
  ])('真实 Editor 编号协调只有一次 beforeChange，支持取消及撤销：%s', (source, expected) => {
    const parse = (template: string) => {
      const cursors: number[] = [];
      const doc = template.replace(/\|/g, (_match, offset: number) => {
        cursors.push(offset - cursors.length);
        return '';
      });
      return {
        doc,
        selection: EditorSelection.create(
          cursors.map((pos) => EditorSelection.cursor(pos)),
          1,
        ),
      };
    };
    const before = parse(source);
    const after = parse(expected);
    const actualView = createActualEditor(before.doc);
    actualView.dispatch({ selection: before.selection });
    const observed: string[] = [];
    let cancel = true;
    editor!.editor!.on('beforeChange', (_cm, event: any) => {
      observed.push(event.transaction.newDoc.toString());
      if (cancel) event.cancel();
    });
    pressEnter(actualView);
    expect(observed).toEqual([after.doc]);
    expect(actualView.state.doc.toString()).toBe(before.doc);
    // changeFilter cancellation retains upstream's marker-start mapping for an exited item.
    const cancelled = source === '1. a|\n2. |\n3. c' ? parse('1. a|\n|2. \n3. c').selection : before.selection;
    expect(actualView.state.selection.eq(cancelled)).toBe(true);
    actualView.dispatch({ selection: before.selection });
    cancel = false;
    observed.length = 0;
    pressEnter(actualView);
    expect(observed).toEqual([after.doc]);
    expect(actualView.state.doc.toString()).toBe(after.doc);
    expect(actualView.state.selection.eq(after.selection)).toBe(true);
    expect(undo(actualView)).toBe(true);
    expect(actualView.state.doc.toString()).toBe(before.doc);
    expect(actualView.state.selection.eq(before.selection)).toBe(true);
    expect(redo(actualView)).toBe(true);
    expect(actualView.state.doc.toString()).toBe(after.doc);
    expect(actualView.state.selection.eq(after.selection)).toBe(true);
    actualView.dispatch(actualView.state.replaceSelection('X'));
    expect(actualView.state.doc.toString()).toBe(expected.replace(/\|/g, 'X'));
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

  it.each(['一.', 'I.'])('中文列表 %s 续写和退出保留源码段落分隔', (marker) => {
    const actualView = createActualEditor(`${marker} a`);
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe(`${marker} a\nI. `);
    pressEnter(actualView);
    actualView.dispatch(actualView.state.replaceSelection('text'));
    expect(actualView.state.doc.toString()).toBe(`${marker} a\n\ntext`);
    expect(actualView.state.selection.main.head).toBe(actualView.state.doc.length);
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
    expect(observed).toEqual(['- a\n']);
    expect(actualView.state.doc.toString()).toBe('- a\n- ');
  });

  it.each([false, true])('混合 loose 列表与引用仅触发一次 beforeChange（取消=%s）', (cancel) => {
    const source = '- a\n\n- b\n\n> quote';
    const expected = '- a\n\n- b\n- \n\n> quote\n> ';
    const actualView = createActualEditor(source);
    actualView.dispatch({
      selection: EditorSelection.create([
        EditorSelection.cursor(actualView.state.doc.line(3).to),
        EditorSelection.cursor(source.length),
      ]),
    });
    const observed: string[] = [];
    editor!.editor!.on('beforeChange', (_cm, event: any) => {
      observed.push(event.transaction.newDoc.toString());
      if (cancel) event.cancel();
    });
    pressEnter(actualView);
    expect(observed).toEqual([expected]);
    expect(actualView.state.doc.toString()).toBe(cancel ? source : expected);
    if (!cancel) {
      expect(actualView.state.selection.ranges.map((range) => range.head)).toEqual([11, expected.length]);
      expect(undo(actualView)).toBe(true);
      expect(actualView.state.doc.toString()).toBe(source);
      expect(redo(actualView)).toBe(true);
      expect(actualView.state.doc.toString()).toBe(expected);
    }
  });

  it.each(['- a', '一. a', '> quote'])('只读切换阻止 %s 的 Enter，恢复编辑后继续处理', (source) => {
    const actualView = createActualEditor(source);
    editor!.setReadOnly(true);
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe(source);
    editor!.setReadOnly(false);
    pressEnter(actualView);
    expect(actualView.state.doc.lines).toBe(2);
  });

  it('退出列表与真实 Editor 的撤销、重做组合', () => {
    const source = '- a\n- ';
    const actualView = createActualEditor(source);
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe('- a\n');
    expect(undo(actualView)).toBe(true);
    expect(actualView.state.doc.toString()).toBe(source);
    expect(redo(actualView)).toBe(true);
    expect(actualView.state.doc.toString()).toBe('- a\n');
  });

  it('列表续写后 Tab 缩进，再按 Enter 退回父级', () => {
    const actualView = createActualEditor('- a');
    pressEnter(actualView);
    actualView.contentDOM.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(actualView.state.doc.toString()).toBe('- a\n  - ');
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe('- a\n- ');
  });

  it('列表中选中文字时 Enter 交给默认选区替换', () => {
    const actualView = createActualEditor('- abc');
    actualView.dispatch({ selection: { anchor: 2, head: 5 } });
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe('- \n');
  });

  it('列表前有 Front Matter 和表格时，退出不改动其他块', () => {
    const prefix = '---\ntitle: test\n---\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\n';
    const actualView = createActualEditor(`${prefix}- a\n- `);
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe(`${prefix}- a\n`);
  });

  it('原子标记拦截列表退出时没有部分删除', () => {
    const source = '- a\n- ';
    const actualView = createActualEditor(source);
    editor!.editor!.markText(4, 6, { atomic: true });
    actualView.dispatch({ selection: { anchor: 5 } });
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe(source);
  });

  const pressKey = (actualView: EditorView, key: string, keyCode: number) => {
    actualView.contentDOM.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        keyCode,
        bubbles: true,
        cancelable: true,
      }),
    );
  };

  it.each(['- a\n- b', '1. a\n2. b', '- [ ] a\n- [ ] b', '> a\n> b', '一. a\n二. b'])(
    'Vim 普通模式 Enter 只移动光标：%s',
    async (source) => {
      const actualView = createActualEditor(source);
      await editor!.editor!.setKeyMap('vim');
      actualView.dispatch({ selection: { anchor: actualView.state.doc.line(1).to } });
      const accept = vi.fn(() => true);
      editor!.arrowKeyInterceptor = accept;
      pressEnter(actualView);
      expect(actualView.state.doc.toString()).toBe(source);
      expect(actualView.state.selection.main.head).toBe(actualView.state.doc.line(2).from);
      expect(accept).not.toHaveBeenCalled();
    },
  );

  it('Vim 普通模式 Backspace 不删除列表标记', async () => {
    const actualView = createActualEditor('- a');
    await editor!.editor!.setKeyMap('vim');
    actualView.dispatch({ selection: { anchor: 2 } });
    pressKey(actualView, 'Backspace', 8);
    expect(actualView.state.doc.toString()).toBe('- a');
    expect(actualView.state.selection.main.head).toBe(1);
  });

  it('Vim 插入模式保留建议框的 Enter 拦截', async () => {
    const actualView = createActualEditor('- a');
    await editor!.editor!.setKeyMap('vim');
    pressKey(actualView, 'i', 73);
    actualView.dispatch({ selection: { anchor: actualView.state.doc.length } });
    const accept = vi.fn(() => true);
    editor!.arrowKeyInterceptor = accept;
    pressEnter(actualView);
    expect(accept).toHaveBeenCalledExactlyOnceWith('Enter');
    expect(actualView.state.doc.toString()).toBe('- a');
    editor!.arrowKeyInterceptor = null;
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe('- a\n- ');
  });

  it('Vim 插入模式保留 Tab、Enter 退级和 Backspace 删除标记', async () => {
    const actualView = createActualEditor('- a');
    await editor!.editor!.setKeyMap('vim');
    pressKey(actualView, 'i', 73);
    actualView.dispatch({ selection: { anchor: actualView.state.doc.length } });
    pressEnter(actualView);
    pressKey(actualView, 'Tab', 9);
    expect(actualView.state.doc.toString()).toBe('- a\n  - ');
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe('- a\n- ');
    pressKey(actualView, 'Backspace', 8);
    expect(actualView.state.doc.toString()).toBe('- a\n  ');
    pressKey(actualView, 'Backspace', 8);
    expect(actualView.state.doc.toString()).toBe('- a\n');
  });

  it('Vim 插入模式和默认模式切换保留列表 Enter', async () => {
    const actualView = createActualEditor('- a');
    await editor!.editor!.setKeyMap('vim');
    const { getCM } = await import('@replit/codemirror-vim');
    expect(getCM(actualView)?.state.vim?.insertMode).toBe(false);
    actualView.contentDOM.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'i',
        code: 'KeyI',
        keyCode: 73,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(getCM(actualView)?.state.vim?.insertMode).toBe(true);
    actualView.dispatch({ selection: { anchor: actualView.state.doc.length } });
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe('- a\n- ');
    await editor!.editor!.setKeyMap('sublime');
    pressEnter(actualView);
    expect(actualView.state.doc.toString()).toBe('- a\n');
  });
});
