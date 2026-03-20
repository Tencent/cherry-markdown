/**
 * Shared utility for Cherry custom block-level remark tree transforms.
 * Walks MDAST tree root.children and merges delimited blocks into custom nodes.
 */

/**
 * Get the raw text content of an MDAST node (recursively).
 * @param {object} node MDAST node
 * @returns {string}
 */
export function getNodeText(node) {
  if (node.value) return node.value;
  if (!node.children) return '';
  return node.children.map(getNodeText).join('');
}

/**
 * Transform block-level patterns in the MDAST tree.
 * Scans root.children for delimiter patterns and merges matched ranges into custom nodes.
 *
 * @param {object} tree MDAST tree root
 * @param {(node: object) => object|null} startTest Returns attrs object if node is a block start, null otherwise
 * @param {(node: object) => boolean} endTest Returns true if node is a block end delimiter
 * @param {(attrs: object, children: object[]) => object} createNode Factory to build the custom MDAST node
 */
export function transformCherryBlocks(tree, startTest, endTest, createNode) {
  if (!tree.children) return;

  const newChildren = [];
  let i = 0;

  while (i < tree.children.length) {
    const child = tree.children[i];
    const startResult = startTest(child);

    if (startResult) {
      const collected = [];
      i++;
      let foundEnd = false;
      while (i < tree.children.length) {
        if (endTest(tree.children[i])) {
          i++;
          foundEnd = true;
          break;
        }
        collected.push(tree.children[i]);
        i++;
      }
      if (foundEnd) {
        newChildren.push(createNode(startResult, collected));
      } else {
        // No matching end found — keep original nodes unchanged
        newChildren.push(child);
        newChildren.push(...collected);
      }
    } else {
      // Recurse into children that may contain nested blocks (e.g., blockquote)
      if (child.children && child.type !== 'code') {
        transformCherryBlocks(child, startTest, endTest, createNode);
      }
      newChildren.push(child);
      i++;
    }
  }

  tree.children = newChildren;
}
