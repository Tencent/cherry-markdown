import { expect, it, vi } from 'vitest';
import { editorViewCtx } from '@milkdown/kit/core';
import CherryEngine from '../src/cherry-engine';
import { parseTableChart } from '../src/wysiwyg/table-chart';
import { createTestEditor } from './helpers/create-editor';
import { TextSelection } from '@milkdown/kit/prose/state';

it('coalesces full Cherry parsing while editing one of several large tables', async () => {
  const tables = Array.from({ length: 5 }, (_, chart) => {
    const rows = Array.from({ length: 100 }, (_, row) => `| Row ${row} | ${chart + row} |`).join('\n');
    return `| :line:{"title":"Performance ${chart}"} | Value |\n| --- | --- |\n${rows}`;
  });
  const prototype = Object.getPrototypeOf(new CherryEngine({}));
  const makeHtml = vi.spyOn(prototype, 'makeHtml');
  const root = document.body.appendChild(document.createElement('div'));
  const renderer = vi.fn(({ source }: { source: string }) => {
    const parsed = parseTableChart(source)!;
    return `<span data-performance-chart>${parsed.table.rows[0]![1]}</span>`;
  });
  const instance = await createTestEditor({
    el: root,
    value: tables.join('\n\n'),
    debounce: 30,
    renderers: { tableChart: renderer },
  });
  try {
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(5));
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let position = -1;
    view.state.doc.descendants((node, pos) => {
      if (position < 0 && node.isText && node.text === 'Row 0') position = pos;
    });
    const tableDOM = root.querySelector('.milkdown-table-block');
    const fullParses = () => makeHtml.mock.calls.filter(([source]) => String(source).includes('Row 99')).length;
    const initialParses = fullParses();
    const initialCalls = makeHtml.mock.calls.length;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, position + 5)));
    for (let i = 0; i < 50; i++) view.dispatch(view.state.tr.insertText('x'));
    expect(instance.getMarkdown()).toContain(`Row 0${'x'.repeat(50)}`);
    expect(fullParses()).toBe(initialParses);
    // Neither body edits nor selection transactions invoke the Cherry parser
    // synchronously; unchanged table nodes also reuse their source revisions.
    expect(makeHtml.mock.calls.length).toBe(initialCalls);
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(6));
    expect(fullParses()).toBe(initialParses + 1);
    expect(root.querySelector('.milkdown-table-block')).toBe(tableDOM);
  } finally {
    await instance.destroy();
    root.remove();
    makeHtml.mockRestore();
  }
});
