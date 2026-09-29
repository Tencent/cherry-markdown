export interface CherryTableChartDescriptor {
  type: string;
  options: Record<string, unknown>;
  table: {
    header: string[];
    rows: string[][];
    colLength: number;
    rowLength: number;
  };
}

/**
 * Cherry table hook adapter used only while producing integration HTML.
 * The marker is owned by this package, so mounting never depends on Cherry's
 * private wrapper classes or DOM nesting.
 */
export class TableChartDescriptorEngine {
  isValid() {
    return true;
  }

  render(type: string, options: Record<string, unknown>, table: CherryTableChartDescriptor['table']) {
    const descriptor = encodeURIComponent(JSON.stringify({ type, options, table }));
    return `<div class="cherry-echarts-wrapper" data-cherry-milkdown-table-chart="${descriptor}"></div>`;
  }
}

export function readTableChartDescriptor(element: HTMLElement): CherryTableChartDescriptor | undefined {
  const value = element.dataset.cherryMilkdownTableChart;
  if (!value) return undefined;
  try {
    return JSON.parse(decodeURIComponent(value)) as CherryTableChartDescriptor;
  } catch {
    return undefined;
  }
}

function escapeCell(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function tableChartDescriptorSource(descriptor: CherryTableChartDescriptor) {
  const options = Object.keys(descriptor.options).length ? JSON.stringify(descriptor.options) : '';
  const header = [`:${descriptor.type}:${options}`, ...descriptor.table.header.slice(1)].map(escapeCell);
  const delimiter = header.map(() => '---');
  const row = (cells: string[]) => `| ${cells.map(escapeCell).join(' | ')} |`;
  return [row(header), row(delimiter), ...descriptor.table.rows.map(row)].join('\n');
}
