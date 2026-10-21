import CherryEngine from '../cherry-engine.js';
import {
  TableChartDescriptorEngine,
  decodeTableChartDescriptor,
  type CherryTableChartDescriptor,
} from './table-chart-render-engine.js';

export type ParsedTableChart = CherryTableChartDescriptor;

/**
 * One public Engine boundary for Cherry's table grammar, options and cells.
 * Capture the chartRenderEngine contract directly; no presentation DOM is read.
 */
export function createTableChartParser() {
  const cache = new Map<string, string | undefined>();
  return (source: string): ParsedTableChart | undefined => {
    let serialized = cache.get(source);
    if (cache.has(source)) {
      cache.delete(source);
      cache.set(source, serialized);
    } else {
      // A short-lived engine bounds Cherry's own rendering caches as well as
      // this adapter's cache. No editor, Previewer or chart library is created.
      const descriptors: CherryTableChartDescriptor[] = [];
      class CaptureTableChart extends TableChartDescriptorEngine {
        render(type: string, options: Record<string, unknown>, table: CherryTableChartDescriptor['table']) {
          descriptors.push({ type, options, table });
          return '';
        }
      }
      const engine = new CherryEngine({
        engine: { syntax: { table: { enableChart: true, chartRenderEngine: CaptureTableChart } } },
      });
      engine.makeHtml(source);
      const descriptor = descriptors.length === 1 ? descriptors[0] : undefined;
      serialized = descriptor ? JSON.stringify(decodeTableChartDescriptor(JSON.stringify(descriptor))) : undefined;
      // Bound both entry count and per-entry string sizes, including negative results.
      if (source.length <= 32_768 && (serialized?.length ?? 0) <= 32_768) {
        cache.set(source, serialized);
        if (cache.size > 32) cache.delete(cache.keys().next().value!);
      }
    }
    // Renderers can mutate chart data. Never expose a cached object by reference.
    return serialized ? (JSON.parse(serialized) as ParsedTableChart) : undefined;
  };
}

export const parseTableChart = createTableChartParser();
const parseChartCell = createTableChartParser();

export function tableChartType(source: string) {
  return parseTableChart(source)?.type ?? '';
}

/** Header-only recognition stays independent of body edits and uses Cherry grammar. */
export function tableChartCellType(cell: string) {
  const value = cell.trim();
  if (!value.startsWith(':')) return '';
  const escaped = value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  return parseChartCell(`| ${escaped} | Value |\n| --- | --- |\n| Row | 1 |`)?.type ?? '';
}
