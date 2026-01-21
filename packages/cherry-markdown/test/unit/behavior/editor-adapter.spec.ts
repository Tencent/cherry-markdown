/**
 * 编辑器适配器测试
 *
 * 这个文件定义了编辑器的抽象接口和行为测试
 * 升级 CM6 时，只需要实现相同的接口，测试代码不需要修改
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// 编辑器适配器接口定义
// 这是升级 CM6 时需要实现的抽象层
// ============================================================================

/**
 * 光标/选区位置
 */
export interface Position {
  line: number;
  ch: number;
}

/**
 * 选区范围
 */
export interface SelectionRange {
  anchor: Position;
  head: Position;
}

/**
 * 编辑器适配器接口
 * 定义了编辑器必须提供的核心能力
 */
export interface IEditorAdapter {
  // 内容操作
  getValue(): string;
  setValue(value: string): void;
  getLine(lineNum: number): string;
  lineCount(): number;

  // 光标操作
  getCursor(): Position;
  setCursor(pos: Position): void;

  // 选区操作
  getSelection(): string;
  getSelections(): string[];
  setSelection(anchor: Position, head?: Position): void;
  listSelections(): SelectionRange[];
  replaceSelection(text: string): void;
  replaceSelections(texts: string[]): void;

  // 高级操作
  replaceRange(text: string, from: Position, to: Position): void;
  findWordAt(pos: Position): SelectionRange;

  // 焦点
  focus(): void;
  hasFocus(): boolean;
}

// ============================================================================
// Mock 编辑器适配器实现（用于单元测试）
// ============================================================================

/**
 * 创建一个 Mock 编辑器适配器
 * 这个实现完全不依赖 CodeMirror
 */
export function createMockEditorAdapter(initialValue = ''): IEditorAdapter {
  let content = initialValue;
  let cursor: Position = { line: 0, ch: 0 };
  let selections: SelectionRange[] = [{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } }];

  const getLines = () => content.split('\n');

  return {
    getValue: () => content,

    setValue: (value: string) => {
      content = value;
      cursor = { line: 0, ch: 0 };
      selections = [{ anchor: cursor, head: cursor }];
    },

    getLine: (lineNum: number) => {
      const lines = getLines();
      return lines[lineNum] || '';
    },

    lineCount: () => getLines().length,

    getCursor: () => ({ ...cursor }),

    setCursor: (pos: Position) => {
      cursor = { ...pos };
      selections = [{ anchor: pos, head: pos }];
    },

    getSelection: () => {
      const sel = selections[0];
      const lines = getLines();

      if (sel.anchor.line === sel.head.line) {
        const line = lines[sel.anchor.line] || '';
        const start = Math.min(sel.anchor.ch, sel.head.ch);
        const end = Math.max(sel.anchor.ch, sel.head.ch);
        return line.substring(start, end);
      }

      // 多行选区
      let result = '';
      const startLine = Math.min(sel.anchor.line, sel.head.line);
      const endLine = Math.max(sel.anchor.line, sel.head.line);
      const startCh = sel.anchor.line < sel.head.line ? sel.anchor.ch : sel.head.ch;
      const endCh = sel.anchor.line > sel.head.line ? sel.anchor.ch : sel.head.ch;

      for (let i = startLine; i <= endLine; i++) {
        if (i === startLine) {
          result += lines[i].substring(startCh);
        } else if (i === endLine) {
          result += '\n' + lines[i].substring(0, endCh);
        } else {
          result += '\n' + lines[i];
        }
      }
      return result;
    },

    getSelections: () => {
      return selections.map((sel) => {
        const lines = getLines();
        if (sel.anchor.line === sel.head.line) {
          const line = lines[sel.anchor.line] || '';
          const start = Math.min(sel.anchor.ch, sel.head.ch);
          const end = Math.max(sel.anchor.ch, sel.head.ch);
          return line.substring(start, end);
        }
        return '';
      });
    },

    setSelection: (anchor: Position, head?: Position) => {
      const actualHead = head || anchor;
      selections = [{ anchor: { ...anchor }, head: { ...actualHead } }];
      cursor = { ...actualHead };
    },

    listSelections: () => selections.map((s) => ({ ...s })),

    replaceSelection: (text: string) => {
      const sel = selections[0];
      const lines = getLines();
      const startLine = Math.min(sel.anchor.line, sel.head.line);
      const endLine = Math.max(sel.anchor.line, sel.head.line);

      if (startLine === endLine) {
        const line = lines[startLine];
        const start = Math.min(sel.anchor.ch, sel.head.ch);
        const end = Math.max(sel.anchor.ch, sel.head.ch);
        lines[startLine] = line.substring(0, start) + text + line.substring(end);
        content = lines.join('\n');
        const newCh = start + text.length;
        cursor = { line: startLine, ch: newCh };
        selections = [{ anchor: cursor, head: cursor }];
      } else {
        // 多行选区
        const startCh = sel.anchor.line < sel.head.line ? sel.anchor.ch : sel.head.ch;
        const endCh = sel.anchor.line > sel.head.line ? sel.anchor.ch : sel.head.ch;
        const startLineText = lines[startLine].substring(0, startCh);
        const endLineText = lines[endLine].substring(endCh);
        const newLines = text.split('\n');
        newLines[0] = startLineText + newLines[0];
        newLines[newLines.length - 1] = newLines[newLines.length - 1] + endLineText;
        lines.splice(startLine, endLine - startLine + 1, ...newLines);
        content = lines.join('\n');
        const newCh = startCh + text.length;
        cursor = { line: startLine, ch: newCh };
        selections = [{ anchor: cursor, head: cursor }];
      }
    },

    replaceSelections: (texts: string[]) => {
      if (texts.length > 0) {
        // 简化实现：只处理单个选区
        const sel = selections[0];
        const lines = getLines();
        const startLine = Math.min(sel.anchor.line, sel.head.line);
        const start = Math.min(sel.anchor.ch, sel.head.ch);
        const end = Math.max(sel.anchor.ch, sel.head.ch);

        const line = lines[startLine];
        lines[startLine] = line.substring(0, start) + texts[0] + line.substring(end);
        content = lines.join('\n');
      }
    },

    replaceRange: (text: string, from: Position, to: Position) => {
      const lines = getLines();
      if (from.line === to.line) {
        const line = lines[from.line] || '';
        lines[from.line] = line.substring(0, from.ch) + text + line.substring(to.ch);
      } else {
        const startLineText = (lines[from.line] || '').substring(0, from.ch);
        const endLineText = (lines[to.line] || '').substring(to.ch);
        const newLines = text.split('\n');
        newLines[0] = startLineText + newLines[0];
        newLines[newLines.length - 1] = newLines[newLines.length - 1] + endLineText;
        lines.splice(from.line, to.line - from.line + 1, ...newLines);
      }
      content = lines.join('\n');
    },

    findWordAt: (pos: Position) => {
      const line = getLines()[pos.line] || '';
      let start = pos.ch;
      let end = pos.ch;

      while (start > 0 && /\w/.test(line[start - 1])) {
        start--;
      }
      while (end < line.length && /\w/.test(line[end])) {
        end++;
      }

      return {
        anchor: { line: pos.line, ch: start },
        head: { line: pos.line, ch: end },
      };
    },

    focus: () => {},
    hasFocus: () => true,
  };
}

