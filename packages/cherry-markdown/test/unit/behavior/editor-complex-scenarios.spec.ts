/**
 * 编辑器复杂场景端到端测试
 *
 * 这些测试模拟真实用户操作场景
 * 升级 CodeMirror 6 后这些测试必须全部通过
 *
 * 设计原则：
 * 1. 测试用户可感知的功能行为
 * 2. 不依赖具体的 CodeMirror API
 * 3. 覆盖典型的 Markdown 编辑场景
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createExtendedMockEditorAdapter, type IEditorAdapterExtended } from './editor-adapter-extended.spec';

// ============================================================================
// Markdown 编辑场景测试
// ============================================================================

describe('Markdown 编辑场景测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  describe('文档创建场景', () => {
    it('应该能创建完整的 Markdown 文档', () => {
      // 创建标题
      editor.setValue('# Document Title\n\n');

      // 添加段落
      editor.replaceRange('This is the first paragraph.\n\n', { line: 2, ch: 0 }, { line: 2, ch: 0 });

      // 添加列表
      editor.setValue(`${editor.getValue()}- Item 1\n- Item 2\n- Item 3\n\n`);

      // 添加代码块
      editor.setValue(`${editor.getValue()}\`\`\`javascript\nconsole.log("Hello");\n\`\`\`\n`);

      const content = editor.getValue();
      expect(content).toContain('# Document Title');
      expect(content).toContain('- Item 1');
      expect(content).toContain('```javascript');
    });

    it('应该能编辑和格式化文档', () => {
      editor.setValue('This is important text to emphasize');

      // 选中 "important" 并加粗
      const content = editor.getValue();
      const importantIndex = content.indexOf('important');
      editor.setSelection({ line: 0, ch: importantIndex }, { line: 0, ch: importantIndex + 'important'.length });
      editor.replaceSelection('**important**');

      // 选中 "emphasize" 并斜体
      const newContent = editor.getValue();
      const emphasizeIndex = newContent.indexOf('emphasize');
      editor.setSelection({ line: 0, ch: emphasizeIndex }, { line: 0, ch: emphasizeIndex + 'emphasize'.length });
      editor.replaceSelection('*emphasize*');

      expect(editor.getValue()).toBe('This is **important** text to *emphasize*');
    });
  });

  describe('列表编辑场景', () => {
    it('应该能创建和编辑列表', () => {
      editor.setValue('- First item\n- Second item\n- Third item');

      // 在第二项后插入新项
      editor.replaceRange('\n- Inserted item', { line: 1, ch: 13 }, { line: 1, ch: 13 });

      expect(editor.getValue()).toContain('Inserted item');
    });

    it('应该能转换列表类型', () => {
      editor.setValue('- Item 1\n- Item 2\n- Item 3');

      // 将无序列表转换为有序列表
      const content = editor.getValue();
      const newContent = content.replace(/^- /gm, '1. ');
      editor.setValue(newContent);

      expect(editor.getValue()).toBe('1. Item 1\n1. Item 2\n1. Item 3');
    });

    it('应该能嵌套列表', () => {
      editor.setValue('- Top level\n  - Nested item\n  - Another nested');

      expect(editor.getValue()).toContain('  - Nested');
    });
  });

  describe('表格编辑场景', () => {
    it('应该能创建简单表格', () => {
      const table = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`;

      editor.setValue(table);

      expect(editor.getValue()).toContain('| Header 1 |');
      expect(editor.getValue()).toContain('| Cell 1');
    });

    it('应该能编辑表格单元格', () => {
      editor.setValue('| Name | Age |\n|------|-----|\n| John | 25  |');

      // 编辑年龄 - 直接使用 replaceRange
      const lines = editor.getValue().split('\n');
      const thirdLine = lines[2]; // '| John | 25  |'
      const ageStart = thirdLine.indexOf('25');
      const ageEnd = ageStart + 2;

      editor.replaceRange('30', { line: 2, ch: ageStart }, { line: 2, ch: ageEnd });

      expect(editor.getValue()).toContain('| John | 30');
    });
  });

  describe('代码块编辑场景', () => {
    it('应该能创建代码块', () => {
      editor.setValue('Here is some code:\n\n```javascript\nconst x = 1;\n```\n\nEnd.');

      expect(editor.getValue()).toContain('```javascript');
      expect(editor.getValue()).toContain('const x = 1');
    });

    it('应该能编辑代码块内容', () => {
      editor.setValue('```\noriginal code\n```');

      // 替换代码内容
      const lines = editor.getValue().split('\n');
      editor.replaceRange('new code', { line: 1, ch: 0 }, { line: 1, ch: lines[1].length });

      expect(editor.getValue()).toContain('new code');
    });
  });

  describe('链接和图片场景', () => {
    it('应该能创建链接', () => {
      editor.setValue('Click here for more info');

      // 选中 "here" 并转换为链接
      const hereIndex = editor.getValue().indexOf('here');
      editor.setSelection({ line: 0, ch: hereIndex }, { line: 0, ch: hereIndex + 'here'.length });
      editor.replaceSelection('[here](https://example.com)');

      expect(editor.getValue()).toBe('Click [here](https://example.com) for more info');
    });

    it('应该能插入图片', () => {
      editor.setValue('An image:\n\n');

      editor.replaceRange('![Alt text](image.png)', { line: 2, ch: 0 }, { line: 2, ch: 0 });

      expect(editor.getValue()).toContain('![Alt text](image.png)');
    });
  });
});

// ============================================================================
// 编辑流程场景测试
// ============================================================================

describe('编辑流程场景测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  describe('写作-编辑-修订流程', () => {
    it('应该支持完整的写作流程', () => {
      // 1. 初始写作
      editor.setValue('# My Article\n\nThis is the introduction.');

      // 2. 添加内容
      let content = editor.getValue();
      editor.setValue(`${content}\n\n## Section 1\n\nContent of section 1.`);

      // 3. 修订内容
      content = editor.getValue();
      const introIndex = content.indexOf('introduction');
      editor.setSelection(
        { line: 2, ch: introIndex - content.split('\n')[2].indexOf('introduction') },
        { line: 2, ch: introIndex - content.split('\n')[2].indexOf('introduction') + 'introduction'.length },
      );
      editor.replaceSelection('opening paragraph');

      // 4. 最终检查
      expect(editor.getValue()).toContain('opening paragraph');
      expect(editor.getValue()).toContain('## Section 1');
    });

    it('应该支持撤销整个写作会话', () => {
      // 设置初始值
      editor.setValue('Initial');

      // 记录初始状态
      const initialState = editor.getValue();
      expect(initialState).toBe('Initial');

      // 进行多次编辑
      editor.setValue(`${editor.getValue()} Edit 1`);
      editor.setValue(`${editor.getValue()} Edit 2`);
      editor.setValue(`${editor.getValue()} Edit 3`);

      // 验证编辑后的内容
      expect(editor.getValue()).toBe('Initial Edit 1 Edit 2 Edit 3');

      // 验证可以撤销
      expect(editor.historySize().canUndo).toBe(true);

      // 撤销几次
      editor.undo();
      expect(editor.getValue()).toBe('Initial Edit 1 Edit 2');

      editor.undo();
      expect(editor.getValue()).toBe('Initial Edit 1');

      editor.undo();
      expect(editor.getValue()).toBe('Initial');
    });
  });

  describe('批量编辑场景', () => {
    it('应该能批量替换文本', () => {
      editor.setValue('foo bar foo baz foo');

      // 替换所有 foo 为 qux
      const content = editor.getValue();
      editor.setValue(content.replace(/foo/g, 'qux'));

      expect(editor.getValue()).toBe('qux bar qux baz qux');
    });

    it('应该能批量格式化', () => {
      editor.setValue('item1\nitem2\nitem3');

      // 将每行转换为列表项
      const lines = editor.getValue().split('\n');
      const formatted = lines.map((line) => `- ${line}`).join('\n');
      editor.setValue(formatted);

      expect(editor.getValue()).toBe('- item1\n- item2\n- item3');
    });
  });
});

// ============================================================================
// 撤销重做场景测试
// ============================================================================

describe('撤销重做场景测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('应该能撤销格式化操作', () => {
    editor.setValue('plain text');

    // 加粗
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 10 });
    editor.replaceSelection('**plain text**');

    expect(editor.getValue()).toBe('**plain text**');

    // 撤销
    editor.undo();

    expect(editor.getValue()).toBe('plain text');
  });

  it('应该能重做撤销的操作', () => {
    editor.setValue('original');
    editor.setValue('modified');

    editor.undo();
    expect(editor.getValue()).toBe('original');

    editor.redo();
    expect(editor.getValue()).toBe('modified');
  });

  it('应该能撤销到初始状态', () => {
    editor.setValue('start');
    editor.setValue('middle');
    editor.setValue('end');

    editor.undo();
    editor.undo();

    expect(editor.getValue()).toBe('start');
  });
});

// ============================================================================
// 多行编辑场景测试
// ============================================================================

describe('多行编辑场景测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('应该能编辑多行内容', () => {
    editor.setValue('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');

    // 替换中间几行
    editor.setSelection({ line: 1, ch: 0 }, { line: 3, ch: 6 });
    editor.replaceSelection('New Line 2\nNew Line 3');

    const lines = editor.getValue().split('\n');
    expect(lines[1]).toBe('New Line 2');
    expect(lines[2]).toBe('New Line 3');
  });

  it('应该能正确处理行尾操作', () => {
    editor.setValue('First\nSecond');

    // 在第一行末尾添加
    editor.setSelection({ line: 0, ch: 5 }, { line: 0, ch: 5 });
    editor.replaceSelection(' Line Extended');

    expect(editor.getValue()).toBe('First Line Extended\nSecond');
  });

  it('应该能正确处理空行', () => {
    editor.setValue('Line 1\n\n\nLine 4');

    expect(editor.lineCount()).toBe(4);

    // 在空行添加内容
    editor.setSelection({ line: 1, ch: 0 }, { line: 1, ch: 0 });
    editor.replaceSelection('Line 2');

    expect(editor.getLine(1)).toBe('Line 2');
  });
});

// ============================================================================
// 边界情况场景测试
// ============================================================================

describe('边界情况场景测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('应该能处理空文档', () => {
    editor.setValue('');

    expect(editor.getValue()).toBe('');
    expect(editor.lineCount()).toBe(1); // 空文档有一行
    expect(editor.getCursor()).toEqual({ line: 0, ch: 0 });
  });

  it('应该能处理非常长的行', () => {
    const longLine = 'A'.repeat(10000);
    editor.setValue(longLine);

    expect(editor.getValue().length).toBe(10000);

    // 在长行中间编辑
    editor.setSelection({ line: 0, ch: 5000 }, { line: 0, ch: 5005 });
    editor.replaceSelection('BBBBB');

    expect(editor.getValue().substring(5000, 5005)).toBe('BBBBB');
  });

  it('应该能处理特殊字符', () => {
    editor.setValue('Special: \t\nUnicode: 你好世界\nEmoji: 🎉');

    expect(editor.getValue()).toContain('\t');
    expect(editor.getValue()).toContain('你好世界');
    expect(editor.getValue()).toContain('🎉');
  });

  it('应该能处理重复内容', () => {
    editor.setValue('repeat repeat repeat repeat');

    expect(editor.getValue().split('repeat').length - 1).toBe(4);
  });
});

// ============================================================================
// 性能场景测试
// ============================================================================

describe('性能场景测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('应该能处理大文档', () => {
    const lines = Array(1000).fill('Line content here');
    editor.setValue(lines.join('\n'));

    expect(editor.lineCount()).toBe(1000);
  });

  it('应该能快速定位和编辑', () => {
    const lines = Array(1000).fill('Line content');
    editor.setValue(lines.join('\n'));

    // 定位到中间行
    const midLine = 500;
    editor.setSelection({ line: midLine, ch: 0 }, { line: midLine, ch: 12 });
    editor.replaceSelection('MODIFIED');

    expect(editor.getLine(midLine)).toBe('MODIFIED');
  });
});

// ============================================================================
// 事件驱动场景测试
// ============================================================================

describe('事件驱动场景测试', () => {
  let editor: IEditorAdapterExtended;
  let stateSnapshot: {
    content: string;
    cursor: { line: number; ch: number };
    historySize: { canUndo: boolean; canRedo: boolean };
  };

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
    stateSnapshot = {
      content: '',
      cursor: { line: 0, ch: 0 },
      historySize: { canUndo: false, canRedo: false },
    };

    // 记录状态变化
    editor.on('change', () => {
      stateSnapshot.content = editor.getValue();
      stateSnapshot.historySize = editor.historySize();
    });

    editor.on('cursorActivity', () => {
      stateSnapshot.cursor = editor.getCursor();
    });
  });

  it('应该正确追踪编辑状态', () => {
    editor.setValue('Hello');

    expect(stateSnapshot.content).toBe('Hello');

    editor.setValue('World');

    expect(stateSnapshot.content).toBe('World');
    expect(stateSnapshot.historySize.canUndo).toBe(true);
  });

  it('应该正确追踪光标移动', () => {
    editor.setValue('Test content');
    editor.setCursor({ line: 0, ch: 4 });

    expect(stateSnapshot.cursor).toEqual({ line: 0, ch: 4 });
  });

  it('应该正确追踪历史状态', () => {
    editor.setValue('First');
    editor.setValue('Second');

    expect(stateSnapshot.historySize.canUndo).toBe(true);
    expect(stateSnapshot.historySize.canRedo).toBe(false);

    editor.undo();

    expect(stateSnapshot.historySize.canRedo).toBe(true);
  });
});

// ============================================================================
// 完整用户场景测试
// ============================================================================

describe('完整用户场景测试', () => {
  let editor: IEditorAdapterExtended;

  beforeEach(() => {
    editor = createExtendedMockEditorAdapter('');
  });

  it('场景：写一篇博客文章', () => {
    // 1. 创建标题
    editor.setValue('# My Blog Post\n\n');

    // 2. 添加介绍段落
    let content = editor.getValue();
    editor.setValue(`${content}This is an introduction to the topic.\n\n`);

    // 3. 添加章节
    content = editor.getValue();
    editor.setValue(`${content}## Section 1\n\nFirst section content.\n\n`);

    // 4. 添加代码示例
    content = editor.getValue();
    editor.setValue(`${content}\`\`\`javascript\nconsole.log("Hello");\n\`\`\`\n\n`);

    // 5. 添加列表
    content = editor.getValue();
    editor.setValue(`${content}Key points:\n- Point 1\n- Point 2\n- Point 3\n\n`);

    // 6. 添加结论
    content = editor.getValue();
    editor.setValue(`${content}## Conclusion\n\nThis concludes the article.`);

    // 验证最终内容
    const finalContent = editor.getValue();
    expect(finalContent).toContain('# My Blog Post');
    expect(finalContent).toContain('## Section 1');
    expect(finalContent).toContain('```javascript');
    expect(finalContent).toContain('- Point 1');
    expect(finalContent).toContain('## Conclusion');
  });

  it('场景：编辑技术文档', () => {
    // 创建技术文档
    editor.setValue(`# API Documentation

## Overview

This API provides the following endpoints.

## Endpoints

### GET /users

Returns a list of users.

### POST /users

Creates a new user.

## Examples

\`\`\`bash
curl -X GET https://api.example.com/users
\`\`\`
`);

    // 验证文档结构
    expect(editor.getValue()).toContain('# API Documentation');
    expect(editor.getValue()).toContain('### GET /users');
    expect(editor.getValue()).toContain('```bash');

    // 添加新端点
    const content = editor.getValue();
    const insertPoint = content.indexOf('## Examples');
    const beforeExamples = content.substring(0, insertPoint);
    const afterExamples = content.substring(insertPoint);

    editor.setValue(
      `${beforeExamples}### DELETE /users/:id

Deletes a user by ID.

${afterExamples}`,
    );

    expect(editor.getValue()).toContain('### DELETE /users/:id');
  });
});
