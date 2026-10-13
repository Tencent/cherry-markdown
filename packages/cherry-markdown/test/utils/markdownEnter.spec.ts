import { EditorSelection, EditorState, Text, Transaction, type Extension } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { markdown, insertNewlineContinueMarkupCommand } from '@codemirror/lang-markdown';
import { describe, expect, it, vi } from 'vite-plus/test';
import { cherryInsertNewlineContinueMarkup } from '../../src/utils/markdownEnter';

const upstreamRun = vi.hoisted(() => vi.fn());

vi.mock('@codemirror/lang-markdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@codemirror/lang-markdown')>();
  return {
    ...actual,
    insertNewlineContinueMarkupCommand: (config: Parameters<typeof actual.insertNewlineContinueMarkupCommand>[0]) => {
      const command = actual.insertNewlineContinueMarkupCommand(config);
      return (target: Parameters<typeof command>[0]) => {
        upstreamRun();
        return command(target);
      };
    },
  };
});

const CURSOR = '|';

const parseCursors = (template: string): { doc: string; cursors: number[] } => {
  const cursors: number[] = [];
  let doc = '';
  for (const ch of template) {
    if (ch === CURSOR) {
      cursors.push(doc.length);
    } else {
      doc += ch;
    }
  }
  return { doc, cursors: cursors.length > 0 ? cursors : [doc.length] };
};

const createMarkdownTarget = (
  template: string,
  options: { readOnly?: boolean; mainIndex?: number; extensions?: Extension[] } = {},
) => {
  const { doc, cursors } = parseCursors(template);
  let state = EditorState.create({
    doc,
    selection: EditorSelection.create(
      cursors.map((p) => EditorSelection.cursor(p)),
      options.mainIndex ?? 0,
    ),
    extensions: [
      markdown(),
      EditorState.allowMultipleSelections.of(true),
      EditorState.readOnly.of(!!options.readOnly),
      ...(options.extensions ?? []),
    ],
  });
  const dispatch = vi.fn((tr: Transaction | Parameters<typeof state.update>[0]) => {
    state = tr instanceof Transaction ? tr.state : state.update(tr).state;
  });

  const target = {
    get state() {
      return state;
    },
    dispatch,
  };

  return {
    target,
    dispatch,
    pressEnter: () => cherryInsertNewlineContinueMarkup(target as never),
    getDocWithCursors: () => {
      const doc = state.doc.toString();
      const heads = [...state.selection.ranges].map((range) => range.head).sort((a, b) => b - a);
      return heads.reduce((text, pos) => text.slice(0, pos) + CURSOR + text.slice(pos), doc);
    },
  };
};

const expectEnter = (before: string, after: string, options?: { extensions?: Extension[] }) => {
  const context = createMarkdownTarget(before, options);
  expect(context.pressEnter()).toBe(true);
  expect(context.getDocWithCursors()).toBe(after);
  expect(context.dispatch).toHaveBeenCalledOnce();
};

