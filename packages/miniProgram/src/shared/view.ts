import { nativeInlineStyle } from '../native/theme';
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
  MiniProgramListBlock,
  MiniProgramTableRow,
  MiniProgramMathBlock,
  MiniProgramRichTextNode,
  MiniProgramBlock,
  MiniProgramViewOptions,
  MiniProgramMathInlineRun,
  MiniProgramImageRun,
  MiniProgramImagePlaceholderRun,
  MiniProgramInlineRun,
  MiniProgramTableRowView,
  MiniProgramCodeRun,
  MiniProgramMathViewBlock,
  MiniProgramViewBlock,
} from '../types';
const DEFAULT_INLINE_CLASS: Record<string, string> = {
  mark: 'md-highlight',
  strong: 'md-strong',
  em: 'md-em',
  code: 'md-inline-code',
  underline: 'md-underline',
  strikethrough: 'md-strike',
  sub: 'md-sub',
  sup: 'md-sup',
  math_inline: 'md-math-inline',
};

const CODE_TOKEN_CLASS: Record<string, string> = {
  comment: 'md-code-comment',
  keyword: 'md-code-keyword',
  number: 'md-code-number',
  operator: 'md-code-operator',
  punctuation: 'md-code-punctuation',
  string: 'md-code-string',
  text: 'md-code-token',
};

const PRISM_TOKEN_CLASS_MAP: Record<string, string> = {
  comment: 'md-code-comment',
  keyword: 'md-code-keyword',
  number: 'md-code-number',
  operator: 'md-code-operator',
  punctuation: 'md-code-punctuation',
  string: 'md-code-string',
  text: 'md-code-token',
};

