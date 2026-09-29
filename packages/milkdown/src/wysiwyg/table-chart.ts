export interface ParsedTableChart {
  syntax: string;
  optionsSource?: string;
  header: string[];
  rows: string[][];
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
  // Cherry accepts compact `|-|-|` delimiters in addition to GFM's three-dash
  // form, so the chart parser must preserve that published compatibility.
  return cells.length > 0 && cells.every((cell) => /^\s*:?-+:?\s*$/.test(cell));
}

function isTableRow(line: string) {
  return line.trim().startsWith('|') && /(?<!\\)\|/.test(line.trim().slice(1));
}

/**
 * Parse the small, documented Markdown-table surface used by Cherry charts.
 *
 * This intentionally consumes Markdown source instead of inspecting the HTML
 * returned by `engine.makeHtml()`. Cherry's generated wrapper/class names are
 * presentation details and must not become a renderer API for this package.
 */
function splitTableRow(line: string) {
  const value = line.trim();
  const cells: string[] = [];
  let cell = '';
  let escaped = false;
  let codeFence = 0;
  let index = value.startsWith('|') ? 1 : 0;

  while (index < value.length) {
    const character = value[index] ?? '';
    if (escaped) {
      cell += character;
      escaped = false;
      index += 1;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      cell += character;
      index += 1;
      continue;
    }
    if (character === '`') {
      let length = 1;
      while (value[index + length] === '`') length += 1;
      if (codeFence === length) codeFence = 0;
      else if (codeFence === 0) codeFence = length;
      cell += '`'.repeat(length);
      index += length;
      continue;
    }
    if (character === '|' && codeFence === 0) {
      cells.push(cell.trim().replace(/\\\|/g, '|'));
      cell = '';
      index += 1;
      continue;
    }
    cell += character;
    index += 1;
  }
  if (cell || !value.endsWith('|')) cells.push(cell.trim().replace(/\\\|/g, '|'));
  return cells;
}

export function parseTableChart(source: string): ParsedTableChart | undefined {
  const lines = source.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2 || !isTableDelimiter(lines[1] ?? '')) return undefined;
  const first = splitTableRow(lines[0] ?? '');
  const descriptor = /^:(\w+):(?:\s*(\{[\s\S]*\}))?\s*$/.exec(first[0] ?? '');
  if (!descriptor) return undefined;
  return {
    syntax: descriptor[1] ?? '',
    optionsSource: descriptor[2],
    header: first.slice(1),
    rows: lines.slice(2).filter(isTableRow).map(splitTableRow),
  };
}