describe('loose 续写只省略自动空行', () => {
  it.each([
    ['- a\n\n- b|', '- a\n\n- b\n- |'],
    ['* a\n\n* b|', '* a\n\n* b\n* |'],
    ['+ a\n\n+ b|', '+ a\n\n+ b\n+ |'],
    ['1. a\n\n2. b|\n3. c', '1. a\n\n2. b\n3. |\n4. c'],
    ['1) a\n\n2) b|\n8) c', '1) a\n\n2) b\n3) |\n8) c'],
    ['- [ ] a\n\n- [X] b|', '- [ ] a\n\n- [X] b\n- [ ] |'],
    ['> - a\n>\n> - b|', '> - a\n>\n> - b\n> - |'],
    ['- parent\n  - a\n\n  - b|', '- parent\n  - a\n\n  - b\n  - |'],
    ['- a\n\n- b\n  continuation|', '- a\n\n- b\n  continuation\n  |'],
    ['- a\n\n- b| tail', '- a\n\n- b\n- | tail'],
    ['- a\n\n- b   |', '- a\n\n- b\n- |'],
  ])('%s', (source, expected) => {
    upstreamRun.mockClear();
    expectEnter(source, expected);
    expect(upstreamRun).not.toHaveBeenCalled();
  });

  it.each([
    '1. a\n\n2.   b|',
    '1. a\n\n2.    b|',
    '1. a\n\n2.     b|',
    '- a\n\n-   b|',
    '- a\n\n-    b|',
    '- a\n\n-     b|',
    '- [ ] a\n\n-  [X]   b|',
  ])('标记空格边界保持上游语义，仅省略新增空行：%s', (source) => {
    const cherry = createMarkdownTarget(source);
    const upstream = createMarkdownTarget(source);
    upstreamRun.mockClear();
    expect(cherry.pressEnter()).toBe(true);
    expect(upstreamRun).not.toHaveBeenCalled();
    expect(insertNewlineContinueMarkupCommand({ nonTightLists: false })(upstream.target as never)).toBe(true);
    const transaction = upstream.dispatch.mock.calls[0][0] as Transaction;
    const changes: { from: number; to: number; insert: string }[] = [];
    transaction.changes.iterChanges((from, to, _fromB, _toB, text) => {
      changes.push({ from, to, insert: text.toString().replace(/^\n\n/, '\n') });
    });
    expect(cherry.target.state.doc.toString()).toBe(
      transaction.startState.changes(changes).apply(transaction.startState.doc).toString(),
    );
    expect(cherry.target.state.selection.main.head).toBe(cherry.target.state.doc.length);
  });

  it('Tab 缩进保持层级', () => {
    expectEnter('- parent\n\t- a\n\n\t- b|', '- parent\n\t- a\n\n\t- b\n\t- |', {
      extensions: [indentUnit.of('\t')],
    });
  });

  it('CRLF 插入与光标采用文档坐标', () => {
    let state = EditorState.create({
      doc: '- a\r\n\r\n- b',
      extensions: [markdown(), EditorState.lineSeparator.of('\r\n')],
    });
    state = state.update({ selection: { anchor: state.doc.length } }).state;
    const dispatch = vi.fn((tr: Transaction) => {
      state = tr.state;
    });
    expect(cherryInsertNewlineContinueMarkup({ state, dispatch })).toBe(true);
    expect(state.sliceDoc()).toBe('- a\r\n\r\n- b\r\n- ');
    expect(state.selection.main.head).toBe(state.doc.length);
    expect(dispatch).toHaveBeenCalledOnce();
  });
});

describe('没有 loose 续写时实际委托上游', () => {
  it.each([
    '- a|',
    '3. a|\n4. b',
    '3. a|\n8. b',
    '- [x] a|',
    '- a\n- |',
    '- a\n\n- |',
    '1. a\n2. |\n3. c',
    '> - a\n> - |',
    '- a\n  - b|',
    '- a\n  - b\n  - |',
    '> quoted|',
    '> > quoted|',
    '> >\n> > |',
    '> quoted|\n\n> other|',
    '> quoted\n>\n> paragraph|',
    '- a\n  continuation|',
    '- a\n  > quoted|',
    '- a\n  >\n  > |',
    '- a\n\t- b|',
    '> - [X] task|',
    '1) a|\n2) b',
    '>\n> |',
    'text|',
    '```\n- code|\n```',
    '<div>code|</div>',
    '- first| last|',
  ])('%s', (source) => {
    const cherry = createMarkdownTarget(source);
    const upstream = createMarkdownTarget(source);
    upstreamRun.mockClear();
    const handled = cherry.pressEnter();
    expect(upstreamRun).toHaveBeenCalledOnce();
    expect(handled).toBe(insertNewlineContinueMarkupCommand({ nonTightLists: false })(upstream.target as never));
    expect(cherry.getDocWithCursors()).toBe(upstream.getDocWithCursors());
    expect(cherry.dispatch.mock.calls.length).toBe(upstream.dispatch.mock.calls.length);
  });

  it('只读不调用命令', () => {
    const context = createMarkdownTarget('- a\n\n- b|', { readOnly: true });
    upstreamRun.mockClear();
    expect(context.pressEnter()).toBe(false);
    expect(context.dispatch).not.toHaveBeenCalled();
    expect(upstreamRun).not.toHaveBeenCalled();
  });
});

