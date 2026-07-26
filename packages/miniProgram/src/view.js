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

const DEFAULT_INLINE_CLASS = {
  strong: 'md-strong',
  em: 'md-em',
  code: 'md-inline-code',
  underline: 'md-underline',
  strikethrough: 'md-strike',
  sub: 'md-sub',
  sup: 'md-sup',
  math_inline: 'md-math-inline',
};

const CODE_TOKEN_CLASS = {
  comment: 'md-code-comment',
  keyword: 'md-code-keyword',
  number: 'md-code-number',
  operator: 'md-code-operator',
  punctuation: 'md-code-punctuation',
  string: 'md-code-string',
  text: 'md-code-token',
};

const CODE_TOKEN_PATTERN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|class|new|import|export|from|async|await|try|catch|throw|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b|[{}()[\],.;:]|[+\-*/%=<>!&|]+)/g;

const PRISM_TOKEN_CLASS_MAP = {
  comment: 'md-code-comment',
  keyword: 'md-code-keyword',
  number: 'md-code-number',
  operator: 'md-code-operator',
  punctuation: 'md-code-punctuation',
  string: 'md-code-string',
  text: 'md-code-token',
};

/**
 * @typedef {{ inlineClassMap?: Record<string, string>; deferImages?: boolean; imagePlaceholderText?: string }} MiniProgramViewOptions
 * @typedef {{ type: 'text' | 'link'; text: string; className?: string; href?: string }} MiniProgramTextRun
 * @typedef {{ type: 'math_inline'; text: string; source: string; className?: string }} MiniProgramMathInlineRun
 * @typedef {{ type: 'cursor' }} MiniProgramCursorRun
 * @typedef {{ type: 'image'; src: string; pendingSrc?: string; alt?: string }} MiniProgramImageRun
 * @typedef {{ type: 'image_placeholder'; src: string; alt?: string; text: string }} MiniProgramImagePlaceholderRun
 * @typedef {MiniProgramTextRun | MiniProgramMathInlineRun | MiniProgramCursorRun | MiniProgramImageRun | MiniProgramImagePlaceholderRun} MiniProgramInlineRun
 * @typedef {{ type: 'paragraph'; inlines: MiniProgramInlineRun[] }} MiniProgramParagraphViewBlock
 * @typedef {{ type: 'heading'; level: number; inlines: MiniProgramInlineRun[] }} MiniProgramHeadingViewBlock
 * @typedef {{ type: 'blockquote'; children: MiniProgramViewBlock[] }} MiniProgramBlockquoteViewBlock
 * @typedef {{ type: 'list'; ordered: boolean; children: Array<{ task: boolean; marker: string; checked?: boolean; inlines: MiniProgramInlineRun[] }> }} MiniProgramListViewBlock
 * @typedef {{ header: boolean; align?: 'left' | 'center' | 'right'; inlines: MiniProgramInlineRun[] }} MiniProgramTableCellView
 * @typedef {{ cells: MiniProgramTableCellView[] }} MiniProgramTableRowView
 * @typedef {{ type: 'table'; header: MiniProgramTableRowView[]; rows: MiniProgramTableRowView[] }} MiniProgramTableViewBlock
 * @typedef {{ type: 'code_block'; lang: string; text: string }} MiniProgramCodeViewBlock
 * @typedef {{ type: 'math_block'; text: string; source: string; display: boolean }} MiniProgramMathViewBlock
 * @typedef {{ type: 'diagram'; kind: 'mermaid'; text: string }} MiniProgramDiagramViewBlock
 * @typedef {MiniProgramParagraphViewBlock | MiniProgramHeadingViewBlock | MiniProgramBlockquoteViewBlock | MiniProgramListViewBlock | MiniProgramTableViewBlock | MiniProgramCodeViewBlock | MiniProgramMathViewBlock | MiniProgramDiagramViewBlock | MiniProgramImageRun | MiniProgramImagePlaceholderRun | import('./transform').MiniProgramHtmlBlock} MiniProgramViewBlock
 */

