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
import type {
  MiniProgramImage,
  MiniProgramMathInline,
  MiniProgramInline,
  MiniProgramListItem,
  MiniProgramTableCell,
  MiniProgramTableRow,
  MiniProgramTableBlock,
  MiniProgramCodeBlock,
  MiniProgramMathBlock,
  MiniProgramDiagramBlock,
  MiniProgramRichTextNode,
  MiniProgramUnsupportedBlock,
  MiniProgramBlock,
  MiniProgramTransformOptions,
  MiniProgramEngine,
} from '../types';
import * as htmlparser2 from 'htmlparser2';
type AnyNode = ReturnType<typeof htmlparser2.parseDocument>['children'][number];
type Element = ReturnType<typeof htmlparser2.DomUtils.getElementsByTagName>[number];
type Text = Extract<AnyNode, { type: typeof htmlparser2.ElementType.Text }>;

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

const RICH_TEXT_TABLE_STYLE: Record<string, string> = {
  table:
    'width:100%;border-collapse:collapse;border-spacing:0;background:#fff;margin:8px 0;font-size:14px;line-height:1.6;',
  th: 'border:1px solid #d0d7de;background:#f6f8fa;color:#24292f;font-weight:600;padding:6px 8px;text-align:left;',
  td: 'border:1px solid #d0d7de;color:#24292f;padding:6px 8px;text-align:left;',
};

function isTag(node: AnyNode | null | undefined): node is Element {
  return !!node && (node.type === 'tag' || node.type === 'script' || node.type === 'style');
}

function isText(node: AnyNode | null | undefined): node is Text {
  return !!node && node.type === 'text';
}

function isSkippableTag(node: AnyNode) {
  return isTag(node) && SKIP_TAGS.has(String(node.name).toLowerCase());
}

