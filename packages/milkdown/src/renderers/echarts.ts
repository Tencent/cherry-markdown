import { configurationObject, supportedKeys } from '../options.js';
import type { EChartsOption } from 'echarts';
import type { CherryVisualRenderer } from '../types.js';
import { parseTableChart } from '../wysiwyg/table-chart.js';
import { mountCherryChart } from '../cherry-echarts.js';
import EChartsCodeBlockEngine from '../cherry-codeblock-echarts.js';

export interface EChartsTransformContext {
  kind: 'codeblock' | 'table';
  /** Cherry chart type, or `codeblock` for ECharts fences. */
  type: string;
  /** Markdown table or the contents of the ECharts fence. */
  source: string;
}

export interface EChartsRendererOptions {
  /** Mutate the supplied copy or return a complete option. Called on full rebuilds. */
  transformOption?: (option: EChartsOption, context: EChartsTransformContext) => EChartsOption | void;
}

/** Create optional renderers sharing a preview-only ECharts option transform. */
export function createEChartsRenderers(options: EChartsRendererOptions = {}): {
  echarts: CherryVisualRenderer;
  tableChart: CherryVisualRenderer;
} {
  const config = configurationObject(options, 'echarts');
  supportedKeys(config, ['transformOption'], 'echarts');
  const { transformOption } = options;
  if (transformOption !== undefined && typeof transformOption !== 'function') {
    throw new TypeError('Invalid Milkdown configuration "echarts.transformOption": expected a synchronous function.');
  }
  return {
    async echarts({ container, source, signal }) {
      const library = await import('echarts');
      if (signal?.aborted) return;
      // Use Cherry's data-only JSON5 parser for fenced source.
      const option = new EChartsCodeBlockEngine({ echarts: library }).parseOption(source);
      return mountCherryChart(container, {
        echarts: library,
        type: 'codeblock',
        options: option,
        signal,
        transformOption:
          transformOption && ((value) => transformOption(value, { kind: 'codeblock', type: 'codeblock', source })),
      });
    },
    async tableChart({ container, source, signal }) {
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
        transformOption:
          transformOption && ((value) => transformOption(value, { kind: 'table', type: parsed.type, source })),
      });
    },
  };
}

export const { echarts, tableChart } = createEChartsRenderers();