function joinClass(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getInlineClass(type, options = {}) {
  return options.inlineClassMap?.[type] || DEFAULT_INLINE_CLASS[type] || '';
}

function toImageRun(node, options = {}) {
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

function toMathInlineRun(node, className = '') {
  const source = node.text || '';
  return {
    type: 'math_inline',
    text: `$${source}$`,
    source,
    className,
  };
}

function toMathBlockView(block) {
  const source = block.text || '';
  return {
    type: 'math_block',
    text: `$$\n${source}\n$$`,
    source,
    display: block.display !== false,
  };
}

function joinNonEmptyClasses(...classes) {
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

function getCodeTokenType(token) {
  if (/^(?:\/\/|\/\*)/.test(token)) {
    return 'comment';
  }
  if (/^['"`]/.test(token)) {
    return 'string';
  }
  if (/^\d/.test(token)) {
    return 'number';
  }
  if (/^[{}()[\],.;:]$/.test(token)) {
    return 'punctuation';
  }
  if (/^[+\-*/%=<>!&|]+$/.test(token)) {
    return 'operator';
  }
  if (
    /^(?:const|let|var|function|return|if|else|for|while|class|new|import|export|from|async|await|try|catch|throw|true|false|null|undefined)$/.test(
      token,
    )
  ) {
    return 'keyword';
  }
  return 'text';
}

function codeToRuns(text = '', lang = '') {
  const shouldHighlight = /^(js|javascript|ts|typescript|json|text)?$/i.test(lang || '');
  if (!shouldHighlight) {
    return [{ text, className: CODE_TOKEN_CLASS.text }];
  }

  const runs = [];
  let lastIndex = 0;
  String(text).replace(CODE_TOKEN_PATTERN, (token, match, index) => {
    if (index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, index), className: CODE_TOKEN_CLASS.text });
    }
    const type = getCodeTokenType(token);
    runs.push({ text: token, className: `${CODE_TOKEN_CLASS.text} ${CODE_TOKEN_CLASS[type]}` });
    lastIndex = index + token.length;
    return token;
  });

  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex), className: CODE_TOKEN_CLASS.text });
  }

  return runs;
}

function codeNodesToRuns(nodes = [], inheritedClass = '') {
  /** @type {Array<Record<string, any>>} */
  const runs = [];

  const walk = (node, className = inheritedClass) => {
    if (!node) {
      return;
    }

    if (node.type === 'text') {
      if (node.text) {
        runs.push({ text: node.text, className: className || CODE_TOKEN_CLASS.text });
      }
      return;
    }

    if (node.name === 'br') {
      runs.push({ text: '\n', className: className || CODE_TOKEN_CLASS.text });
      return;
    }

    const nextClass = joinNonEmptyClasses(className, normalizeCodeClass(node.attrs?.class));
    (node.children || []).forEach((child) => walk(child, nextClass));
  };

  nodes.forEach((node) => walk(node, inheritedClass));
  return runs.length > 0 ? runs : codeToRuns('', '');
}

function taskMarkerText(item, list, itemIndex) {
  if (typeof item.checked === 'boolean') {
    return item.checked ? '\u2611 ' : '\u2610 ';
  }
  return `${list.ordered ? `${itemIndex + 1}.` : '\u2022'} `;
}

/**
 * @param {import('./transform').MiniProgramTableRow} row
 * @param {{ inlineClassMap?: Record<string, string>; deferImages?: boolean; imagePlaceholderText?: string }} [options]
 * @returns {Record<string, any>}
 */
function tableRowToView(row, options = {}) {
  return {
    cells: (row.children || []).map((cell) => ({
      header: cell.header,
      align: cell.align || '',
      inlines: inlineNodesToRuns(cell.children || [], options),
    })),
  };
}

/**
 * Flattens MiniProgram inline AST nodes into simple WXML-friendly runs.
 * @param {import('./transform').MiniProgramInline[]} nodes
 * @param {{ inlineClassMap?: Record<string, string>; deferImages?: boolean; imagePlaceholderText?: string }} [options]
 * @param {string} [className]
 * @param {string} [href]
 * @returns {Array<Record<string, any>>}
 */