function sanitizeAttrs(attrs: Record<string, string> = {}) {
  const safeAttrs: Record<string, string> = {};
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

function withRichTextDefaultStyle(tagName: string, attrs: Record<string, string> = {}) {
  const defaultStyle = RICH_TEXT_TABLE_STYLE[tagName];
  if (!defaultStyle) {
    return attrs;
  }
  return {
    ...attrs,
    style: attrs.style ? `${defaultStyle}${attrs.style}` : defaultStyle,
  };
}

function isCursorAttrs(attrs: Record<string, string> = {}) {
  return /\bcherry-flow-session-cursor\b/.test(attrs.class || '');
}

function isTaskMarkerAttrs(attrs: Record<string, string> = {}) {
  return /\bch-icon\b/.test(attrs.class || '') && /\bch-icon-(?:check|square)\b/.test(attrs.class || '');
}

function isCheckedTaskMarkerAttrs(attrs: Record<string, string> = {}) {
  return /\bch-icon-check\b/.test(attrs.class || '');
}

function isMathAttrs(attrs: Record<string, string> = {}) {
  return attrs['data-type'] === 'mathBlock' || /\bCherry-(?:InlineMath|Math)\b/.test(attrs.class || '');
}

function safeDecodeURIComponent(value = '') {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getText(node: AnyNode): string {
  if (!node) {
    return '';
  }
  if (isSkippableTag(node)) return '';
  if (isText(node)) {
    return node.data || '';
  }
  return ('children' in node ? node.children : []).map(getText).join('');
}

function getLanguageFromClass(className = '') {
  const match = String(className).match(/(?:^|\s)language-([^\s]+)/);
  return match ? match[1] : '';
}

function findDescendant(node: AnyNode | null | undefined, predicate: (node: Element) => boolean): Element | null {
  if (!node) {
    return null;
  }
  if (isTag(node) && predicate(node)) {
    return node;
  }
  const children = 'children' in node ? node.children : [];
  for (let index = 0; index < children.length; index += 1) {
    const found = findDescendant(children[index], predicate);
    if (found) {
      return found;
    }
  }
  return null;
}

function getElementChildren(node: AnyNode | null | undefined): Element[] {
  return (node && 'children' in node ? node.children : []).filter(isTag);
}

function isCodeBlockWrapper(node: AnyNode) {
  if (!isTag(node)) {
    return false;
  }
  const attrs = node.attribs || {};
  return attrs['data-type'] === 'codeBlock' || /\bcherry-code-(?:expand|unExpand)\b/.test(attrs.class || '');
}

function toCodeBlock(node: Element): MiniProgramCodeBlock {
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

function toImage(node: Element): MiniProgramImage {
  const attrs = sanitizeAttrs(node.attribs || {});
  return {
    type: 'image',
    src: attrs.src || '',
    alt: attrs.alt || '',
    title: attrs.title || '',
    attrs,
  };
}

function getMathText(attrs: Record<string, string>, node: AnyNode): string {
  if (attrs['data-formula-source']) {
    return safeDecodeURIComponent(attrs['data-formula-source']);
  }
  if (attrs['data-content']) {
    return safeDecodeURIComponent(attrs['data-content']);
  }
  return getText(node).replace(/^\${1,2}|\${1,2}$/g, '');
}

function toMathInline(node: Element): MiniProgramMathInline {
  const attrs = sanitizeAttrs(node.attribs || {});
  return {
    type: 'math_inline',
    text: getMathText(attrs, node),
    attrs,
  };
}

function toMathBlock(node: Element): MiniProgramMathBlock {
  const attrs = sanitizeAttrs(node.attribs || {});
  return {
    type: 'math_block',
    text: getMathText(attrs, node),
    display: true,
    attrs,
  };
}

function codeBlockToDiagram(codeBlock: MiniProgramCodeBlock): MiniProgramDiagramBlock {
  return {
    type: 'diagram',
    kind: 'mermaid',
    text: codeBlock.text || '',
    attrs: codeBlock.attrs || {},
  };
}

function getTableCellAlign(attrs: Record<string, string> = {}): 'left' | 'center' | 'right' | undefined {
  const align = String(attrs.align || '').toLowerCase();
  if (align === 'left' || align === 'center' || align === 'right') {
    return align;
  }
  const styleAlign = String(attrs.style || '').match(/text-align\s*:\s*(left|center|right)/i);
  return styleAlign ? (styleAlign[1].toLowerCase() as 'left' | 'center' | 'right') : undefined;
}

function toTableCell(node: Element): MiniProgramTableCell {
  const tagName = String(node.name).toLowerCase();
  const attrs = sanitizeAttrs(node.attribs || {});
  const align = getTableCellAlign(attrs);
  return {
    type: 'table_cell',
    header: tagName === 'th',
    ...(align ? { align } : {}),
    attrs,
    children: nodesToInline('children' in node ? node.children : []),
  };
}

function toTableRow(node: Element): MiniProgramTableRow | null {
  const attrs = sanitizeAttrs(node.attribs || {});
  const cells = getElementChildren(node)
    .filter((child) => child.name === 'th' || child.name === 'td')
    .map(toTableCell);
  return cells.length > 0 ? { type: 'table_row', attrs, children: cells } : null;
}

function tableSectionToRows(section: Element): MiniProgramTableRow[] {
  const rows = getElementChildren(section)
    .filter((child) => child.name === 'tr')
    .map(toTableRow)
    .filter((row): row is MiniProgramTableRow => row !== null);
  if (rows.length > 0) {
    return rows;
  }
  const directCells = getElementChildren(section).filter((child) => child.name === 'th' || child.name === 'td');
  return directCells.length > 0
    ? [{ type: 'table_row', attrs: sanitizeAttrs(section.attribs || {}), children: directCells.map(toTableCell) }]
    : [];
}

function toTable(node: Element): MiniProgramTableBlock {
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
    .filter((row): row is MiniProgramTableRow => row !== null);
  const directCells = sections.filter((child) => child.name === 'th' || child.name === 'td');
  const standaloneRow: MiniProgramTableRow[] =
    directCells.length > 0 ? [{ type: 'table_row', attrs: {}, children: directCells.map(toTableCell) }] : [];

  return {
    type: 'table',
    attrs,
    header,
    rows: [...bodyRows, ...directRows, ...standaloneRow],
  };
}

function extractTaskListInfo(children: AnyNode[] = []) {
  const markerIndex = children.findIndex((child) => !(isText(child) && child.data.trim() === ''));
  const markerParent = children[markerIndex];
  if (!markerParent) {
    return null;
  }

  const stripMarkerFromInlineChildren = (inlineChildren: AnyNode[] = []) => {
    const inlineMarkerIndex = inlineChildren.findIndex((child) => !(isText(child) && child.data.trim() === ''));
    const marker = inlineChildren[inlineMarkerIndex];
    if (!isTag(marker) || marker.name !== 'span' || !isTaskMarkerAttrs(marker.attribs || {})) {
      return null;
    }
    const nextChildren = inlineChildren.slice(0, inlineMarkerIndex).concat(inlineChildren.slice(inlineMarkerIndex + 1));
    const nextTextIndex = nextChildren.findIndex((child) => !(isText(child) && child.data === ''));
    const nextText = nextChildren[nextTextIndex];
    if (isText(nextText)) {
      const trimmed = nextText.cloneNode();
      trimmed.data = nextText.data.replace(/^\s+/, '');
      nextChildren[nextTextIndex] = trimmed;
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
    const paragraph = markerParent.cloneNode(false);
    paragraph.children = stripped.children;
    nextChildren[markerIndex] = paragraph;
    return { checked: stripped.checked, children: nextChildren };
  }

  const stripped = stripMarkerFromInlineChildren(children);
  return stripped ? { checked: stripped.checked, children: stripped.children } : null;
}

function hasVisibleInline(children: MiniProgramInline[]) {
  return children.some((child) => {
    if (child.type === 'text') {
      return child.text.trim() !== '';
    }
    return true;
  });
}

function getOnlyImageChild(children: AnyNode[] = []) {
  const meaningful = children.filter((child) => !(isText(child) && child.data.trim() === ''));
  if (meaningful.length === 1 && isTag(meaningful[0]) && meaningful[0].name === 'img') {
    return meaningful[0];
  }
  return null;
}

function isBlockLikeNode(node: AnyNode) {
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

function hasBlockChildren(children: AnyNode[] = []) {
  return children.some((child) => isBlockLikeNode(child));
}

function mixedChildrenToBlocks(
  children: AnyNode[] = [],
  options: MiniProgramTransformOptions = {},
): MiniProgramBlock[] {
  const blocks: MiniProgramBlock[] = [];

  let inlineBuffer: AnyNode[] = [];
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

function nodesToInline(nodes: AnyNode[] = []): MiniProgramInline[] {
  return nodes.flatMap((node) => nodeToInline(node));
}

function nodeToInline(node: AnyNode): MiniProgramInline[] {
  if (!node || isSkippableTag(node)) {
    return [];
  }
  if (isText(node)) {
    return node.data ? [{ type: 'text', text: node.data }] : [];
  }
  if (!isTag(node)) {
    return nodesToInline('children' in node ? node.children : []);
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
  const children = nodesToInline('children' in node ? node.children : []);
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

function nodeToRichTextNodes(node: AnyNode): MiniProgramRichTextNode[] {
  if (!node || isSkippableTag(node)) {
    return [];
  }
  if (isText(node)) {
    return node.data ? [{ type: 'text', text: node.data }] : [];
  }
  if (!isTag(node)) {
    return nodesToRichTextNodes('children' in node ? node.children : []);
  }
  const tagName = String(node.name).toLowerCase();
  const attrs = withRichTextDefaultStyle(tagName, sanitizeAttrs(node.attribs || {}));
  const children = nodesToRichTextNodes('children' in node ? node.children : []);
  return [
    {
      name: node.name,
      attrs,
      children,
    },
  ];
}

function nodesToRichTextNodes(nodes: AnyNode[] = []): MiniProgramRichTextNode[] {
  return nodes.flatMap((node) => nodeToRichTextNodes(node));
}

function toUnsupported(node: Element): MiniProgramUnsupportedBlock[] {
  return [{ type: 'unsupported', tag: node.name, text: getText(node) }];
}

function nodeToBlocks(node: AnyNode, options: MiniProgramTransformOptions = {}): MiniProgramBlock[] {
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
    return mixedChildrenToBlocks('children' in node ? node.children : [], options);
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
    return [
      {
        type: 'heading',
        level: Number(tagName[1]),
        attrs,
        children: nodesToInline('children' in node ? node.children : []),
      },
    ];
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
    const children = getElementChildren(node)
      .filter((child) => child.name === 'li')
      .map((child): MiniProgramListItem => {
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
    const taskListInfo = extractTaskListInfo('children' in node ? node.children : []);
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
    const onlyImage = getOnlyImageChild('children' in node ? node.children : []);
    if (onlyImage) {
      const image = toImage(onlyImage);
      return image.src ? [image] : [];
    }
    if (hasBlockChildren('children' in node ? node.children : [])) {
      return mixedChildrenToBlocks('children' in node ? node.children : [], options);
    }
    const children = nodesToInline('children' in node ? node.children : []);
    return hasVisibleInline(children) ? [{ type: 'paragraph', attrs, children }] : [];
  }
  if (tagName === 'hr') {
    return [{ type: 'thematic_break' }];
  }
  switch (options.unknownTag || 'text') {
    case 'unwrap':
      return mixedChildrenToBlocks('children' in node ? node.children : [], options);
    case 'drop':
      return [];
    case 'text':
    default:
      return toUnsupported(node);
  }
}

export function htmlToMiniProgramBlocks(html: string, options: MiniProgramTransformOptions = {}): MiniProgramBlock[] {
  if (typeof html !== 'string' || html.length === 0) {
    return [];
  }
  const doc = htmlparser2.parseDocument(html, { decodeEntities: true });
  return mixedChildrenToBlocks(doc.children || [], options);
}

export function markdownToMiniProgramBlocks(
  engine: MiniProgramEngine,
  markdown: string,
  options: MiniProgramTransformOptions = {},
): MiniProgramBlock[] {
  if (!engine || typeof engine.makeHtml !== 'function') {
    throw new Error('markdownToMiniProgramBlocks requires a Cherry engine instance.');
  }
  const html = engine.makeHtml(markdown, 'string', !!options.forceNoCursor);
  return htmlToMiniProgramBlocks(html, options);
}

export default htmlToMiniProgramBlocks;