// ============================================================================
// 测试用例 - 验证编辑器适配器行为
// ============================================================================

describe('编辑器适配器行为测试', () => {
  let editor: IEditorAdapter;

  beforeEach(() => {
    editor = createMockEditorAdapter('Hello World\nSecond Line\nThird Line');
  });

  describe('内容操作', () => {
    it('getValue 应该返回完整内容', () => {
      expect(editor.getValue()).toBe('Hello World\nSecond Line\nThird Line');
    });

    it('setValue 应该替换全部内容', () => {
      editor.setValue('New Content');
      expect(editor.getValue()).toBe('New Content');
    });

    it('getLine 应该返回指定行', () => {
      expect(editor.getLine(0)).toBe('Hello World');
      expect(editor.getLine(1)).toBe('Second Line');
      expect(editor.getLine(2)).toBe('Third Line');
    });

    it('lineCount 应该返回行数', () => {
      expect(editor.lineCount()).toBe(3);
    });
  });

  describe('光标操作', () => {
    it('getCursor 应该返回当前光标位置', () => {
      expect(editor.getCursor()).toEqual({ line: 0, ch: 0 });
    });

    it('setCursor 应该设置光标位置', () => {
      editor.setCursor({ line: 1, ch: 5 });
      expect(editor.getCursor()).toEqual({ line: 1, ch: 5 });
    });
  });

  describe('选区操作', () => {
    it('setSelection 应该设置选区', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getSelection()).toBe('Hello');
    });

    it('getSelections 应该返回所有选区内容', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getSelections()).toEqual(['Hello']);
    });

    it('listSelections 应该返回选区范围', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      const sels = editor.listSelections();
      expect(sels[0].anchor).toEqual({ line: 0, ch: 0 });
      expect(sels[0].head).toEqual({ line: 0, ch: 5 });
    });
  });

  describe('内容替换', () => {
    it('replaceSelection 应该替换选中内容', () => {
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceSelection('Hi');
      expect(editor.getValue()).toBe('Hi World\nSecond Line\nThird Line');
    });

    it('replaceRange 应该替换指定范围', () => {
      editor.replaceRange('X', { line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getValue()).toBe('X World\nSecond Line\nThird Line');
    });
  });

  describe('单词查找', () => {
    it('findWordAt 应该找到光标所在单词', () => {
      const range = editor.findWordAt({ line: 0, ch: 2 });
      expect(range.anchor.ch).toBe(0);
      expect(range.head.ch).toBe(5);
      // 验证找到的是 "Hello"
      editor.setSelection(range.anchor, range.head);
      expect(editor.getSelection()).toBe('Hello');
    });
  });
});

