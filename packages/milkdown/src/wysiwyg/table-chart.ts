export interface EmbeddedTableChart {
  source: string;
  syntax: string;
  from: number;
  to: number;
}

export function tableChartType(source: string) {
  const firstLine = source.split(/\r?\n/, 1)[0]?.trim() ?? '';
  const firstCell =
    firstLine
      .replace(/^\|/, '')
      .split(/(?<!\\)\|/, 1)[0]
      ?.trim() ?? '';
  return /^:(\w+):(?:[ ]*\{[\s\S]*\}[ ]*)?$/.exec(firstCell)?.[1] ?? '';
}

function isTableDelimiter(line: string) {
  const cells = line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/);
  return cells.length > 0 && cells.every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell));
}

function isTableRow(line: string) {
  return line.trim().startsWith('|') && /(?<!\\)\|/.test(line.trim().slice(1));
}

/**
 * Finds table-chart Markdown nested in a Cherry-owned compound block.
 * Fenced examples are deliberately ignored: only rendered tables should be
 * enhanced after `engine.makeHtml()` creates the native Cherry DOM.
 */
export function findEmbeddedTableCharts(source: string): EmbeddedTableChart[] {
  const lines = source.split(/\r?\n/);
  const lineOffsets: number[] = [];
  let offset = 0;
  lines.forEach((line) => {
    lineOffsets.push(offset);
    offset += line.length;
    if (source.slice(offset, offset + 2) === '\r\n') offset += 2;
    else if (source[offset] === '\n') offset += 1;
  });
  const charts: EmbeddedTableChart[] = [];
  let fence: { marker: '`' | '~'; length: number } | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const token = fenceMatch[1];
      const marker = token[0] as '`' | '~';
      if (!fence) fence = { marker, length: token.length };
      else if (fence.marker === marker && token.length >= fence.length) fence = undefined;
      continue;
    }
    if (fence) continue;

    const syntax = tableChartType(line);
    if (!syntax || !isTableDelimiter(lines[index + 1] ?? '')) continue;
    let end = index + 2;
    while (end < lines.length && isTableRow(lines[end] ?? '')) end += 1;
    const chartSource = lines.slice(index, end).join('\n');
    const from = lineOffsets[index] ?? 0;
    charts.push({ syntax, source: chartSource, from, to: from + chartSource.length });
    index = end - 1;
  }
  return charts;
}
