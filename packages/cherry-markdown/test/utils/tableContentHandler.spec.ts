import { describe, expect, it, vi } from 'vite-plus/test';
import TableHandler from '../../src/utils/tableContentHandler';

type TableCode = { code: string; offset: number; type: string };
type LineInfo = { from: number; to: number; text: string };
type SelectionRange = [{ line: number; ch: number }, { line: number; ch: number }];
type TableInfo = Record<string, unknown> & {
  code?: string;
  columns?: number;
  isHtmlTable?: boolean;
  isInFootnote?: boolean;
  isTHead?: boolean;
  selection?: SelectionRange;
  tableIndex?: number;
  tableNode?: HTMLTableElement;
  tableText?: string;
  tdIndex?: number;
  tdNode?: HTMLElement;
  totalTables?: number;
  trIndex?: number;
  trNode?: HTMLTableRowElement;
};
type EditorDom = Record<string, unknown> & {
  inputDiv?: HTMLDivElement;
  inputDom?: HTMLTextAreaElement;
  menuContainer?: HTMLDivElement;
  symbolContainer?: HTMLDivElement;
  boundaryTriggerSymbol?: {
    col: { el: HTMLDivElement; index: number | null };
    rows: Array<{ el: HTMLDivElement; index: number | null }>;
  };
};
type HandlerHarness = {
  tableEditor: {
    info: TableInfo;
    tableCodes: TableCode[];
    footnoteTableCodes: TableCode[];
    editorDom: EditorDom;
  };
  trigger: string;
  target: HTMLElement;
  previewerDom: HTMLElement;
  container: HTMLElement;
  codeMirror: MockCodeMirror;
  $cherry: { locale: { addCol: string; addRow: string; deleteRow: string; deleteColumn: string } };
  boundaryCache?: unknown;
  boundaryGlobalMoveRef?: EventListener;
  boundaryMouseMoveHandlerRef?: EventListener;
  boundaryTableRef?: HTMLElement;
  tableReg?: RegExp;
  codeBlockReg?: RegExp;
  htmlTableReg?: RegExp;
  blockquoteHtmlTableReg?: RegExp;
  emit(type: string, event?: Event, callback?: () => void): void | boolean;
  setStyle(element: HTMLElement, property: string, value: string): void;
  showBubble(): void;
  $afterTableOperation(): void;
  $alignColumn(alignment: string): void;
  $alignColumnInMarkdownTable(lines: string[], columnIndex: number, alignment: string): void;
  $applyRowHighlight(add: boolean): void;
  $cancelHighlightColumn(): void;
  $cancelHighlightElement(elementType: string): void;
  $cancelHighlightRow(): void;
  $clearAllBorders(): void;
  $clearTableHighlights(table: HTMLTableElement): void;
  $collectHtmlTableCode(
    editorValue: string,
    tableCodes: TableCode[],
    footnoteTableCodes: TableCode[],
    isInFootnote: (offset: number) => boolean,
  ): void;
  $collectTableCode(): void;
  $collectTableDom(): false | void;
  $createMenuBubble(type: string): HTMLDivElement;
  $createMenuOption(
    config: { action: string; icon: string; title: string; highlight?: string },
    type: string,
  ): HTMLDivElement;
  $deleteCurrentColumn(): void;
  $deleteCurrentRow(): void;
  $dragCol(): void;
  $dragLine(): void;
  $drawEditor(): void;
  $drawMenu(): void;
  $drawSymbol(): void;
  $executeMenuAction(action: string, type: string): void;
  $extractHtmlTableText(htmlCode: string): string;
  $findTableByContent(): number;
  $findTableInEditor(): boolean;
  $getBlockquoteHtmlTdOffset(tableCode: string, trIndex: number, tdIndex: number): OffsetInfo;
  $getBlockquoteTdOffset(tableCode: string, isTHead: boolean, trIndex: number, tdIndex: number): OffsetInfo;
  $getClosestNode(node: Element, targetNodeName: string): Element | false;
  $getHtmlTdOffset(tableCode: string, trIndex: number, tdIndex: number): OffsetInfo;
  $getMenuConfig(type: string): Array<{ action: string; showIn: string[] }>;
  $getPosition(node?: HTMLElement): { top: number; height: number; width: number; left: number; maxHeight: number };
  $getTdAlign(cells: string[], index: number, cellsIndex: number): string;
  $getTdOffset(tableCode: string, isTHead: boolean, trIndex: number, tdIndex: number, isInBlock?: boolean): OffsetInfo;
  $highlightColumn(): void;
  $highlightColumnCellsDom(columnIndex: number, position: string): void;
  $highlightCurrentColumn(): void;
  $highlightElement(elementType: string): void;
  $highlightRow(): void;
  $hideMenuBubble(bubble: HTMLElement): void;
  $initReg(): void;
  $insertCol(): void;
  $insertRow(position: string | number): void;
  $onInputChange(event: Event): void;
  $operateLines(oldIndex: number, index: number, lines: string[]): string[];
  $refreshPosition(): void;
  $remove(): void;
  $setInputOffset(): void;
  $setMenuButtonPosition(): void;
  $setSelection(index: number, type?: string, select?: boolean): void;
  $showMenuBubble(button: HTMLElement, bubble: HTMLElement): void;
  $showColumnDragFeedback(objTarget: HTMLElement, oldIndex: number, index: number): void;
  $showRowDragFeedback(objTarget: HTMLElement, oldIndex: number, index: number): void;
  $toggleMenuBubble(button: HTMLElement, bubble: HTMLElement): void;
  $tryRemoveMe(event: Event, callback: () => void): void;
  $unhighlightCurrentColumn(): void;
  $updateBoundaryTriggerPosition(): void;
  $updateEditorPosition(): void;
  $validateBounds(index: number, maxLength: number, context?: string): boolean;
};
type OffsetInfo = { preLine: number; preCh: number; plusCh: number; currentTd: string };

class MockDoc {
  constructor(private value: string) {}

  toString() {
    return this.value;
  }

  get length() {
    return this.value.length;
  }

  get lines() {
    return this.value.split('\n').length;
  }

  setValue(value: string) {
    this.value = value;
  }

  line(lineNumber: number): LineInfo {
    const lines = this.value.split('\n');
    const from = lines.slice(0, lineNumber - 1).join('\n').length + (lineNumber === 1 ? 0 : 1);
    const text = lines[lineNumber - 1] ?? '';
    return { from, to: from + text.length, text };
  }

  sliceString(from: number, to: number) {
    return this.value.slice(from, to);
  }
}

class MockCodeMirror {
  readonly doc: MockDoc;
  readonly view: { state: { doc: MockDoc; selection: { main: { from: number; to: number } } } };
  readonly setSelection = vi.fn((from: number, to: number) => {
    this.view.state.selection.main = { from, to };
  });
  readonly replaceRange = vi.fn((text: string, from: number, to = from) => {
    const next = `${this.doc.toString().slice(0, from)}${text}${this.doc.toString().slice(to)}`;
    this.doc.setValue(next);
  });
  readonly replaceSelection = vi.fn((text: string) => {
    const { from, to } = this.view.state.selection.main;
    this.replaceRange(text, from, to);
  });

