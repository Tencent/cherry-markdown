import { image as cherryImage } from './generated/cherry-helpers.js';
import { cherryImagePatterns } from './generated/cherry-syntax.js';

export interface NativeLayoutChange {
  type?: string;
  width?: number | string;
  height?: number | string;
}

const SIZE = cherryImagePatterns.size.source;
const ALIGNMENT = cherryImagePatterns.alignment.source;
const IMAGE_DECORATION = cherryImagePatterns.decoration.source;
const IMAGE_EXTENSION = `${SIZE}|${IMAGE_DECORATION}|${ALIGNMENT}`;

export function readMermaidLayout(source: string) {
  const opener = source.split(/\r?\n/, 1)[0] ?? '';
  const sizes = opener.match(new RegExp(SIZE, 'gi')) ?? [];
  const alignment = opener.match(new RegExp(ALIGNMENT, 'i'))?.[0].slice(1) ?? '';
  return {
    width: sizes[0]?.slice(1) ?? '',
    height: sizes[1]?.slice(1) ?? '',
    alignment,
  };
}

function sizeToken(value: unknown) {
  const raw = String(value).trim();
  if (new RegExp(`^(?:${SIZE.slice(1)})$`, 'i').test(raw)) return `#${raw}`;
  const number = Math.round(Number.parseFloat(raw));
  return Number.isFinite(number) ? `#${number}px` : '';
}

export function imageLayoutState(source: string) {
  const { extendClasses } = cherryImage.processExtendStyleInAlt(source);
  return {
    alignment: cherryImage.$getAlignment(source),
    border: extendClasses.includes('cherry-img-deco-border'),
    shadow: extendClasses.includes('cherry-img-deco-shadow'),
    radius: extendClasses.includes('cherry-img-deco-radius'),
  };
}

export function updateImageLayout(source: string, change: NativeLayoutChange) {
  const extension = new RegExp(IMAGE_EXTENSION, 'g');
  const tokens = source.match(extension) ?? [];
  const base = source.replace(extension, '').trimEnd();
  let sizes = tokens.filter((token) => new RegExp(`^${SIZE}$`).test(token));
  let decorations = tokens.filter((token) => new RegExp(`^${IMAGE_DECORATION}$`).test(token));
  let alignment = tokens.find((token) => new RegExp(`^${ALIGNMENT}$`).test(token));

  if (change.width !== undefined || change.height !== undefined) {
    sizes = [sizeToken(change.width), sizeToken(change.height)].filter(Boolean);
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

export function imageAltText(source: string) {
  return source.replace(new RegExp(IMAGE_EXTENSION, 'g'), '').trimEnd();
}

export function replaceImageAltText(source: string, text: string) {
  const extensions = source.match(new RegExp(IMAGE_EXTENSION, 'g')) ?? [];
  return `${text.trimEnd()}${extensions.join('')}`;
}

export function updateMermaidLayout(source: string, change: NativeLayoutChange) {
  const lines = source.split(/\r?\n/);
  const layout = new RegExp(`${SIZE}|${ALIGNMENT}`, 'gi');
  const opener = lines[0] ?? '```mermaid';
  const tokens = opener.match(layout) ?? [];
  let sizes = tokens.filter((token) => new RegExp(`^${SIZE}$`, 'i').test(token));
  let alignment = tokens.find((token) => new RegExp(`^${ALIGNMENT}$`, 'i').test(token));

  if (change.width !== undefined || change.height !== undefined) {
    sizes = [sizeToken(change.width), sizeToken(change.height)].filter(Boolean);
  }
  const type = String(change.type ?? '');
  if (type === 'clear-align') alignment = undefined;
  else if (/^(?:left|right|center|float-left|float-right)$/.test(type)) alignment = `#${type}`;
  const suffix = [...sizes, ...(alignment ? [alignment] : [])].join(' ');
  lines[0] = `${opener.replace(layout, '').trimEnd()}${suffix ? ` ${suffix}` : ''}`;
  return lines.join('\n');
}
