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

interface BlockMatch {
  from: number;
  to: number;
  syntax: string;
  source: string;
}

const BLOCK_PATTERNS = [
  { syntax: 'frontmatter', pattern: /^---[^\n]*\n[\s\S]+?\n---[^\n]*(?=\n|$)/gm },
  { syntax: 'toc', pattern: /^[ \t]*(?:\[\[(?:toc|TOC)\]\]|【【(?:toc|TOC)】】|\[(?:toc|TOC)\])[ \t]*$/gm },
  { syntax: 'comment-reference', pattern: /^[ \t]*\[(?!\^)[^\]\n]+?\]:[^\S\n]*[^\n]+$/gm },
  { syntax: 'panel', pattern: /^[ \t]*:::[^:\n][^\n]*\n[\s\S]*?^[ \t]*:::[ \t]*$/gm },
  { syntax: 'detail', pattern: /^[ \t]*\+\+\+-?[ \t]+[^\n]+\n[\s\S]*?^[ \t]*\+\+\+[ \t]*$/gm },
  ...['mermaid', 'plantuml', 'echarts'].map((syntax) => ({
    syntax,
    pattern: new RegExp(
      `^( {0,3})(\u0060{3,}|~{3,})[ \\t]*${syntax}(?:[ \\t][^\\n]*)?\\n[\\s\\S]*?^\\1\\2[ \\t]*$`,
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
  {
    type: 'cherry_subscript',
    pattern: /\^\^([^\n]+?)\^\^/,
    text: (match: RegExpExecArray) => match[1] ?? '',
  },
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
    pattern: /(?<!\S)==([^=\n]+?)==(?!\S)/,
    text: (match: RegExpExecArray) => match[1] ?? '',
  },
  {
    type: 'cherry_visual_inline',
    pattern: /:[+\w-]+:/,
    attrs: () => ({ syntax: 'emoji' }),
  },
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

function nodeRange(node: MarkdownNode) {
  const from = node.position?.start?.offset;
  const to = node.position?.end?.offset;
  return typeof from === 'number' && typeof to === 'number' ? { from, to } : null;
}

function replaceRootBlocks(tree: MarkdownNode, source: string) {
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
    next.push({ type: 'cherry_visual_block', syntax: block.syntax, value: block.source });
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
    if (match.type === 'cherry_visual_inline') {
      next.push({ type: match.type, value: match.source, ...match.attrs });
    } else {
      next.push({
        type: match.type,
        children: [{ type: 'text', value: match.text ?? '' }],
        ...match.attrs,
      });
    }
    cursor = match.to;
  }
  if (cursor < value.length) next.push({ type: 'text', value: value.slice(cursor) });
  return next;
}

function transformInline(node: MarkdownNode, root = false) {
  if (!node.children) return;
  const next: MarkdownNode[] = [];
  for (const child of node.children) {
    if (child.type === 'code' || child.type === 'inlineCode' || child.type === 'cherry_visual_block') {
      next.push(child);
    } else if (child.type === 'html') {
      next.push({
        type: root ? 'cherry_visual_block' : 'cherry_visual_inline',
        value: child.value ?? '',
        syntax: 'html',
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

export function transformCherryWysiwygTree(tree: MarkdownNode, source: string) {
  replaceRootBlocks(tree, source);
  transformInline(tree, true);
  return tree;
}
