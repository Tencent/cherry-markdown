/**
 * 高级场景行为测试
 *
 * 测试复杂的编辑场景，确保升级 CM6 后行为一致
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockEditorAdapter, type IEditorAdapter } from './editor-adapter.spec';

// ============================================================================
// 1. 多行选区操作
// ============================================================================

describe('多行选区操作', () => {
  let editor: IEditorAdapter;

  beforeEach(() => {
    editor = createMockEditorAdapter('');
  });

  it('应该正确选中多行文本', () => {
    editor.setValue('Line 1\nLine 2\nLine 3');
    editor.setSelection({ line: 0, ch: 0 }, { line: 2, ch: 6 });
    expect(editor.getSelection()).toBe('Line 1\nLine 2\nLine 3');
  });

  it('应该正确选中部分多行文本', () => {
    editor.setValue('Hello World\nFoo Bar\nBaz Qux');
    editor.setSelection({ line: 0, ch: 6 }, { line: 1, ch: 3 });
    expect(editor.getSelection()).toBe('World\nFoo');
  });

  it('应该正确替换多行选区', () => {
    editor.setValue('Line 1\nLine 2\nLine 3');
    editor.setSelection({ line: 0, ch: 0 }, { line: 1, ch: 6 });
    editor.replaceSelection('New Content');
    expect(editor.getValue()).toBe('New Content\nLine 3');
  });
});

// ============================================================================
// 2. 嵌套格式处理
// ============================================================================

describe('嵌套格式处理', () => {
  /**
   * 检测文本是否已加粗
   */
  const isBold = (text: string) => /^\*\*[\s\S]+\*\*$/.test(text.trim());

  /**
   * 添加加粗
   */
  const addBold = (text: string) => `**${text}**`;

  /**
   * 添加斜体
   */
  const addItalic = (text: string) => `*${text}*`;

  it('先加粗再斜体', () => {
    const text = 'hello';
    const bolded = addBold(text);
    const boldItalic = addItalic(bolded);
    expect(boldItalic).toBe('***hello***');
  });

  it('先斜体再加粗', () => {
    const text = 'hello';
    const italiced = addItalic(text);
    const italicBold = addBold(italiced);
    expect(italicBold).toBe('***hello***');
  });

  it('从加粗+斜体中移除加粗', () => {
    const text = '***hello***';
    // 移除外层加粗（***text*** -> *text*）
    const withoutBold = text.replace(/^\*\*\*([\s\S]+)\*\*\*$/, '*$1*');
    expect(withoutBold).toBe('*hello*');
  });

  it('检测纯加粗', () => {
    expect(isBold('**hello**')).toBe(true);
    expect(isBold('*hello*')).toBe(false);
    expect(isBold('***hello***')).toBe(true); // 也包含加粗
  });
});

// ============================================================================
// 3. 边界情况
// ============================================================================

describe('边界情况', () => {
  let editor: IEditorAdapter;

  beforeEach(() => {
    editor = createMockEditorAdapter('');
  });

  describe('空文档', () => {
    it('getValue 应该返回空字符串', () => {
      expect(editor.getValue()).toBe('');
    });

    it('lineCount 应该返回 1', () => {
      expect(editor.lineCount()).toBe(1);
    });

    it('getLine(0) 应该返回空字符串', () => {
      expect(editor.getLine(0)).toBe('');
    });

    it('getSelection 无选区时应该返回空', () => {
      expect(editor.getSelection()).toBe('');
    });
  });

  describe('单字符操作', () => {
    it('选中单个字符', () => {
      editor.setValue('a');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 1 });
      expect(editor.getSelection()).toBe('a');
    });

    it('替换单个字符', () => {
      editor.setValue('a');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 1 });
      editor.replaceSelection('b');
      expect(editor.getValue()).toBe('b');
    });
  });

  describe('行首行尾', () => {
    it('光标在行首', () => {
      editor.setValue('hello');
      editor.setCursor({ line: 0, ch: 0 });
      const cursor = editor.getCursor();
      expect(cursor.ch).toBe(0);
    });

    it('光标在行尾', () => {
      editor.setValue('hello');
      editor.setCursor({ line: 0, ch: 5 });
      const cursor = editor.getCursor();
      expect(cursor.ch).toBe(5);
    });

    it('在行首插入文本', () => {
      editor.setValue('world');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 0 });
      editor.replaceSelection('hello ');
      expect(editor.getValue()).toBe('hello world');
    });

    it('在行尾插入文本', () => {
      editor.setValue('hello');
      editor.setSelection({ line: 0, ch: 5 }, { line: 0, ch: 5 });
      editor.replaceSelection(' world');
      expect(editor.getValue()).toBe('hello world');
    });
  });

  describe('特殊字符', () => {
    it('处理中文', () => {
      editor.setValue('你好世界');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 2 });
      expect(editor.getSelection()).toBe('你好');
    });

    it('处理 emoji', () => {
      editor.setValue('Hello 🎉 World');
      expect(editor.getValue()).toBe('Hello 🎉 World');
    });

    it('处理制表符', () => {
      editor.setValue('Hello\tWorld');
      expect(editor.getValue()).toBe('Hello\tWorld');
    });

    it('处理换行符', () => {
      editor.setValue('Line1\nLine2\nLine3');
      expect(editor.lineCount()).toBe(3);
    });
  });
});