const mixedCases = [
  ['引用续写', '- a\n\n- b|\n\n> quote|', '- a\n\n- b\n- |\n\n> quote\n> |'],
  ['紧凑列表续写', '- a\n\n- b|\n\n* c|', '- a\n\n- b\n- |\n\n* c\n* |'],
  ['空列表退出', '- a\n\n- b|\n\n* c\n* |', '- a\n\n- b\n- |\n\n* c\n|'],
  ['有序列表退出并重排', '- a\n\n- b|\n\n1. c\n2. |\n3. d', '- a\n\n- b\n- |\n\n1. c\n|\n2. d'],
  ['嵌套空项退级', '- a\n\n- b|\n\n* c\n  * d\n  * |', '- a\n\n- b\n- |\n\n* c\n  * d\n* |'],
  ['引用内空项退出', '- a\n\n- b|\n\n> * c\n> * |', '- a\n\n- b\n- |\n\n> * c\n> |'],
  ['引用退出', '- a\n\n- b|\n\n> quote\n> \n> |', '- a\n\n- b\n- |\n\n> quote\n\n|'],
  ['同一列表续写与空项退出', '- a\n\n- b|\n- |', '- a\n\n- b\n- |\n|'],
  ['两处 loose 续写', '- a\n\n- b|\n\n* c\n\n* d|', '- a\n\n- b\n- |\n\n* c\n\n* d\n* |'],
];

describe('混合多光标只生成一次最终事务', () => {
  it.each(mixedCases)('%s', (_name, source, expected) => {
    const observed: string[] = [];
    const filtered: string[] = [];
    const context = createMarkdownTarget(source, {
      extensions: [
        EditorState.changeFilter.of((tr) => {
          observed.push(tr.newDoc.toString());
          return true;
        }),
        EditorState.transactionFilter.of((tr) => {
          filtered.push(tr.newDoc.toString());
          return tr;
        }),
      ],
    });
    upstreamRun.mockClear();
    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe(expected);
    expect(context.dispatch).toHaveBeenCalledOnce();
    expect(observed).toEqual([parseCursors(expected).doc]);
    expect(filtered).toEqual(observed);
    expect(upstreamRun).not.toHaveBeenCalled();
  });

  it.each([0, 1, 2])('三个混合光标保留主光标 %s，并只提交最终事务', (mainIndex) => {
    const source = '- a\n\n- b|\n\n> quote|\n\n* c\n* |';
    const expected = '- a\n\n- b\n- |\n\n> quote\n> |\n\n* c\n|';
    const observed: string[] = [];
    const context = createMarkdownTarget(source, {
      mainIndex,
      extensions: [
        EditorState.changeFilter.of((tr) => {
          observed.push(tr.newDoc.toString());
          return true;
        }),
      ],
    });
    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe(expected);
    expect(context.target.state.selection.mainIndex).toBe(mainIndex);
    expect(context.target.state.selection.main.head).toBe(parseCursors(expected).cursors[mainIndex]);
    expect(observed).toEqual([parseCursors(expected).doc]);
    expect(context.dispatch).toHaveBeenCalledOnce();
  });

  it('混合 CRLF 光标保持文档偏移和一次最终事务', () => {
    const source = '- a\n\n- b|\n\n> quote|';
    const expected = parseCursors('- a\n\n- b\n- |\n\n> quote\n> |');
    const { doc, cursors } = parseCursors(source);
    const observed: string[] = [];
    let state = EditorState.create({
      doc: Text.of(doc.split('\n')),
      selection: EditorSelection.create(
        cursors.map((pos) => EditorSelection.cursor(pos)),
        1,
      ),
      extensions: [
        markdown(),
        EditorState.allowMultipleSelections.of(true),
        EditorState.lineSeparator.of('\r\n'),
        EditorState.changeFilter.of((tr) => {
          observed.push(tr.newDoc.toString());
          return true;
        }),
      ],
    });
    const dispatch = vi.fn((tr: Transaction) => {
      state = tr.state;
    });
    expect(cherryInsertNewlineContinueMarkup({ state, dispatch })).toBe(true);
    expect(state.doc.toString()).toBe(expected.doc);
    expect(state.sliceDoc()).toBe(expected.doc.replace(/\n/g, '\r\n'));
    expect(state.selection.ranges.map((range) => range.head)).toEqual(expected.cursors);
    expect(state.selection.mainIndex).toBe(1);
    expect(observed).toEqual([expected.doc]);
    expect(dispatch).toHaveBeenCalledOnce();
  });

  it('非空选区与 loose 光标混合时整体回退，没有部分编辑', () => {
    const context = createMarkdownTarget('- a\n\n- b|\n\n> quote|');
    const [first, second] = context.target.state.selection.ranges;
    context.target.dispatch({
      selection: EditorSelection.create([first, EditorSelection.range(second.head - 5, second.head)], 1),
    });
    const original = context.target.state;
    context.dispatch.mockClear();
    upstreamRun.mockClear();
    expect(context.pressEnter()).toBe(false);
    expect(context.target.state).toBe(original);
    expect(context.dispatch).not.toHaveBeenCalled();
    expect(upstreamRun).not.toHaveBeenCalled();
  });

  it.each(mixedCases)('%s被 changeFilter 取消时不部分更新，光标与上游一致', (_name, source, expected) => {
    const observed: string[] = [];
    const context = createMarkdownTarget(source, {
      mainIndex: 1,
      extensions: [
        EditorState.changeFilter.of((tr) => {
          observed.push(tr.newDoc.toString());
          return false;
        }),
      ],
    });
    expect(context.pressEnter()).toBe(true);
    expect(observed).toEqual([parseCursors(expected).doc]);
    expect(context.target.state.doc.toString()).toBe(parseCursors(source).doc);
    const upstream = createMarkdownTarget(source, {
      mainIndex: 1,
      extensions: [EditorState.changeFilter.of(() => false)],
    });
    expect(insertNewlineContinueMarkupCommand({ nonTightLists: false })(upstream.target as never)).toBe(true);
    expect(context.getDocWithCursors()).toBe(upstream.getDocWithCursors());
    expect(context.target.state.selection.eq(upstream.target.state.selection)).toBe(true);
    expect(context.dispatch).toHaveBeenCalledOnce();
  });

  it('transactionFilter 整体取消时保留全部源码及光标', () => {
    const source = '- a\n\n- b|\n\n> * c\n> * |';
    const observed: string[] = [];
    const context = createMarkdownTarget(source, {
      mainIndex: 1,
      extensions: [
        EditorState.transactionFilter.of((tr) => {
          observed.push(tr.newDoc.toString());
          return [];
        }),
      ],
    });
    expect(context.pressEnter()).toBe(true);
    expect(observed).toEqual(['- a\n\n- b\n- \n\n> * c\n> ']);
    expect(context.getDocWithCursors()).toBe(source);
    expect(context.target.state.selection.mainIndex).toBe(1);
    expect(context.dispatch).toHaveBeenCalledOnce();
  });

  it.each(['- a\n\n- b|\n\ntext|', '- a\n\n- b|\n\n```\ncode|\n```'])(
    '不支持的混合选区整体回退而不部分更新：%s',
    (source) => {
      const context = createMarkdownTarget(source);
      expect(context.pressEnter()).toBe(false);
      expect(context.getDocWithCursors()).toBe(source);
      expect(context.dispatch).not.toHaveBeenCalled();
    },
  );
});

