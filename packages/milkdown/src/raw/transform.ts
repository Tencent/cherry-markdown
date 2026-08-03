import { detectCherryRawRanges } from './patterns.js';
import type { CherryRawPattern, CherryRawRange } from './types.js';

interface MarkdownPosition {
  start?: { offset?: number };
  end?: { offset?: number };
}

interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  position?: MarkdownPosition;
  syntax?: string;
}

function nodeRange(node: MarkdownNode) {
  const from = node.position?.start?.offset;
  const to = node.position?.end?.offset;
  if (typeof from !== 'number' || typeof to !== 'number') return null;
  return { from, to };
}

function rawNode(range: CherryRawRange): MarkdownNode {
  return {
    type: range.kind === 'block' ? 'cherryRawBlock' : 'cherryRawInline',
    value: range.source,
    syntax: range.syntax,
  };
}

function replaceRootBlocks(tree: MarkdownNode, ranges: CherryRawRange[]) {
  if (!tree.children) return;
  const blocks = ranges.filter((range) => range.kind === 'block');
  if (!blocks.length) return;

  const next: MarkdownNode[] = [];
  let childIndex = 0;
  for (const range of blocks) {
    while (childIndex < tree.children.length) {
      const current = tree.children[childIndex];
      if (!current) break;
      const currentRange = nodeRange(current);
      if (!currentRange || currentRange.to <= range.from) {
        next.push(current);
        childIndex += 1;
        continue;
      }
      break;
    }

    const first = tree.children[childIndex];
    const firstRange = first && nodeRange(first);
    if (!firstRange || firstRange.from >= range.to) continue;
    while (childIndex < tree.children.length) {
      const current = tree.children[childIndex];
      if (!current) break;
      const currentRange = nodeRange(current);
      if (!currentRange || currentRange.from >= range.to) break;
      childIndex += 1;
    }
    next.push(rawNode(range));
  }
  next.push(...tree.children.slice(childIndex));
  tree.children = next;
}

function splitTextNode(node: MarkdownNode, patterns: CherryRawPattern[]): MarkdownNode[] {
  const source = node.value ?? '';
  const ranges = detectCherryRawRanges(source, patterns).filter((range) => range.kind === 'inline');
  if (!ranges.length) return [node];
  const nodes: MarkdownNode[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.from > cursor) nodes.push({ type: 'text', value: source.slice(cursor, range.from) });
    nodes.push(rawNode(range));
    cursor = range.to;
  }
  if (cursor < source.length) nodes.push({ type: 'text', value: source.slice(cursor) });
  return nodes;
}

function replaceInlineNodes(node: MarkdownNode, patterns: CherryRawPattern[], isRoot = false) {
  if (!node.children) return;
  const next: MarkdownNode[] = [];
  for (const child of node.children) {
    if (child.type === 'code' || child.type === 'inlineCode' || child.type === 'cherryRawBlock') {
      next.push(child);
      continue;
    }
    if (child.type === 'html') {
      next.push({ type: isRoot ? 'cherryRawBlock' : 'cherryRawInline', value: child.value ?? '', syntax: 'html' });
      continue;
    }
    if (child.type === 'text') {
      next.push(...splitTextNode(child, patterns));
      continue;
    }
    replaceInlineNodes(child, patterns);
    next.push(child);
  }
  node.children = next;
}

export function transformCherryRawTree(tree: MarkdownNode, source: string, patterns: CherryRawPattern[] = []) {
  const ranges = detectCherryRawRanges(source, patterns);
  replaceRootBlocks(tree, ranges);
  replaceInlineNodes(tree, patterns, true);
  return tree;
}
