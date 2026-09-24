import type { CherryVisualRenderer } from '../types.js';
import { parseTableChart } from '../wysiwyg/table-chart.js';
import EChartsTableEngine from 'cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin.esm.js';
import JSON5 from 'json5';

/** Optional ECharts renderer. Import this entry only when charts are needed. */
export const echarts: CherryVisualRenderer = async ({ container, source, signal }) => {
  // Accept object-literal data used in the Cherry manual, never executable JS.
  // Cherry's native ECharts code-block examples are object literals followed by
  // a JavaScript statement terminator. JSON5 accepts the object literal but not
  // that trailing semicolon, so remove only a final terminator before parsing.
  const option = JSON5.parse(source.trim().replace(/;\s*$/, ''));
  return mountChart(container, option, signal);
};

async function mountChart(container: HTMLElement, option: Record<string, unknown>, signal?: AbortSignal) {
  const library = await import('echarts');
  if (signal?.aborted) return;
  const chartRoot = document.createElement('div');
  chartRoot.className = 'cherry-echarts-wrapper';
  chartRoot.style.cssText = 'width:100%;height:300px';
  container.append(chartRoot);
  const chart = library.init(chartRoot, undefined, { renderer: 'svg' });
  let observer: ResizeObserver | undefined;
  try {
    chart.setOption({ animation: false, ...option });
    observer = new ResizeObserver(() => chart.resize());
    observer.observe(chartRoot);
  } catch (error) {
    chart.dispose();
    chartRoot.remove();
    throw error;
  }
  const cleanup = () => {
    observer?.disconnect();
    if (!chart.isDisposed()) chart.dispose();
    chartRoot.remove();
  };
  return cleanup;
}

/** Render from the documented chart-table source, never from Cherry's private DOM. */
export const tableChart: CherryVisualRenderer = async ({ container, source, syntax, signal }) => {
  const parsed = parseTableChart(source);
  if (!parsed) throw new TypeError('Invalid Cherry table-chart Markdown.');
  const settings = parsed.optionsSource ? JSON5.parse(parsed.optionsSource) : {};
  const library = await import('echarts');
  if (signal?.aborted) return;
  const chartEngine = new EChartsTableEngine({
    echarts: library,
    cherryOptions: {},
    renderer: 'svg',
  });
  const mount = container.matches('[data-cherry-milkdown-table-chart]')
    ? container
    : container.appendChild(document.createElement('div'));
  const cleanup = chartEngine.renderInto(
    mount,
    syntax,
    settings,
    {
      header: ['', ...parsed.header],
      rows: parsed.rows,
      colLength: parsed.header.length + 1,
      rowLength: parsed.rows.length,
    },
    signal,
  );
  return () => {
    cleanup();
    if (mount !== container) mount.remove();
  };
};
