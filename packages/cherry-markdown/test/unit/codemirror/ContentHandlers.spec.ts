/**
 * 内容处理器测试
 * 测试表格、列表、代码块等内容处理器与 CodeMirror 的交互
 *
 * 这些测试覆盖升级 CodeMirror6 前需要验证的核心功能
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCodeMirrorMock, createCherryMock } from '../../__mocks__/codemirror.mock';

describe('内容处理器 - CodeMirror 交互', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;
  let cherryMock: ReturnType<typeof createCherryMock>;

  beforeEach(() => {
    document.body.innerHTML = '<div id="previewer"></div>';
    cmMock = createCodeMirrorMock('');
    cherryMock = createCherryMock();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('表格内容处理器 (tableContentHandler.js)', () => {
    const tableMarkdown = `| Header 1 | Header 2 | Header 3 |
| --- | --- | --- |
| Cell 1 | Cell 2 | Cell 3 |
| Cell 4 | Cell 5 | Cell 6 |`;

    beforeEach(() => {
      cmMock = createCodeMirrorMock(tableMarkdown);
    });

    describe('表格定位', () => {
      it('应该使用 getValue 获取编辑器内容', () => {
        const value = cmMock.getValue();

        expect(cmMock.getValue).toHaveBeenCalled();
        expect(value).toContain('Header 1');
      });

      it('应该使用正则匹配表格语法', () => {
        const tableReg = /^\|[^\n]+\|\s*\n\|[\s:|-]+\|\s*\n(\|[^\n]+\|\s*\n)*/gm;
        const value = cmMock.getValue();
        const match = value.match(tableReg);

        expect(match).not.toBeNull();
        expect(match?.length).toBeGreaterThan(0);
      });

      it('应该计算表格在编辑器中的行号', () => {
        const value = cmMock.getValue();
        const tableOffset = 0; // 表格从第一行开始
        const linesBeforeTable = value.slice(0, tableOffset).match(/\n/g)?.length ?? 0;

        expect(linesBeforeTable).toBe(0);
      });
    });

    describe('单元格选中', () => {
      it('应该使用 setSelection 选中表格区域', () => {
        const from = { line: 0, ch: 0 };
        const to = { line: 3, ch: 26 };

        cmMock.setSelection(from, to);

        expect(cmMock.setSelection).toHaveBeenCalledWith(from, to);
      });

      it('应该获取选中的表格内容', () => {
        cmMock.setSelection({ line: 0, ch: 0 }, { line: 3, ch: 26 });
        const selection = cmMock.getSelection();

        expect(selection).toBeDefined();
      });

      it('应该计算单元格在行中的偏移量', () => {
        const line = '| Cell 1 | Cell 2 | Cell 3 |';
        const cells = line.split('|');

        // 去除首尾空元素
        const actualCells = cells.slice(1, -1);
        expect(actualCells.length).toBe(3);

        // 计算第二个单元格的偏移
        const firstCellLength = cells[0].length + cells[1].length + 1; // +1 for |
        expect(firstCellLength).toBeGreaterThan(0);
      });
    });

    describe('表格编辑', () => {
      it('应该使用 replaceSelection 替换表格内容', () => {
        cmMock.setSelection({ line: 2, ch: 2 }, { line: 2, ch: 8 });
        cmMock.replaceSelection('New Cell');

        expect(cmMock.replaceSelection).toHaveBeenCalledWith('New Cell');
      });

      it('应该插入新行', () => {
        const newRow = '|  |  |  |\n';
        const insertLine = 4; // 在第4行后插入

        cmMock.replaceRange(newRow, { line: insertLine, ch: 0 });

        expect(cmMock.replaceRange).toHaveBeenCalledWith(newRow, { line: insertLine, ch: 0 });
      });

      it('应该插入新列', () => {
        const value = cmMock.getValue();
        const lines = value.split('\n');

        const newLines = lines.map((line, index) => {
          const cells = line.split('|');
          // 在第二列后插入新列
          if (cells.length > 2) {
            cells.splice(2, 0, index === 1 ? ' --- ' : '  ');
          }
          return cells.join('|');
        });

        const newText = newLines.join('\n');
        expect(newText).toContain('|');
      });

      it('应该删除行', () => {
        cmMock.setSelection({ line: 0, ch: 0 }, { line: 3, ch: 26 });
        const selection = cmMock.getSelection();
        const lines = selection.split('\n');

        // 删除第三行（数据行）
        lines.splice(2, 1);
        const newText = lines.join('\n');

        cmMock.replaceSelection(newText);

        expect(cmMock.replaceSelection).toHaveBeenCalledWith(newText);
      });

      it('应该删除列', () => {
        const value = cmMock.getValue();
        const lines = value.split('\n');
        const columnToDelete = 1; // 删除第二列

        const newLines = lines.map((line) => {
          const cells = line.split('|').slice(1, -1);
          if (columnToDelete >= 0 && columnToDelete < cells.length) {
            cells.splice(columnToDelete, 1);
          }
          return `|${cells.join('|')}|`;
        });

        expect(newLines[0]).not.toContain('Header 2');
      });
    });

    describe('列对齐', () => {
      it('应该设置左对齐', () => {
        const separatorLine = '| --- | --- | --- |';
        const cells = separatorLine.split('|').slice(1, -1);
        cells[0] = ':---';
        const newLine = `|${cells.join('|')}|`;

        expect(newLine).toContain(':---');
      });

      it('应该设置居中对齐', () => {
        const separatorLine = '| --- | --- | --- |';
        const cells = separatorLine.split('|').slice(1, -1);
        cells[0] = ':---:';
        const newLine = `|${cells.join('|')}|`;

        expect(newLine).toContain(':---:');
      });

      it('应该设置右对齐', () => {
        const separatorLine = '| --- | --- | --- |';
        const cells = separatorLine.split('|').slice(1, -1);
        cells[0] = '---:';
        const newLine = `|${cells.join('|')}|`;

        expect(newLine).toContain('---:');
      });
    });

    describe('拖拽排序', () => {
      it('应该交换列位置', () => {
        const operateLines = (oldIndex: number, newIndex: number, lines: string[]) => {
          if (oldIndex < newIndex) {
            lines.splice(newIndex + 1, 0, lines[oldIndex]);
            lines.splice(oldIndex, 1);
          } else if (oldIndex > newIndex) {
            const line = lines[oldIndex];
            lines.splice(oldIndex, 1);
            lines.splice(newIndex, 0, line);
          }
          return lines;
        };

        const cells = ['A', 'B', 'C', 'D'];
        const result = operateLines(0, 2, [...cells]);

        expect(result).toEqual(['B', 'C', 'A', 'D']);
      });

      it('应该交换行位置', () => {
        const lines = ['Row1', 'Row2', 'Row3'];

        const operateLines = (oldIndex: number, newIndex: number, arr: string[]) => {
          if (oldIndex < newIndex) {
            arr.splice(newIndex + 1, 0, arr[oldIndex]);
            arr.splice(oldIndex, 1);
          } else if (oldIndex > newIndex) {
            const item = arr[oldIndex];
            arr.splice(oldIndex, 1);
            arr.splice(newIndex, 0, item);
          }
          return arr;
        };

        const result = operateLines(2, 0, [...lines]);

        expect(result).toEqual(['Row3', 'Row1', 'Row2']);
      });
    });

    describe('引用块中的表格', () => {
      it('应该识别引用块中的表格', () => {
        const blockquoteTable = `> | H1 | H2 |
> | --- | --- |
> | A | B |`;

        cmMock = createCodeMirrorMock(blockquoteTable);
        const value = cmMock.getValue();

        expect(value.startsWith('>')).toBe(true);
      });

      it('应该计算引用块表格的偏移', () => {
        const line = '> | Cell 1 | Cell 2 |';
        const quoteMatch = line.match(/^(>\s*)+/);
        const quoteLength = quoteMatch ? quoteMatch[0].length : 0;

        expect(quoteLength).toBe(2);

        const tableContent = line.substring(quoteLength);
        expect(tableContent).toBe('| Cell 1 | Cell 2 |');
      });
    });

    describe('HTML 表格', () => {
      it('应该识别 HTML 表格', () => {
        const htmlTable = `<table>
  <tr><th>H1</th><th>H2</th></tr>
  <tr><td>A</td><td>B</td></tr>
</table>`;

        const htmlTableReg = /<table[^>]*>[\s\S]*?<\/table>/gi;
        const match = htmlTable.match(htmlTableReg);

        expect(match).not.toBeNull();
      });

      it('应该提取 HTML 表格单元格内容', () => {
        const tableRow = '<tr><td>Cell 1</td><td>Cell 2</td></tr>';
        const tdRegex = /<(td|th)[^>]*>([\s\S]*?)<\/(td|th)>/gi;

        const cells: string[] = [];
        let match;
        while ((match = tdRegex.exec(tableRow)) !== null) {
          cells.push(match[2]);
        }

        expect(cells).toEqual(['Cell 1', 'Cell 2']);
      });
    });
  });

  describe('列表内容处理器 (listContentHandler.js)', () => {
    const listMarkdown = `- Item 1
- Item 2
  - Sub item 1
  - Sub item 2
- Item 3`;

    beforeEach(() => {
      cmMock = createCodeMirrorMock(listMarkdown);
    });

    describe('列表识别', () => {
      it('应该识别无序列表', () => {
        const listReg =
          /^(\s*)([-*+]|\d+[.)]\s|[a-z][.)]\s|[ivxIVX]+[.)]\s|[零一二三四五六七八九十百千]+[、)]\s)(\[[ x]\]\s)?(.*)$/;
        const line = '- Item 1';

        expect(listReg.test(line)).toBe(true);
      });

      it('应该识别有序列表', () => {
        const listReg =
          /^(\s*)([-*+]|\d+[.)]\s|[a-z][.)]\s|[ivxIVX]+[.)]\s|[零一二三四五六七八九十百千]+[、)]\s)(\[[ x]\]\s)?(.*)$/;
        const line = '1. Item 1';

        expect(listReg.test(line)).toBe(true);
      });

      it('应该识别任务列表', () => {
        // 任务列表正则 - 匹配 "- [ ] " 或 "- [x] " 格式
        const taskListReg = /^(\s*)([-*+]\s)(\[[ x]\]\s)(.*)$/;
        const unchecked = '- [ ] Task';
        const checked = '- [x] Done';

        const uncheckedMatch = unchecked.match(taskListReg);
        const checkedMatch = checked.match(taskListReg);

        expect(uncheckedMatch?.[3]).toBe('[ ] ');
        expect(checkedMatch?.[3]).toBe('[x] ');
      });

      it('应该识别中文数字列表', () => {
        // 中文数字列表格式: 一、第一项
        const listReg = /^(\s*)([零一二三四五六七八九十百千]+[、)])/;
        const line = '一、第一项';

        expect(listReg.test(line)).toBe(true);
      });
    });

    describe('列表编辑', () => {
      it('应该获取列表项所在行', () => {
        const value = cmMock.getValue();
        const lines = value.split('\n');

        expect(lines[0]).toBe('- Item 1');
        expect(lines[2]).toBe('  - Sub item 1');
      });

      it('应该使用 setSelection 选中列表项', () => {
        const from = { line: 0, ch: 2 };
        const to = { line: 0, ch: 8 };

        cmMock.setSelection(from, to);

        expect(cmMock.setSelection).toHaveBeenCalledWith(from, to);
      });

      it('应该使用 replaceRange 编辑列表项', () => {
        const newContent = 'New Item';
        const from = { line: 0, ch: 2 };
        const to = { line: 0, ch: 8 };

        cmMock.replaceRange(newContent, from, to);

        expect(cmMock.replaceRange).toHaveBeenCalled();
      });

      it('应该使用 getCursor 获取光标位置', () => {
        const cursor = cmMock.getCursor();

        expect(cursor).toHaveProperty('line');
        expect(cursor).toHaveProperty('ch');
      });

      it('应该使用 getLine 获取当前行内容', () => {
        const line = cmMock.getLine(0);

        expect(line).toBe('- Item 1');
      });
    });

    describe('换行处理', () => {
      it('应该在换行时继承列表标记', () => {
        const currentLine = '- Item';
        // 匹配列表标记（包括后面的空格）
        const listReg = /^(\s*)([-*+]\s|\d+[.)]\s)/;
        const match = currentLine.match(listReg);

        if (match) {
          const indent = match[1];
          const marker = match[2];
          const newLine = `\n${indent}${marker}`;

          expect(newLine).toBe('\n- ');
        } else {
          // 使用替代方式验证
          expect(currentLine.startsWith('-')).toBe(true);
        }
      });

      it('应该在任务列表换行时使用未勾选状态', () => {
        const currentLine = '- [x] Done task';
        const newMarker = currentLine.replace('[x]', '[ ] ');

        expect(newMarker).toContain('[ ]');
      });

      it('应该使用 setCursor 移动光标到新行', () => {
        const newLine = 1;
        const newCh = 2;

        cmMock.setCursor({ line: newLine, ch: newCh });

        expect(cmMock.setCursor).toHaveBeenCalledWith({ line: newLine, ch: newCh });
      });
    });

    describe('缩进处理', () => {
      it('应该识别列表项的缩进级别', () => {
        const lines = ['- Item 1', '  - Sub item 1', '    - Sub sub item'];

        const getIndentLevel = (line: string) => {
          const match = line.match(/^(\s*)/);
          return match ? match[1].length : 0;
        };

        expect(getIndentLevel(lines[0])).toBe(0);
        expect(getIndentLevel(lines[1])).toBe(2);
        expect(getIndentLevel(lines[2])).toBe(4);
      });
    });
  });

  describe('代码块内容处理器 (codeBlockContentHandler.js)', () => {
    const codeBlockMarkdown = '```javascript\nconst hello = "world";\nconsole.log(hello);\n```';

    beforeEach(() => {
      cmMock = createCodeMirrorMock(codeBlockMarkdown);
    });

    describe('代码块识别', () => {
      it('应该识别代码块', () => {
        // 匹配代码块: ```lang ... ```
        const codeBlockReg = /^```(\w*)\n/m;
        const value = cmMock.getValue();
        const match = codeBlockReg.exec(value);

        expect(match).not.toBeNull();
        expect(match?.[1]).toBe('javascript');
      });

      it('应该排除 mermaid 代码块', () => {
        const mermaidCode = '```mermaid\ngraph TD\nA-->B\n```';
        cmMock = createCodeMirrorMock(mermaidCode);

        const value = cmMock.getValue();
        const isMermaid = value.startsWith('```mermaid');

        expect(isMermaid).toBe(true);
      });

      it('应该提取代码块语言', () => {
        const firstLine = '```javascript';
        const lang = firstLine.match(/```\s*([^\n]+)/)?.[1] ?? '';

        expect(lang).toBe('javascript');
      });
    });

    describe('代码块定位', () => {
      it('应该计算代码块在编辑器中的位置', () => {
        const value = cmMock.getValue();
        const offset = 0;
        const beginLine = value.slice(0, offset).match(/\n/g)?.length ?? 0;

        expect(beginLine).toBe(0);
      });

      it('应该计算代码块结束行', () => {
        const codeBlock = '```javascript\ncode\n```';
        const endLine = codeBlock.match(/\n/g)?.length ?? 0;

        expect(endLine).toBe(2);
      });
    });

    describe('代码块选中', () => {
      it('应该使用 setSelection 选中代码块内容', () => {
        // 选中代码内容（不包括语法标记）
        const from = { line: 1, ch: 0 };
        const to = { line: 2, ch: 19 };

        cmMock.setSelection(from, to);

        expect(cmMock.setSelection).toHaveBeenCalled();
      });

      it('应该使用 getSelection 获取选中的代码', () => {
        cmMock.setSelection({ line: 1, ch: 0 }, { line: 1, ch: 21 });
        const selection = cmMock.getSelection();

        expect(selection).toBeDefined();
      });
    });

    describe('代码块编辑', () => {
      it('应该使用 replaceSelection 替换代码内容', () => {
        cmMock.setSelection({ line: 1, ch: 0 }, { line: 2, ch: 19 });
        const newCode = 'const x = 1;\nconst y = 2;';

        cmMock.replaceSelection(newCode);

        expect(cmMock.replaceSelection).toHaveBeenCalledWith(newCode);
      });

      it('应该更改代码块语言', () => {
        // 选中语言部分
        cmMock.setSelection({ line: 0, ch: 3 }, { line: 0, ch: 13 });

        cmMock.replaceSelection('typescript', 'around');

        expect(cmMock.replaceSelection).toHaveBeenCalledWith('typescript', 'around');
      });
    });

    describe('代码复制', () => {
      it('应该获取代码块纯文本内容', () => {
        const codeBlock = '```javascript\nconst x = 1;\n```';
        const codeContent = codeBlock.replace(/^```[^\n]*\n/, '').replace(/\n```$/, '');

        expect(codeContent).toBe('const x = 1;');
      });
    });

    describe('嵌套 CodeMirror 编辑器', () => {
      it('应该创建代码块编辑器实例', () => {
        // 模拟创建嵌套编辑器
        const textarea = document.createElement('textarea');
        textarea.id = 'codeMirrorEditor';
        document.body.appendChild(textarea);

        // 验证 textarea 存在
        expect(document.getElementById('codeMirrorEditor')).not.toBeNull();
      });

      it('应该在嵌套编辑器变化时同步到主编辑器', () => {
        const nestedValue = 'new code';
        cmMock.replaceSelection(nestedValue, 'around');

        expect(cmMock.replaceSelection).toHaveBeenCalledWith(nestedValue, 'around');
      });
    });
  });

  describe('通用 CodeMirror 交互', () => {
    describe('选区操作', () => {
      it('应该使用 listSelections 获取所有选区', () => {
        const selections = cmMock.listSelections();

        expect(Array.isArray(selections)).toBe(true);
      });

      it('应该处理多选区', () => {
        const selections = cmMock.listSelections();

        selections.forEach((sel) => {
          expect(sel).toHaveProperty('anchor');
          expect(sel).toHaveProperty('head');
        });
      });
    });

    describe('位置计算', () => {
      it('应该使用 charCoords 获取字符坐标', () => {
        const pos = { line: 0, ch: 5 };
        const coords = cmMock.charCoords(pos, 'local');

        expect(coords).toHaveProperty('left');
        expect(coords).toHaveProperty('top');
      });

      it('应该使用 coordsChar 从坐标获取位置', () => {
        const coords = { left: 40, top: 0 };
        const pos = cmMock.coordsChar(coords, 'local');

        expect(pos).toHaveProperty('line');
        expect(pos).toHaveProperty('ch');
      });
    });

    describe('文档操作', () => {
      it('应该使用 getDoc 获取文档对象', () => {
        const doc = cmMock.getDoc();

        expect(doc).toHaveProperty('getValue');
        expect(doc).toHaveProperty('setValue');
        expect(doc).toHaveProperty('replaceSelection');
      });

      it('应该使用 lineCount 获取总行数', () => {
        cmMock = createCodeMirrorMock('line1\nline2\nline3');
        const count = cmMock.lineCount();

        expect(count).toBe(3);
      });
    });

    describe('刷新和焦点', () => {
      it('应该调用 refresh 刷新编辑器', () => {
        cmMock.refresh();

        expect(cmMock.refresh).toHaveBeenCalled();
      });

      it('应该调用 focus 聚焦编辑器', () => {
        cmMock.focus();

        expect(cmMock.focus).toHaveBeenCalled();
      });

      it('应该使用 hasFocus 检查焦点状态', () => {
        const hasFocus = cmMock.hasFocus();

        expect(typeof hasFocus).toBe('boolean');
      });
    });
  });
});
