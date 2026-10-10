import { EditorSelection, EditorState, Transaction, type Extension } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { markdown, insertNewlineContinueMarkupCommand } from '@codemirror/lang-markdown';
import { describe, expect, it, vi } from 'vite-plus/test';
import { cherryInsertNewlineContinueMarkup } from '../../src/utils/markdownEnter';

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

const createMarkdownTarget = (template: string, options: { readOnly?: boolean; extensions?: Extension[] } = {}) => {
  const { doc, cursors } = parseCursors(template);
  let state = EditorState.create({
    doc,
    selection: EditorSelection.create(cursors.map((p) => EditorSelection.cursor(p))),
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

describe('utils/autoindent - 准则一：紧凑列表的空列表项退出列表', () => {
  it('连续两次回车：先续出空项，再补足独立段落边界', () => {
    const context = createMarkdownTarget('- 123|');

    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe('- 123\n- |');
    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe('- 123\n\n|');
  });

  it.each([
    ['无序列表', '- 123\n- |', '- 123\n\n|'],
    ['有序列表', '1. 123\n2. |', '1. 123\n\n|'],
    ['任务列表', '- [ ] a\n- [ ] |', '- [ ] a\n\n|'],
    ['嵌套列表回退一层', '- a\n  - b\n  - |', '- a\n  - b\n- |'],
    ['引用内列表退出', '> - a\n> - |', '> - a\n>\n> |'],
    ['有序列表后续序号重排', '1. a\n2. |\n3. c', '1. a\n\n|\n\n2. c'],
  ])('%s', (_name, before, after) => {
    expectEnter(before, after);
  });
});

describe('utils/autoindent - 准则二：loose 列表新建列表项不补空行', () => {
  it.each([
    ['无序列表', '- a\n\n- b|', '- a\n\n- b\n- |'],
    ['有序列表', '1. a\n\n2. b|', '1. a\n\n2. b\n3. |'],
    ['有序列表并重排后续序号', '1. a\n\n2. b|\n3. c', '1. a\n\n2. b\n3. |\n4. c'],
    ['任务列表（新项重置为未勾选）', '- [ ] a\n\n- [x] b|', '- [ ] a\n\n- [x] b\n- [ ] |'],
    ['星号标记', '* a\n\n* b|', '* a\n\n* b\n* |'],
    ['加号标记', '+ a\n\n+ b|', '+ a\n\n+ b\n+ |'],
    ['右括号分隔符', '1) a\n\n2) b|', '1) a\n\n2) b\n3) |'],
    ['嵌套列表保留缩进', '- a\n\n  - b\n\n  - c|', '- a\n\n  - b\n\n  - c\n  - |'],
    ['引用内的列表保留引用标记', '> - a\n>\n> - b|', '> - a\n>\n> - b\n> - |'],
  ])('%s', (_name, before, after) => {
    expectEnter(before, after);
  });

  it('tab 缩进的嵌套列表同样生效', () => {
    expectEnter('- a\n\n\t- b\n\n\t- c|', '- a\n\n\t- b\n\n\t- c\n\t- |', { extensions: [indentUnit.of('\t')] });
  });

  it('多光标：各自插入列表标记且都不补空行', () => {
    expectEnter('- a\n\n- b|\n\n- c|', '- a\n\n- b\n- |\n\n- c\n- |');
  });

  it('多光标：两条准则同时命中时，各光标位置均正确', () => {
    expectEnter('- a\n- |\n\n# h\n\n- b\n\n- c|', '- a\n\n|\n\n# h\n\n- b\n\n- c\n- |');
  });

  it('多光标：退出列表时各自补足段落边界', () => {
    expectEnter('- a\n- |\n\n# h\n\n- b\n- |', '- a\n\n|\n\n# h\n\n- b\n\n|');
  });

  it('连续回车不会反复产生空行', () => {
    const context = createMarkdownTarget('- a\n\n- b|');

    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe('- a\n\n- b\n- |');
    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe('- a\n\n- b\n\n|');
  });

  it('事务过滤器只观察一次最终结果', () => {
    const observedDocs: string[] = [];
    let transactionFilterCalls = 0;
    const context = createMarkdownTarget('- a\n\n- b|', {
      extensions: [
        EditorState.changeFilter.of((tr) => {
          observedDocs.push(tr.newDoc.toString());
          return true;
        }),
        EditorState.transactionFilter.of((tr) => {
          transactionFilterCalls += 1;
          return tr;
        }),
      ],
    });

    expect(context.pressEnter()).toBe(true);
    expect(observedDocs).toEqual(['- a\n\n- b\n- ']);
    expect(transactionFilterCalls).toBe(1);
  });

  it('保留 input 的 userEvent 与 scrollIntoView', () => {
    const context = createMarkdownTarget('- a\n\n- b|');

    expect(context.pressEnter()).toBe(true);
    const transaction = context.dispatch.mock.calls[0][0] as Transaction;
    expect(transaction.annotation(Transaction.userEvent)).toBe('input');
    expect(transaction.scrollIntoView).toBe(true);
  });
});

describe('utils/autoindent - 不应受影响的书写规则', () => {
  it.each([
    ['无序列表续写', '- 123|', '- 123\n- |'],
    ['有序列表续写', '1. 123|', '1. 123\n2. |'],
    ['引用续写', '> 123|', '> 123\n> |'],
    ['引用内段落续写', '> a\n>\n> b|', '> a\n>\n> b\n> |'],
    ['退出引用保持上游行为', '> a\n> \n> |', '> a\n\n|'],
    ['列表项内段落续写不自动补空行', '- a\n\n- b\n  c|', '- a\n\n- b\n  c\n  |'],
    ['已有多段落的列表项续写不自动补空行', '- a\n\n- b\n\n  c|', '- a\n\n- b\n\n  c\n  |'],
  ])('%s', (_name, before, after) => {
    expectEnter(before, after);
  });
});

describe('utils/autoindent - 交回 CodeMirror 默认按键处理的情形', () => {
  it.each([
    ['非列表上下文', 'ordinary text|'],
    ['不在语法树内的缩进空行', '- a\n  |'],
    ['代码块内', '```\n- a\n\n- b|\n```'],
  ])('%s', (_name, before) => {
    const context = createMarkdownTarget(before);

    expect(context.pressEnter()).toBe(false);
    expect(context.dispatch).not.toHaveBeenCalled();
  });

  it('只读状态', () => {
    const context = createMarkdownTarget('- 123\n- |', { readOnly: true });

    expect(context.pressEnter()).toBe(false);
    expect(context.dispatch).not.toHaveBeenCalled();
  });

  it('存在选区时', () => {
    const state = EditorState.create({
      doc: '- a\n\n- b',
      selection: EditorSelection.single(6, 8),
      extensions: [markdown()],
    });
    const dispatch = vi.fn();
    const target = {
      get state() {
        return state;
      },
      dispatch,
    };

    expect(cherryInsertNewlineContinueMarkup(target as never)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('utils/autoindent - 独立段落与列表边界', () => {
  it.each([
    ['首个空项不补前置空行', '- |', '|'],
    ['已有前置分隔不重复补写', '- a\n\n- |', '- a\n\n|'],
    ['中部退出保留前后段落分隔', '- a\n- |\n- c', '- a\n\n|\n\n- c'],
    ['已有后置分隔不重复补写', '- a\n- |\n\n- c', '- a\n\n|\n\n- c'],
    ['退出后跟随普通文本', '- a\n- |\ntext', '- a\n\n|\n\ntext'],
    ['多层引用内退出', '> > - a\n> > - |', '> > - a\n> >\n> > |'],
    ['引用中部退出', '> - a\n> - |\n> - c', '> - a\n>\n> |\n>\n> - c'],
    ['引用内已有分隔', '> - a\n>\n> - |\n>\n> - c', '> - a\n>\n> |\n>\n> - c'],
    ['有序父级退回继续父级列表', '1. a\n   - b\n   - |\n2. c', '1. a\n   - b\n2. |\n3. c'],
    ['空项末尾空格', '- a\n- |  ', '- a\n\n|  '],
  ])('%s', (_name, before, after) => expectEnter(before, after));

  it('CRLF 文档使用同一种换行并保持正确光标', () => {
    let state = EditorState.create({
      doc: '- a\r\n- ',
      extensions: [markdown(), EditorState.lineSeparator.of('\r\n')],
      selection: EditorSelection.single(6),
    });
    expect(
      cherryInsertNewlineContinueMarkup({
        state,
        dispatch: (tr: Transaction) => {
          state = tr.state;
        },
      }),
    ).toBe(true);
    expect(state.sliceDoc()).toBe('- a\r\n\r\n');
    expect(state.selection.main.head).toBe(state.doc.length);
  });
});

describe('退出列表的最终事务', () => {
  it('过滤器只收到包含前后段落边界的一次最终变更', () => {
    const observed: string[] = [];
    const context = createMarkdownTarget('- a\n- |\n- c', {
      extensions: [
        EditorState.changeFilter.of((tr) => {
          observed.push(tr.newDoc.toString());
          return true;
        }),
      ],
    });
    expect(context.pressEnter()).toBe(true);
    expect(observed).toEqual(['- a\n\n\n\n- c']);
    expect(context.getDocWithCursors()).toBe('- a\n\n|\n\n- c');
    expect(context.dispatch).toHaveBeenCalledOnce();
  });

  it('过滤器取消时不泄漏部分标记删除或分隔符', () => {
    const context = createMarkdownTarget('- a\n- |', {
      extensions: [EditorState.changeFilter.of(() => false)],
    });
    expect(context.pressEnter()).toBe(true);
    expect(context.target.state.doc.toString()).toBe('- a\n- ');
    expect(context.dispatch).toHaveBeenCalledOnce();
  });

  it('混合列表与普通段落光标交给默认命令，避免部分更新', () => {
    const context = createMarkdownTarget('- a|\n\ntext|');
    expect(context.pressEnter()).toBe(false);
    expect(context.dispatch).not.toHaveBeenCalled();
  });
});

// Deliberately exclude Cherry's exit-boundary and no-loose rules. These cases
// detect unintended drift when upgrading the upstream Markdown command.
describe('普通 Markdown 行为与上游命令保持一致', () => {
  it.each([
    '- a|',
    '3. a|\n4. b',
    '3. a|\n8. b',
    '- [x] a|',
    '- a\n  - b|',
    '- a\n  - b\n  - |',
    '> quoted|',
    '>\n> |',
    'text|',
    '```\n- code|\n```',
    '<div>code|</div>',
    '- selec|ted|',
  ])('%s', (source) => {
    const cherry = createMarkdownTarget(source);
    const upstream = createMarkdownTarget(source);
    const runUpstream = insertNewlineContinueMarkupCommand({ nonTightLists: false });
    expect(cherry.pressEnter()).toBe(runUpstream(upstream.target as never));
    expect(cherry.getDocWithCursors()).toBe(upstream.getDocWithCursors());
    expect(cherry.dispatch.mock.calls.length).toBe(upstream.dispatch.mock.calls.length);
  });
});
