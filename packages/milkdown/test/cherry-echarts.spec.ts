import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountCherryTableChart } from '../src/cherry-echarts';
import { cherryChartLocale } from '../src/cherry-chart-locale';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const table = { header: ['', 'Jan'], rows: [['Sales', '1']], colLength: 2, rowLength: 1 };
function fixture() {
  const container = document.body.appendChild(document.createElement('div'));
  const option = { series: [{ type: 'line', data: [1] }] };
  const legacy = {
    $buildEchartsThemeFromCss: vi.fn(),
    $generateChartOptions: vi.fn(() => option),
    createChart: vi.fn(() => ({ resize: vi.fn() })),
    onDestroy: vi.fn(),
  };
  return { container, legacy, option, engine: legacy as unknown as Parameters<typeof mountCherryTableChart>[0] };
}
afterEach(() => document.body.replaceChildren());

describe('Cherry table-chart version boundary', () => {
  it('derives chart messages from Cherry instead of a second translation table', () => {
    expect(() =>
      execFileSync(process.execPath, [resolve(import.meta.dirname, '../scripts/sync-chart-locale.mjs'), '--check']),
    ).not.toThrow();
    expect(Object.keys(cherryChartLocale).length).toBeGreaterThan(0);
  });
  it('prefers Cherry renderInto when available', () => {
    const { container, engine } = fixture();
    const cleanup = vi.fn();
    engine.renderInto = vi.fn(() => cleanup);
    const { signal } = new AbortController();
    expect(mountCherryTableChart(engine, container, 'line', {}, table, signal)).toBe(cleanup);
    expect(engine.renderInto).toHaveBeenCalledWith(container, 'line', {}, table, signal);
    expect(container.childElementCount).toBe(0);
  });

  it('reuses the published minimum Cherry handlers without Previewer DOM', () => {
    const { container, engine, legacy, option } = fixture();
    const controller = new AbortController();
    const cleanup = mountCherryTableChart(engine, container, 'line', { title: 'Sales' }, table, controller.signal);
    const { firstElementChild: mount } = container;
    expect(legacy.$buildEchartsThemeFromCss).toHaveBeenCalledWith(mount);
    expect(legacy.$generateChartOptions).toHaveBeenCalledWith(
      'line',
      table,
      expect.objectContaining({ title: 'Sales' }),
    );
    expect(legacy.createChart).toHaveBeenCalledWith(mount, option, 'line');
    expect(JSON.parse(mount!.getAttribute('data-table-data')!)).toEqual(table);
    controller.abort();
    cleanup();
    expect(legacy.onDestroy).toHaveBeenCalledTimes(1);
    expect(container.childElementCount).toBe(0);
  });

  it('releases failed initialization and ignores already aborted revisions', () => {
    const { container, engine, legacy } = fixture();
    legacy.createChart.mockImplementation(() => {
      throw new Error('Chart failed');
    });
    expect(() => mountCherryTableChart(engine, container, 'line', {}, table)).toThrow('Chart failed');
    expect(legacy.onDestroy).toHaveBeenCalledTimes(1);
    expect(container.childElementCount).toBe(0);
    const controller = new AbortController();
    controller.abort();
    mountCherryTableChart(engine, container, 'line', {}, table, controller.signal)();
    expect(legacy.createChart).toHaveBeenCalledTimes(1);
  });
});
