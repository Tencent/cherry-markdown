import { EditorSelection, EditorState, Transaction, type Extension } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { describe, expect, it, vi } from 'vite-plus/test';
import { handleNewlineIndentList, cherryInsertNewlineContinueMarkup } from '../../src/utils/autoindent';

const createAdapter = (
  doc: string,
  ranges: Array<{ anchor: number; head?: number }>,
  options: { readOnly?: boolean } = {},
) => {
  let state = EditorState.create({
    doc,
    selection: EditorSelection.create(ranges.map(({ anchor, head = anchor }) => EditorSelection.range(anchor, head))),
    extensions: EditorState.allowMultipleSelections.of(true),
  });
  const dispatch = vi.fn((spec) => {
    state = state.update(spec).state;
  });

  return {
    adapter: {
      get state() {
        return state;
      },
      getOption: vi.fn((name: string) => name === 'readOnly' && !!options.readOnly),
      listSelections: vi.fn(() => state.selection.ranges),
      dispatch,
    },
    dispatch,
    getState: () => state,
  };
};

describe('utils/autoindent', () => {
  it('leaves read-only and ordinary lines to CodeMirror', () => {
    const readOnly = createAdapter('I. item', [{ anchor: 7 }], { readOnly: true });
    const ordinary = createAdapter('ordinary text', [{ anchor: 13 }]);

    expect(handleNewlineIndentList(readOnly.adapter as never)).toBe(false);
    expect(handleNewlineIndentList(ordinary.adapter as never)).toBe(false);
    expect(readOnly.dispatch).not.toHaveBeenCalled();
    expect(ordinary.dispatch).not.toHaveBeenCalled();
  });

  it('rejects selections and cursors positioned before the list marker', () => {
    const selection = createAdapter('I. item', [{ anchor: 3, head: 7 }]);
    const beforeMarker = createAdapter('  I. item', [{ anchor: 1 }]);

    expect(handleNewlineIndentList(selection.adapter as never)).toBe(false);
    expect(handleNewlineIndentList(beforeMarker.adapter as never)).toBe(false);
  });

  it('inserts a normalized marker while preserving indentation and spacing', () => {
    const context = createAdapter('  一.  item', [{ anchor: 10 }]);

    expect(handleNewlineIndentList(context.adapter as never)).toBe(true);
    expect(context.getState().doc.toString()).toBe('  一.  item\n  I.  ');
    expect(context.getState().selection.main.head).toBe(17);
    expect(context.dispatch).toHaveBeenCalledOnce();
  });

  it('exits an empty cherry list item', () => {
    const context = createAdapter('I. ', [{ anchor: 3 }]);

    expect(handleNewlineIndentList(context.adapter as never)).toBe(true);
    expect(context.getState().doc.toString()).toBe('\n');
    expect(context.getState().selection.main.head).toBe(1);
  });
});

// ------------------------------------------------------------------
// Cherry 自定义列表准则：紧凑列表的空列表项按回车时移除列表标记，
// 不改写成 loose list（无序列表 / 有序列表均生效）
// ------------------------------------------------------------------

/**
 * 解析用 `|` 标记光标位置的文档模板，返回真实文档与光标偏移。
 * 例如 `'- a\n- |'` 表示光标位于第二行的行尾；写多个 `|` 即多光标。
 * 这样测试用例无需手算偏移量，改动文档时也不必同步维护数字。
 */
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

/** 光标标记符，取一个不会出现在 Markdown 列表语法里的字符 */
const CURSOR = '|';

/**
 * 创建带 markdown 语言支持的命令目标
 * @param template 文档模板，用 `|` 标记光标位置；不含 `|` 时光标位于文档末尾
 */
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
  // 与 EditorView.dispatch 一致：既接受 Transaction，也接受 TransactionSpec
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
    /** 按回车，返回命令是否处理了该事件 */
    pressEnter: () => cherryInsertNewlineContinueMarkup(target as never),
    /** 当前文档内容，并把光标位置还原成 `|` 标记，便于直接与模板字符串比对 */
    getDocWithCursors: () => {
      const doc = state.doc.toString();
      const heads = [...state.selection.ranges].map((range) => range.head).sort((a, b) => b - a);
      return heads.reduce((text, pos) => text.slice(0, pos) + CURSOR + text.slice(pos), doc);
    },
    getDoc: () => state.doc.toString(),
  };
};