// ============================================================================
// 4. 撤销重做行为
// ============================================================================

describe('撤销重做行为', () => {
  /**
   * 简单的历史记录管理器
   */
  class HistoryManager {
    private undoStack: string[] = [];
    private redoStack: string[] = [];
    private current: string = '';

    constructor(initial: string = '') {
      this.current = initial;
    }

    push(content: string) {
      this.undoStack.push(this.current);
      this.current = content;
      this.redoStack = []; // 新操作清空 redo 栈
    }

    undo(): string | null {
      if (this.undoStack.length === 0) return null;
      this.redoStack.push(this.current);
      this.current = this.undoStack.pop()!;
      return this.current;
    }

    redo(): string | null {
      if (this.redoStack.length === 0) return null;
      this.undoStack.push(this.current);
      this.current = this.redoStack.pop()!;
      return this.current;
    }

    getCurrent() {
      return this.current;
    }

    canUndo() {
      return this.undoStack.length > 0;
    }

    canRedo() {
      return this.redoStack.length > 0;
    }
  }

  it('应该能撤销到上一个状态', () => {
    const history = new HistoryManager('');
    history.push('hello');
    history.push('hello world');

    const undone = history.undo();
    expect(undone).toBe('hello');
  });

  it('应该能重做', () => {
    const history = new HistoryManager('');
    history.push('hello');
    history.push('hello world');
    history.undo();

    const redone = history.redo();
    expect(redone).toBe('hello world');
  });

  it('新操作应该清空 redo 栈', () => {
    const history = new HistoryManager('');
    history.push('a');
    history.push('b');
    history.undo(); // 回到 'a'
    history.push('c'); // 新操作

    expect(history.canRedo()).toBe(false);
  });

  it('多次撤销应该依次回退', () => {
    const history = new HistoryManager('');
    history.push('1');
    history.push('2');
    history.push('3');

    expect(history.undo()).toBe('2');
    expect(history.undo()).toBe('1');
    expect(history.undo()).toBe('');
    expect(history.undo()).toBe(null); // 没有更多历史
  });
});

// ============================================================================
// 5. 粘贴行为
// ============================================================================

describe('粘贴行为', () => {
  /**
   * 处理粘贴的 HTML 转 Markdown
   */
  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]+>/g, ''); // 移除其他标签
  };

  it('应该转换 HTML strong 为 Markdown 加粗', () => {
    expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**');
    expect(htmlToMarkdown('<b>bold</b>')).toBe('**bold**');
  });

  it('应该转换 HTML em 为 Markdown 斜体', () => {
    expect(htmlToMarkdown('<em>italic</em>')).toBe('*italic*');
    expect(htmlToMarkdown('<i>italic</i>')).toBe('*italic*');
  });

  it('应该转换 HTML 链接为 Markdown 链接', () => {
    expect(htmlToMarkdown('<a href="https://example.com">link</a>')).toBe('[link](https://example.com)');
  });

  it('应该处理嵌套格式', () => {
    expect(htmlToMarkdown('<strong><em>bold italic</em></strong>')).toBe('***bold italic***');
  });

  it('应该处理换行', () => {
    expect(htmlToMarkdown('line1<br>line2')).toBe('line1\nline2');
  });

  /**
   * 处理纯文本粘贴（检测 URL）
   */
  const processPlainTextPaste = (text: string, selection: string): string => {
    // 如果粘贴的是 URL 且有选中文本，创建链接
    const urlPattern = /^https?:\/\/[^\s]+$/;
    if (urlPattern.test(text) && selection) {
      return `[${selection}](${text})`;
    }
    return text;
  };

  it('粘贴 URL 到选中文本应该创建链接', () => {
    const url = 'https://example.com';
    const selection = 'click here';
    expect(processPlainTextPaste(url, selection)).toBe('[click here](https://example.com)');
  });

  it('粘贴 URL 无选中文本应该保持原样', () => {
    const url = 'https://example.com';
    expect(processPlainTextPaste(url, '')).toBe('https://example.com');
  });

  it('粘贴普通文本应该保持原样', () => {
    const text = 'hello world';
    expect(processPlainTextPaste(text, 'selected')).toBe('hello world');
  });
});

