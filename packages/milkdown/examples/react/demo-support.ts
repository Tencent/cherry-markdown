import Cherry from 'cherry-markdown';
import type { CherryVisualRenderer } from '@cherry-markdown/milkdown';

let echartsReady: Promise<typeof import('echarts/core')> | undefined;

async function loadECharts() {
  echartsReady ??= Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers'),
    import('echarts/features'),
  ]).then(([echarts, charts, components, renderers, features]) => {
    echarts.use([
      charts.LineChart,
      charts.BarChart,
      charts.PieChart,
      charts.RadarChart,
      charts.ScatterChart,
      charts.MapChart,
      charts.HeatmapChart,
      charts.SankeyChart,
      components.GridComponent,
      components.RadarComponent,
      components.GeoComponent,
      components.GraphicComponent,
      components.ToolboxComponent,
      components.TooltipComponent,
      components.AxisPointerComponent,
      components.TitleComponent,
      components.LegendComponent,
      components.DataZoomComponent,
      components.VisualMapComponent,
      components.DatasetComponent,
      components.TransformComponent,
      renderers.CanvasRenderer,
      renderers.SVGRenderer,
      features.LabelLayout,
      features.UniversalTransition,
    ]);
    window.echarts = echarts;
    Cherry.usePlugin(Cherry.plugins.EChartsCodeBlockEngine, {
      size: { width: '100%', height: '600px' },
      enableJs: true,
    });
    return echarts;
  });
  return echartsReady;
}

export const renderECharts: CherryVisualRenderer = async ({ container, source }) => {
  const echarts = await loadECharts();
  const expression = source.trim().replace(/;\s*$/, '');
  // This matches the root demo, whose ECharts code block engine enables JS.
  const option = Function(`"use strict"; return (${expression});`)();
  container.style.width = '100%';
  container.style.height = '600px';
  const chart = echarts.init(container);
  chart.setOption(option);
  const resizeObserver = new ResizeObserver(() => chart.resize());
  resizeObserver.observe(container);
  return () => {
    resizeObserver.disconnect();
    chart.dispose();
  };
};

export async function loadDemoDependencies() {
  // @ts-expect-error The legacy pinyin demo asset does not publish declarations.
  await Promise.all([loadECharts(), import('../../../../examples/assets/scripts/pinyin/pinyin_dist.js')]);
}