/**
 * 表驱动断言：按回车后，文档与光标应与 `after` 模板一致
 * @param before 回车前的文档模板（`|` 为光标）
 * @param after 回车后的预期文档模板（`|` 为光标）
 */
const expectEnter = (before: string, after: string, options?: { extensions?: Extension[] }) => {
  const context = createMarkdownTarget(before, options);
  expect(context.pressEnter()).toBe(true);
  expect(context.getDocWithCursors()).toBe(after);
  // 始终只派发一个事务，保证撤销一步即可回退
  expect(context.dispatch).toHaveBeenCalledOnce();
};

describe('utils/autoindent - 准则一：紧凑列表的空列表项退出列表', () => {
  it.each([
    ['无序列表', '- 123\n- |', '- 123\n\n|'],
    ['有序列表', '1. 123\n2. |', '1. 123\n\n|'],
    ['任务列表', '- [ ] a\n- [ ] |', '- [ ] a\n\n|'],
    ['嵌套列表回退一层', '- a\n  - b\n  - |', '- a\n  - b\n- |'],
    ['有序列表后续序号重排', '1. a\n2. |\n3. c', '1. a\n|\n2. c'],
  ])('%s', (_name, before, after) => {
    // 默认 CommonMark 行为会在空项上方插入空行改成 loose list，这里应直接移除列表标记
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
    // 默认 CommonMark 行为会在新项前补一个空行以维持松散风格，这里不再补
    expectEnter(before, after);
  });

  it('tab 缩进的嵌套列表同样生效', () => {
    // indentUnit 为 tab 时 CodeMirror 会把缩进归一化成 tab，需确保仍能识别
    expectEnter('- a\n\n\t- b\n\n\t- c|', '- a\n\n\t- b\n\n\t- c\n\t- |', { extensions: [indentUnit.of('\t')] });
  });

  it('多光标：各自插入列表标记且都不补空行', () => {
    expectEnter('- a\n\n- b|\n\n- c|', '- a\n\n- b\n- |\n\n- c\n- |');
  });

  it('多光标：两条准则同时命中时，各光标位置均正确', () => {
    // 第一个光标在 tight 列表的空项（准则一），第二个在 loose 列表项末（准则二）
    expectEnter('- a\n- |\n\n# h\n\n- b\n\n- c|', '- a\n|\n\n# h\n\n- b\n\n- c\n- |');
  });

  it('多光标：文档末尾退出列表时仍保留块级分隔', () => {
    expectEnter('- a\n- |\n\n# h\n\n- b\n- |', '- a\n|\n\n# h\n\n- b\n\n|');
  });

  it('连续回车不会反复产生空行', () => {
    const context = createMarkdownTarget('- a\n\n- b|');

    // 第一次：新建列表项，不补空行
    expect(context.pressEnter()).toBe(true);
    expect(context.getDocWithCursors()).toBe('- a\n\n- b\n- |');
    // 第二次：空列表项退出列表（准则一）
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
    const spec = context.dispatch.mock.calls[0][0] as { userEvent?: string; scrollIntoView?: boolean };
    expect(spec.userEvent).toBe('input');
    expect(spec.scrollIntoView).toBe(true);
  });
});

describe('utils/autoindent - 不应受影响的书写规则', () => {
  it.each([
    ['无序列表续写', '- 123|', '- 123\n- |'],
    ['有序列表续写', '1. 123|', '1. 123\n2. |'],
    ['引用续写', '> 123|', '> 123\n> |'],
    ['引用内段落续写', '> a\n>\n> b|', '> a\n>\n> b\n> |'],
    // 段落之间的空行是渲染所必需的，必须保留
    ['列表项内段落续写保留空行', '- a\n\n- b\n  c|', '- a\n\n- b\n  c\n\n  |'],
    ['列表项内多段落续写保留空行', '- a\n\n- b\n\n  c|', '- a\n\n- b\n\n  c\n\n  |'],
  ])('%s', (_name, before, after) => {
    expectEnter(before, after);
  });
});

describe('utils/autoindent - 交回 CodeMirror 默认按键处理的情形', () => {
  it.each([
    ['非列表上下文', 'ordinary text|'],
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
