/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as htmlparser2 from 'htmlparser2';

/**
 * @typedef {{ type: 'text'; text: string }} MiniProgramText
 * @typedef {{ type: 'break' }} MiniProgramBreak
 * @typedef {{ type: 'cursor' }} MiniProgramCursor
 * @typedef {{ type: 'strong' | 'em' | 'code' | 'span' | 'underline' | 'strikethrough' | 'sub' | 'sup'; attrs?: Record<string, string>; children: MiniProgramInline[] }} MiniProgramInlineWrapper
 * @typedef {{ type: 'link'; href: string; title?: string; attrs?: Record<string, string>; children: MiniProgramInline[] }} MiniProgramLink
 * @typedef {{ type: 'image'; src: string; alt?: string; title?: string; attrs?: Record<string, string> }} MiniProgramImage
 * @typedef {{ type: 'math_inline'; text: string; attrs?: Record<string, string> }} MiniProgramMathInline
 * @typedef {MiniProgramText | MiniProgramBreak | MiniProgramCursor | MiniProgramInlineWrapper | MiniProgramLink | MiniProgramImage | MiniProgramMathInline} MiniProgramInline
 *
 * @typedef {{ type: 'paragraph'; attrs?: Record<string, string>; children: MiniProgramInline[] }} MiniProgramParagraphBlock
 * @typedef {{ type: 'heading'; level: number; attrs?: Record<string, string>; children: MiniProgramInline[] }} MiniProgramHeadingBlock
 * @typedef {{ type: 'blockquote'; attrs?: Record<string, string>; children: MiniProgramBlock[] }} MiniProgramBlockquoteBlock
 * @typedef {{ type: 'list_item'; attrs?: Record<string, string>; checked?: boolean; children: MiniProgramBlock[] }} MiniProgramListItem
 * @typedef {{ type: 'list'; ordered: boolean; attrs?: Record<string, string>; children: MiniProgramListItem[] }} MiniProgramListBlock
 * @typedef {{ type: 'table_cell'; header: boolean; align?: 'left' | 'center' | 'right'; attrs?: Record<string, string>; children: MiniProgramInline[] }} MiniProgramTableCell
 * @typedef {{ type: 'table_row'; attrs?: Record<string, string>; children: MiniProgramTableCell[] }} MiniProgramTableRow
 * @typedef {{ type: 'table'; attrs?: Record<string, string>; header: MiniProgramTableRow[]; rows: MiniProgramTableRow[] }} MiniProgramTableBlock
 * @typedef {{ type: 'code_block'; lang: string; text: string; nodes?: MiniProgramRichTextNode[]; attrs?: Record<string, string> }} MiniProgramCodeBlock
 * @typedef {{ type: 'math_block'; text: string; display: boolean; attrs?: Record<string, string> }} MiniProgramMathBlock
 * @typedef {{ type: 'diagram'; kind: 'mermaid'; text: string; attrs?: Record<string, string> }} MiniProgramDiagramBlock
 * @typedef {{ type: 'html'; nodes: MiniProgramRichTextNode[] }} MiniProgramHtmlBlock
 * @typedef {MiniProgramParagraphBlock | MiniProgramHeadingBlock | MiniProgramBlockquoteBlock | MiniProgramListBlock | MiniProgramListItem | MiniProgramTableBlock | MiniProgramCodeBlock | MiniProgramMathBlock | MiniProgramDiagramBlock | MiniProgramImage | MiniProgramHtmlBlock} MiniProgramBlock
 *
 * @typedef {{ type: 'text'; text: string } | { name: string; attrs?: Record<string, string>; children?: MiniProgramRichTextNode[] }} MiniProgramRichTextNode
 * @typedef {{ unknownTag?: 'html' | 'unwrap' | 'drop'; forceNoCursor?: boolean }} MiniProgramTransformOptions
 */

const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'details',
  'div',
  'dl',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul',
  'video',
  'audio',
]);

const FALLBACK_TAGS = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'figure', 'video', 'audio']);
const SKIP_TAGS = new Set(['script', 'style']);
const INLINE_TAGS = new Set(['a', 'b', 'br', 'code', 'del', 'em', 'i', 's', 'span', 'strong', 'sub', 'sup', 'u']);

