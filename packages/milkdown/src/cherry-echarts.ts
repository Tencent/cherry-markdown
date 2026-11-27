import EChartsTableEngine from 'cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin.esm.js';
import type { EChartsOption } from 'echarts';
import { cherryChartLocale } from './cherry-chart-locale.js';
import { createMapOptions } from './cherry-map.js';

type TableEngine = InstanceType<typeof EChartsTableEngine>;
type TableData = Parameters<TableEngine['$generateChartOptions']>[1];
type TableOptionGenerator = (table: TableData, options: Record<string, unknown>) => EChartsOption;
let mountId = 0;

interface ChartMountOptions {
  echarts: typeof import('echarts');
  type: string;
  options: Record<string, unknown>;
  table?: TableData;
  signal?: AbortSignal;
  transformOption?: (option: EChartsOption) => EChartsOption | void;
}

interface ChartEngineScope {
  engine: TableEngine;
  references: number;
  generators: Map<string, TableOptionGenerator>;
  generate: TableEngine['$generateChartOptions'];
}

const chartEngines = new WeakMap<HTMLElement, WeakMap<ChartMountOptions['echarts'], ChartEngineScope>>();

function acquireChartEngine(root: HTMLElement, echarts: ChartMountOptions['echarts']) {
  const engines = chartEngines.get(root) ?? new WeakMap<ChartMountOptions['echarts'], ChartEngineScope>();
  let scope = engines.get(echarts);
  if (!scope) {
    const engine = new EChartsTableEngine({
      echarts,
      cherry: { locale: cherryChartLocale },
      cherryOptions: {},
      renderer: 'svg',
    });
    const generators: ChartEngineScope['generators'] = new Map();
    const generate = engine.$generateChartOptions.bind(engine);
    // Cherry reconstructs table options on export. Route each owned chart
    // through its renderer's transform and, for maps, its existing loader.
    engine.$generateChartOptions = (type, table, options) =>
      generators.get(String(options.chartId))?.(table, options) ?? generate(type, table, options);
    scope = { engine, references: 0, generators, generate };
  }
  chartEngines.set(root, engines);
  engines.set(echarts, scope);
  scope.references += 1;
  return {
    engine: scope.engine,
    generators: scope.generators,
    generate: scope.generate,
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
  { echarts, type, options, table, signal, transformOption }: ChartMountOptions,
): () => void {
  if (signal?.aborted) return () => {};

  const controller = new AbortController();
  const mount = container.appendChild(document.createElement('div'));
  mountId += 1;
  mount.id = `cherry-milkdown-chart-${mountId}`;
  mount.className = `cherry-echarts-wrapper${table ? '' : ' cherry-echarts-codeblock-wrapper'}`;
  mount.setAttribute('part', 'chart');
  mount.dataset.chartType = type;
  let engine: TableEngine | undefined;
  let releaseEngine: (() => void) | undefined;
  let releaseGenerator: (() => void) | undefined;
  let observer: ResizeObserver | undefined;
  let disposed = false;
  let lastOption: EChartsOption | undefined;
  const transform = (base: EChartsOption) => {
    if (!transformOption) return base;
    const copy = echarts.util.clone(base);
    try {
      lastOption = transformOption(copy) ?? copy;
      return lastOption;
    } catch (error) {
      // A rebuild must not erase the last valid chart or stop its siblings.
      if (lastOption) return lastOption;
      throw error;
    }
  };
  // Cherry can rebuild table charts from their datasets. Fenced charts keep
  // their original options here rather than inventing a table representation.
  const restoreCodeChart = () => {
    if (disposed) return;
    const chart = echarts.getInstanceByDom(mount);
    if (chart) {
      chart.setOption(transform(options), true);
      engine?.$applyThemeOnly(chart);
    }
  };
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    signal?.removeEventListener('abort', cleanup);
    window.removeEventListener('cherry:export:done', restoreCodeChart);
    controller.abort();
    releaseGenerator?.();
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
    if (table && (type === 'map' || transformOption)) {
      const generate: TableOptionGenerator = (data, config) => transform(scope.generate(type, data, config));
      scope.generators.set(
        mount.id,
        type === 'map' ? createMapOptions(mount, echarts, controller.signal, generate, cherryChartLocale) : generate,
      );
      releaseGenerator = () => scope.generators.delete(mount.id);
    }
    const chartOptions = table
      ? engine.$generateChartOptions(type, table, { ...options, chartId: mount.id })
      : transform(options);
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
