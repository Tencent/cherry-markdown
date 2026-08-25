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

export type ParseMarkdown = (source: string) => MarkdownNode[];

interface BlockMatch {
  from: number;
  to: number;
  syntax: 'frontmatter' | 'toc' | 'comment-reference' | 'panel' | 'detail' | 'diagram';
  source: string;
  diagramType?: string;
}

const BLOCK_PATTERNS = [
  { syntax: 'frontmatter' as const, pattern: /^---[^\n]*\n[\s\S]+?\n---[^\n]*(?=\n|$)/gm },
  { syntax: 'toc' as const, pattern: /^[ \t]*(?:\[\[(?:toc|TOC)\]\]|【【(?:toc|TOC)】】|\[(?:toc|TOC)\])[ \t]*$/gm },
  { syntax: 'comment-reference' as const, pattern: /^[ \t]*\[(?!\^)[^\]\n]+?\]:[^\S\n]*[^\n]+$/gm },
  { syntax: 'panel' as const, pattern: /^[ \t]*:::[^:\n][^\n]*\n[\s\S]*?^[ \t]*:::[ \t]*$/gm },
  { syntax: 'detail' as const, pattern: /^[ \t]*\+\+\+-?[ \t]+[^\n]+\n[\s\S]*?^[ \t]*\+\+\+[ \t]*$/gm },
  ...['mermaid', 'plantuml', 'echarts'].map((diagramType) => ({
    syntax: 'diagram' as const,
    diagramType,
    pattern: new RegExp(
      `^( {0,3})(\u0060{3,}|~{3,})[ \\t]*${diagramType}(?:[ \\t][^\\n]*)?\\n[\\s\\S]*?^\\1\\2[ \\t]*$`,
      'gim',
    ),
  })),
];

const INLINE_MATCHERS = [
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
  for (const descriptor of BLOCK_PATTERNS) {
    descriptor.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = descriptor.pattern.exec(source))) {
      matches.push({
        from: match.index,
        to: match.index + match[0].length,
        syntax: descriptor.syntax,
        diagramType: 'diagramType' in descriptor ? descriptor.diagramType : undefined,
        source: match[0],
      });
    }
  }
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
  return parse(body).length ? parse(body) : [{ type: 'paragraph', children: [{ type: 'text', value: '' }] }];
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
  if (match.syntax === 'panel') return parsePanel(match.source, parse);
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
    };
  }
  return { type: match.syntax === 'toc' ? 'cherryToc' : 'cherryFrontmatter', source: match.source };
}

function nodeRange(node: MarkdownNode) {
  const from = node.position?.start?.offset;
  const to = node.position?.end?.offset;
  return typeof from === 'number' && typeof to === 'number' ? { from, to } : null;
}

function replaceRootBlocks(tree: MarkdownNode, source: string, parse: ParseMarkdown) {
  if (!tree.children) return;
  const blocks = collectBlocks(source);
  if (!blocks.length) return;
  const next: MarkdownNode[] = [];
  let childIndex = 0;
  for (const block of blocks) {
    while (childIndex < tree.children.length) {
      const current = tree.children[childIndex];
      const range = current && nodeRange(current);
      if (!range || range.to <= block.from) {
        if (current) next.push(current);
        childIndex += 1;
        continue;
      }
      break;
    }
    const first = tree.children[childIndex];
    const firstRange = first && nodeRange(first);
    if (!firstRange || firstRange.from >= block.to) continue;
    while (childIndex < tree.children.length) {
      const current = tree.children[childIndex];
      const range = current && nodeRange(current);
      if (!range || range.from >= block.to) break;
      childIndex += 1;
    }
    next.push(createBlockNode(block, parse));
  }
  next.push(...tree.children.slice(childIndex));
  tree.children = next;
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
      next.push({ type: match.type, children: [{ type: 'text', value: match.text ?? '' }], ...match.attrs });
    }
    cursor = match.to;
  }
  if (cursor < value.length) next.push({ type: 'text', value: value.slice(cursor) });
  return next;
}

function transformInline(node: MarkdownNode, root = false) {
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
      /^cherry(?:Panel|Detail|Diagram|Toc|Frontmatter)/.test(child.type)
    ) {
      next.push(child);
    } else if (child.type === 'html') {
      next.push({
        type: root ? 'cherryHtmlBlock' : 'cherryHtmlInline',
        value: child.value ?? '',
        source: child.value ?? '',
      });
    } else if (child.type === 'text') {
      next.push(...splitText(child));
    } else {
      transformInline(child);
      next.push(child);
    }
  }
  node.children = next;
}

export function transformCherryWysiwygTree(tree: MarkdownNode, source: string, parse: ParseMarkdown = () => []) {
  replaceRootBlocks(tree, source, parse);
  transformInline(tree, true);
  return tree;
}
