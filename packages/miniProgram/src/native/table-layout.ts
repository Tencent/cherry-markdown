import { cherryThemes } from 'cherry-markdown/theme';
import type { MiniProgramTableCellView, MiniProgramTableViewBlock } from '../types';
import { nativeTextWidth, nativeTypography } from './text-metrics';

export type NativeCellMeasurements = Map<string, { signature: string; width: number }>;

/** Interpolate intrinsic minimum and max-content widths, leaving short columns at their minima. */
export function distributeTableColumns(
  minimum: number[],
  preferred: number[],
  available: number,
  border = 1,
): number[] {
  const minTotal = minimum.reduce((sum, width) => sum + width, 0);
  const maxTotal = preferred.reduce((sum, width) => sum + width, 0);
  const target = Math.max(minTotal, Math.min(maxTotal, Math.max(0, available - border)));
  const flexibility = maxTotal - minTotal;
  return minimum.map(
    (width, index) => width + (flexibility > 0 ? ((target - minTotal) * (preferred[index] - width)) / flexibility : 0),
  );
}
function cellWidth(cell: MiniProgramTableCellView, theme: string, imageWidth: number): number {
  const { fontSize, family } = nativeTypography(theme);
  let line = 0;
  let longest = 0;
  for (const run of cell.inlines) {
    if (run.type === 'image' || run.type === 'image_placeholder') {
      longest = Math.max(longest, line, imageWidth);
      line = 0;
      continue;
    }
    if (run.type === 'cursor') continue;
    const size =
      'style' in run ? parseFloat(/font-size:([\d.]+)px/.exec(run.style || '')?.[1] || '') || fontSize : fontSize;
    const classes = 'className' in run ? run.className || '' : '';
    const font = `${classes.includes('md-em') ? 'italic ' : ''}${cell.header || classes.includes('md-strong') ? 'bold ' : ''}${size}px ${classes.includes('md-inline-code') ? 'monospace' : family}`;
    const lines = run.text.split('\n');
    for (let index = 0; index < lines.length; index++) {
      if (index > 0) {
        longest = Math.max(longest, line);
        line = 0;
      }
      line += nativeTextWidth(lines[index], font, size);
    }
    if (classes.includes('md-inline-code')) line += size * 0.2 + 2;
  }
  return Math.max(longest, line);
}
export function nativeTableLayout(
  block: MiniProgramTableViewBlock,
  available: number,
  theme = 'default',
  windowWidth = 375,
  measurements: NativeCellMeasurements = new Map(),
) {
  const { fontSize } = nativeTypography(theme);
  // Cherry content-box min-width:100px, padding:.2em .4em and collapsed 1px borders.
  const tokens =
    cherryThemes[
      Object.prototype.hasOwnProperty.call(cherryThemes, theme) ? (theme as keyof typeof cherryThemes) : 'default'
    ];
  const px = (value: string) => parseFloat(value) * (value.endsWith('em') ? fontSize : 1);
  const padding = tokens['--native-table-cell-padding'].split(/\s+/);
  const horizontalPadding = px(padding[1] || padding[0]) + px(padding[3] || padding[1] || padding[0]);
  const tableBorderWidth = px(tokens['--native-table-border-width']);
  const chrome = horizontalPadding + tableBorderWidth;
  const rows = [...block.header, ...block.rows];
  const count = rows.reduce((max, row) => Math.max(max, row.cells.length), 0);
  const minimum = Array<number>(count).fill(px(tokens['--native-table-cell-min']) + chrome);
  const preferred = [...minimum];
  const active = new Set<string>();
  rows.forEach((row, rowIndex) =>
    row.cells.forEach((cell, index) => {
      const imageWidth = (windowWidth * 240) / 750;
      if (cell.inlines.some((run) => run.type === 'image'))
        minimum[index] = Math.max(minimum[index], imageWidth + chrome);
      const id = (cell as typeof cell & { id?: string }).id || `${rowIndex}/${index}`;
      active.add(id);
      const signature = JSON.stringify([theme, windowWidth, cell.header, cell.inlines]);
      const previous = measurements.get(id);
      const width = previous?.signature === signature ? previous.width : cellWidth(cell, theme, imageWidth);
      if (previous?.signature !== signature) measurements.set(id, { signature, width });
      preferred[index] = Math.max(preferred[index], minimum[index], width + chrome);
    }),
  );
  for (const id of measurements.keys()) if (!active.has(id)) measurements.delete(id);
  const columnWidths = distributeTableColumns(minimum, preferred, available, tableBorderWidth);
  return {
    columnWidths,
    tableWidth: columnWidths.reduce((sum, width) => sum + width, tableBorderWidth),
    tableBorderWidth,
  };
}