export function inlineNodesToRuns(nodes = [], options = {}, className = '', href = '') {
  return nodes.reduce((runs, node) => {
    if (!node) {
      return runs;
    }

    if (node.type === 'text') {
      if (node.text) {
        runs.push({ type: href ? 'link' : 'text', text: node.text, className, href });
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

    if (node.type === 'link') {
      return runs.concat(
        inlineNodesToRuns(node.children || [], options, joinClass(className, 'md-link'), node.href || ''),
      );
    }

    return runs.concat(
      inlineNodesToRuns(node.children || [], options, joinClass(className, getInlineClass(node.type, options)), href),
    );
  }, []);
}

/**
 * @param {import('./transform').MiniProgramBlock[]} blocks
 * @param {{ inlineClassMap?: Record<string, string>; deferImages?: boolean; imagePlaceholderText?: string }} [options]
 * @returns {Array<Record<string, any>>}
 */
export function blocksToInlineRuns(blocks = [], options = {}) {
  return blocks.reduce((runs, block, index) => {
    if (index > 0) {
      runs.push({ type: 'text', text: '\n' });
    }

    if (block.type === 'paragraph' || block.type === 'heading') {
      return runs.concat(inlineNodesToRuns(block.children || [], options));
    }

    if (block.type === 'code_block') {
      runs.push({ type: 'text', text: block.text || '', className: getInlineClass('code', options) });
      return runs;
    }

    if (block.type === 'math_block') {
      runs.push({
        type: 'math_inline',
        text: `$$${block.text || ''}$$`,
        source: block.text || '',
        className: 'md-math-inline',
      });
      return runs;
    }

    if (block.type === 'diagram') {
      runs.push({ type: 'text', text: block.text || '', className: getInlineClass('code', options) });
      return runs;
    }

    if (block.type === 'image') {
      runs.push(toImageRun(block, options));
      return runs;
    }

    if (block.type === 'list') {
      block.children.forEach((item, itemIndex) => {
        if (runs.length > 0) {
          runs.push({ type: 'text', text: '\n' });
        }
        runs.push({ type: 'text', text: taskMarkerText(item, block, itemIndex) });
        runs.push(...blocksToInlineRuns(item.children || [], options));
      });
    }

    return runs;
  }, []);
}

/**
 * Converts MiniProgram Block AST into a WXML-friendly view model.
 * @param {import('./transform').MiniProgramBlock[]} blocks
 * @param {{ inlineClassMap?: Record<string, string>; deferImages?: boolean; imagePlaceholderText?: string }} [options]
 * @returns {Array<Record<string, any>>}
 */
export function blocksToMiniProgramView(blocks = [], options = {}) {
  return blocks.map((block) => {
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
            inlines: blocksToInlineRuns(item.children || [], options),
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
      const runs = block.nodes && block.nodes.length > 0 ? codeNodesToRuns(block.nodes) : codeToRuns(text, lang);
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

    return block;
  });
}

/**
 * Resolves deferred image src values after a setData commit.
 * @param {Array<Record<string, any>>} blocks
 * @returns {Array<Record<string, any>>}
 */
export function resolvePendingImages(blocks = []) {
  let changed = false;
  const nextBlocks = blocks.map((block) => {
    if (block.type === 'image' && !block.src && block.pendingSrc) {
      changed = true;
      return { ...block, src: block.pendingSrc };
    }

    if (block.inlines) {
      let inlineChanged = false;
      const inlines = block.inlines.map((item) => {
        if (item.type === 'image' && !item.src && item.pendingSrc) {
          changed = true;
          inlineChanged = true;
          return { ...item, src: item.pendingSrc };
        }
        return item;
      });
      return inlineChanged ? { ...block, inlines } : block;
    }

    if (block.children) {
      const children = resolvePendingImages(block.children);
      if (children !== block.children) {
        changed = true;
        return { ...block, children };
      }
    }

    if (block.header || block.rows) {
      let tableChanged = false;
      const resolveRows = (rows = []) =>
        rows.map((row) => {
          let rowChanged = false;
          const cells = (row.cells || []).map((cell) => {
            const [{ inlines }] = resolvePendingImages([{ inlines: cell.inlines || [] }]);
            if (inlines !== cell.inlines) {
              rowChanged = true;
              tableChanged = true;
              return { ...cell, inlines };
            }
            return cell;
          });
          return rowChanged ? { ...row, cells } : row;
        });
      const header = resolveRows(block.header);
      const rows = resolveRows(block.rows);
      if (tableChanged) {
        changed = true;
        return { ...block, header, rows };
      }
    }

    return block;
  });

  return changed ? nextBlocks : blocks;
}