  constructor(value: string) {
    this.doc = new MockDoc(value);
    this.view = {
      state: {
        doc: this.doc,
        selection: { main: { from: 0, to: value.length } },
      },
    };
  }
}

const createHandler = (value = '') => {
  const handler = Object.create(TableHandler.prototype) as HandlerHarness;

  handler.tableEditor = {
    info: {},
    tableCodes: [],
    footnoteTableCodes: [],
    editorDom: {},
  };
  handler.trigger = 'hover';
  handler.target = document.createElement('td');
  handler.previewerDom = document.createElement('div');
  handler.container = document.createElement('div');
  handler.codeMirror = new MockCodeMirror(value);
  handler.$cherry = {
    locale: {
      addCol: 'Add column',
      addRow: 'Add row',
      deleteRow: 'Delete row',
      deleteColumn: 'Delete column',
    },
  };
  handler.$initReg();
  return handler;
};

const setRect = (element: Element, rect: Partial<DOMRect>) => {
  const fullRect = {
    top: 0,
    left: 0,
    right: rect.width ?? 0,
    bottom: rect.height ?? 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  };
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => fullRect,
  });
};

const mountPreviewer = (handler: HandlerHarness) => {
  const wrapper = document.createElement('div');
  setRect(wrapper, { top: 10, left: 20, width: 500, height: 300 });
  wrapper.appendChild(handler.previewerDom);
  document.body.appendChild(wrapper);
  return wrapper;
};

const createBoundaryTable = () => {
  const wrapper = document.createElement('div');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const tbody = document.createElement('tbody');
  const bodyRowOne = document.createElement('tr');
  const bodyRowTwo = document.createElement('tr');
  const cells: HTMLTableCellElement[] = [];

  ['A', 'B', 'C'].forEach((text, index) => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
    cells[index] = th;
  });

  ['1', '2', '3'].forEach((text, index) => {
    const td = document.createElement('td');
    td.textContent = text;
    bodyRowOne.appendChild(td);
    cells[index + 3] = td;
  });

  ['4', '5', '6'].forEach((text, index) => {
    const td = document.createElement('td');
    td.textContent = text;
    bodyRowTwo.appendChild(td);
    cells[index + 6] = td;
  });

  thead.appendChild(headerRow);
  tbody.append(bodyRowOne, bodyRowTwo);
  table.append(thead, tbody);
  wrapper.appendChild(table);
  document.body.appendChild(wrapper);

  setRect(wrapper, { top: 20, left: 30, width: 240, height: 140 });
  setRect(table, { top: 20, left: 30, width: 240, height: 140 });
  setRect(headerRow, { top: 20, left: 30, width: 240, height: 28 });
  setRect(bodyRowOne, { top: 48, left: 30, width: 240, height: 28 });
  setRect(bodyRowTwo, { top: 76, left: 30, width: 240, height: 28 });

  cells.forEach((cell, index) => {
    let rowTop = 76;
    if (index < 6) {
      rowTop = 48;
    }
    if (index < 3) {
      rowTop = 20;
    }
    const column = index % 3;
    setRect(cell, {
      top: rowTop,
      left: 30 + column * 80,
      width: 80,
      height: 28,
      right: 30 + column * 80 + 80,
      bottom: rowTop + 28,
    });
  });

  return { wrapper, table, cells, bodyRowOne, bodyRowTwo };
};

const seedMarkdownTable = (handler: HandlerHarness, tableCode: string) => {
  Object.assign(handler.tableEditor, {
    info: {
      columns: 2,
      isHtmlTable: false,
      isInFootnote: false,
      isTHead: false,
      tableIndex: 0,
      tdIndex: 1,
      trIndex: 0,
    },
    tableCodes: [{ code: tableCode, offset: 0, type: 'markdown' }],
  });
  Object.assign(handler.codeMirror.view.state.selection, {
    main: { from: 0, to: tableCode.length },
  });
};