const RICH_TEXT_TABLE_STYLE = {
  table:
    'width:100%;border-collapse:collapse;border-spacing:0;background:#fff;margin:8px 0;font-size:14px;line-height:1.6;',
  th: 'border:1px solid #d0d7de;background:#f6f8fa;color:#24292f;font-weight:600;padding:6px 8px;text-align:left;',
  td: 'border:1px solid #d0d7de;color:#24292f;padding:6px 8px;text-align:left;',
};

/**
 * @param {any} node
 * @returns {node is { type: string; name: string; attribs?: Record<string, string>; children?: any[] }}
 */
function isTag(node) {
  return node && (node.type === 'tag' || node.type === 'script' || node.type === 'style');
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function isText(node) {
  return node && node.type === 'text';
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function isSkippableTag(node) {
  return isTag(node) && SKIP_TAGS.has(String(node.name).toLowerCase());
}

/**
 * @param {Record<string, string>} attrs
 * @returns {Record<string, string>}
 */
function sanitizeAttrs(attrs = {}) {
  /** @type {Record<string, string>} */
  const safeAttrs = {};
  Object.keys(attrs).forEach((key) => {
    if (/^on/i.test(key)) {
      return;
    }
    if (/^data-(sign|lines|type)$/i.test(key)) {
      return;
    }
    const value = attrs[key];
    if ((key === 'href' || key === 'src') && /^\s*javascript:/i.test(String(value))) {
      return;
    }
    safeAttrs[key] = value;
  });
  return safeAttrs;
}

function withRichTextDefaultStyle(tagName, attrs = {}) {
  const defaultStyle = RICH_TEXT_TABLE_STYLE[tagName];
  if (!defaultStyle) {
    return attrs;
  }
  return {
    ...attrs,
    style: attrs.style ? `${defaultStyle}${attrs.style}` : defaultStyle,
  };
}

/**
 * @param {Record<string, string>} attrs
 * @returns {boolean}
 */
function isCursorAttrs(attrs = {}) {
  return /\bcherry-flow-session-cursor\b/.test(attrs.class || '');
}

/**
 * @param {Record<string, string>} attrs
 * @returns {boolean}
 */
function isTaskMarkerAttrs(attrs = {}) {
  return /\bch-icon\b/.test(attrs.class || '') && /\bch-icon-(?:check|square)\b/.test(attrs.class || '');
}

/**
 * @param {Record<string, string>} attrs
 * @returns {boolean}
 */
function isCheckedTaskMarkerAttrs(attrs = {}) {
  return /\bch-icon-check\b/.test(attrs.class || '');
}

/**
 * @param {Record<string, string>} attrs
 * @returns {boolean}
 */
function isMathAttrs(attrs = {}) {
  return attrs['data-type'] === 'mathBlock' || /\bCherry-(?:InlineMath|Math)\b/.test(attrs.class || '');
}

function safeDecodeURIComponent(value = '') {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * @param {any} node
 * @returns {string}
 */
function getText(node) {
  if (!node) {
    return '';
  }
  if (isText(node)) {
    return node.data || '';
  }
  return (node.children || []).map(getText).join('');
}

/**
 * @param {string | undefined} className
 * @returns {string}
 */
function getLanguageFromClass(className = '') {
  const match = String(className).match(/(?:^|\s)language-([^\s]+)/);
  return match ? match[1] : '';
}

/**
 * @param {any} node
 * @param {(node: any) => boolean} predicate
 * @returns {any}
 */
function findDescendant(node, predicate) {
  if (!node) {
    return null;
  }
  if (predicate(node)) {
    return node;
  }
  const children = node.children || [];
  for (let index = 0; index < children.length; index += 1) {
    const found = findDescendant(children[index], predicate);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * @param {any} node
 * @returns {any[]}
 */
function getElementChildren(node) {
  return (node?.children || []).filter(isTag);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function isCodeBlockWrapper(node) {
  if (!isTag(node)) {
    return false;
  }
  const attrs = node.attribs || {};
  return attrs['data-type'] === 'codeBlock' || /\bcherry-code-(?:expand|unExpand)\b/.test(attrs.class || '');
}

/**
 * @param {any} node
 * @returns {MiniProgramCodeBlock}
 */
function toCodeBlock(node) {
  const pre = node.name === 'pre' ? node : findDescendant(node, (child) => isTag(child) && child.name === 'pre');
  const code = findDescendant(pre, (child) => isTag(child) && child.name === 'code');
  const wrapperAttrs = sanitizeAttrs(node.attribs || {});
  const preAttrs = sanitizeAttrs(pre?.attribs || {});
  const codeAttrs = sanitizeAttrs(code?.attribs || {});
  const lang =
    wrapperAttrs['data-lang'] || getLanguageFromClass(preAttrs.class) || getLanguageFromClass(codeAttrs.class) || '';
  return {
    type: 'code_block',
    lang,
    text: getText(code || pre || node),
    nodes: nodesToRichTextNodes((code?.children || pre?.children || node.children || []).filter(Boolean)),
    attrs: wrapperAttrs,
  };
}

/**
 * @param {any} node
 * @returns {MiniProgramImage}
 */
function toImage(node) {
  const attrs = sanitizeAttrs(node.attribs || {});
  return {
    type: 'image',
    src: attrs.src || '',
    alt: attrs.alt || '',
    title: attrs.title || '',
    attrs,
  };
}

/**
 * @param {Record<string, string>} attrs
 * @param {any} node
 * @returns {string}
 */
function getMathText(attrs, node) {
  if (attrs['data-formula-source']) {
    return safeDecodeURIComponent(attrs['data-formula-source']);
  }
  if (attrs['data-content']) {
    return safeDecodeURIComponent(attrs['data-content']);
  }
  return getText(node).replace(/^\${1,2}|\${1,2}$/g, '');
}

/**
 * @param {any} node
 * @returns {MiniProgramMathInline}
 */
function toMathInline(node) {
  const attrs = sanitizeAttrs(node.attribs || {});
  return {
    type: 'math_inline',
    text: getMathText(attrs, node),
    attrs,
  };
}

/**
 * @param {any} node
 * @returns {MiniProgramMathBlock}
 */
function toMathBlock(node) {
  const attrs = sanitizeAttrs(node.attribs || {});
  return {
    type: 'math_block',
    text: getMathText(attrs, node),
    display: true,
    attrs,
  };
}

/**
 * @param {MiniProgramCodeBlock} codeBlock
 * @returns {MiniProgramDiagramBlock}
 */
function codeBlockToDiagram(codeBlock) {
  return {
    type: 'diagram',
    kind: 'mermaid',
    text: codeBlock.text || '',
    attrs: codeBlock.attrs || {},
  };
}

/**
 * @param {Record<string, string>} attrs
 * @returns {'left' | 'center' | 'right' | undefined}
 */
function getTableCellAlign(attrs = {}) {
  const align = String(attrs.align || '').toLowerCase();
  if (align === 'left' || align === 'center' || align === 'right') {
    return align;
  }
  const styleAlign = String(attrs.style || '').match(/text-align\s*:\s*(left|center|right)/i);
  return styleAlign ? styleAlign[1].toLowerCase() : undefined;
}

/**
 * @param {any} node
 * @returns {MiniProgramTableCell}
 */
function toTableCell(node) {
  const tagName = String(node.name).toLowerCase();
  const attrs = sanitizeAttrs(node.attribs || {});
  const align = getTableCellAlign(attrs);
  return {
    type: 'table_cell',
    header: tagName === 'th',
    ...(align ? { align } : {}),
    attrs,
    children: nodesToInline(node.children || []),
  };
}

/**
 * @param {any} node
 * @returns {MiniProgramTableRow | null}
 */
function toTableRow(node) {
  const attrs = sanitizeAttrs(node.attribs || {});
  const cells = getElementChildren(node)
    .filter((child) => child.name === 'th' || child.name === 'td')
    .map(toTableCell);
  return cells.length > 0 ? { type: 'table_row', attrs, children: cells } : null;
}

/**
 * @param {any} section
 * @returns {MiniProgramTableRow[]}
 */
function tableSectionToRows(section) {
  const rows = getElementChildren(section)
    .filter((child) => child.name === 'tr')
    .map(toTableRow)
    .filter(Boolean);
  if (rows.length > 0) {
    return rows;
  }
  const directCells = getElementChildren(section).filter((child) => child.name === 'th' || child.name === 'td');
  return directCells.length > 0
    ? [{ type: 'table_row', attrs: sanitizeAttrs(section.attribs || {}), children: directCells.map(toTableCell) }]
    : [];
}

/**
 * @param {any} node
 * @returns {MiniProgramTableBlock}
 */
function toTable(node) {
  const table = node.name === 'table' ? node : findDescendant(node, (child) => isTag(child) && child.name === 'table');
  const attrs = sanitizeAttrs((table || node).attribs || {});
  const sections = getElementChildren(table || node);
  const header = sections.filter((child) => child.name === 'thead').flatMap(tableSectionToRows);
  const bodyRows = sections
    .filter((child) => child.name === 'tbody' || child.name === 'tfoot')
    .flatMap(tableSectionToRows);
  const directRows = sections
    .filter((child) => child.name === 'tr')
    .map(toTableRow)
    .filter(Boolean);
  const directCells = sections.filter((child) => child.name === 'th' || child.name === 'td');
  const standaloneRow =
    directCells.length > 0 ? [{ type: 'table_row', attrs: {}, children: directCells.map(toTableCell) }] : [];

  return {
    type: 'table',
    attrs,
    header,
    rows: [...bodyRows, ...directRows, ...standaloneRow],
  };
}

/**
 * @param {any[]} children
 * @returns {{ checked: boolean; children: any[] } | null}
 */
function extractTaskListInfo(children = []) {
  const markerIndex = children.findIndex((child) => !(isText(child) && child.data.trim() === ''));
  const markerParent = children[markerIndex];
  if (!markerParent) {
    return null;
  }

  const stripMarkerFromInlineChildren = (inlineChildren = []) => {
    const inlineMarkerIndex = inlineChildren.findIndex((child) => !(isText(child) && child.data.trim() === ''));
    const marker = inlineChildren[inlineMarkerIndex];
    if (!isTag(marker) || marker.name !== 'span' || !isTaskMarkerAttrs(marker.attribs || {})) {
      return null;
    }
    const nextChildren = inlineChildren.slice(0, inlineMarkerIndex).concat(inlineChildren.slice(inlineMarkerIndex + 1));
    const nextTextIndex = nextChildren.findIndex((child) => !(isText(child) && child.data === ''));
    const nextText = nextChildren[nextTextIndex];
    if (isText(nextText)) {
      nextChildren[nextTextIndex] = { ...nextText, data: nextText.data.replace(/^\s+/, '') };
    }
    return {
      checked: isCheckedTaskMarkerAttrs(marker.attribs || {}),
      children: nextChildren,
    };
  };

  if (isTag(markerParent) && markerParent.name === 'p') {
    const stripped = stripMarkerFromInlineChildren(markerParent.children || []);
    if (!stripped) {
      return null;
    }
    const nextChildren = children.slice();
    nextChildren[markerIndex] = { ...markerParent, children: stripped.children };
    return { checked: stripped.checked, children: nextChildren };
  }

  const stripped = stripMarkerFromInlineChildren(children);
  return stripped ? { checked: stripped.checked, children: stripped.children } : null;
}

/**
 * @param {MiniProgramInline[]} children
 * @returns {boolean}
 */
function hasVisibleInline(children) {
  return children.some((child) => {
    if (child.type === 'text') {
      return child.text.trim() !== '';
    }
    return true;
  });
}

/**
 * @param {any[]} children
 * @returns {any | null}
 */
function getOnlyImageChild(children = []) {
  const meaningful = children.filter((child) => !(isText(child) && child.data.trim() === ''));
  if (meaningful.length === 1 && isTag(meaningful[0]) && meaningful[0].name === 'img') {
    return meaningful[0];
  }
  return null;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function isBlockLikeNode(node) {
  if (!isTag(node)) {
    return false;
  }
  const tagName = String(node.name).toLowerCase();
  if (tagName === 'img') {
    return true;
  }
  if (isCodeBlockWrapper(node)) {
    return true;
  }
  return BLOCK_TAGS.has(tagName) || FALLBACK_TAGS.has(tagName) || !INLINE_TAGS.has(tagName);
}

/**
 * @param {any[]} children
 * @returns {boolean}
 */
function hasBlockChildren(children = []) {
  return children.some((child) => isBlockLikeNode(child));
}

/**
 * @param {any[]} children
 * @param {MiniProgramTransformOptions} options
 * @returns {MiniProgramBlock[]}
 */
function mixedChildrenToBlocks(children = [], options = {}) {
  /** @type {MiniProgramBlock[]} */
  const blocks = [];
  /** @type {any[]} */
  let inlineBuffer = [];
  const flushInline = () => {
    if (inlineBuffer.length === 0) {
      return;
    }
    const inlineChildren = nodesToInline(inlineBuffer);
    if (hasVisibleInline(inlineChildren)) {
      blocks.push({ type: 'paragraph', children: inlineChildren });
    }
    inlineBuffer = [];
  };
  children.forEach((child) => {
    if (isBlockLikeNode(child)) {
      flushInline();
      blocks.push(...nodeToBlocks(child, options));
    } else {
      inlineBuffer.push(child);
    }
  });
  flushInline();
  return blocks;
}

/**
 * @param {any[]} nodes
 * @returns {MiniProgramInline[]}
 */
function nodesToInline(nodes = []) {
  return nodes.flatMap((node) => nodeToInline(node));
}

/**
 * @param {any} node
 * @returns {MiniProgramInline[]}
 */
function nodeToInline(node) {
  if (!node || isSkippableTag(node)) {
    return [];
  }
  if (isText(node)) {
    return node.data ? [{ type: 'text', text: node.data }] : [];
  }
  if (!isTag(node)) {
    return nodesToInline(node.children || []);
  }
  const tagName = String(node.name).toLowerCase();
  const rawAttrs = node.attribs || {};
  const attrs = sanitizeAttrs(rawAttrs);
  if (tagName === 'br') {
    return [{ type: 'break' }];
  }
  if (tagName === 'img') {
    const image = toImage(node);
    return image.src ? [image] : [];
  }
  if (tagName === 'span' && isCursorAttrs(attrs)) {
    return [{ type: 'cursor' }];
  }
  if (tagName === 'span' && isMathAttrs(rawAttrs)) {
    return [toMathInline(node)];
  }
  const children = nodesToInline(node.children || []);
  switch (tagName) {
    case 'a':
      return [
        {
          type: 'link',
          href: attrs.href || '',
          ...(attrs.title ? { title: attrs.title } : {}),
          attrs,
          children,
        },
      ];
    case 'strong':
    case 'b':
      return [{ type: 'strong', attrs, children }];
    case 'em':
    case 'i':
      return [{ type: 'em', attrs, children }];
    case 'code':
      return [{ type: 'code', attrs, children }];
    case 'u':
      return [{ type: 'underline', attrs, children }];
    case 's':
    case 'del':
      return [{ type: 'strikethrough', attrs, children }];
    case 'sub':
      return [{ type: 'sub', attrs, children }];
    case 'sup':
      return [{ type: 'sup', attrs, children }];
    case 'span':
      return Object.keys(attrs).length > 0 ? [{ type: 'span', attrs, children }] : children;
    default:
      return children;
  }
}

/**
 * @param {any} node
 * @returns {MiniProgramRichTextNode[]}
 */
function nodeToRichTextNodes(node) {
  if (!node || isSkippableTag(node)) {
    return [];
  }
  if (isText(node)) {
    return node.data ? [{ type: 'text', text: node.data }] : [];
  }
  if (!isTag(node)) {
    return nodesToRichTextNodes(node.children || []);
  }
  const tagName = String(node.name).toLowerCase();
  const attrs = withRichTextDefaultStyle(tagName, sanitizeAttrs(node.attribs || {}));
  const children = nodesToRichTextNodes(node.children || []);
  return [
    {
      name: node.name,
      attrs,
      children,
    },
  ];
}

/**
 * @param {any[]} nodes
 * @returns {MiniProgramRichTextNode[]}
 */
function nodesToRichTextNodes(nodes = []) {
  return nodes.flatMap((node) => nodeToRichTextNodes(node));
}

/**
 * @param {any} node
 * @returns {MiniProgramHtmlBlock[]}
 */
function toHtmlFallback(node) {
  const nodes = nodeToRichTextNodes(node);
  return nodes.length > 0 ? [{ type: 'html', nodes }] : [];
}

/**
 * @param {any} node
 * @param {MiniProgramTransformOptions} options
 * @returns {MiniProgramBlock[]}
 */
function nodeToBlocks(node, options = {}) {
  if (!node || isSkippableTag(node)) {
    return [];
  }
  if (isText(node)) {
    if (node.data.trim() === '') {
      return [];
    }
    return [{ type: 'paragraph', children: [{ type: 'text', text: node.data }] }];
  }
  if (!isTag(node)) {
    return mixedChildrenToBlocks(node.children || [], options);
  }
  const tagName = String(node.name).toLowerCase();
  const rawAttrs = node.attribs || {};
  const attrs = sanitizeAttrs(rawAttrs);
  if (tagName === 'div' && isMathAttrs(rawAttrs)) {
    return [toMathBlock(node)];
  }
  if (isCodeBlockWrapper(node) || tagName === 'pre') {
    const codeBlock = toCodeBlock(node);
    return String(codeBlock.lang || '').toLowerCase() === 'mermaid' ? [codeBlockToDiagram(codeBlock)] : [codeBlock];
  }
  if (/^h[1-6]$/.test(tagName)) {
    return [{ type: 'heading', level: Number(tagName[1]), attrs, children: nodesToInline(node.children || []) }];
  }
  if (tagName === 'img') {
    const image = toImage(node);
    return image.src ? [image] : [];
  }
  if (tagName === 'blockquote') {
    return [{ type: 'blockquote', attrs, children: mixedChildrenToBlocks(node.children || [], options) }];
  }
  if (tagName === 'table') {
    return [toTable(node)];
  }
  if (tagName === 'ul' || tagName === 'ol') {
    /** @type {MiniProgramListItem[]} */
    const children = (node.children || [])
      .filter((child) => isTag(child) && child.name === 'li')
      .map((child) => {
        const taskListInfo = extractTaskListInfo(child.children || []);
        return {
          type: 'list_item',
          attrs: sanitizeAttrs(child.attribs || {}),
          ...(taskListInfo ? { checked: taskListInfo.checked } : {}),
          children: mixedChildrenToBlocks(taskListInfo?.children || child.children || [], options),
        };
      });
    return [{ type: 'list', ordered: tagName === 'ol', attrs, children }];
  }
  if (tagName === 'li') {
    const taskListInfo = extractTaskListInfo(node.children || []);
    return [
      {
        type: 'list_item',
        attrs,
        ...(taskListInfo ? { checked: taskListInfo.checked } : {}),
        children: mixedChildrenToBlocks(taskListInfo?.children || node.children || [], options),
      },
    ];
  }
  if (tagName === 'p' || tagName === 'div') {
    const onlyImage = getOnlyImageChild(node.children || []);
    if (onlyImage) {
      const image = toImage(onlyImage);
      return image.src ? [image] : [];
    }
    if (hasBlockChildren(node.children || [])) {
      return mixedChildrenToBlocks(node.children || [], options);
    }
    const children = nodesToInline(node.children || []);
    return hasVisibleInline(children) ? [{ type: 'paragraph', attrs, children }] : [];
  }
  if (FALLBACK_TAGS.has(tagName)) {
    return toHtmlFallback(node);
  }
  switch (options.unknownTag || 'html') {
    case 'unwrap':
      return mixedChildrenToBlocks(node.children || [], options);
    case 'drop':
      return [];
    case 'html':
    default:
      return toHtmlFallback(node);
  }
}

/**
 * Converts Cherry-rendered HTML into a MiniProgram-friendly block AST.
 * @param {string} html HTML generated by Cherry.
 * @param {MiniProgramTransformOptions} [options]
 * @returns {MiniProgramBlock[]}
 */
export function htmlToMiniProgramBlocks(html, options = {}) {
  if (typeof html !== 'string' || html.length === 0) {
    return [];
  }
  const doc = htmlparser2.parseDocument(html, { decodeEntities: true });
  return mixedChildrenToBlocks(doc.children || [], options);
}

/**
 * Converts markdown through a Cherry engine instance and returns MiniProgram blocks.
 * @param {{ makeHtml: (markdown: string, returnType?: string, forceNoCursor?: boolean) => string }} engine Cherry Engine instance.
 * @param {string} markdown Markdown source.
 * @param {MiniProgramTransformOptions} [options]
 * @returns {MiniProgramBlock[]}
 */
export function markdownToMiniProgramBlocks(engine, markdown, options = {}) {
  if (!engine || typeof engine.makeHtml !== 'function') {
    throw new Error('markdownToMiniProgramBlocks requires a Cherry engine instance.');
  }
  const html = engine.makeHtml(markdown, 'string', !!options.forceNoCursor);
  return htmlToMiniProgramBlocks(html, options);
}

export default htmlToMiniProgramBlocks;
