import type { CherryVisualRenderer } from '../types.js';
import { parseTableChart } from '../wysiwyg/table-chart.js';
import { mountCherryChart } from '../cherry-echarts.js';
import EChartsCodeBlockEngine from '../cherry-codeblock-echarts.js';

/** Optional ECharts renderer. Import this entry only when charts are needed. */
export const echarts: CherryVisualRenderer = async ({ container, source, signal }) => {
  // Reuse Cherry's own safe JSON5 parser and its trailing-semicolon handling.
  // Its enableJs default stays false, so chart source cannot execute JavaScript.
  const library = await import('echarts');
  if (signal?.aborted) return;
  const option = new EChartsCodeBlockEngine({ echarts: library }).parseOption(source);
  return mountCherryChart(container, { echarts: library, type: 'codeblock', options: option, signal });
};

/** Render from the documented chart-table source, never from Cherry's private DOM. */
export const tableChart: CherryVisualRenderer = async ({ container, source, signal }) => {
  const parsed = parseTableChart(source);
  if (!parsed) throw new TypeError('Invalid Cherry table-chart Markdown.');
  const library = await import('echarts');
  if (signal?.aborted) return;
  return mountCherryChart(container, {
    echarts: library,
    type: parsed.type,
    options: parsed.options,
    table: parsed.table,
    signal,
  });
};
