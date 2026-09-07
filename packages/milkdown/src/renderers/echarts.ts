import type { CherryVisualRenderer } from '../types.js';
import JSON5 from 'json5';

/** Optional ECharts renderer. Import this entry only when charts are needed. */
export const echarts: CherryVisualRenderer = async ({ container, source }) => {
  // Accept object-literal data used in the Cherry manual, never executable JS.
  const option = JSON5.parse(source);
  return mountChart(container, option);
};

async function mountChart(container: HTMLElement, option: Record<string, unknown>) {
  const library = await import('echarts');
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
  return () => {
    observer?.disconnect();
    chart.dispose();
    chartRoot.remove();
  };
}

/** Read cell text from Cherry's rendered table, not a second Markdown parser. */
export const tableChart: CherryVisualRenderer = async ({ container, source, engine, syntax }) => {
  const template = document.createElement('template');
  template.innerHTML = engine.makeHtml(source);
  const rows = Array.from(template.content.querySelectorAll('tr'), (row) =>
    Array.from(row.querySelectorAll('th,td'), (cell) => cell.textContent?.trim() ?? ''),
  );
  const header = rows.shift() ?? [];
  const metadata = header[0]?.match(/^:[a-z]+:(\{.*\})$/s)?.[1];
  const settings = metadata ? JSON.parse(metadata) : {};
  const categories = header.slice(1);
  const names = rows.map((row) => row[0]);
  const data = rows.map((row) => row.slice(1).map((value) => Number(value) || 0));
  const option: Record<string, unknown> = { title: { text: settings.title ?? '' }, tooltip: {}, legend: {} };
  if (syntax === 'line' || syntax === 'bar') {
    Object.assign(option, {
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'value' },
      series: rows.map((_, index) => ({ name: names[index], type: syntax, data: data[index] })),
    });
  } else if (syntax === 'pie') {
    option.series = [{ type: 'pie', data: names.map((name, index) => ({ name, value: data[index]?.[0] })) }];
  } else if (syntax === 'radar') {
    option.radar = {
      indicator: categories.map((name, index) => ({
        name,
        max: Math.max(1, ...data.map((row) => row[index] ?? 0)) * 1.1,
      })),
    };
    option.series = [{ type: 'radar', data: names.map((name, index) => ({ name, value: data[index] })) }];
  } else if (syntax === 'heatmap') {
    const values = data.flatMap((row, y) => row.map((value, x) => [x, y, value]));
    Object.assign(option, {
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'category', data: names },
      visualMap: { min: 0, max: Math.max(1, ...data.flat()), calculable: true },
      series: [{ type: 'heatmap', data: values }],
    });
  } else if (syntax === 'scatter') {
    Object.assign(option, {
      xAxis: {},
      yAxis: {},
      series: [{ type: 'scatter', data: data.map((row) => row.slice(0, 2)) }],
    });
  } else if (syntax === 'sankey') {
    const nodes = [...new Set(rows.flatMap((row) => row.slice(0, 2)))];
    option.series = [
      {
        type: 'sankey',
        data: nodes.map((name) => ({ name })),
        links: rows.map((row) => ({ source: row[0], target: row[1], value: Number(row[2]) || 0 })),
      },
    ];
  } else {
    // Map charts need consumer-owned geographic data. Preserve the native
    // table instead of fetching a third-party URL without a configured source.
    container.remove();
    return;
  }
  return mountChart(container, option);
};
