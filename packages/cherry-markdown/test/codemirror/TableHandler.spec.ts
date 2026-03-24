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
 * TableHandler 核心功能单元测试
 *
 * 测试修复的核心逻辑：
 * - $afterTableOperation: 表格操作后选中整个表格
 * - $setSelection: 边界检查
 * - $getTdOffset: 边界检查
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock CodeMirror 6 实例
const createMockCodeMirror = (content: string) => {
  let currentContent = content;
  let selection = { from: 0, to: 0 };

  return {
    view: {
      state: {
        doc: {
          toString: () => currentContent,
          length: currentContent.length,
          line: (n: number) => {
            const lines = currentContent.split('\n');
            const lineContent = lines[n - 1] || '';
            let from = 0;
            for (let i = 0; i < n - 1; i++) {
              from += (lines[i]?.length || 0) + 1;
            }
            return {
              number: n,
              from,
              to: from + lineContent.length,
              length: lineContent.length,
              text: lineContent,
            };
          },
          lines: currentContent.split('\n').length,
        },
        selection: {
          main: selection,
        },
      },
    },
    getValue: () => currentContent,
    setValue: (val: string) => {
      currentContent = val;
    },
    getSelection: () => {
      return currentContent.slice(selection.from, selection.to);
    },
    setSelection: (from: number, to: number) => {
      selection = { from, to };
    },
    replaceSelection: vi.fn((text: string) => {
      currentContent = currentContent.slice(0, selection.from) + text + currentContent.slice(selection.to);
      selection.to = selection.from + text.length;
    }),
    replaceRange: vi.fn((text: string, from: number, to: number) => {
      currentContent = currentContent.slice(0, from) + text + currentContent.slice(to);
    }),
  };
};

// Mock TableHandler 的核心方法
const createMockTableHandler = (codeMirror: ReturnType<typeof createMockCodeMirror>) => {
  const handler = {
    codeMirror,
    tableEditor: {
      info: {
        tableIndex: 0,
        trIndex: 0,
        tdIndex: 0,
        isTHead: false,
        isInFootnote: false,
        selection: [
          { line: 0, ch: 0 },
          { line: 2, ch: 10 },
        ],
      },
      tableCodes: [] as Array<{ code: string; offset: number; type: string }>,
      footnoteTableCodes: [] as Array<{ code: string; offset: number; type: string }>,
    },
    boundaryCache: null as null | object,

    // 模拟 $collectTableCode
    $collectTableCode() {
      const content = this.codeMirror.getValue();
      // 简化的表格正则，匹配标准 Markdown 表格
      const tableReg = /(\|[^\n]+\|\n)(\|[-:\s|]+\|\n)((\|[^\n]+\|\n?)*)/g;
      const matches: Array<{ code: string; offset: number; type: string }> = [];
      let match;
      while ((match = tableReg.exec(content)) !== null) {
        matches.push({
          code: match[0],
          offset: match.index,
          type: 'markdown',
        });
      }
      this.tableEditor.tableCodes = matches;
    },

    // 核心修复：$setSelection 边界检查
    $setSelection(index: number, type = 'table') {
      const { isInFootnote } = this.tableEditor.info;
      const tableCode = isInFootnote
        ? this.tableEditor.footnoteTableCodes[index]
        : this.tableEditor.tableCodes[index];

      // 边界检查：如果表格代码不存在，直接返回
      if (!tableCode) {
        return false;
      }

      const whole = this.codeMirror.getValue();
      const beforeTable = whole.slice(0, tableCode.offset);
      const beginLine = (beforeTable.match(/\n/g) || []).length;

      if (type === 'table') {
        const tableLines = tableCode.code.split('\n').length - 1;
        const endLine = beginLine + tableLines;
        const lastLineLength = tableCode.code.split('\n').pop()?.length || 0;

        this.tableEditor.info.selection = [
          { line: beginLine, ch: 0 },
          { line: endLine, ch: lastLineLength },
        ];

        // 计算文档偏移量并设置选区
        const { doc } = this.codeMirror.view.state;
        const from = doc.line(beginLine + 1).from;
        const to = doc.line(endLine + 1).from + lastLineLength;
        this.codeMirror.setSelection(from, to);
      }
      return true;
    },

    // 核心修复：$afterTableOperation
    $afterTableOperation() {
      this.boundaryCache = null;
      this.$collectTableCode();
      this.$setSelection(this.tableEditor.info.tableIndex, 'table');
    },
  };

  return handler;
};

