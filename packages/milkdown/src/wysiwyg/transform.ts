import type { CherryInlineMatch } from './types.js';

interface MarkdownPosition {
  start?: { offset?: number };
  end?: { offset?: number };
}

export interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  position?: MarkdownPosition;
  [key: string]: unknown;
}

interface ParseMarkdownOptions {
  supplementalDefinitions?: boolean;
}

export type ParseMarkdown = (source: string, options?: ParseMarkdownOptions) => MarkdownNode[];

interface BlockMatch {
  from: number;
  to: number;
  syntax: 'frontmatter' | 'toc' | 'comment-reference' | 'panel' | 'detail' | 'diagram' | 'native';
  source: string;
  diagramType?: string;
}

const BLOCK_PATTERNS = [
  { syntax: 'toc' as const, pattern: /^[ \t]*(?:\[\[(?:toc|TOC)\]\]|【【(?:toc|TOC)】】|\[(?:toc|TOC)\])[ \t]*$/gm },
  { syntax: 'comment-reference' as const, pattern: /^[ \t]*\[(?!\^)[^\]\n]+?\]:[^\S\n]*[^\n]+$/gm },
  {
    syntax: 'native' as const,
    pattern: /^[^\n`]*\$\$[ \t]*\n[\s\S]*?^\$\$[ \t]*$/gm,
  },
  ...['mermaid', 'plantuml', 'echarts'].map((diagramType) => ({
    syntax: 'diagram' as const,
    diagramType,
    pattern: new RegExp(
      `^( {0,3})(\u0060{3,}|~{3,})[ \\t]*${diagramType}(?:[ \\t][^\\n]*)?\\n[\\s\\S]*?^\\1\\2[ \\t]*$`,
      'gim',
    ),
  })),
];

// YAML frontmatter is only valid at the start of a Markdown document. Treating
// every pair of horizontal rules as frontmatter can swallow most of a long
// document, including fenced examples between those rules.
const FRONTMATTER_PATTERN = /^(?:\uFEFF)?---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?=\r?\n|$)/;
const FENCED_BLOCK_PATTERN = /^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*$/gm;

function containsOffset(ranges: Array<{ from: number; to: number }>, offset: number) {
  return ranges.some((range) => range.from <= offset && offset < range.to);
}

function collectDelimitedBlocks(
  source: string,
  syntax: 'panel' | 'detail',
  openerPattern: RegExp,
  closerPattern: RegExp,
  fencedRanges: Array<{ from: number; to: number }>,
) {
  const matches: BlockMatch[] = [];
  openerPattern.lastIndex = 0;
  let opener: RegExpExecArray | null;
  while ((opener = openerPattern.exec(source))) {
    if (containsOffset(fencedRanges, opener.index)) continue;
    closerPattern.lastIndex = opener.index + opener[0].length;
    let closer: RegExpExecArray | null;
    while ((closer = closerPattern.exec(source))) {
      if (containsOffset(fencedRanges, closer.index)) continue;
      const to = closer.index + closer[0].length;
      matches.push({ from: opener.index, to, syntax, source: source.slice(opener.index, to) });
      openerPattern.lastIndex = to;
      break;
    }
  }
  return matches;
}

const INLINE_MATCHERS = [
  {
    type: 'cherry_color',
    pattern: /!!(#[0-9a-zA-Z]{3,6}|[a-z]{3,20})\s(!!!(#[0-9a-zA-Z]{3,6}|[a-z]{3,10})\s[\s\S]+?!!!)!!/,
    attrs: (match: RegExpExecArray) => ({ color: match[1] ?? '' }),
    text: (match: RegExpExecArray) => match[2] ?? '',
  },
  {
    type: 'cherry_background_color',
    pattern: /!!!(#[0-9a-zA-Z]{3,6}|[a-z]{3,10})\s(!!(#[0-9a-zA-Z]{3,6}|[a-z]{3,20})\s[\s\S]+?!!)!!!/,
    attrs: (match: RegExpExecArray) => ({ color: match[1] ?? '' }),
    text: (match: RegExpExecArray) => match[2] ?? '',
  },
  {
    type: 'cherry_background_color',
    pattern: /!!!(#[0-9a-zA-Z]{3,6}|[a-z]{3,10})\s([\s\S]+?)!!!/,
    attrs: (match: RegExpExecArray) => ({ color: match[1] ?? '' }),
    text: (match: RegExpExecArray) => match[2] ?? '',
  },
  {
    type: 'cherry_color',
    pattern: /!!(#[0-9a-zA-Z]{3,6}|[a-z]{3,20})\s([\s\S]+?)!!/,
    attrs: (match: RegExpExecArray) => ({ color: match[1] ?? '' }),
    text: (match: RegExpExecArray) => match[2] ?? '',
  },
  {
    type: 'cherry_font_size',
    pattern: /!([0-9]{1,2})\s([\s\S]*?)!/,
    attrs: (match: RegExpExecArray) => ({ size: match[1] ?? '' }),
    text: (match: RegExpExecArray) => match[2] ?? '',
  },
  { type: 'cherry_subscript', pattern: /\^\^([^\n]+?)\^\^/, text: (match: RegExpExecArray) => match[1] ?? '' },
  {
    type: 'cherry_superscript',
    pattern: /(?<!\^)\^([^\n^]+?)\^(?!\^)/,
    text: (match: RegExpExecArray) => match[1] ?? '',
  },
  {
    type: 'cherry_ruby',
    pattern: /(?<!\S)\{([^|\n]+?)\|([^}\n]+?)\}(?!\S)/,
    attrs: (match: RegExpExecArray) => ({ annotation: match[2] ?? '' }),
    text: (match: RegExpExecArray) => match[1] ?? '',
  },
  {
    type: 'cherry_underline',
    pattern: /(?<!\S)\/([^/\n]+?)\/(?!\S)/,
    text: (match: RegExpExecArray) => match[1] ?? '',
  },
  {
    type: 'cherry_highlight',
    pattern: /==([^=\n]+?)==/,
    text: (match: RegExpExecArray) => match[1] ?? '',
  },
  { type: 'cherry_emoji', pattern: /:[+\w-]+:/, attrs: () => ({}) },
];

function collectBlocks(source: string): BlockMatch[] {
  const matches: BlockMatch[] = [];
  const fencedRanges: Array<{ from: number; to: number; source: string }> = [];
  FENCED_BLOCK_PATTERN.lastIndex = 0;
  let fenced: RegExpExecArray | null;
  while ((fenced = FENCED_BLOCK_PATTERN.exec(source))) {
    fencedRanges.push({ from: fenced.index, to: fenced.index + fenced[0].length, source: fenced[0] });
  }
  matches.push(
    ...collectDelimitedBlocks(
      source,
      'panel',
      /^[ \t]*:::[^:\n][^\n]*(?:\r?\n|$)/gm,
      /^[ \t]*:::[ \t]*(?=\r?$)/gm,
      fencedRanges,
    ),
    ...collectDelimitedBlocks(
      source,
      'detail',
      /^[ \t]*\+\+\+-?[ \t]+[^\n]+(?:\r?\n|$)/gm,
      /^[ \t]*\+\+\+[ \t]*(?=\r?$)/gm,
      fencedRanges,
    ),
  );
  const frontmatter = FRONTMATTER_PATTERN.exec(source);
  if (frontmatter) {
    matches.push({
      from: 0,
      to: frontmatter[0].length,
      syntax: 'frontmatter',
      source: frontmatter[0],
    });
  }
  for (const descriptor of BLOCK_PATTERNS) {
    descriptor.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = descriptor.pattern.exec(source))) {
      if (descriptor.syntax !== 'diagram' && containsOffset(fencedRanges, match.index)) {
        continue;
      }
      matches.push({
        from: match.index,
        to: match.index + match[0].length,
        syntax: descriptor.syntax,
        diagramType: 'diagramType' in descriptor ? descriptor.diagramType : undefined,
        source: match[0],
      });
    }
  }
  // Ordinary fenced code stays in Milkdown's structured `code_block` schema.
  // Only diagram languages are promoted to native visual nodes. Turning every
  // fence into an opaque source node makes direct code editing impossible and
  // causes newly inserted code blocks to change node type after synchronization.
  return matches
    .sort((left, right) => left.from - right.from || right.to - right.from - (left.to - left.from))
    .filter((match, index, all) => !all.slice(0, index).some((item) => item.from < match.to && match.from < item.to));
}

export function findCherryInlineMatches(source: string): CherryInlineMatch[] {
  const matches: CherryInlineMatch[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    let selected:
      { descriptor: (typeof INLINE_MATCHERS)[number]; match: RegExpExecArray; from: number; to: number } | undefined;
    for (const descriptor of INLINE_MATCHERS) {
      const match = descriptor.pattern.exec(source.slice(cursor));
      if (!match) continue;
      const from = cursor + match.index;
      const to = from + match[0].length;
      if (!selected || from < selected.from || (from === selected.from && to > selected.to)) {
        selected = { descriptor, match, from, to };
      }
    }
    if (!selected) break;
    const { descriptor, match, from, to } = selected;
    matches.push({
      from,
      to,
      type: descriptor.type,
      text: descriptor.text?.(match),
      attrs: descriptor.attrs?.(match),
      source: match[0],
    });
    cursor = to;
  }
  return matches;
}

function parseChildren(body: string, parse: ParseMarkdown): MarkdownNode[] {
  // ProseMirror forbids empty text nodes.  An empty compound item still needs
  // a legal block so its title/actions remain editable, but the paragraph must
  // have no text child rather than a synthetic `text('')` node.
  return parse(body).length ? parse(body) : [{ type: 'paragraph', children: [] }];
}

function offsetPositions(nodes: MarkdownNode[], offset: number) {
  const visit = (node: MarkdownNode) => {
    const start = node.position?.start?.offset;
    const end = node.position?.end?.offset;
    if (typeof start === 'number') node.position!.start!.offset = start + offset;
    if (typeof end === 'number') node.position!.end!.offset = end + offset;
    node.children?.forEach(visit);
  };
  nodes.forEach(visit);
  return nodes;
}

function parsePanel(source: string, parse: ParseMarkdown): MarkdownNode {
  const lines = source.split(/\r?\n/);
  const header = (lines.shift() ?? ':::panel').replace(/^\s*:::\s*/, '').trim();
  lines.pop();
  const [rawType = 'panel', ...titleParts] = header.split(/\s+/);
  const legacyCols = /^(\d+)cols$/i.exec(rawType);
  const kind = legacyCols ? 'cols' : rawType.toLowerCase();
  const title = titleParts.join(' ');
  const body = lines.join('\n');
  const node: MarkdownNode = {
    type: 'cherryPanel',
    kind,
    rawType,
    title,
    source,
    originalBody: body,
  };
  if (kind === 'cols') {
    node.children = body.split(/^\s*::\s*$/gm).map((item) => ({
      type: 'cherryCompoundItem',
      role: 'column',
      label: '',
      children: parseChildren(item.trim(), parse),
    }));
  } else if (kind === 'tabs' || kind === 'timeline') {
    const segments = body.split(/^\s*::\s+([^\n]+)\s*$/gm);
    const items: MarkdownNode[] = [];
    for (let index = 1; index < segments.length; index += 2) {
      items.push({
        type: 'cherryCompoundItem',
        role: kind === 'tabs' ? 'tab' : 'timeline-item',
        label: segments[index]?.trim() ?? '',
        children: parseChildren((segments[index + 1] ?? '').trim(), parse),
      });
    }
    node.children = items.length
      ? items
      : [
          {
            type: 'cherryCompoundItem',
            role: kind === 'tabs' ? 'tab' : 'timeline-item',
            label: '',
            children: parseChildren(body, parse),
          },
        ];
  } else {
    node.children = parseChildren(body, parse);
  }
  return node;
}

function parseDetail(source: string, parse: ParseMarkdown): MarkdownNode {
  const lines = source.split(/\r?\n/);
  const header = (lines.shift() ?? '+++ Detail').trim();
  lines.pop();
  const firstOpen = /^\+\+\+-/.test(header);
  const firstTitle = header.replace(/^\+\+\+-?\s*/, '');
  const body = lines.join('\n');
  const segments = body.split(/^\s*(\+\+-?\s+[^\n]+)\s*$/gm);
  const items: MarkdownNode[] = [
    {
      type: 'cherryCompoundItem',
      role: 'detail-item',
      label: firstTitle,
      open: firstOpen,
      children: parseChildren((segments.shift() ?? '').trim(), parse),
    },
  ];
  for (let index = 0; index < segments.length; index += 2) {
    const itemHeader = segments[index] ?? '';
    items.push({
      type: 'cherryCompoundItem',
      role: 'detail-item',
      label: itemHeader.replace(/^\+\+-?\s*/, ''),
      open: /^\+\+-/.test(itemHeader),
      children: parseChildren((segments[index + 1] ?? '').trim(), parse),
    });
  }
  return { type: 'cherryDetail', source, originalBody: body, children: items };
}

function createBlockNode(match: BlockMatch, parse: ParseMarkdown): MarkdownNode {
  if (match.syntax === 'panel') {
    const rawType =
      match.source
        .split(/\r?\n/, 1)[0]
        ?.replace(/^\s*:::\s*/, '')
        .trim()
        .split(/\s+/, 1)[0] ?? '';
    // Compound layouts stay structured in the preview editor. Unknown
    // business directives must not be guessed as panels: their syntax and
    // semantics belong to the application. Keep the complete source in the
    // native Cherry shell until the caller supplies a Milkdown schema,
    // parser, serializer and NodeView through `plugins`.
    const normalizedType = rawType.toLowerCase();
    const isStructured =
      /^(?:panel|primary|info|warning|danger|success|cols|tabs|timeline)$/i.test(normalizedType) ||
      /^\d+cols$/i.test(rawType);
    if (/^(?:left|center|right|justify)$/i.test(rawType) || !isStructured) {
      return { type: 'cherryNativeBlock', source: match.source };
    }
    return parsePanel(match.source, parse);
  }
  if (match.syntax === 'detail') return parseDetail(match.source, parse);
  if (match.syntax === 'diagram') {
    const lines = match.source.split(/\r?\n/);
    return {
      type: 'cherryDiagram',
      diagramType: match.diagramType ?? 'diagram',
      source: match.source,
      value: lines.slice(1, -1).join('\n'),
    };
  }
  if (match.syntax === 'comment-reference') {
    const parsed = /^\s*\[([^\]]+)\]:\s*(\S+)(?:\s+["'(](.*?)["')])?\s*$/.exec(match.source);
    return {
      type: 'cherryCommentDefinition',
      source: match.source,
      label: parsed?.[1] ?? '',
      url: parsed?.[2] ?? '',
      title: parsed?.[3] ?? '',
      position: { start: { offset: match.from }, end: { offset: match.to } },
    };
  }
  if (match.syntax === 'native') return { type: 'cherryNativeBlock', source: match.source };
  return { type: match.syntax === 'toc' ? 'cherryToc' : 'cherryFrontmatter', source: match.source };
}

function nodeRange(node: MarkdownNode) {
  const from = node.position?.start?.offset;
  const to = node.position?.end?.offset;
  return typeof from === 'number' && typeof to === 'number' ? { from, to } : null;
}

function replaceRootBlocks(
  tree: MarkdownNode,
  source: string,
  parse: ParseMarkdown,
  supplementalDefinitionsEnabled = true,
) {
  if (!tree.children) return;
  const originalChildren = tree.children;
  const blocks = collectBlocks(source);
  if (!blocks.length) return;
  const next: MarkdownNode[] = [];
  const supplementalDefinitions = supplementalDefinitionsEnabled
    ? Array.from(source.matchAll(/^\[(?:\^)?[^\]\n]+\]:[^\n]*/gm), (match) => match[0]).join('\n')
    : '';
  const linkDefinitions = new Map<string, { url: string; title?: string }>();
  for (const match of source.matchAll(/^\[(?!\^)([^\]\n]+)\]:\s*(\S+)(?:\s+["'(](.*?)["')])?\s*$/gm)) {
    const rawUrl = match[2] ?? '';
    linkDefinitions.set(String(match[1]).toLowerCase(), {
      url: rawUrl.startsWith('<') && rawUrl.endsWith('>') ? rawUrl.slice(1, -1) : rawUrl,
      title: match[3],
    });
  }
  const resolveReferences = (nodes: MarkdownNode[], segment: string) => {
    const visit = (node: MarkdownNode) => {
      if (node.type === 'definition') {
        const range = nodeRange(node);
        node.type = 'cherryCommentDefinition';
        node.source = range
          ? segment.slice(range.from, range.to)
          : `[${String(node.label ?? '')}]: ${String(node.url ?? '')}`;
        return;
      }
      if (node.type === 'linkReference' || node.type === 'imageReference') {
        const definition = linkDefinitions.get(String(node.identifier ?? node.label ?? '').toLowerCase());
        if (definition) {
          node.type = node.type === 'linkReference' ? 'link' : 'image';
          node.url = definition.url;
          node.title = definition.title;
        }
      }
      node.children?.forEach(visit);
    };
    nodes.forEach(visit);
    return nodes;
  };
  const parseSegment = (segment: string, baseOffset: number) => {
    if (!segment) return [];
    const fallback = () =>
      originalChildren.filter((node) => {
        const range = nodeRange(node);
        return range && range.from >= baseOffset && range.to <= baseOffset + segment.length;
      });
    if (!supplementalDefinitions) {
      const nodes = resolveReferences(parse(segment, { supplementalDefinitions: false }), segment);
      return nodes.length || !segment.trim() ? offsetPositions(nodes, baseOffset) : fallback();
    }
    const separator = '\n\n';
    const nodes = parse(`${segment}${separator}${supplementalDefinitions}`, { supplementalDefinitions: false });
    const resolved = resolveReferences(
      nodes.filter((node) => {
        const from = node.position?.start?.offset;
        return typeof from !== 'number' || from < segment.length + separator.length;
      }),
      segment,
    );
    return resolved.length || !segment.trim() ? offsetPositions(resolved, baseOffset) : fallback();
  };
  let sourceCursor = 0;
  for (const block of blocks) {
    if (block.from > sourceCursor) next.push(...parseSegment(source.slice(sourceCursor, block.from), sourceCursor));
    next.push(createBlockNode(block, parse));
    sourceCursor = block.to;
  }
  if (sourceCursor < source.length) next.push(...parseSegment(source.slice(sourceCursor), sourceCursor));
  tree.children = next;
}

function tableChartType(source: string) {
  const firstLine = source.split(/\r?\n/, 1)[0]?.trim() ?? '';
  const firstCell =
    firstLine
      .replace(/^\|/, '')
      .split(/(?<!\\)\|/, 1)[0]
      ?.trim() ?? '';
  return /^:(\w+):(?:[ ]*\{[\s\S]*\}[ ]*)?$/.exec(firstCell)?.[1] ?? '';
}

function replaceTableCharts(node: MarkdownNode, source: string) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === 'table') {
      const range = nodeRange(child);
      const raw = range ? source.slice(range.from, range.to) : '';
      const chartType = tableChartType(raw);
      if (chartType) {
        return {
          type: 'cherryTableChart',
          chartType,
          source: raw,
          position: child.position,
        };
      }
    }
    replaceTableCharts(child, source);
    return child;
  });
}

function splitText(node: MarkdownNode): MarkdownNode[] {
  const value = node.value ?? '';
  const matches = findCherryInlineMatches(value);
  if (!matches.length) return [node];
  const next: MarkdownNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.from > cursor) next.push({ type: 'text', value: value.slice(cursor, match.from) });
    if (match.type === 'cherry_emoji') {
      next.push({ type: 'cherryEmoji', value: match.source, source: match.source });
    } else {
      next.push({
        type: match.type,
        children: splitText({ type: 'text', value: match.text ?? '' }),
        ...match.attrs,
      });
    }
    cursor = match.to;
  }
  if (cursor < value.length) next.push({ type: 'text', value: value.slice(cursor) });
  return next;
}

function transformInline(node: MarkdownNode, source: string, root = false) {
  if (!node.children) return;
  if (
    node.type === 'paragraph' &&
    node.children.length === 1 &&
    node.children[0]?.type === 'html' &&
    /^\s*<(?:address|article|aside|blockquote|details|div|figure|footer|form|h[1-6]|header|hr|iframe|main|nav|ol|p|pre|script|section|style|table|ul)\b/i.test(
      String(node.children[0].value ?? ''),
    )
  ) {
    const source = String(node.children[0].value ?? '');
    node.type = 'cherryHtmlBlock';
    node.source = source;
    node.value = source;
    delete node.children;
    return;
  }
  const next: MarkdownNode[] = [];
  for (const child of node.children) {
    if (
      child.type === 'code' ||
      child.type === 'inlineCode' ||
      /^cherry(?:Panel|Detail|Diagram|NativeBlock|Toc|Frontmatter)/.test(child.type)
    ) {
      next.push(child);
    } else if (child.type === 'html') {
      next.push({
        type: root ? 'cherryHtmlBlock' : 'cherryHtmlInline',
        value: child.value ?? '',
        source: child.value ?? '',
      });
    } else if (child.type === 'text') {
      const value = child.value ?? '';
      const previous = next.at(-1);
      const target = previous?.type === 'link' ? /^\{target\s*=\s*([^}\s]+)\}/.exec(value) : null;
      if (target) {
        const range = nodeRange(child);
        const rawValue = range ? source.slice(range.from, range.to) : value;
        const rawTarget = /^\{target\s*=\s*([^}\s]+)\}/.exec(rawValue)?.[0] ?? target[0];
        next.push({
          type: 'cherryLinkTarget',
          source: rawTarget,
          target: String(target[1] ?? '').replace(/^['"]|['"]$/g, ''),
        });
        const remainder = value.slice(target[0].length);
        if (remainder) next.push(...splitText({ ...child, value: remainder }));
      } else {
        next.push(...splitText(child));
      }
    } else {
      transformInline(child, source);
      next.push(child);
    }
  }
  node.children = next;
}

export function transformCherryWysiwygTree(
  tree: MarkdownNode,
  source: string,
  parse: ParseMarkdown = () => [],
  options: ParseMarkdownOptions = {},
) {
  replaceRootBlocks(tree, source, parse, options.supplementalDefinitions ?? true);
  replaceTableCharts(tree, source);
  transformInline(tree, source, true);
  return tree;
}