describe('utils/tableContentHandler', () => {
  describe('constructor', () => {
    it('initializes table editing state and selects the clicked table cell', () => {
      const tableCode = '| A | B |\n| - | - |\n| 1 | 2 |';
      const previewerDom = document.createElement('div');
      previewerDom.innerHTML = '<table class="cherry-table"><tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
      const wrapper = document.createElement('div');
      wrapper.appendChild(previewerDom);
      const target = previewerDom.querySelectorAll('td')[1] as HTMLTableCellElement;
      const container = document.createElement('div');
      const codeMirror = new MockCodeMirror(tableCode);
      const cherry = {
        locale: {
          addCol: 'Add column',
          addRow: 'Add row',
          deleteRow: 'Delete row',
          deleteColumn: 'Delete column',
        },
      };

      const handler = new TableHandler(
        'click',
        target,
        container,
        previewerDom,
        codeMirror,
        target.closest('table'),
        cherry,
      );

      expect(handler.trigger).toBe('click');
      expect(handler.target).toBe(target);
      expect(handler.tableElement).toBe(target.closest('table'));
      expect(handler.tableEditor.info.code).toBe('2');
      expect(handler.tableEditor.tableCodes).toHaveLength(1);
      expect(codeMirror.setSelection).toHaveBeenCalled();
    });

    it('skips table editing initialization when codeMirror is unavailable', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handler = new TableHandler(
        'hover',
        document.createElement('td'),
        document.createElement('div'),
        document.createElement('div'),
        undefined,
        document.createElement('table'),
        { locale: { addCol: '+', addRow: '+', deleteRow: '-', deleteColumn: '-' } },
      );

      expect(warnSpy).toHaveBeenCalledWith('TableHandler: codeMirror is not available, table editing is disabled');
      expect(handler.tableEditor).toEqual({
        info: {},
        tableCodes: [],
        footnoteTableCodes: [],
        editorDom: {},
      });

      warnSpy.mockRestore();
    });
  });

  describe('$validateBounds', () => {
    it('accepts indexes inside the range', () => {
      const handler = createHandler();

      expect(handler.$validateBounds(1, 3, 'test')).toBe(true);
    });

    it('rejects indexes outside the range and logs context', () => {
      const handler = createHandler();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(handler.$validateBounds(3, 3, 'targetTd')).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith('Index out of bounds in targetTd:', 3, 'max:', 3);
      expect(handler.$validateBounds(-1, 3, 'targetTr')).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith('Index out of bounds in targetTr:', -1, 'max:', 3);

      errorSpy.mockRestore();
    });
  });

  describe('$getTdOffset', () => {
    it('finds a markdown table cell when rows start with a pipe', () => {
      const handler = createHandler();
      const tableCode = '| Name | Value |\n| --- | --- |\n| foo |  bar  |';

      expect(handler.$getTdOffset(tableCode, false, 0, 1)).toEqual({
        preLine: 2,
        preCh: 9,
        plusCh: 3,
        currentTd: 'bar',
      });
    });

    it('finds a markdown table cell when rows do not start with a pipe', () => {
      const handler = createHandler();
      const tableCode = 'Name | Value\n--- | ---\nfoo |  bar';

      expect(handler.$getTdOffset(tableCode, false, 0, 1)).toEqual({
        preLine: 2,
        preCh: 6,
        plusCh: 3,
        currentTd: 'bar',
      });
    });

    it('places the cursor in the middle of an empty cell', () => {
      const handler = createHandler();
      const tableCode = '| Name | Value |\n| --- | --- |\n| foo |    |';

      expect(handler.$getTdOffset(tableCode, false, 0, 1)).toEqual({
        preLine: 2,
        preCh: 9,
        plusCh: 0,
        currentTd: '',
      });
    });
  });

  describe('HTML table offsets and extraction', () => {
    it('finds the requested HTML table cell', () => {
      const handler = createHandler();
      const tableCode = [
        '<table>',
        '<tr><th>Name</th><th>Value</th></tr>',
        '<tr><td>foo</td><td>bar</td></tr>',
        '</table>',
      ].join('\n');

      expect(handler.$getHtmlTdOffset(tableCode, 1, 1)).toEqual({
        preLine: 2,
        preCh: 20,
        plusCh: 3,
        currentTd: 'bar',
      });
    });

    it('falls back to selecting the whole table when the cell is missing', () => {
      const handler = createHandler();
      const tableCode = '<table>\n<tr><td>foo</td></tr>\n</table>';

      expect(handler.$getHtmlTdOffset(tableCode, 4, 0)).toEqual({
        preLine: 0,
        preCh: 0,
        plusCh: tableCode.length,
        currentTd: '',
      });
    });

    it('extracts text from HTML table markup', () => {
      const handler = createHandler();

      expect(handler.$extractHtmlTableText('<table><tr><td> A </td><td>B</td></tr></table>')).toBe('AB');
      expect(handler.$extractHtmlTableText('<div>not a table</div>')).toBe('');
    });
  });

  describe('table collection and matching', () => {
    it('collects markdown, blockquote, HTML, and footnote table code in editor order', () => {
      const editorValue = [
        '| A | B |',
        '| - | - |',
        '| 1 | 2 |',
        '',
        '```',
        '| ignored | table |',
        '| - | - |',
        '```',
        '',
        '> | QA | QB |',
        '> | - | - |',
        '> | 3 | 4 |',
        '',
        '<table><tr><td>html</td></tr></table>',
        '',
        '[^1]: | N | V |',
        '| - | - |',
        '| note | 7 |',
      ].join('\n');
      const handler = createHandler(editorValue);

      handler.$collectTableCode();

      expect(handler.tableEditor.tableCodes.map(({ type }) => type)).toEqual([
        'markdown',
        'blockquote-markdown',
        'html',
      ]);
      expect(handler.tableEditor.tableCodes[0].code).toContain('| 1 | 2 |');
      expect(handler.tableEditor.tableCodes[1].code).toContain('> | 3 | 4 |');
      expect(handler.tableEditor.footnoteTableCodes).toMatchObject([{ type: 'markdown' }]);
      expect(handler.tableEditor.tableCodes.every(({ code }) => !code.includes('ignored'))).toBe(true);
    });

    it('separates normal and footnote HTML tables', () => {
      const handler = createHandler();
      const tableCodes: Array<{ code: string; offset: number; type: string }> = [];
      const footnoteTableCodes: Array<{ code: string; offset: number; type: string }> = [];
      const editorValue = [
        '<table><tr><td>main</td></tr></table>',
        '',
        '[^1]: <table><tr><td>note</td></tr></table>',
      ].join('\n');
      const footnoteStart = editorValue.indexOf('[^1]:');

      handler.$collectHtmlTableCode(
        editorValue,
        tableCodes,
        footnoteTableCodes,
        (offset: number) => offset >= footnoteStart,
      );

      expect(tableCodes).toMatchObject([{ type: 'html', offset: 0 }]);
      expect(footnoteTableCodes).toMatchObject([{ type: 'html' }]);
    });

    it('matches collected markdown tables by normalized text content', () => {
      const handler = createHandler();
      handler.tableEditor.info.tableText = 'NameValuefoo1';
      handler.tableEditor.tableCodes = [
        {
          type: 'markdown',
          offset: 0,
          code: '| Name | Value |\n| --- | --- |\n| foo | 1 |',
        },
      ];

      expect(handler.$findTableByContent()).toBe(0);
    });

    it('matches collected blockquote HTML tables by normalized text content', () => {
      const handler = createHandler();
      handler.tableEditor.info.tableText = 'NameValue';
      handler.tableEditor.tableCodes = [
        {
          type: 'blockquote-html',
          offset: 0,
          code: '> <table>\n> <tr><td>Name</td><td>Value</td></tr>\n> </table>',
        },
      ];

      expect(handler.$findTableByContent()).toBe(0);
    });

    it('returns -1 when no collected table matches the preview text', () => {
      const handler = createHandler();
      handler.tableEditor.info.tableText = 'other';
      handler.tableEditor.tableCodes = [
        {
          type: 'markdown',
          offset: 0,
          code: '| Name | Value |\n| --- | --- |\n| foo | 1 |',
        },
      ];

      expect(handler.$findTableByContent()).toBe(-1);
    });

    it('matches collected blockquote markdown tables by normalized preview text', () => {
      const handler = createHandler();
      handler.tableEditor.info.tableText = 'NameValuefoo1';
      handler.tableEditor.tableCodes = [
        {
          type: 'blockquote-markdown',
          offset: 0,
          code: '> | Name | Value |\n> | --- | --- |\n> | foo | 1 |',
        },
      ];

      expect(handler.$findTableByContent()).toBe(0);
    });
  });

  describe('preview DOM collection and selection', () => {
    it('collects the clicked normal preview table metadata', () => {
      const handler = createHandler();
      handler.previewerDom.innerHTML = [
        '<table class="cherry-table"><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>',
        '<div class="one-footnote"><table><tbody><tr><td>note</td></tr></tbody></table></div>',
      ].join('');
      handler.previewerDom.querySelector('tr')?.appendChild(document.createTextNode('ignored text'));
      const target = handler.previewerDom.querySelectorAll('td')[3] as HTMLTableCellElement;
      handler.target = target;

      handler.$collectTableDom();

      expect(handler.tableEditor.info.tdIndex).toBe(1);
      expect(handler.tableEditor.info.trIndex).toBe(1);
      expect(handler.tableEditor.info.tableIndex).toBe(0);
      expect(handler.tableEditor.info.totalTables).toBe(1);
      expect(handler.tableEditor.info.isHtmlTable).toBe(false);
      expect(handler.tableEditor.info.isInFootnote).toBe(false);
      expect(handler.tableEditor.info.tableText).toBe('ABignoredtextCD');
    });

    it('collects footnote table metadata independently from normal tables', () => {
      const handler = createHandler();
      handler.previewerDom.innerHTML = [
        '<table><tbody><tr><td>main</td></tr></tbody></table>',
        '<div class="one-footnote"><table><tbody><tr><td>note</td></tr></tbody></table></div>',
      ].join('');
      const target = handler.previewerDom.querySelector('.one-footnote td') as HTMLTableCellElement;
      handler.target = target;

      handler.$collectTableDom();

      expect(handler.tableEditor.info.tableIndex).toBe(0);
      expect(handler.tableEditor.info.totalTables).toBe(1);
      expect(handler.tableEditor.info.isHtmlTable).toBe(true);
      expect(handler.tableEditor.info.isInFootnote).toBe(true);
      expect(handler.tableEditor.info.tableText).toBe('note');
    });

    it('returns false when the clicked target has no table ancestor', () => {
      const handler = createHandler();
      document.body.innerHTML = '<div><span>not a table</span></div>';
      handler.target = document.querySelector('span') as HTMLSpanElement;

      expect(handler.$collectTableDom()).toBe(false);
    });

    it('selects the matching markdown cell in CodeMirror', () => {
      const tableCode = '| Name | Value |\n| --- | --- |\n| foo |  bar  |';
      const handler = createHandler(tableCode);
      seedMarkdownTable(handler, tableCode);

      handler.$setSelection(0, 'td');

      expect(handler.tableEditor.info.code).toBe('bar');
      expect(handler.tableEditor.info.selection).toEqual([
        { line: 2, ch: 9 },
        { line: 2, ch: 12 },
      ]);
      expect(handler.codeMirror.setSelection).toHaveBeenCalledWith(40, 43);
    });

    it('selects the whole table when requested', () => {
      const tableCode = '| Name | Value |\n| --- | --- |\n| foo | bar |';
      const handler = createHandler(tableCode);
      seedMarkdownTable(handler, tableCode);

      handler.$setSelection(0, 'table', false);

      expect(handler.tableEditor.info.selection).toEqual([
        { line: 0, ch: 0 },
        { line: 2, ch: 13 },
      ]);
      expect(handler.codeMirror.setSelection).not.toHaveBeenCalled();
    });

    it('skips selection when the preview table cannot be matched to source code', () => {
      const handler = createHandler('| A | B |');
      handler.tableEditor.info = { isInFootnote: false };

      handler.$setSelection(9, 'td');

      expect(handler.codeMirror.setSelection).not.toHaveBeenCalled();
    });

    it('selects HTML and blockquote table source variants', () => {
      const htmlTable = '<table>\n<tr><td>A</td><td>B</td></tr>\n</table>';
      const htmlHandler = createHandler(`intro\n${htmlTable}`);
      htmlHandler.tableEditor.info = { isInFootnote: false, trIndex: 0, tdIndex: 1 };
      htmlHandler.tableEditor.tableCodes = [{ code: htmlTable, offset: 6, type: 'html' }];

      htmlHandler.$setSelection(0, 'td', false);
      expect(htmlHandler.tableEditor.info.code).toBe('B');
      expect(htmlHandler.tableEditor.info.selection).toEqual([
        { line: 2, ch: 18 },
        { line: 2, ch: 19 },
      ]);

      const blockquoteHtml = '> <table>\n> <tr><td>A</td><td>B</td></tr>\n> </table>';
      const blockquoteHtmlHandler = createHandler(blockquoteHtml);
      blockquoteHtmlHandler.tableEditor.info = { isInFootnote: false, trIndex: 0, tdIndex: 1 };
      blockquoteHtmlHandler.tableEditor.tableCodes = [{ code: blockquoteHtml, offset: 0, type: 'blockquote-html' }];

      blockquoteHtmlHandler.$setSelection(0, 'td', false);
      expect(blockquoteHtmlHandler.tableEditor.info.code).toBe('B');

      const blockquoteMarkdown = '> | A | B |\n> | - | - |\n> | 1 | 2 |';
      const blockquoteMarkdownHandler = createHandler(blockquoteMarkdown);
      blockquoteMarkdownHandler.tableEditor.info = {
        isInFootnote: false,
        isTHead: false,
        trIndex: 0,
        tdIndex: 1,
      };
      blockquoteMarkdownHandler.tableEditor.tableCodes = [
        { code: blockquoteMarkdown, offset: 0, type: 'blockquote-markdown' },
      ];

      blockquoteMarkdownHandler.$setSelection(0, 'td', false);
      expect(blockquoteMarkdownHandler.tableEditor.info.code).toBe('2');
    });

    it('selects cells from collected footnote table source', () => {
      const prefix = 'before\n[^1]: ';
      const tableCode = '| A | B |\n| - | - |\n| 1 | 2 |';
      const handler = createHandler(`${prefix}${tableCode}`);
      handler.tableEditor.info = {
        isInFootnote: true,
        isTHead: false,
        tdIndex: 1,
        trIndex: 0,
      };
      handler.tableEditor.footnoteTableCodes = [{ code: tableCode, offset: prefix.length, type: 'markdown' }];

      handler.$setSelection(0, 'td');

      expect(handler.tableEditor.info.code).toBe('2');
      expect(handler.codeMirror.setSelection).toHaveBeenCalledWith(prefix.length + 26, prefix.length + 27);
    });

    it('finds preview tables through direct index and content fallback', () => {
      const tableCode = '| A | B |\n| - | - |\n| 1 | 2 |';
      const handler = createHandler(tableCode);
      handler.previewerDom.innerHTML =
        '<table class="cherry-table"><tbody><tr><td>A</td><td>B</td></tr></tbody></table>';
      handler.target = handler.previewerDom.querySelectorAll('td')[1] as HTMLTableCellElement;
      handler.trigger = 'click';

      expect(handler.$findTableInEditor()).toBe(true);
      expect(handler.tableEditor.info.code).toBe('2');

      const mismatchHandler = createHandler(tableCode);
      mismatchHandler.previewerDom.innerHTML =
        '<table class="cherry-table"><tbody><tr><td>A</td><td>B</td></tr></tbody></table>' +
        '<table class="cherry-table"><tbody><tr><td>other</td></tr></tbody></table>';
      mismatchHandler.target = mismatchHandler.previewerDom.querySelectorAll('td')[2] as HTMLTableCellElement;
      mismatchHandler.tableEditor.tableCodes = [{ code: tableCode, offset: 0, type: 'markdown' }];

      expect(mismatchHandler.$findTableInEditor()).toBe(false);
    });
  });

  describe('$getClosestNode', () => {
    it('walks up from a table cell to the containing table', () => {
      const handler = createHandler();
      document.body.innerHTML = '<table><tbody><tr><td><span>cell</span></td></tr></tbody></table>';
      const span = document.querySelector('span')!;
      const table = document.querySelector('table')!;

      expect(handler.$getClosestNode(span, 'TABLE')).toBe(table);
    });

    it('returns false when the target is not inside the requested element', () => {
      const handler = createHandler();
      document.body.innerHTML = '<div><span>cell</span></div>';
      const span = document.querySelector('span')!;

      expect(handler.$getClosestNode(span, 'TABLE')).toBe(false);
    });
  });

  describe('blockquote and HTML offset helpers', () => {
    it('finds a cell inside blockquote markdown tables', () => {
      const handler = createHandler();
      const tableCode = '> | Name | Value |\n> | --- | --- |\n> | foo |  bar  |';

      expect(handler.$getBlockquoteTdOffset(tableCode, false, 0, 1)).toEqual({
        preLine: 1,
        preCh: 11,
        plusCh: 3,
        currentTd: 'bar',
      });
    });

    it('uses the current blockquote row when no following row exists', () => {
      const handler = createHandler();

      expect(handler.$getBlockquoteTdOffset('> | A | B |', true, 0, 1)).toEqual({
        preLine: -1,
        preCh: 8,
        plusCh: 1,
        currentTd: 'B',
      });
    });

    it('handles blockquote markdown rows without leading pipes or quote prefixes', () => {
      const handler = createHandler();

      expect(handler.$getBlockquoteTdOffset('Name | Value\n--- | ---\nfoo | bar', false, 0, 1)).toEqual({
        preLine: 1,
        preCh: 6,
        plusCh: 3,
        currentTd: 'bar',
      });

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(handler.$getBlockquoteTdOffset('> A | B\n> - | -\n> 1 | 2', false, 0, 9)).toEqual({
        preLine: 2,
        preCh: 0,
        plusCh: 0,
        currentTd: '',
      });
      errorSpy.mockRestore();
    });

    it('falls back when blockquote markdown indexes are outside the table', () => {
      const handler = createHandler();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(handler.$getBlockquoteTdOffset('> | A |', false, 5, 0)).toEqual({
        preLine: 0,
        preCh: 0,
        plusCh: 0,
        currentTd: '',
      });

      errorSpy.mockRestore();
    });

    it('finds a cell inside blockquote HTML tables', () => {
      const handler = createHandler();
      const tableCode = [
        '> <table>',
        '> <tr><th>Name</th><th>Value</th></tr>',
        '> <tr><td>foo</td><td>bar</td></tr>',
        '> </table>',
      ].join('\n');

      expect(handler.$getBlockquoteHtmlTdOffset(tableCode, 1, 1)).toEqual({
        preLine: 2,
        preCh: 22,
        plusCh: 3,
        currentTd: 'bar',
      });
      expect(handler.$getBlockquoteHtmlTdOffset(tableCode, 9, 0)).toEqual({
        preLine: 0,
        preCh: 0,
        plusCh: tableCode.length,
        currentTd: '',
      });
    });
  });

  describe('editor overlay and input replacement', () => {
    it('positions the textarea overlay and hides it outside the preview bounds', () => {
      const handler = createHandler();
      mountPreviewer(handler);
      const inputDiv = document.createElement('div');
      const tdNode = document.createElement('td');
      setRect(tdNode, { top: 500, left: 60, width: 120, height: 28 });
      handler.tableEditor.editorDom.inputDiv = inputDiv;
      handler.tableEditor.info = { tdNode };

      handler.$setInputOffset();

      expect(inputDiv.style.width).toBe('120px');
      expect(inputDiv.style.left).toBe('40px');
      expect(inputDiv.style.display).toBe('none');
    });

    it('draws a textarea overlay using the selected table cell value', () => {
      const handler = createHandler('| A | B |');
      mountPreviewer(handler);
      const tdNode = document.createElement('td');
      tdNode.style.textAlign = 'right';
      setRect(tdNode, { top: 40, left: 60, width: 120, height: 28 });
      handler.tableEditor.info = { code: 'line<br>two', tdNode };

      handler.$drawEditor();

      expect(handler.tableEditor.editorDom.inputDiv).toBeInstanceOf(HTMLDivElement);
      expect(handler.tableEditor.editorDom.inputDom?.value).toBe('line\ntwo');
      expect(handler.container.contains(handler.tableEditor.editorDom.inputDiv ?? null)).toBe(true);
    });

    it('applies textarea padding for left and center aligned cells', () => {
      const handler = createHandler();
      mountPreviewer(handler);
      const inputDiv = document.createElement('div');
      const inputDom = document.createElement('textarea');
      const tdNode = document.createElement('td');
      setRect(tdNode, { top: 20, left: 40, width: 100, height: 20 });
      handler.tableEditor.editorDom = { inputDiv, inputDom };
      handler.tableEditor.info = { tdNode };

      tdNode.style.textAlign = 'left';
      handler.$updateEditorPosition();
      expect(inputDom.style.paddingRight).toBe('0px');

      tdNode.style.textAlign = 'center';
      handler.$updateEditorPosition();
      expect(inputDom.style.paddingLeft).toBe('0px');
      expect(inputDom.style.paddingRight).toBe('0px');
    });

    it('replaces the selected cell text when the textarea changes', () => {
      const tableCode = '| Name | Value |\n| --- | --- |\n| foo | old |';
      const handler = createHandler(tableCode);
      seedMarkdownTable(handler, tableCode);
      handler.tableEditor.info.selection = [
        { line: 2, ch: 8 },
        { line: 2, ch: 11 },
      ];
      const textarea = document.createElement('textarea');
      textarea.value = 'new\nvalue';

      const ignoredTarget = document.createElement('div');
      const ignoredEvent = new InputEvent('input', { bubbles: true, inputType: 'insertText' });
      Object.defineProperty(ignoredEvent, 'target', { value: ignoredTarget });
      handler.$onInputChange(ignoredEvent);
      expect(handler.codeMirror.replaceRange).not.toHaveBeenCalled();

      const event = new InputEvent('input', { bubbles: true, inputType: 'insertText' });
      Object.defineProperty(event, 'target', { value: textarea });
      handler.$onInputChange(event);

      expect(handler.codeMirror.replaceRange).toHaveBeenCalledWith('new<br>value', 39, 42);
      expect(handler.tableEditor.info.code).toBe('new<br>value');
      expect(handler.tableEditor.info.selection?.[1].ch).toBe(20);
    });
  });

  describe('table editing operations', () => {
    it('does not insert rows for HTML tables or invalid row positions', () => {
      const tableCode = '| A | B |\n| - | - |\n| 1 | 2 |';
      const handler = createHandler(tableCode);
      seedMarkdownTable(handler, tableCode);
      handler.tableEditor.info.isHtmlTable = true;
      handler.$insertRow('top');
      expect(handler.codeMirror.replaceRange).not.toHaveBeenCalled();

      const invalidHandler = createHandler(tableCode);
      seedMarkdownTable(invalidHandler, tableCode);
      invalidHandler.$insertRow(5);
      expect(invalidHandler.codeMirror.replaceRange).not.toHaveBeenCalled();
    });

    it('inserts columns using existing alignment rows for pipe and no-pipe tables', () => {
      const pipeTable = '| A | B |\n|:---|---:|\n| 1 | 2 |';
      const handler = createHandler(pipeTable);
      seedMarkdownTable(handler, pipeTable);
      handler.tableEditor.info.tdIndex = 0;

      handler.$insertCol();

      expect(handler.codeMirror.doc.toString()).toBe('| A |  | B |\n|:---|:---|---:|\n| 1 |  | 2 |');

      const noPipeTable = 'A | B\n--- | ---\n1 | 2';
      const noPipeHandler = createHandler(noPipeTable);
      seedMarkdownTable(noPipeHandler, noPipeTable);
      noPipeHandler.tableEditor.info.tdIndex = 0;

      noPipeHandler.$insertCol();

      expect(noPipeHandler.codeMirror.doc.toString()).toBe('A |  | B\n--- |--- | ---\n1 |  | 2');
    });

    it('aligns, deletes rows, and deletes columns in markdown table source', () => {
      const tableCode = '| A | B | C |\n|---|---|---|\n| 1 | 2 | 3 |\n| 4 | 5 | 6 |';
      const handler = createHandler(tableCode);
      seedMarkdownTable(handler, tableCode);
      handler.tableEditor.info.tdIndex = 1;

      handler.$alignColumn('right');
      expect(handler.codeMirror.doc.toString()).toContain('|---|---:|---|');

      const rowHandler = createHandler(tableCode);
      seedMarkdownTable(rowHandler, tableCode);
      rowHandler.tableEditor.info.trIndex = 0;
      rowHandler.$deleteCurrentRow();
      expect(rowHandler.codeMirror.doc.toString()).not.toContain('| 1 | 2 | 3 |');

      const columnHandler = createHandler(tableCode);
      seedMarkdownTable(columnHandler, tableCode);
      columnHandler.tableEditor.info.tdIndex = 1;
      columnHandler.$deleteCurrentColumn();
      expect(columnHandler.codeMirror.doc.toString()).toBe('| A | C |\n|---|---|\n| 1 | 3 |\n| 4 | 6 |');
    });

    it('deletes columns in blockquote markdown table source', () => {
      const tableCode = '> | A | B | C |\n> |---|---|---|\n> | 1 | 2 | 3 |';
      const handler = createHandler(tableCode);
      seedMarkdownTable(handler, tableCode);
      handler.tableEditor.info.tdIndex = 0;
      handler.tableEditor.tableCodes[0].type = 'blockquote-markdown';

      handler.$deleteCurrentColumn();

      expect(handler.codeMirror.doc.toString()).toBe('> | B | C |\n> |---|---|\n> | 2 | 3 |');
    });

    it('aligns blockquote tables and ignores invalid alignment targets', () => {
      const blockquoteHandler = createHandler();
      const blockquoteLines = ['> | A | B |', '> |---|---|', '> | 1 | 2 |'];

      blockquoteHandler.$alignColumnInMarkdownTable(blockquoteLines, 0, 'center');
      expect(blockquoteHandler.codeMirror.replaceSelection).toHaveBeenCalledWith(
        '> | A | B |\n> |:---:|---|\n> | 1 | 2 |',
      );

      const invalidHandler = createHandler();
      invalidHandler.$alignColumnInMarkdownTable(['| A | B |'], 0, 'left');
      invalidHandler.$alignColumnInMarkdownTable(['| A | B |', '|---|---|'], 9, 'left');
      expect(invalidHandler.codeMirror.replaceSelection).not.toHaveBeenCalled();

      const defaultHandler = createHandler();
      defaultHandler.$alignColumnInMarkdownTable(['| A | B |', '|---|---|', '| 1 | 2 |'], 1, 'unknown');
      expect(defaultHandler.codeMirror.replaceSelection).toHaveBeenCalledWith('| A | B |\n|---|---|\n| 1 | 2 |');
    });
  });

  describe('menu and highlighting behavior', () => {
    it('dispatches public emit events based on trigger mode', () => {
      const handler = createHandler();
      const callback = vi.fn();
      const event = new MouseEvent('mouseup', { bubbles: true });
      Object.defineProperty(event, 'target', { value: document.createElement('div') });
      const inputSpy = vi.spyOn(handler, '$onInputChange').mockImplementation(() => {});
      const removeSpy = vi.spyOn(handler, '$remove').mockImplementation(() => {});
      const refreshSpy = vi.spyOn(handler, '$refreshPosition').mockImplementation(() => {});
      const tryRemoveSpy = vi.spyOn(handler, '$tryRemoveMe').mockImplementation((_event, done) => done());

      expect(handler.emit('mousedown', event)).toBeUndefined();
      handler.emit('remove', event);
      handler.emit('scroll', event);
      handler.emit('previewUpdate', event);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(refreshSpy).toHaveBeenCalledTimes(2);

      handler.trigger = 'hover';
      expect(handler.emit('keyup', event)).toBe(false);
      expect(handler.emit('mouseup', event, callback)).toBe(false);
      expect(inputSpy).not.toHaveBeenCalled();
      expect(tryRemoveSpy).not.toHaveBeenCalled();

      handler.trigger = 'click';
      handler.emit('keyup', event);
      handler.emit('mouseup', event, callback);
      expect(inputSpy).toHaveBeenCalledWith(event);
      expect(tryRemoveSpy).toHaveBeenCalledWith(event, callback);
      expect(callback).toHaveBeenCalled();
    });

    it('removes the click editor on non-textarea mouseup only', () => {
      const handler = createHandler();
      const removeSpy = vi.spyOn(handler, '$remove').mockImplementation(() => {});
      const callback = vi.fn();
      const textareaEvent = new MouseEvent('mouseup', { bubbles: true });
      Object.defineProperty(textareaEvent, 'target', { value: document.createElement('textarea') });
      const divEvent = new MouseEvent('mouseup', { bubbles: true });
      Object.defineProperty(divEvent, 'target', { value: document.createElement('div') });

      handler.$tryRemoveMe(textareaEvent, callback);
      expect(removeSpy).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();

      handler.$tryRemoveMe(divEvent, callback);
      expect(removeSpy).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('chooses editor or hover UI from showBubble and refreshes positions by trigger mode', () => {
      const handler = createHandler();
      const drawEditorSpy = vi.spyOn(handler, '$drawEditor').mockImplementation(() => {});
      const drawSymbolSpy = vi.spyOn(handler, '$drawSymbol').mockImplementation(() => {});
      const drawMenuSpy = vi.spyOn(handler, '$drawMenu').mockImplementation(() => {});
      const setInputSpy = vi.spyOn(handler, '$setInputOffset').mockImplementation(() => {});
      const boundarySpy = vi.spyOn(handler, '$updateBoundaryTriggerPosition').mockImplementation(() => {});
      const menuPositionSpy = vi.spyOn(handler, '$setMenuButtonPosition').mockImplementation(() => {});

      handler.trigger = 'click';
      handler.showBubble();
      handler.$refreshPosition();
      expect(drawEditorSpy).toHaveBeenCalled();
      expect(setInputSpy).toHaveBeenCalled();

      handler.trigger = 'hover';
      handler.tableEditor.editorDom.menuContainer = document.createElement('div');
      handler.showBubble();
      handler.$refreshPosition();
      expect(drawSymbolSpy).toHaveBeenCalled();
      expect(drawMenuSpy).toHaveBeenCalled();
      expect(boundarySpy).toHaveBeenCalled();
      expect(menuPositionSpy).toHaveBeenCalled();
    });

    it('draws boundary symbols, positions them from table geometry, and inserts columns or rows on click', () => {
      const handler = createHandler('| A | B | C |\n| - | - | - |\n| 1 | 2 | 3 |\n| 4 | 5 | 6 |');
      const previewerWrapper = mountPreviewer(handler);
      const fixture = createBoundaryTable();
      const { table } = fixture;
      const firstBodyCell = fixture.cells[3];
      handler.tableEditor.info = {
        columns: 3,
        tableIndex: 0,
        tableNode: table,
        tdIndex: 0,
        tdNode: firstBodyCell,
        trIndex: 0,
        trNode: fixture.bodyRowOne,
      };
      const rAFSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        callback(0);
        return 1;
      });
      const insertColSpy = vi.spyOn(handler, '$insertCol').mockImplementation(() => {});
      const insertRowSpy = vi.spyOn(handler, '$insertRow').mockImplementation(() => {});
      const afterSpy = vi.spyOn(handler, '$afterTableOperation').mockImplementation(() => {});

      handler.$drawSymbol();

      expect(
        handler.container.querySelector('.cherry-previewer-table-hover-handler-container--boundary-trigger'),
      ).toBeInstanceOf(HTMLDivElement);
      expect(handler.tableEditor.editorDom.symbolContainer?.parentNode).toBe(handler.container);
      expect(handler.container.style.width).toBe('240px');
      expect(handler.container.style.height).toBe('140px');
      expect(handler.container.style.top).toBe('10px');
      expect(handler.container.style.left).toBe('10px');

      table.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 31, clientY: 49 }));

      const boundarySymbol = handler.tableEditor.editorDom.boundaryTriggerSymbol;
      const colSymbol = boundarySymbol.col.el;
      const rowLeftSymbol = boundarySymbol.rows[0].el;
      const rowRightSymbol = boundarySymbol.rows[1].el;

      expect(colSymbol.style.display).toBe('');
      expect(colSymbol.style.left).toBe('-6px');
      expect(colSymbol.style.top).toBe('-20px');
      expect(boundarySymbol.col.index).toBe(0);
      expect(rowLeftSymbol.style.display).toBe('');
      expect(rowRightSymbol.style.display).toBe('');
      expect(rowLeftSymbol.style.left).toBe('-20px');
      expect(rowRightSymbol.style.left).toBe('244px');
      expect(boundarySymbol.rows[0].index).toBe(0);
      expect(boundarySymbol.rows[1].index).toBe(0);

      colSymbol.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(insertColSpy).toHaveBeenCalled();
      expect(afterSpy).toHaveBeenCalled();

      boundarySymbol.col.index = 3;
      colSymbol.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(insertColSpy).toHaveBeenCalledTimes(2);

      boundarySymbol.rows[0].index = 0;
      rowLeftSymbol.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(insertRowSpy).toHaveBeenCalledWith('top');
      expect(afterSpy).toHaveBeenCalledTimes(3);

      boundarySymbol.rows[1].index = 2;
      rowRightSymbol.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(insertRowSpy).toHaveBeenCalledWith('bottom');

      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1000, clientY: 1000 }));
      expect(colSymbol.style.display).toBe('none');
      expect(rowLeftSymbol.style.display).toBe('none');
      expect(rowRightSymbol.style.display).toBe('none');

      rAFSpy.mockRestore();
      previewerWrapper.remove();
      fixture.wrapper.remove();
    });

    it('cleans up symbol containers, boundary listeners, and editor state on remove', () => {
      const handler = createHandler();
      const table = document.createElement('table');
      const symbolContainer = document.createElement('div');
      const moveHandler = vi.fn();
      const globalHandler = vi.fn();
      handler.boundaryTableRef = table;
      handler.boundaryMouseMoveHandlerRef = moveHandler;
      handler.boundaryGlobalMoveRef = globalHandler;
      handler.tableEditor.editorDom.symbolContainer = symbolContainer;
      handler.container.appendChild(symbolContainer);
      const tableRemoveSpy = vi.spyOn(table, 'removeEventListener');
      const documentRemoveSpy = vi.spyOn(document, 'removeEventListener');

      handler.$remove();

      expect(tableRemoveSpy).toHaveBeenCalledWith('mousemove', moveHandler);
      expect(documentRemoveSpy).toHaveBeenCalledWith('mousemove', globalHandler, true);
      expect(handler.container.contains(symbolContainer)).toBe(false);
      expect(handler.tableEditor.tableCodes).toEqual([]);
      expect(handler.boundaryCache).toBeNull();
    });

    it('still clears editor state when cleanup listeners throw during remove', () => {
      const handler = createHandler();
      const table = document.createElement('table');
      const symbolContainer = document.createElement('div');
      handler.boundaryTableRef = table;
      handler.boundaryMouseMoveHandlerRef = vi.fn();
      handler.boundaryGlobalMoveRef = vi.fn();
      handler.tableEditor.editorDom.symbolContainer = symbolContainer;
      handler.container.appendChild(symbolContainer);
      vi.spyOn(table, 'removeEventListener').mockImplementation(() => {
        throw new Error('table listener failed');
      });
      vi.spyOn(document, 'removeEventListener').mockImplementation(() => {
        throw new Error('document listener failed');
      });
      vi.spyOn(handler.container, 'removeChild').mockImplementation(() => {
        throw new Error('symbol removal failed');
      });

      expect(() => handler.$remove()).not.toThrow();
      expect(handler.boundaryTableRef).toBeNull();
      expect(handler.boundaryMouseMoveHandlerRef).toBeNull();
      expect(handler.boundaryGlobalMoveRef).toBeNull();
      expect(handler.tableEditor.tableCodes).toEqual([]);
    });

    it('draws menu buttons and wires drag/highlight interactions', () => {
      const handler = createHandler('| A | B |\n| - | - |\n| 1 | 2 |');
      mountPreviewer(handler);
      const tableHost = document.createElement('div');
      tableHost.innerHTML = '<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>';
      document.body.appendChild(tableHost);
      const table = tableHost.querySelector('table') as HTMLTableElement;
      const td = table.rows[0].cells[0];
      setRect(table, { top: 30, left: 40, width: 200, height: 80 });
      setRect(td, { top: 40, left: 50, width: 90, height: 20 });
      handler.tableEditor.info = {
        isTHead: false,
        tableIndex: 0,
        tableNode: table,
        tdIndex: 0,
        tdNode: td,
        trNode: table.rows[0],
      };
      const setSelectionSpy = vi.spyOn(handler, '$setSelection').mockImplementation(() => {});
      const dragColSpy = vi.spyOn(handler, '$dragCol').mockImplementation(() => {});
      const dragLineSpy = vi.spyOn(handler, '$dragLine').mockImplementation(() => {});
      const highlightColumnSpy = vi.spyOn(handler, '$highlightCurrentColumn').mockImplementation(() => {});
      const highlightRowSpy = vi.spyOn(handler, '$applyRowHighlight').mockImplementation(() => {});

      handler.$drawMenu();
      const buttons = handler.container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);

      buttons[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      buttons[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      buttons[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      buttons[1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(highlightColumnSpy).toHaveBeenCalled();
      expect(highlightRowSpy).toHaveBeenCalledWith(true);
      expect(setSelectionSpy).toHaveBeenCalledTimes(2);
      expect(dragColSpy).toHaveBeenCalled();
      expect(dragLineSpy).toHaveBeenCalled();
    });

    it('builds row and column menu configs with the expected actions', () => {
      const handler = createHandler();

      expect(handler.$getMenuConfig('left').map(({ action }) => action)).toEqual(['deleteRow']);
      expect(handler.$getMenuConfig('top').map(({ action }) => action)).toEqual([
        'deleteColumn',
        'alignLeft',
        'alignCenter',
        'alignRight',
      ]);
    });

    it('creates menu options that execute actions and hide the containing bubble', () => {
      const handler = createHandler();
      const executeSpy = vi.spyOn(handler, '$executeMenuAction').mockImplementation(() => {});
      const bubble = document.createElement('div');
      bubble.className = 'cherry-previewer-table-menu-bubble';

      const option = handler.$createMenuOption(
        { action: 'deleteColumn', icon: 'ch-icon-delete', title: 'Delete', highlight: 'column' },
        'top',
      );
      bubble.appendChild(option);
      option.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(executeSpy).toHaveBeenCalledWith('deleteColumn', 'top');
      expect(bubble.classList.contains('cherry-previewer-table-menu-bubble--hidden')).toBe(true);
    });

    it('dispatches menu actions and warns on unknown actions or highlight types', () => {
      const handler = createHandler();
      const deleteRowSpy = vi.spyOn(handler, '$deleteCurrentRow').mockImplementation(() => {});
      const deleteColumnSpy = vi.spyOn(handler, '$deleteCurrentColumn').mockImplementation(() => {});
      const alignSpy = vi.spyOn(handler, '$alignColumn').mockImplementation(() => {});
      const highlightRowSpy = vi.spyOn(handler, '$highlightRow').mockImplementation(() => {});
      const highlightColumnSpy = vi.spyOn(handler, '$highlightColumn').mockImplementation(() => {});
      const cancelRowSpy = vi.spyOn(handler, '$cancelHighlightRow').mockImplementation(() => {});
      const cancelColumnSpy = vi.spyOn(handler, '$cancelHighlightColumn').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      handler.$executeMenuAction('deleteRow', 'left');
      handler.$executeMenuAction('deleteColumn', 'top');
      handler.$executeMenuAction('alignLeft', 'top');
      handler.$executeMenuAction('alignCenter', 'top');
      handler.$executeMenuAction('alignRight', 'top');
      handler.$executeMenuAction('missing', 'top');
      handler.$highlightElement('row');
      handler.$highlightElement('column');
      handler.$highlightElement('missing');
      handler.$cancelHighlightElement('row');
      handler.$cancelHighlightElement('column');
      handler.$cancelHighlightElement('missing');

      expect(deleteRowSpy).toHaveBeenCalled();
      expect(deleteColumnSpy).toHaveBeenCalled();
      expect(alignSpy).toHaveBeenCalledWith('left');
      expect(alignSpy).toHaveBeenCalledWith('center');
      expect(alignSpy).toHaveBeenCalledWith('right');
      expect(highlightRowSpy).toHaveBeenCalled();
      expect(highlightColumnSpy).toHaveBeenCalled();
      expect(cancelRowSpy).toHaveBeenCalled();
      expect(cancelColumnSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith('Unknown menu action: missing');
      expect(warnSpy).toHaveBeenCalledWith('Unknown highlight type: missing');

      warnSpy.mockRestore();
    });

    it('toggles and positions menu bubbles', () => {
      const handler = createHandler();
      const button = document.createElement('button');
      button.dataset.type = 'top';
      const bubble = document.createElement('div');
      bubble.className = 'cherry-previewer-table-menu-bubble cherry-previewer-table-menu-bubble--hidden';
      handler.container.appendChild(bubble);

      handler.$toggleMenuBubble(button, bubble);
      expect(bubble.classList.contains('cherry-previewer-table-menu-bubble--hidden')).toBe(false);
      expect(bubble.style.left).toBe('50%');

      handler.$toggleMenuBubble(button, bubble);
      expect(bubble.classList.contains('cherry-previewer-table-menu-bubble--hidden')).toBe(true);

      const leftButton = document.createElement('button');
      leftButton.dataset.type = 'left';
      const otherBubble = document.createElement('div');
      const leftBubble = document.createElement('div');
      otherBubble.className = 'cherry-previewer-table-menu-bubble';
      leftBubble.className = 'cherry-previewer-table-menu-bubble cherry-previewer-table-menu-bubble--hidden';
      handler.container.append(otherBubble, leftBubble);

      handler.$showMenuBubble(leftButton, leftBubble);
      expect(otherBubble.classList.contains('cherry-previewer-table-menu-bubble--hidden')).toBe(true);
      expect(leftBubble.style.transform).toBe('translateY(-50%) rotate(-90deg)');
    });

    it('highlights rows, columns, and drag feedback classes', () => {
      const handler = createHandler();
      document.body.innerHTML =
        '<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>';
      const table = document.querySelector('table') as HTMLTableElement;
      const td = table.rows[0].cells[1];
      handler.tableEditor.info = {
        tableNode: table,
        tdIndex: 1,
        tdNode: td,
        trNode: table.rows[0],
      };
      handler.target = td;

      handler.$highlightCurrentColumn();
      expect(table.rows[0].cells[1].classList.contains('table-highlight-col')).toBe(true);
      expect(table.rows[1].cells[1].classList.contains('table-highlight-col')).toBe(true);

      handler.$applyRowHighlight(true);
      expect(table.rows[0].cells[0].classList.contains('table-highlight-row')).toBe(true);
      handler.$applyRowHighlight(false);
      expect(table.rows[0].cells[0].classList.contains('table-highlight-row')).toBe(false);

      handler.$showColumnDragFeedback(td, 0, 1);
      expect(table.rows[0].cells[1].classList.contains('table-highlight-border-reorder-right')).toBe(true);
      handler.$showColumnDragFeedback(td, 2, 1);
      expect(table.rows[0].cells[1].classList.contains('table-highlight-border-reorder-left')).toBe(true);

      handler.$highlightColumnCellsDom(1, 'top');
      expect(table.rows[0].cells[1].classList.contains('table-highlight-border-reorder-top')).toBe(true);
      handler.$highlightColumnCellsDom(1, 'bottom');
      expect(table.rows[0].cells[1].classList.contains('table-highlight-border-reorder-bottom')).toBe(true);

      handler.$showRowDragFeedback(td, 2, 1);
      expect(table.rows[0].classList.contains('table-highlight-border-reorder-top')).toBe(true);

      handler.$clearAllBorders();
      expect(table.querySelector('.table-highlight-col')).toBeNull();
      expect(table.querySelector('.table-highlight-row')).toBeNull();
    });

    it('moves array lines in both drag directions', () => {
      const handler = createHandler();

      expect(handler.$operateLines(0, 2, ['a', 'b', 'c'])).toEqual(['b', 'c', 'a']);
      expect(handler.$operateLines(2, 0, ['a', 'b', 'c'])).toEqual(['c', 'a', 'b']);
      expect(handler.$operateLines(1, 1, ['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });
  });
});
