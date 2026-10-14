import EChartsTableEngine from 'cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin.esm.js';
import { cherryChartLocale } from './cherry-chart-locale.js';

type TableEngine = InstanceType<typeof EChartsTableEngine>;
type TableData = Parameters<TableEngine['$generateChartOptions']>[1];
let mountId = 0;

interface ChartMountOptions {
  echarts: typeof import('echarts');
  type: string;
  options: Record<string, unknown>;
  table?: TableData;
  signal?: AbortSignal;
}

interface ChartEngineScope {
  engine: TableEngine;
  references: number;
}

const chartEngines = new WeakMap<HTMLElement, WeakMap<ChartMountOptions['echarts'], ChartEngineScope>>();

function acquireChartEngine(root: HTMLElement, echarts: ChartMountOptions['echarts']) {
  const engines = chartEngines.get(root) ?? new WeakMap<ChartMountOptions['echarts'], ChartEngineScope>();
  const scope = engines.get(echarts) ?? {
    engine: new EChartsTableEngine({
      echarts,
      cherry: { locale: cherryChartLocale },
      cherryOptions: {},
      renderer: 'svg',
    }),
    references: 0,
  };
  chartEngines.set(root, engines);
  engines.set(echarts, scope);
  scope.references += 1;
  return {
    engine: scope.engine,
    release() {
      scope.references -= 1;
      if (scope.references === 0) {
        engines.delete(echarts);
        scope.engine.onDestroy();
      }
    },
  };
}

/**
 * Cherry owns conversion/themes and expects one chart engine per preview root.
 * Milkdown owns that shared scope and each mount's cancellation and teardown.
 * Keep Cherry's internal API boundary here and test both the published minimum
 * and workspace build when upgrading it.
 */
export function mountCherryChart(
  container: HTMLElement,
  { echarts, type, options, table, signal }: ChartMountOptions,
): () => void {
  if (signal?.aborted) return () => {};

  const controller = new AbortController();
  const mount = container.appendChild(document.createElement('div'));
  mountId += 1;
  mount.id = `cherry-milkdown-chart-${mountId}`;
  mount.className = `cherry-echarts-wrapper${table ? '' : ' cherry-echarts-codeblock-wrapper'}`;
  mount.style.cssText = 'width:100%;height:300px';
  mount.dataset.chartType = type;
  let engine: TableEngine | undefined;
  let releaseEngine: (() => void) | undefined;
  let observer: ResizeObserver | undefined;
  let disposed = false;
  // Cherry can rebuild table charts from their datasets. Fenced charts keep
  // their original options here rather than inventing a table representation.
  const restoreCodeChart = () => {
    if (disposed) return;
    const chart = echarts.getInstanceByDom(mount);
    if (chart) {
      chart.setOption(options, true);
      engine?.$applyThemeOnly(chart);
    }
  };
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    signal?.removeEventListener('abort', cleanup);
    window.removeEventListener('cherry:export:done', restoreCodeChart);
    controller.abort();
    observer?.disconnect();
    try {
      // Export/locale rebuilds may have replaced the first chart instance.
      // Resolve the current one by its owned mount, then release the engine.
      engine?.destroyChart(mount);
    } finally {
      try {
        releaseEngine?.();
      } finally {
        mount.remove();
      }
    }
  };
  signal?.addEventListener('abort', cleanup, { once: true });
  try {
    if (table) {
      mount.dataset.tableData = JSON.stringify(table);
      mount.dataset.chartOptions = JSON.stringify({ ...options, chartId: mount.id });
    }
    const root = mount.closest<HTMLElement>('.cherry') ?? mount.closest<HTMLElement>('.cherry-markdown') ?? container;
    const scope = acquireChartEngine(root, echarts);
    engine = scope.engine;
    releaseEngine = scope.release;
    engine.$buildEchartsThemeFromCss(root);
    const chartOptions = table
      ? engine.$generateChartOptions(type, table, { ...options, chartId: mount.id, signal: controller.signal })
      : options;
    const chart = engine.createChart(mount, chartOptions, type);
    if (!table) {
      engine.$applyThemeOnly(chart);
      window.addEventListener('cherry:export:done', restoreCodeChart);
    }
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (!disposed) echarts.getInstanceByDom(mount)?.resize();
      });
      observer.observe(mount);
    }
    return cleanup;
  } catch (error) {
    cleanup();
    throw error;
  }
}
