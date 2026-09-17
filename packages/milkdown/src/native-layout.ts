export interface NativeLayoutChange {
  type?: string;
  width?: number | string;
  height?: number | string;
}

const SIZE = '#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto)';
const ALIGNMENT = '#(?:center|right|left|float-right|float-left)';
const IMAGE_DECORATION = '#(?:border|shadow|radius|B|S|R)';

function pixelToken(value: unknown) {
  const number = Math.round(Number.parseFloat(String(value)));
  return Number.isFinite(number) ? `#${number}px` : '';
}

export function updateImageLayout(source: string, change: NativeLayoutChange) {
  const extension = new RegExp(`${SIZE}|${IMAGE_DECORATION}|${ALIGNMENT}`, 'g');
  const tokens = source.match(extension) ?? [];
  const base = source.replace(extension, '').trimEnd();
  let sizes = tokens.filter((token) => new RegExp(`^${SIZE}$`).test(token));
  let decorations = tokens.filter((token) => new RegExp(`^${IMAGE_DECORATION}$`).test(token));
  let alignment = tokens.find((token) => new RegExp(`^${ALIGNMENT}$`).test(token));

  if (change.width !== undefined || change.height !== undefined) {
    sizes = [pixelToken(change.width), pixelToken(change.height)].filter(Boolean);
  }
  const aliases: Record<string, string> = { border: '#B', shadow: '#S', radius: '#R' };
  const type = String(change.type ?? '');
  if (aliases[type]) {
    const alias = new RegExp(`^#(?:${type}|${aliases[type].slice(1)})$`);
    const active = decorations.some((token) => alias.test(token));
    decorations = decorations.filter((token) => !alias.test(token));
    if (!active) decorations.push(aliases[type]);
  } else if (type === 'clear-align') alignment = undefined;
  else if (/^(?:left|right|center|float-left|float-right)$/.test(type)) alignment = `#${type}`;

  return `${base}${[...sizes, ...decorations, ...(alignment ? [alignment] : [])].join('')}`;
}

export function updateMermaidLayout(source: string, change: NativeLayoutChange) {
  const lines = source.split(/\r?\n/);
  const layout = new RegExp(`${SIZE}|${ALIGNMENT}`, 'gi');
  const opener = lines[0] ?? '```mermaid';
  const tokens = opener.match(layout) ?? [];
  let sizes = tokens.filter((token) => new RegExp(`^${SIZE}$`, 'i').test(token));
  let alignment = tokens.find((token) => new RegExp(`^${ALIGNMENT}$`, 'i').test(token));

  if (change.width !== undefined || change.height !== undefined) {
    sizes = [pixelToken(change.width), pixelToken(change.height)].filter(Boolean);
  }
  const type = String(change.type ?? '');
  if (type === 'clear-align') alignment = undefined;
  else if (/^(?:left|right|center|float-left|float-right)$/.test(type)) alignment = `#${type}`;
  const suffix = [...sizes, ...(alignment ? [alignment] : [])].join(' ');
  lines[0] = `${opener.replace(layout, '').trimEnd()}${suffix ? ` ${suffix}` : ''}`;
  return lines.join('\n');
}
