import EChartsTableEngine from 'cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin.esm.js';

export default EChartsTableEngine;
type TableEngine = InstanceType<typeof EChartsTableEngine>;
type TableData = Parameters<TableEngine['$generateChartOptions']>[1];
let mountId = 0;

/**
 * Cherry 0.11.10 exposes the option generator and chart lifecycle, but not
 * renderInto(). Keep that version boundary here, never in NodeViews. Both
 * paths use Cherry's handlers/themes; neither constructs a Cherry Previewer
 * nor reimplements table-to-ECharts conversion. Test the published minimum
 * dependency as well as the workspace build when changing this adapter.
 */
export function mountCherryTableChart(
  engine: TableEngine,
  container: HTMLElement,
  type: string,
  options: Record<string, unknown>,
  table: TableData,
  signal?: AbortSignal,
): () => void {
  if (engine.renderInto) return engine.renderInto(container, type, options, table, signal);
  if (signal?.aborted) return () => {};

  // This is package-owned metadata consumed by Cherry's chart handlers (map
  // updates included), not a patch to Cherry-rendered DOM. An owned child lets
  // destroy remove the lookup target before a legacy map request completes.
  const mount = container.appendChild(document.createElement('div'));
  mountId += 1;
  mount.id = `cherry-milkdown-chart-${mountId}`;
  mount.className = 'cherry-echarts-wrapper';
  mount.style.cssText = 'width:100%;height:300px';
  mount.dataset.chartType = type;
  mount.dataset.tableData = JSON.stringify(table);
  mount.dataset.chartOptions = JSON.stringify({ ...options, chartId: mount.id });
  let observer: ResizeObserver | undefined;
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    signal?.removeEventListener('abort', cleanup);
    observer?.disconnect();
    mount.remove();
    engine.onDestroy();
  };
  signal?.addEventListener('abort', cleanup, { once: true });
  try {
    engine.$buildEchartsThemeFromCss(mount);
    const chart = engine.createChart(
      mount,
      engine.$generateChartOptions(type, table, { ...options, chartId: mount.id, signal }),
      type,
    );
    observer = new ResizeObserver(() => chart?.resize());
    observer.observe(mount);
    return cleanup;
  } catch (error) {
    cleanup();
    throw error;
  }
}
