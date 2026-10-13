import type { CherryVisualRenderer } from '../types.js';
import { parseTableChart } from '../wysiwyg/table-chart.js';
import EChartsTableEngine, { mountCherryTableChart } from '../cherry-echarts.js';
import EChartsCodeBlockEngine from '../cherry-codeblock-echarts.js';
import { cherryChartLocale } from '../cherry-chart-locale.js';
import JSON5 from 'json5';

/** Optional ECharts renderer. Import this entry only when charts are needed. */
export const echarts: CherryVisualRenderer = async ({ container, source, signal }) => {
  // Reuse Cherry's own safe JSON5 parser and its trailing-semicolon handling.
  // Its enableJs default stays false, so chart source cannot execute JavaScript.
  const library = await import('echarts');
  if (signal?.aborted) return;
  const option = new EChartsCodeBlockEngine({ echarts: library }).parseOption(source);
  return mountChart(container, option, library, signal);
};

function mountChart(
  container: HTMLElement,
  option: Record<string, unknown>,
  library: typeof import('echarts'),
  signal?: AbortSignal,
) {
  if (signal?.aborted) return;
  const chartRoot = document.createElement('div');
  chartRoot.className = 'cherry-echarts-codeblock-wrapper cherry-echarts-wrapper';
  chartRoot.style.cssText = 'width:100%;height:300px';
  container.append(chartRoot);
  // Reuse Cherry's CSS-derived theme and lightweight observer. This updates
  // presentation without rebuilding series/data or losing chart interaction.
  const chartEngine = new EChartsTableEngine({
    echarts: library,
    cherry: { locale: cherryChartLocale },
    renderer: 'svg',
  });
  let observer: ResizeObserver | undefined;
  try {
    chartEngine.$buildEchartsThemeFromCss(chartRoot.closest('.cherry') ?? chartRoot);
    const chart = chartEngine.createChart(chartRoot, option, 'codeblock');
    chartEngine.$applyThemeOnly(chart);
    observer = new ResizeObserver(() => chart?.resize());
    observer.observe(chartRoot);
  } catch (error) {
    chartEngine.onDestroy();
    chartRoot.remove();
    throw error;
  }
  const cleanup = () => {
    observer?.disconnect();
    chartEngine.onDestroy();
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
    cherry: { locale: cherryChartLocale },
    renderer: 'svg',
  });
  const mount = container.matches('[data-cherry-milkdown-table-chart]')
    ? container
    : container.appendChild(document.createElement('div'));
  const cleanup = mountCherryTableChart(
    chartEngine,
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
