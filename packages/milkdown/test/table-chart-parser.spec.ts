import { describe, expect, it, vi } from 'vitest';
import CherryEngine from '../src/cherry-engine';
import { createTableChartParser, tableChartCellType } from '../src/wysiwyg/table-chart';
import { TableChartDescriptorEngine, readTableChartDescriptor } from '../src/wysiwyg/table-chart-render-engine';

const table = (cell: string, body = '| Sales | 1 |') => `| ${cell} | Jan |\n| --- | --- |\n${body}`;

function native(source: string) {
  const engine = new CherryEngine({
    engine: { syntax: { table: { enableChart: true, chartRenderEngine: TableChartDescriptorEngine } } },
  });
  const template = document.createElement('template');
  template.innerHTML = engine.makeHtml(source);
  const marker = template.content.querySelector<HTMLElement>('[data-cherry-milkdown-table-chart]');
  return marker ? readTableChartDescriptor(marker) : undefined;
}

describe('Cherry-owned table chart grammar', () => {
  it.each([
    ':line:',
    ':line:{}',
    ':line:{"title":"Trend","nested":{"visible":true}}',
    ':line:{title: My Chart, width: 500, show: true}',
    ':map:{"mapDataSource":"https://maps.example/china.json?a=1&b=2"}',
    ':line:{"title":"Bad",}',
    ':line:{"__proto__":{"polluted":true},"constructor":1,"title":"Safe"}',
    ':line:{title: "Old", show: false}',
    ':line:{',
    ':line',
    'ordinary',
  ])('matches the native Cherry result: %s', (cell) => {
    const source = table(cell);
    const parse = createTableChartParser();
    expect(parse(source)).toEqual(native(source));
    expect(tableChartCellType(cell)).toBe(native(source)?.type ?? '');
  });

  it('retains URL values and Cherry legacy unquoted text', () => {
    const parse = createTableChartParser();
    expect(parse(table(':line:{title: My Chart, show: true}'))?.options).toEqual({ title: 'My Chart', show: true });
    expect(
      parse(table(':map:{"mapDataSource":"https://maps.example/china.json?a=1&b=2"}'))?.options.mapDataSource,
    ).toBe('https://maps.example/china.json?a=1&b=2');
  });

  it.each([
    '| :line: | A | B |\n|-|-|-|\n| Row | 1 |',
    '| :line: | A |\n| --- | --- |\n| Row | 1 | 2 |',
    '| :line: | A |\n| --- | --- |\n| Sales \\| retail | 1 |',
    '| :line: | A | `B | C` |\n| --- | --- | --- |\n| Row | 1 | 2 |',
    '| :line: | A |\r\n| --- | --- |\r\n| Row | 1 |',
    'Ordinary paragraph',
  ])('inherits native splitting, padding and delimiters: %s', (source) => {
    expect(createTableChartParser()(source)).toEqual(native(source));
  });

  it('uses a bounded cache and keeps renderer mutations isolated', () => {
    const prototype = Object.getPrototypeOf(new CherryEngine({}));
    const render = vi.spyOn(prototype, 'makeHtml');
    try {
      const parse = createTableChartParser();
      const source = table(':line:');
      const first = parse(source)!;
      first.table.rows[0]![0] = 'mutated';
      expect(parse(source)!.table.rows[0]![0]).toBe('Sales');
      expect(render).toHaveBeenCalledTimes(1);
      for (let i = 0; i < 33; i++) parse(table(`:line:{"title":"${i}"}`));
      parse(source);
      expect(render).toHaveBeenCalledTimes(35);
    } finally {
      render.mockRestore();
    }
  });
});

it('inherits Cherry option filtering without evaluating option text', () => {
  const parse = createTableChartParser();
  const source = table(':line:{"__proto__":{"polluted":true},"constructor":1,"prototype":2,"title":"Safe"}');
  expect(parse(source)?.options).toEqual({ title: 'Safe' });
  const before = Object.prototype.hasOwnProperty.call(globalThis, '__chartExecuted');
  expect(parse(table(':line:{title: (globalThis.__chartExecuted = true)}'))?.options.title).toBe(
    '(globalThis.__chartExecuted = true)',
  );
  expect(Object.prototype.hasOwnProperty.call(globalThis, '__chartExecuted')).toBe(before);
});

it('uses Cherry fallback for JSON5-only quoted options instead of a second parser', () => {
  expect(createTableChartParser()(table(':line:{"title":"Trailing",}'))?.options).toEqual({});
});

it('cannot mistake authored HTML for an actual chart-render callback', () => {
  const forged = encodeURIComponent(
    JSON.stringify({ type: 'line', options: {}, table: { header: [], rows: [], rowLength: 0, colLength: 0 } }),
  );
  expect(createTableChartParser()(`<div data-cherry-milkdown-table-chart="${forged}"></div>`)).toBeUndefined();
});

it('does not silently select one chart from a multi-table document', () => {
  expect(createTableChartParser()(`${table(':line:')}\n\n${table(':bar:')}`)).toBeUndefined();
});

it('caches negative results but does not retain oversized sources', () => {
  const prototype = Object.getPrototypeOf(new CherryEngine({}));
  const render = vi.spyOn(prototype, 'makeHtml');
  try {
    const parse = createTableChartParser();
    expect(parse('ordinary')).toBeUndefined();
    expect(parse('ordinary')).toBeUndefined();
    expect(render).toHaveBeenCalledTimes(1);
    const large = 'ordinary '.repeat(4000);
    parse(large);
    parse(large);
    expect(render).toHaveBeenCalledTimes(3);
  } finally {
    render.mockRestore();
  }
});
