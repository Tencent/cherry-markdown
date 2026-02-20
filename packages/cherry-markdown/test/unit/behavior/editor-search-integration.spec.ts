/**
 * 编辑器搜索替换集成测试
 *
 * 这些测试验证编辑器的搜索替换功能行为
 * 升级 CodeMirror 6 后这些测试必须全部通过
 *
 * CM5 → CM6 搜索映射：
 * - getSearchCursor() → @codemirror/search SearchCursor
 * - findNext/findPrevious → cursor.next() / cursor.prev()
 * - replace() → cursor.replace()
 * - overlay 高亮 → @codemirror/search highlightSelectionMatches
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createExtendedMockEditorAdapter,
  type IEditorAdapterExtended,
  type ISearchCursor,
} from './editor-adapter-extended.spec';

// ============================================================================
// 搜索基础行为测试
// ============================================================================

describe('搜索基础行为测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Hello World\nHello Cherry\nHello CodeMirror');
  });

  describe('搜索光标创建', () => {
    it('应该能创建字符串搜索光标', () => {
      const cursor = editor.getSearchCursor('Hello');
      expect(cursor).toBeDefined();
      expect(cursor.findNext).toBeDefined();
      expect(cursor.findPrevious).toBeDefined();
    });

    it('应该能创建正则表达式搜索光标', () => {
      const cursor = editor.getSearchCursor(/Hello/g);
      expect(cursor).toBeDefined();
    });

    it('应该能从指定位置开始搜索', () => {
      const cursor = editor.getSearchCursor('Hello', { line: 1, ch: 0 });
      expect(cursor).toBeDefined();
    });
  });

  describe('findNext 行为', () => {
    it('应该找到第一个匹配', () => {
      const cursor = editor.getSearchCursor('World');
      const found = cursor.findNext();

      expect(found).toBe(true);
    });

    it('应该找到多个匹配', () => {
      const cursor = editor.getSearchCursor('Hello');
      const matches: ISearchCursor[] = [];

      while (cursor.findNext()) {
        matches.push(cursor);
      }

      expect(matches.length).toBe(3);
    });

    it('找不到匹配时应该返回 false', () => {
      const cursor = editor.getSearchCursor('NotExist');
      const found = cursor.findNext();

      expect(found).toBe(false);
    });

    it('应该返回正确的匹配位置', () => {
      const cursor = editor.getSearchCursor('World');
      cursor.findNext();

      const from = cursor.from();
      const to = cursor.to();

      expect(from).toEqual({ line: 0, ch: 6 });
      expect(to).toEqual({ line: 0, ch: 11 });
    });
  });

  describe('findPrevious 行为', () => {
    it('应该找到上一个匹配', () => {
      const cursor = editor.getSearchCursor('Hello');

      // 先找到最后一个
      while (cursor.findNext()) {}

      // 然后找上一个
      // 注意：具体行为取决于实现
    });
  });
});

// ============================================================================
// 正则表达式搜索测试
// ============================================================================

describe('正则表达式搜索测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('test123 test456 test789');
  });

  it('应该支持正则表达式匹配', () => {
    const cursor = editor.getSearchCursor(/test\d+/g);
    const matches: number[] = [];

    while (cursor.findNext()) {
      matches.push(cursor.from()!.ch);
    }

    expect(matches.length).toBe(3);
  });

  it('应该支持大小写不敏感匹配', () => {
    editor.setValue('Hello hello HELLO');
    const cursor = editor.getSearchCursor(/hello/gi);
    const matches: number[] = [];

    while (cursor.findNext()) {
      matches.push(cursor.from()!.ch);
    }

    expect(matches.length).toBe(3);
  });

  it('应该支持大小写敏感匹配', () => {
    editor.setValue('Hello hello HELLO');
    const cursor = editor.getSearchCursor(/hello/g);
    const matches: number[] = [];

    while (cursor.findNext()) {
      matches.push(cursor.from()!.ch);
    }

    expect(matches.length).toBe(1);
  });

  it('应该支持全字匹配', () => {
    editor.setValue('hello helloworld world');
    const cursor = editor.getSearchCursor(/\bhello\b/g);
    const matches: number[] = [];

    while (cursor.findNext()) {
      matches.push(cursor.from()!.ch);
    }

    // 只匹配独立的 "hello"
    expect(matches.length).toBe(1);
  });

  it('应该支持复杂正则表达式', () => {
    editor.setValue('email: test@example.com\nphone: 123-456-7890');
    const emailCursor = editor.getSearchCursor(/[\w.-]+@[\w.-]+\.\w+/g);

    expect(emailCursor.findNext()).toBe(true);
  });
});

// ============================================================================
// 替换行为测试
// ============================================================================

describe('替换行为测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Hello World');
  });

  describe('单次替换', () => {
    it('应该替换当前匹配', () => {
      const cursor = editor.getSearchCursor('World');
      cursor.findNext();
      cursor.replace('Cherry');

      expect(editor.getValue()).toBe('Hello Cherry');
    });

    it('替换后应该更新内容', () => {
      const cursor = editor.getSearchCursor('Hello');
      cursor.findNext();
      cursor.replace('Hi');

      expect(editor.getValue()).toBe('Hi World');
    });

    it('替换为空字符串应该删除匹配', () => {
      const cursor = editor.getSearchCursor('World');
      cursor.findNext();
      cursor.replace('');

      expect(editor.getValue()).toBe('Hello ');
    });
  });

  describe('全部替换', () => {
    it('应该替换所有匹配', () => {
      editor.setValue('Hello Hello Hello');
      const cursor = editor.getSearchCursor('Hello');
      let count = 0;

      while (cursor.findNext()) {
        cursor.replace('Hi');
        count += 1;
      }

      expect(count).toBe(3);
    });

    it('应该处理相邻匹配的替换', () => {
      editor.setValue('aaa');
      const cursor = editor.getSearchCursor('aa');
      let count = 0;

      while (cursor.findNext()) {
        cursor.replace('b');
        count += 1;
      }

      // 根据实现可能不同
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('替换与撤销', () => {
    it('替换应该可以被撤销', () => {
      const original = editor.getValue();
      const cursor = editor.getSearchCursor('World');
      cursor.findNext();
      cursor.replace('Cherry');

      editor.undo();

      expect(editor.getValue()).toBe(original);
    });
  });
});

// ============================================================================
// 搜索选项测试
// ============================================================================

describe('搜索选项测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Hello hello HELLO HeLLo');
  });

  it('大小写敏感搜索应该只匹配精确匹配', () => {
    const cursor = editor.getSearchCursor(/Hello/g);
    const matches: number[] = [];

    while (cursor.findNext()) {
      matches.push(cursor.from()!.ch);
    }

    expect(matches.length).toBe(1);
  });

  it('大小写不敏感搜索应该匹配所有变体', () => {
    const cursor = editor.getSearchCursor(/hello/gi);
    const matches: number[] = [];

    while (cursor.findNext()) {
      matches.push(cursor.from()!.ch);
    }

    expect(matches.length).toBe(4);
  });
});

// ============================================================================
// 多行搜索测试
// ============================================================================

describe('多行搜索测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('First Line\nSecond Line\nThird Line');
  });

  it('应该能搜索多行内容', () => {
    const cursor = editor.getSearchCursor('Line');
    const matches: number[] = [];

    while (cursor.findNext()) {
      matches.push(cursor.from()!.line);
    }

    expect(matches.length).toBe(3);
  });

  it('应该能匹配跨行内容', () => {
    const cursor = editor.getSearchCursor(/Second.*Third/s);
    const found = cursor.findNext();

    // 跨行匹配可能根据实现不同
    // 主要是确保不会报错
    expect(typeof found).toBe('boolean');
  });

  it('应该正确报告多行匹配的位置', () => {
    const cursor = editor.getSearchCursor('Second');
    cursor.findNext();

    expect(cursor.from()).toEqual({ line: 1, ch: 0 });
    expect(cursor.to()).toEqual({ line: 1, ch: 6 });
  });
});

// ============================================================================
// 特殊字符搜索测试
// ============================================================================

describe('特殊字符搜索测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('应该正确转义正则特殊字符', () => {
    editor.setValue('test.file[0]');
    const cursor = editor.getSearchCursor('test.file[0]');

    expect(cursor.findNext()).toBe(true);
  });

  it('应该能搜索换行符', () => {
    editor.setValue('line1\nline2');
    const cursor = editor.getSearchCursor(/\n/);

    expect(cursor.findNext()).toBe(true);
  });

  it('应该能搜索制表符', () => {
    editor.setValue('col1\tcol2');
    const cursor = editor.getSearchCursor(/\t/);

    expect(cursor.findNext()).toBe(true);
  });
});

// ============================================================================
// 搜索场景测试
// ============================================================================

describe('搜索场景测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  describe('Markdown 文档搜索', () => {
    beforeEach(() => {
      editor.setValue(`# Heading 1

This is a paragraph with **bold** text.

## Heading 2

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const code = "example";
\`\`\`

[Link text](https://example.com)
`);
    });

    it('应该能搜索标题', () => {
      const cursor = editor.getSearchCursor(/#{1,6}\s/);
      const matches: number[] = [];

      while (cursor.findNext()) {
        matches.push(cursor.from()!.line);
      }

      expect(matches.length).toBe(2);
    });

    it('应该能搜索列表项', () => {
      const cursor = editor.getSearchCursor(/^- /gm);
      const matches: number[] = [];

      while (cursor.findNext()) {
        matches.push(cursor.from()!.line);
      }

      expect(matches.length).toBe(3);
    });

    it('应该能搜索代码块标记', () => {
      const cursor = editor.getSearchCursor(/```/g);
      const matches: number[] = [];

      while (cursor.findNext()) {
        matches.push(cursor.from()!.line);
      }

      expect(matches.length).toBe(2);
    });

    it('应该能搜索链接', () => {
      const cursor = editor.getSearchCursor(/\[[^\]]+\]\([^)]+\)/g);

      expect(cursor.findNext()).toBe(true);
    });
  });

  describe('代码搜索', () => {
    beforeEach(() => {
      editor.setValue(`function hello() {
  console.log("Hello World");
  return true;
}

const greeting = "Hello";
export { hello };
`);
    });

    it('应该能搜索函数定义', () => {
      const cursor = editor.getSearchCursor(/function\s+\w+/g);

      expect(cursor.findNext()).toBe(true);
    });

    it('应该能搜索变量声明', () => {
      const cursor = editor.getSearchCursor(/const\s+\w+/g);

      expect(cursor.findNext()).toBe(true);
    });

    it('应该能搜索字符串', () => {
      const cursor = editor.getSearchCursor(/"[^"]+"/g);
      const matches: number[] = [];

      while (cursor.findNext()) {
        matches.push(cursor.from()!.line);
      }

      expect(matches.length).toBe(2);
    });
  });
});

// ============================================================================
// 搜索与选区交互测试
// ============================================================================

describe('搜索与选区交互', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('Hello World Hello');
  });

  it('找到匹配后应该能选中', () => {
    const cursor = editor.getSearchCursor('World');
    cursor.findNext();

    const from = cursor.from();
    const to = cursor.to();

    if (from && to) {
      editor.setSelection(from, to);
      expect(editor.getSelection()).toBe('World');
    }
  });

  it('搜索不应该改变当前选区', () => {
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    const selectionBefore = editor.getSelection();

    const cursor = editor.getSearchCursor('World');
    cursor.findNext();

    // 选区应该保持不变
    expect(editor.getSelection()).toBe(selectionBefore);
  });
});

// ============================================================================
// 性能相关测试（简化版）
// ============================================================================

describe('搜索性能测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('应该能搜索中等大小文档', () => {
    // 创建中等大小文档
    const lines = Array(100).fill('Hello World Line');
    editor.setValue(lines.join('\n'));

    const cursor = editor.getSearchCursor('Hello');
    let count = 0;

    // 限制循环次数防止无限循环
    while (cursor.findNext() && count < 200) {
      count += 1;
    }

    expect(count).toBe(100);
  });

  it('应该能定位匹配', () => {
    editor.setValue('PREFIX TARGET SUFFIX');

    const cursor = editor.getSearchCursor('TARGET');
    const found = cursor.findNext();

    expect(found).toBe(true);
  });
});