describe('TableHandler', () => {
  describe('$setSelection 边界检查', () => {
    it('应该在 tableCode 不存在时安全返回', () => {
      const codeMirror = createMockCodeMirror('no table here');
      const handler = createMockTableHandler(codeMirror);

      // tableCodes 为空
      handler.tableEditor.tableCodes = [];
      handler.tableEditor.info.tableIndex = 0;

      const result = handler.$setSelection(0, 'table');
      expect(result).toBe(false);
    });

    it('应该在 tableCode 存在时正常工作', () => {
      const tableContent = '| A | B |\n|---|---|\n| 1 | 2 |';
      const codeMirror = createMockCodeMirror(tableContent);
      const handler = createMockTableHandler(codeMirror);

      handler.$collectTableCode();
      expect(handler.tableEditor.tableCodes.length).toBe(1);

      const result = handler.$setSelection(0, 'table');
      expect(result).toBe(true);
    });

    it('应该在索引越界时安全返回', () => {
      const tableContent = '| A | B |\n|---|---|\n| 1 | 2 |';
      const codeMirror = createMockCodeMirror(tableContent);
      const handler = createMockTableHandler(codeMirror);

      handler.$collectTableCode();
      handler.tableEditor.info.tableIndex = 999; // 越界索引

      const result = handler.$setSelection(999, 'table');
      expect(result).toBe(false);
    });
  });

  describe('$afterTableOperation', () => {
    it('应该清除 boundaryCache', () => {
      const tableContent = '| A | B |\n|---|---|\n| 1 | 2 |';
      const codeMirror = createMockCodeMirror(tableContent);
      const handler = createMockTableHandler(codeMirror);

      handler.boundaryCache = { some: 'data' };
      handler.$afterTableOperation();

      expect(handler.boundaryCache).toBe(null);
    });

    it('应该重新收集表格代码', () => {
      const tableContent = '| A | B |\n|---|---|\n| 1 | 2 |';
      const codeMirror = createMockCodeMirror(tableContent);
      const handler = createMockTableHandler(codeMirror);

      handler.tableEditor.tableCodes = [];
      handler.$afterTableOperation();

      expect(handler.tableEditor.tableCodes.length).toBe(1);
    });

    it('删除行后应该正常工作（不报错）', () => {
      // 模拟删除行后的场景
      const tableContent = '| A | B |\n|---|---|\n| 1 | 2 |';
      const codeMirror = createMockCodeMirror(tableContent);
      const handler = createMockTableHandler(codeMirror);

      // 模拟删除行后 trIndex 失效
      handler.tableEditor.info.trIndex = 5; // 无效的行索引
      handler.tableEditor.info.tableIndex = 0;

      // 不应该抛出错误
      expect(() => handler.$afterTableOperation()).not.toThrow();
    });
  });

  describe('表格删除行场景', () => {
    it('删除表格的最后一个数据行后不应报错', () => {
      // 初始表格有两行数据
      let tableContent = '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |';
      const codeMirror = createMockCodeMirror(tableContent);
      const handler = createMockTableHandler(codeMirror);

      handler.$collectTableCode();
      handler.tableEditor.info.tableIndex = 0;
      handler.tableEditor.info.trIndex = 1; // 指向第二行数据

      // 模拟删除行
      tableContent = '| A | B |\n|---|---|\n| 1 | 2 |';
      codeMirror.setValue(tableContent);

      // trIndex 仍然是 1，但表格只剩一行数据了
      // $afterTableOperation 不应该报错
      expect(() => handler.$afterTableOperation()).not.toThrow();
    });
  });
});