// ============================================================================
// 端到端行为测试
// 模拟用户操作，验证最终结果
// ============================================================================

describe('端到端行为测试', () => {
  let editor: IEditorAdapter;

  beforeEach(() => {
    editor = createMockEditorAdapter('');
  });

  describe('加粗操作', () => {
    it('选中文本后加粗应该包裹 **', () => {
      // 1. 设置初始内容
      editor.setValue('hello world');

      // 2. 选中 "hello"
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      // 3. 获取选中内容
      const selection = editor.getSelection();
      expect(selection).toBe('hello');

      // 4. 应用加粗转换
      const boldText = `**${selection}**`;

      // 5. 替换选区
      editor.replaceSelection(boldText);

      // 6. 验证结果
      expect(editor.getValue()).toBe('**hello** world');
    });

    it('已加粗文本再次操作应该移除 **', () => {
      editor.setValue('**hello** world');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 9 });

      const selection = editor.getSelection();
      expect(selection).toBe('**hello**');

      // 移除加粗
      const plainText = selection.replace(/^\*\*(.+)\*\*$/, '$1');
      editor.replaceSelection(plainText);

      expect(editor.getValue()).toBe('hello world');
    });
  });

  describe('标题操作', () => {
    it('为普通文本添加标题', () => {
      editor.setValue('Title');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      const selection = editor.getSelection();
      editor.replaceSelection(`# ${selection}`);

      expect(editor.getValue()).toBe('# Title');
    });

    it('更改标题级别', () => {
      editor.setValue('# Title');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 7 });

      const selection = editor.getSelection();
      // 移除现有标题标记，添加新标记
      const newText = selection.replace(/^#\s+/, '## ');
      editor.replaceSelection(newText);

      expect(editor.getValue()).toBe('## Title');
    });
  });

  describe('列表操作', () => {
    it('将多行文本转换为列表', () => {
      editor.setValue('item1\nitem2\nitem3');

      // 选中全部内容
      editor.setSelection({ line: 0, ch: 0 }, { line: 2, ch: 5 });

      // 获取内容并转换
      const content = editor.getValue();
      const listContent = content
        .split('\n')
        .map((line) => `- ${line}`)
        .join('\n');

      editor.setValue(listContent);

      expect(editor.getValue()).toBe('- item1\n- item2\n- item3');
    });
  });

  describe('链接操作', () => {
    it('将选中文本转换为链接', () => {
      editor.setValue('click here to visit');
      editor.setSelection({ line: 0, ch: 6 }, { line: 0, ch: 10 });

      const selection = editor.getSelection();
      expect(selection).toBe('here');

      const link = `[${selection}](https://example.com)`;
      editor.replaceSelection(link);

      expect(editor.getValue()).toBe('click [here](https://example.com) to visit');
    });
  });
});

// ============================================================================
// 回归测试 - 编辑操作行为
// 升级 CM6 后这些测试必须全部通过
// ============================================================================

describe('回归测试 - 编辑操作行为', () => {
  let editor: IEditorAdapter;

  beforeEach(() => {
    editor = createMockEditorAdapter('');
  });

  const testCases = [
    // 加粗
    {
      name: '加粗选中文本',
      initial: 'hello world',
      selection: { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
      transform: (s: string) => `**${s}**`,
      expected: '**hello** world',
    },
    // 斜体
    {
      name: '斜体选中文本',
      initial: 'hello world',
      selection: { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
      transform: (s: string) => `*${s}*`,
      expected: '*hello* world',
    },
    // 删除线
    {
      name: '删除线选中文本',
      initial: 'hello world',
      selection: { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
      transform: (s: string) => `~~${s}~~`,
      expected: '~~hello~~ world',
    },
    // 行内代码
    {
      name: '行内代码选中文本',
      initial: 'const x = 1',
      selection: { anchor: { line: 0, ch: 6 }, head: { line: 0, ch: 7 } },
      transform: (s: string) => `\`${s}\``,
      expected: 'const `x` = 1',
    },
    // 链接
    {
      name: '创建链接',
      initial: 'click here',
      selection: { anchor: { line: 0, ch: 6 }, head: { line: 0, ch: 10 } },
      transform: (s: string) => `[${s}](url)`,
      expected: 'click [here](url)',
    },
  ];

  testCases.forEach(({ name, initial, selection, transform, expected }) => {
    it(name, () => {
      editor.setValue(initial);
      editor.setSelection(selection.anchor, selection.head);

      const selectedText = editor.getSelection();
      const transformedText = transform(selectedText);
      editor.replaceSelection(transformedText);

      expect(editor.getValue()).toBe(expected);
    });
  });
});
