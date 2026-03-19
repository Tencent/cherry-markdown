/**
 * Shared utility for Cherry custom mark remark tree transforms.
 * Walks the MDAST tree and replaces text node patterns with custom MDAST nodes.
 */

/**
 * Transform text nodes in the MDAST tree by matching a regex pattern
 * and replacing matches with custom MDAST nodes.
 *
 * @param {object} tree MDAST tree root
 * @param {RegExp} pattern Global regex with capture groups
 * @param {(match: RegExpMatchArray) => object} createNode Factory that builds an MDAST node from a regex match
 */
export function transformCherryMarks(tree, pattern, createNode) {
  visitParents(tree, pattern, createNode);
}

function visitParents(node, pattern, createNode) {
  if (!node.children) return;

  let changed = false;
  const newChildren = [];

  for (const child of node.children) {
    if (child.type === 'text') {
      const parts = splitTextNode(child.value, pattern, createNode);
      if (parts) {
        newChildren.push(...parts);
        changed = true;
      } else {
        newChildren.push(child);
      }
    } else {
      // Recurse into non-text children first
      visitParents(child, pattern, createNode);
      newChildren.push(child);
    }
  }

  if (changed) {
    node.children = newChildren;
  }
}

/**
 * Split a text string by the given regex, returning an array of text and MDAST nodes.
 * Returns null if no matches found (text unchanged).
 */
function splitTextNode(text, pattern, createNode) {
  // Reset regex state for global patterns
  pattern.lastIndex = 0;
  const matches = [...text.matchAll(pattern)];
  if (matches.length === 0) return null;

  const nodes = [];
  let lastIndex = 0;

  for (const match of matches) {
    // Text before the match
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    nodes.push(createNode(match));
    lastIndex = match.index + match[0].length;
  }

  // Text after the last match
  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return nodes;
}
