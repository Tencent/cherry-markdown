import Cherry from 'cherry-markdown';
import 'cherry-markdown/dist/cherry-markdown.css';
import { milkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
import basicMd from '../../../examples/assets/markdown/index.md?raw';

let echartsReady;

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

async function renderECharts({ container, source }) {
  const echarts = await loadECharts();
  const expression = source.trim().replace(/;\s*$/, '');
  // This demo intentionally matches the original index.html configuration,
  // whose EChartsCodeBlockEngine has enableJs enabled.
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
}

async function main() {
  window.Cherry = Cherry;
  window.milkdown = milkdown;
  await Promise.all([loadECharts(), import('../../../examples/assets/scripts/pinyin/pinyin_dist.js')]);
  const { basicConfig } = await import('../../../examples/assets/scripts/index-demo.js');

  window.cherry = new Cherry({
    ...basicConfig,
    id: 'markdown',
    value: basicMd,
    extensions: [
      milkdown({
        debounce: 0,
        renderers: { echarts: renderECharts },
        onChange: ({ markdown }) => {
          window.milkdownMarkdown = markdown;
        },
      }),
    ],
  });
  window.milkdownMarkdown = window.cherry.getMarkdown();
}

void main();