// ============================================================================
// 6. 搜索替换行为
// ============================================================================

describe('搜索替换行为', () => {
  /**
   * 简单的搜索实现
   */
  const findMatches = (content: string, query: string, options?: { caseSensitive?: boolean; regex?: boolean }) => {
    const matches: Array<{ from: number; to: number; text: string }> = [];

    if (!query) return matches;

    let searchRegex: RegExp;
    try {
      if (options?.regex) {
        searchRegex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchRegex = new RegExp(escaped, options?.caseSensitive ? 'g' : 'gi');
      }
    } catch {
      return matches;
    }

    let match;
    while ((match = searchRegex.exec(content)) !== null) {
      matches.push({
        from: match.index,
        to: match.index + match[0].length,
        text: match[0],
      });
    }

    return matches;
  };

  /**
   * 替换所有匹配
   */
  const replaceAll = (content: string, query: string, replacement: string, options?: { caseSensitive?: boolean }) => {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, options?.caseSensitive ? 'g' : 'gi');
    return content.replace(regex, replacement);
  };

  it('应该找到所有匹配项', () => {
    const content = 'hello world hello';
    const matches = findMatches(content, 'hello');
    expect(matches).toHaveLength(2);
    expect(matches[0].from).toBe(0);
    expect(matches[1].from).toBe(12);
  });

  it('大小写不敏感搜索', () => {
    const content = 'Hello HELLO hello';
    const matches = findMatches(content, 'hello', { caseSensitive: false });
    expect(matches).toHaveLength(3);
  });

  it('大小写敏感搜索', () => {
    const content = 'Hello HELLO hello';
    const matches = findMatches(content, 'hello', { caseSensitive: true });
    expect(matches).toHaveLength(1);
    expect(matches[0].text).toBe('hello');
  });

  it('正则表达式搜索', () => {
    const content = 'foo1 foo2 foo3 bar';
    const matches = findMatches(content, 'foo\\d', { regex: true });
    expect(matches).toHaveLength(3);
  });

  it('替换所有', () => {
    const content = 'hello world hello';
    const result = replaceAll(content, 'hello', 'hi');
    expect(result).toBe('hi world hi');
  });

  it('空查询应该返回空数组', () => {
    const matches = findMatches('hello', '');
    expect(matches).toHaveLength(0);
  });

  it('无匹配应该返回空数组', () => {
    const matches = findMatches('hello', 'xyz');
    expect(matches).toHaveLength(0);
  });
});

// ============================================================================
// 7. 光标位置恢复
// ============================================================================

describe('光标位置恢复', () => {
  let editor: IEditorAdapter;

  beforeEach(() => {
    editor = createMockEditorAdapter('');
  });

  it('插入文本后光标应该在插入内容末尾', () => {
    editor.setValue('hello world');
    editor.setSelection({ line: 0, ch: 5 }, { line: 0, ch: 5 });
    editor.replaceSelection(' beautiful');

    const cursor = editor.getCursor();
    expect(cursor.ch).toBe(15); // 'hello beautiful'.length
  });

  it('删除文本后光标应该在删除位置', () => {
    editor.setValue('hello world');
    editor.setSelection({ line: 0, ch: 5 }, { line: 0, ch: 11 });
    editor.replaceSelection('');

    const cursor = editor.getCursor();
    expect(cursor.ch).toBe(5);
    expect(editor.getValue()).toBe('hello');
  });

  it('替换选区后光标应该在新文本末尾', () => {
    editor.setValue('hello world');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    editor.replaceSelection('hi');

    const cursor = editor.getCursor();
    expect(cursor.ch).toBe(2); // 'hi'.length
    expect(editor.getValue()).toBe('hi world');
  });
});