function joinClass(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function getInlineClass(type: string, options: MiniProgramViewOptions = {}) {
  return options.inlineClassMap?.[type] || DEFAULT_INLINE_CLASS[type] || '';
}

function toImageRun(
  node: MiniProgramImage,
  options: MiniProgramViewOptions = {},
): MiniProgramImageRun | MiniProgramImagePlaceholderRun {
  const src = node.src || '';
  if (options.deferImages === false) {
    return { type: 'image', src, alt: node.alt || '' };
  }
  return {
    type: 'image_placeholder',
    src,
    alt: node.alt || '',
    text: options.imagePlaceholderText || node.alt || '图片加载中',
  };
}

function toMathInlineRun(node: MiniProgramMathInline, className = ''): MiniProgramMathInlineRun {
  const source = node.text || '';
  return {
    type: 'math_inline',
    text: `$${source}$`,
    source,
    className,
  };
}

function toMathBlockView(block: MiniProgramMathBlock): MiniProgramMathViewBlock {
  const source = block.text || '';
  return {
    type: 'math_block',
    text: `$$\n${source}\n$$`,
    source,
    display: block.display !== false,
  };
}

function joinNonEmptyClasses(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function normalizeCodeClass(className = '') {
  const classes = String(className).split(/\s+/).filter(Boolean);
  if (classes.includes('code-line')) {
    return '';
  }
  if (classes.length === 0) {
    return CODE_TOKEN_CLASS.text;
  }
  const tokenType = classes.find((item) => item !== 'token' && PRISM_TOKEN_CLASS_MAP[item]);
  if (!tokenType) {
    return classes.join(' ');
  }
  return joinNonEmptyClasses(CODE_TOKEN_CLASS.text, PRISM_TOKEN_CLASS_MAP[tokenType]);
}

function codeNodesToRuns(nodes: MiniProgramRichTextNode[] = [], inheritedClass = ''): MiniProgramCodeRun[] {
  const runs: MiniProgramCodeRun[] = [];

  const walk = (node: MiniProgramRichTextNode, className = inheritedClass): void => {
    if (!node) {
      return;
    }

    if ('type' in node && node.type === 'text') {
      if (node.text) {
        runs.push({ text: node.text, className: className || CODE_TOKEN_CLASS.text });
      }
      return;
    }

    if (!('name' in node)) return;
    if (node.name === 'br') {
      runs.push({ text: '\n', className: className || CODE_TOKEN_CLASS.text });
      return;
    }

    const nextClass = joinNonEmptyClasses(className, normalizeCodeClass(node.attrs?.class));
    (node.children || []).forEach((child) => walk(child, nextClass));
  };

  nodes.forEach((node) => walk(node, inheritedClass));
  return runs;
}

function taskMarkerText(item: MiniProgramListItem, list: MiniProgramListBlock, itemIndex: number) {
  if (typeof item.checked === 'boolean') {
    return item.checked ? '\u2611 ' : '\u2610 ';
  }
  return `${list.ordered ? `${itemIndex + 1}.` : '\u2022'} `;
}

function tableRowToView(row: MiniProgramTableRow, options: MiniProgramViewOptions = {}): MiniProgramTableRowView {
  return {
    cells: (row.children || []).map((cell) => ({
      header: cell.header,
      align: cell.align || '',
      inlines: inlineNodesToRuns(cell.children || [], options),
    })),
  };
}

export function inlineNodesToRuns(
  nodes: MiniProgramInline[] = [],
  options: MiniProgramViewOptions = {},
  className = '',
  href = '',
  style = '',
): MiniProgramInlineRun[] {
  return nodes.reduce<MiniProgramInlineRun[]>((runs, node) => {
    if (!node) {
      return runs;
    }

    if ('type' in node && node.type === 'text') {
      if (node.text) {
        runs.push({ type: href ? 'link' : 'text', text: node.text, className, href, ...(style ? { style } : {}) });
      }
      return runs;
    }

    if (node.type === 'break') {
      runs.push({ type: 'text', text: '\n', className, href });
      return runs;
    }

    if (node.type === 'cursor') {
      runs.push({ type: 'cursor' });
      return runs;
    }

    if (node.type === 'image') {
      runs.push(toImageRun(node, options));
      return runs;
    }

    if (node.type === 'math_inline') {
      runs.push(toMathInlineRun(node, joinClass(className, getInlineClass('math_inline', options))));
      return runs;
    }

    if (node.type === 'ruby')
      return runs.concat(inlineNodesToRuns(node.children, options, className, href, style), [
        { type: 'text', text: `（${node.annotation}）`, className: 'md-ruby-annotation', href },
      ]);
    if (node.type === 'link') {
      return runs.concat(
        inlineNodesToRuns(
          node.children || [],
          options,
          joinClass(className, 'md-link'),
          node.href || '',
          nativeInlineStyle(node.attrs?.style, style),
        ),
      );
    }

    return runs.concat(
      inlineNodesToRuns(
        node.children || [],
        options,
        joinClass(className, getInlineClass(node.type, options)),
        href,
        nativeInlineStyle(node.attrs?.style, style),
      ),
    );
  }, []);
}

export function blocksToMiniProgramView(
  blocks: MiniProgramBlock[] = [],
  options: MiniProgramViewOptions = {},
): MiniProgramViewBlock[] {
  return blocks.map((block): MiniProgramViewBlock => {
    if (block.type === 'panel' || block.type === 'detail')
      return { ...block, children: blocksToMiniProgramView(block.children, options) };
    if (block.type === 'paragraph') {
      return { type: 'paragraph', inlines: inlineNodesToRuns(block.children || [], options) };
    }

    if (block.type === 'heading') {
      return { type: 'heading', level: block.level, inlines: inlineNodesToRuns(block.children || [], options) };
    }

    if (block.type === 'blockquote') {
      return { type: 'blockquote', children: blocksToMiniProgramView(block.children || [], options) };
    }

    if (block.type === 'list') {
      return {
        type: 'list',
        ordered: block.ordered,
        children: (block.children || []).map((item, itemIndex) => {
          const task = typeof item.checked === 'boolean';
          const marker = taskMarkerText(item, block, itemIndex).trim();
          return {
            task,
            marker,
            ...(task ? { checked: item.checked } : {}),
            children: blocksToMiniProgramView(item.children || [], options),
          };
        }),
      };
    }

    if (block.type === 'table') {
      return {
        type: 'table',
        header: (block.header || []).map((row) => tableRowToView(row, options)),
        rows: (block.rows || []).map((row) => tableRowToView(row, options)),
      };
    }

    if (block.type === 'code_block') {
      const lang = block.lang || 'text';
      const text = block.text || '';
      const runs = block.tokens
        ? block.tokens.map((token) => ({
            text: token.text,
            className: joinNonEmptyClasses(CODE_TOKEN_CLASS.text, PRISM_TOKEN_CLASS_MAP[token.type] || ''),
          }))
        : block.nodes && block.nodes.length > 0
          ? codeNodesToRuns(block.nodes)
          : [{ text, className: CODE_TOKEN_CLASS.text }];
      return { type: 'code_block', lang, text, runs };
    }

    if (block.type === 'math_block') {
      return toMathBlockView(block);
    }

    if (block.type === 'diagram') {
      return { type: 'diagram', kind: block.kind || 'mermaid', text: block.text || '' };
    }

    if (block.type === 'image') {
      return toImageRun(block, options);
    }

    if (block.type === 'list_item')
      return { type: 'blockquote', children: blocksToMiniProgramView(block.children, options) };
    return { ...block };
  });
}
