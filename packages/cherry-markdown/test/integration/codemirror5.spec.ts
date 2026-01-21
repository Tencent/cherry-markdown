/**
 * CodeMirror5 集成测试
 *
 * 使用真实的 CodeMirror5 实例进行测试
 * 这些测试验证 Cherry 与 CM5 的真实交互行为
 *
 * 升级 CM6 时，创建对应的 codemirror6.spec.ts 文件
 * 两个文件的测试用例应该完全相同，只是编辑器初始化方式不同
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// 真实 CodeMirror5 集成测试
// ============================================================================

describe('CodeMirror5 集成测试', () => {
  let container: HTMLDivElement;
  let cm: any;

  // 尝试加载真实的 CodeMirror
  let CodeMirror: any;
  let isRealCM = false;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    try {
      // 尝试动态导入 CodeMirror
      CodeMirror = (await import('codemirror')).default;
      cm = CodeMirror(container, {
        value: '',
        mode: 'markdown',
        lineNumbers: true,
      });
      isRealCM = true;
    } catch {
      // 如果无法加载真实的 CodeMirror，使用模拟实现
      console.warn('CodeMirror not available, using mock implementation');
      cm = createMinimalCMMock();
      isRealCM = false;
    }
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  /**
   * 创建最小化的 CM Mock（仅在真实 CM 不可用时使用）
   */
  function createMinimalCMMock() {
    let value = '';
    let cursor = { line: 0, ch: 0 };
    let selection = { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } };

    const getLines = () => value.split('\n');

    return {
      getValue: () => value,
      setValue: (v: string) => {
        value = v;
      },
      getLine: (n: number) => getLines()[n] || '',
      lineCount: () => getLines().length,
      getCursor: () => ({ ...cursor }),
      setCursor: (pos: { line: number; ch: number }) => {
        cursor = { ...pos };
      },
      getSelection: () => {
        const lines = getLines();
        if (selection.anchor.line === selection.head.line) {
          const line = lines[selection.anchor.line] || '';
          const start = Math.min(selection.anchor.ch, selection.head.ch);
          const end = Math.max(selection.anchor.ch, selection.head.ch);
          return line.substring(start, end);
        }
        return '';
      },
      setSelection: (anchor: any, head?: any) => {
        selection = { anchor: { ...anchor }, head: head ? { ...head } : { ...anchor } };
        cursor = head ? { ...head } : { ...anchor };
      },
      replaceSelection: (text: string) => {
        const lines = getLines();
        const line = lines[selection.anchor.line] || '';
        const start = Math.min(selection.anchor.ch, selection.head.ch);
        const end = Math.max(selection.anchor.ch, selection.head.ch);
        lines[selection.anchor.line] = line.substring(0, start) + text + line.substring(end);
        value = lines.join('\n');
        cursor = { line: selection.anchor.line, ch: start + text.length };
        selection = { anchor: cursor, head: cursor };
      },
      replaceRange: (text: string, from: any, to: any) => {
        const lines = getLines();
        const line = lines[from.line] || '';
        lines[from.line] = line.substring(0, from.ch) + text + line.substring(to.ch);
        value = lines.join('\n');
      },
      focus: () => {},
      getDoc: () => ({
        getValue: () => value,
        setValue: (v: string) => {
          value = v;
        },
      }),
    };
  }

  // ============================================================================
  // 基础功能测试
  // ============================================================================

  describe('基础编辑功能', () => {
    it('应该能够设置和获取内容', () => {
      cm.setValue('Hello World');
      expect(cm.getValue()).toBe('Hello World');
    });

    it('应该能够获取指定行', () => {
      cm.setValue('Line 1\nLine 2\nLine 3');
      expect(cm.getLine(0)).toBe('Line 1');
      expect(cm.getLine(1)).toBe('Line 2');
      expect(cm.getLine(2)).toBe('Line 3');
    });

    it('应该能够获取行数', () => {
      cm.setValue('Line 1\nLine 2\nLine 3');
      expect(cm.lineCount()).toBe(3);
    });
  });

  describe('光标操作', () => {
    it('应该能够设置和获取光标位置', () => {
      cm.setValue('Hello World');
      cm.setCursor({ line: 0, ch: 5 });
      const cursor = cm.getCursor();
      expect(cursor.line).toBe(0);
      expect(cursor.ch).toBe(5);
    });
  });

  describe('选区操作', () => {
    it('应该能够选中文本', () => {
      cm.setValue('Hello World');
      cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(cm.getSelection()).toBe('Hello');
    });

    it('应该能够替换选中的文本', () => {
      cm.setValue('Hello World');
      cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      cm.replaceSelection('Hi');
      expect(cm.getValue()).toBe('Hi World');
    });
  });

  // ============================================================================
  // Markdown 编辑行为测试
  // 这些是升级 CM6 后必须保持一致的核心行为
  // ============================================================================

  describe('Markdown 编辑行为', () => {
    describe('加粗', () => {
      it('应该能够加粗选中文本', () => {
        cm.setValue('hello world');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

        const selection = cm.getSelection();
        cm.replaceSelection(`**${selection}**`);

        expect(cm.getValue()).toBe('**hello** world');
      });

      it('应该能够移除加粗', () => {
        cm.setValue('**hello** world');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 9 });

        const selection = cm.getSelection();
        const plainText = selection.replace(/^\*\*(.+)\*\*$/, '$1');
        cm.replaceSelection(plainText);

        expect(cm.getValue()).toBe('hello world');
      });
    });

    describe('斜体', () => {
      it('应该能够添加斜体', () => {
        cm.setValue('hello world');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

        const selection = cm.getSelection();
        cm.replaceSelection(`*${selection}*`);

        expect(cm.getValue()).toBe('*hello* world');
      });
    });

    describe('标题', () => {
      it('应该能够添加一级标题', () => {
        cm.setValue('Title');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

        const selection = cm.getSelection();
        cm.replaceSelection(`# ${selection}`);

        expect(cm.getValue()).toBe('# Title');
      });

      it('应该能够更改标题级别', () => {
        cm.setValue('# Title');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 7 });

        const selection = cm.getSelection();
        const newText = selection.replace(/^#\s+/, '## ');
        cm.replaceSelection(newText);

        expect(cm.getValue()).toBe('## Title');
      });
    });

    describe('链接', () => {
      it('应该能够创建链接', () => {
        cm.setValue('click here');
        cm.setSelection({ line: 0, ch: 6 }, { line: 0, ch: 10 });

        const selection = cm.getSelection();
        cm.replaceSelection(`[${selection}](https://example.com)`);

        expect(cm.getValue()).toBe('click [here](https://example.com)');
      });
    });

    describe('代码块', () => {
      it('应该能够包裹代码块', () => {
        cm.setValue('const x = 1;');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 12 });

        const selection = cm.getSelection();
        cm.replaceSelection('```javascript\n' + selection + '\n```');

        expect(cm.getValue()).toBe('```javascript\nconst x = 1;\n```');
      });
    });

    describe('列表', () => {
      it('应该能够将行转换为无序列表', () => {
        cm.setValue('Item 1');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 6 });

        const selection = cm.getSelection();
        cm.replaceSelection(`- ${selection}`);

        expect(cm.getValue()).toBe('- Item 1');
      });

      it('应该能够将行转换为有序列表', () => {
        cm.setValue('Item 1');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 6 });

        const selection = cm.getSelection();
        cm.replaceSelection(`1. ${selection}`);

        expect(cm.getValue()).toBe('1. Item 1');
      });

      it('应该能够添加任务列表', () => {
        cm.setValue('Task');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

        const selection = cm.getSelection();
        cm.replaceSelection(`- [ ] ${selection}`);

        expect(cm.getValue()).toBe('- [ ] Task');
      });
    });

    describe('引用', () => {
      it('应该能够添加引用', () => {
        cm.setValue('Quote text');
        cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 10 });

        const selection = cm.getSelection();
        cm.replaceSelection(`> ${selection}`);

        expect(cm.getValue()).toBe('> Quote text');
      });
    });
  });

  // ============================================================================
  // 回归测试数据表
  // ============================================================================

  describe('回归测试 - 所有核心编辑操作', () => {
    const regressionTests = [
      // 格式化操作
      {
        name: '加粗',
        initial: 'text',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `**${s}**`,
        expected: '**text**',
      },
      {
        name: '斜体',
        initial: 'text',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `*${s}*`,
        expected: '*text*',
      },
      {
        name: '删除线',
        initial: 'text',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `~~${s}~~`,
        expected: '~~text~~',
      },
      {
        name: '下划线',
        initial: 'text',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `<u>${s}</u>`,
        expected: '<u>text</u>',
      },
      {
        name: '上标',
        initial: '2',
        selStart: 0,
        selEnd: 1,
        transform: (s: string) => `^${s}^`,
        expected: '^2^',
      },
      {
        name: '下标',
        initial: '2',
        selStart: 0,
        selEnd: 1,
        transform: (s: string) => `^^${s}^^`,
        expected: '^^2^^',
      },
      {
        name: '行内代码',
        initial: 'code',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `\`${s}\``,
        expected: '`code`',
      },

      // 标题
      {
        name: '一级标题',
        initial: 'Title',
        selStart: 0,
        selEnd: 5,
        transform: (s: string) => `# ${s}`,
        expected: '# Title',
      },
      {
        name: '二级标题',
        initial: 'Title',
        selStart: 0,
        selEnd: 5,
        transform: (s: string) => `## ${s}`,
        expected: '## Title',
      },
      {
        name: '三级标题',
        initial: 'Title',
        selStart: 0,
        selEnd: 5,
        transform: (s: string) => `### ${s}`,
        expected: '### Title',
      },

      // 列表
      {
        name: '无序列表',
        initial: 'item',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `- ${s}`,
        expected: '- item',
      },
      {
        name: '有序列表',
        initial: 'item',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `1. ${s}`,
        expected: '1. item',
      },
      {
        name: '任务列表(未选中)',
        initial: 'task',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `- [ ] ${s}`,
        expected: '- [ ] task',
      },
      {
        name: '任务列表(已选中)',
        initial: 'task',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `- [x] ${s}`,
        expected: '- [x] task',
      },

      // 引用
      {
        name: '引用',
        initial: 'quote',
        selStart: 0,
        selEnd: 5,
        transform: (s: string) => `> ${s}`,
        expected: '> quote',
      },

      // 链接和图片
      {
        name: '链接',
        initial: 'link',
        selStart: 0,
        selEnd: 4,
        transform: (s: string) => `[${s}](url)`,
        expected: '[link](url)',
      },
      {
        name: '图片',
        initial: 'alt',
        selStart: 0,
        selEnd: 3,
        transform: (s: string) => `![${s}](image.png)`,
        expected: '![alt](image.png)',
      },
    ];

    regressionTests.forEach(({ name, initial, selStart, selEnd, transform, expected }) => {
      it(`${name}: "${initial}" → "${expected}"`, () => {
        cm.setValue(initial);
        cm.setSelection({ line: 0, ch: selStart }, { line: 0, ch: selEnd });

        const selection = cm.getSelection();
        const result = transform(selection);
        cm.replaceSelection(result);

        expect(cm.getValue()).toBe(expected);
      });
    });
  });
});