const numberedCases = [
  [
    '三层列表子项同时退级',
    '- root\n  1. parent\n     1. child\n     2. |\n     3. |\n  2. after',
    '- root\n  1. parent\n     1. child\n  2. |\n  3. |\n  4. after',
  ],
  [
    '引用内两个子项退级',
    '> 1. parent\n>    1. child\n>    2. |\n>    3. |\n> 2. after',
    '> 1. parent\n>    1. child\n> 2. |\n> 3. |\n> 4. after',
  ],
  ['正文续行与列表项续写', '1. a\n   body|\n2. b|\n3. c', '1. a\n   body\n   |\n2. b\n3. |\n4. c'],
  ['同一项标记续写与正文续行', '1. a|\n   body|\n2. b', '1. a\n2. |\n   body\n   |\n3. b'],
  ['正文续行与空项退出', '1. a\n   body|\n2. |\n3. c', '1. a\n   body\n   |\n|\n2. c'],
  ['两处正文续行不重排编号', '1. a\n   body|\n2. b\n   body|\n3. c', '1. a\n   body\n   |\n2. b\n   body\n   |\n3. c'],
  ['紧凑列表双光标', '1. a|\n2. b|\n3. c', '1. a\n2. |\n3. b\n4. |\n5. c'],
  ['loose 列表双光标', '1. a|\n\n2. b|\n3. c', '1. a\n2. |\n\n3. b\n4. |\n5. c'],
  ['三个光标', '1. a|\n\n2. b|\n3. c|\n4. d', '1. a\n2. |\n\n3. b\n4. |\n5. c\n6. |\n7. d'],
  ['末尾两项', '1. a\n\n2. b|\n3. c|', '1. a\n\n2. b\n3. |\n4. c\n5. |'],
  ['同一项两个位置', '1. a|b|c\n2. d', '1. a\n2. |b\n3. |c\n4. d'],
  ['两位数边界', '9. a|\n10. b|\n11. c', '9. a\n10. |\n11. b\n12. |\n13. c'],
  ['括号标记', '1) a|\n2) b|\n3) c', '1) a\n2) |\n3) b\n4) |\n5) c'],
  ['跳号阻断累计', '1. a|\n2. b|\n8. c\n9. d', '1. a\n2. |\n3. b\n4. |\n8. c\n9. d'],
  ['跳号后独立续写', '1. a|\n5. b|\n6. c', '1. a\n2. |\n5. b\n6. |\n7. c'],
  ['紧凑列表续写与退出', '1. a|\n2. |\n3. c', '1. a\n2. |\n|\n3. c'],
  ['loose 列表续写与退出', '1. a|\n\n2. |\n3. c', '1. a\n2. |\n\n|\n3. c'],
  ['两个空项退出', '1. a\n2. |\n3. |\n4. d', '1. a\n|\n|\n2. d'],
  ['退出与后续续写', '1. a\n2. |\n3. c|\n4. d', '1. a\n|\n2. c\n3. |\n4. d'],
  ['引用中多光标', '> 1. a|\n>\n> 2. b|\n> 3. c', '> 1. a\n> 2. |\n>\n> 3. b\n> 4. |\n> 5. c'],
  ['嵌套有序列表续写', '- parent\n  1. a|\n\n  2. b|\n  3. c', '- parent\n  1. a\n  2. |\n\n  3. b\n  4. |\n  5. c'],
  ['父级续写与子级退级', '1. parent|\n   1. child\n   2. |\n2. after', '1. parent\n2. |\n   1. child\n3. |\n4. after'],
  [
    '两个子项退级到同一父级',
    '1. parent\n   1. child\n   2. |\n   3. |\n2. after',
    '1. parent\n   1. child\n2. |\n3. |\n4. after',
  ],
  [
    '无序子项退级与父级续写',
    '1. parent\n   - child\n   - |\n2. after|\n3. end',
    '1. parent\n   - child\n2. |\n3. after\n4. |\n5. end',
  ],
  ['父项退出与子项退级', '1. |\n   - child\n   - |\n2. after', '|\n   - child\n1. |\n2. after'],
  ['编号与引用混合', '1. a|\n2. b|\n3. c\n\n> quote|', '1. a\n2. |\n3. b\n4. |\n5. c\n\n> quote\n> |'],
];

describe('有序列表的编号由同一次 Enter 统一规划', () => {
  it.each(numberedCases)('%s：编号、光标及过滤器只看到最终结果', (_name, source, expected) => {
    const observed: string[] = [];
    const filtered: string[] = [];
    const context = createMarkdownTarget(source, {
      mainIndex: 1,
      extensions: [
        EditorState.changeFilter.of((tr) => {
          observed.push(tr.newDoc.toString());
          return true;
        }),
        EditorState.transactionFilter.of((tr) => {
          filtered.push(tr.newDoc.toString());
          return tr;
        }),
      ],
    });
    upstreamRun.mockClear();
    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe(expected);
    expect(context.target.state.selection.mainIndex).toBe(1);
    expect(context.dispatch).toHaveBeenCalledOnce();
    expect(observed).toEqual([parseCursors(expected).doc]);
    expect(filtered).toEqual(observed);
    expect(upstreamRun).not.toHaveBeenCalled();
  });

  it.each(numberedCases)('%s：整体取消保留所有源码和光标', (_name, source, expected) => {
    const observed: string[] = [];
    const context = createMarkdownTarget(source, {
      mainIndex: 1,
      extensions: [
        EditorState.transactionFilter.of((tr) => {
          observed.push(tr.newDoc.toString());
          return [];
        }),
      ],
    });
    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe(source);
    expect(context.target.state.selection.mainIndex).toBe(1);
    expect(observed).toEqual([parseCursors(expected).doc]);
    expect(context.dispatch).toHaveBeenCalledOnce();
  });

  it('列表外的空白正文行与编号操作混合时整体回退', () => {
    const source = '1. a\n   |\n2. b|\n3. c';
    const context = createMarkdownTarget(source);
    expect(context.pressEnter()).toBe(false);
    expect(context.getDocWithCursors()).toBe(source);
    expect(context.dispatch).not.toHaveBeenCalled();
  });

  it('不支持的选区与编号冲突混合时整体回退', () => {
    const source = '1. a|\n2. b|\n3. c\n\ntext|';
    const context = createMarkdownTarget(source);
    expect(context.pressEnter()).toBe(false);
    expect(context.getDocWithCursors()).toBe(source);
    expect(context.dispatch).not.toHaveBeenCalled();
  });

  it('跨越 9 到 10 的 CRLF 编号修改保留全部光标', () => {
    const source = parseCursors('8. a|\n9. b|\n10. c');
    const expected = parseCursors('8. a\n9. |\n10. b\n11. |\n12. c');
    let state = EditorState.create({
      doc: Text.of(source.doc.split('\n')),
      selection: EditorSelection.create(
        source.cursors.map((pos) => EditorSelection.cursor(pos)),
        1,
      ),
      extensions: [markdown(), EditorState.allowMultipleSelections.of(true), EditorState.lineSeparator.of('\r\n')],
    });
    const dispatch = vi.fn((tr: Transaction) => {
      state = tr.state;
    });
    expect(cherryInsertNewlineContinueMarkup({ state, dispatch })).toBe(true);
    expect(state.sliceDoc()).toBe(expected.doc.replace(/\n/g, '\r\n'));
    expect(state.selection.ranges.map((range) => range.head)).toEqual(expected.cursors);
    expect(state.selection.mainIndex).toBe(1);
    expect(dispatch).toHaveBeenCalledOnce();
  });

  it.each([0, 1, 2])('编号与引用混合保留主光标 %s', (mainIndex) => {
    const context = createMarkdownTarget('8. a|\n9. b|\n10. c\n\n> quote|', { mainIndex });
    expect(context.pressEnter()).toBe(true);
    const expected = '8. a\n9. |\n10. b\n11. |\n12. c\n\n> quote\n> |';
    expect(context.getDocWithCursors()).toBe(expected);
    expect(context.target.state.selection.mainIndex).toBe(mainIndex);
    expect(context.target.state.selection.main.head).toBe(parseCursors(expected).cursors[mainIndex]);
    expect(context.dispatch).toHaveBeenCalledOnce();
  });

  it('连续两次 Enter 分别生成一次事务，退出新项后原有项编号仍连续', () => {
    const context = createMarkdownTarget('1. a|\n2. b|\n3. c');
    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe('1. a\n2. |\n3. b\n4. |\n5. c');
    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe('1. a\n|\n2. b\n|\n3. c');
    expect(context.dispatch).toHaveBeenCalledTimes(2);
  });

  it('单光标正文续行保持上游现有行为', () => {
    const source = '1. a\n   body|\n2. b';
    const cherry = createMarkdownTarget(source);
    const upstream = createMarkdownTarget(source);
    upstreamRun.mockClear();
    expect(cherry.pressEnter()).toBe(true);
    expect(upstreamRun).toHaveBeenCalledOnce();
    expect(insertNewlineContinueMarkupCommand({ nonTightLists: false })(upstream.target as never)).toBe(true);
    expect(cherry.getDocWithCursors()).toBe(upstream.getDocWithCursors());
  });

  it('Tab 缩进的嵌套有序列表多光标保持编号和缩进', () => {
    expectEnter('- parent\n\t1. a|\n\t2. b|\n\t3. c', '- parent\n\t1. a\n\t2. |\n\t3. b\n\t4. |\n\t5. c', {
      extensions: [indentUnit.of('\t')],
    });
  });

  it('不同紧凑列表仍调用上游', () => {
    const source = '1. a|\n2. b\n\n---\n\n1. c|\n2. d';
    upstreamRun.mockClear();
    expectEnter(source, '1. a\n2. |\n3. b\n\n---\n\n1. c\n2. |\n3. d');
    expect(upstreamRun).toHaveBeenCalledOnce();
  });
});
