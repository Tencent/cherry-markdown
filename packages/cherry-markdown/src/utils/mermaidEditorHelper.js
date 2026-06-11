/**
 * mermaid 编辑器侧代码块解析
 *
 * 职责（维护入口集中在此文件）：
 * - 识别编辑器中的 mermaid 代码块
 * - 按源码正文锚定块（删邻居后 rebind）
 * - 解析语言行上的尺寸/对齐扩展参数
 */

/** @type {RegExp} 与 PreviewerBubble 历史逻辑保持一致 */
export const MERMAID_CODE_BLOCK_REG =
  /(?:^|\n)(\n*(?:>[\t ]*)*(?:[^\S\n]*))(`{3,})([^`]*?)\n([\w\W]*?)\n\s*\2[ \t]*(?=$|\n)/g;

const MERMAID_LAYOUT_EXTEND_REG =
  /((?:\s*#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto|center|right|left|float-right|float-left))+)\s*$/i;
const MERMAID_SIZE_REG = /#([0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto)/gi;
const MERMAID_ALIGN_REG = /#(center|right|left|float-right|float-left)/i;

/**
 * 判断语言行是否为 mermaid 类型
 * @param {string} langLine
 * @returns {boolean}
 */
export function isMermaidLangLine(langLine) {
  const langPure = langLine
    .trim()
    .toLowerCase()
    .replace(/#([0-9]+(px|em|pt|pc|in|mm|cm|ex|%)|auto)/gi, '')
    .replace(/#(center|right|left|float-right|float-left)/gi, '')
    .trim();
  return langPure === 'mermaid' || /^flow([ ](td|lr))?$/i.test(langPure) || langPure === 'seq';
}

/**
 * 解析语言行上的尺寸与对齐扩展参数
 * @param {string} fullLangLine 语言行完整文本（含反引号后的 lang 部分所在行）
 * @returns {{
 *   size: string,
 *   align: string,
 *   hasExtend: boolean,
 *   extendStartInLine: number,
 *   extendLength: number,
 * }}
 */
export function parseMermaidLayoutFromLangLine(fullLangLine) {
  const extendMatch = fullLangLine.match(MERMAID_LAYOUT_EXTEND_REG);
  const sizeMatches = fullLangLine.match(MERMAID_SIZE_REG);
  const alignMatch = fullLangLine.match(MERMAID_ALIGN_REG);

  if (extendMatch) {
    return {
      size: sizeMatches ? sizeMatches.join(' ') : '',
      align: alignMatch ? alignMatch[0] : '',
      hasExtend: true,
      extendStartInLine: fullLangLine.indexOf(extendMatch[1]),
      extendLength: extendMatch[1].length,
    };
  }

  return {
    size: sizeMatches ? sizeMatches.join(' ') : '',
    align: alignMatch ? alignMatch[0] : '',
    hasExtend: false,
    extendStartInLine: fullLangLine.length,
    extendLength: 0,
  };
}

/**
 * 列出编辑器中所有 mermaid 代码块
 * @param {string} rawContent
 * @returns {{
 *   index: number,
 *   codeBody: string,
 *   langLine: string,
 *   matchIndex: number,
 *   leadingContent: string,
 *   fence: string,
 * }[]}
 */
export function listMermaidBlocks(rawContent) {
  const blocks = [];
  if (!rawContent) {
    return blocks;
  }
  const reg = new RegExp(MERMAID_CODE_BLOCK_REG.source, 'g');
  let match;
  while ((match = reg.exec(rawContent)) !== null) {
    const langLine = match[3].trim().toLowerCase();
    if (!isMermaidLangLine(langLine)) {
      continue;
    }
    blocks.push({
      index: blocks.length,
      codeBody: match[4],
      langLine,
      matchIndex: match.index,
      leadingContent: match[1] || '',
      fence: match[2],
    });
  }
  return blocks;
}

/**
 * 计算代码块语言行在文档中的行号（0-based）
 * @param {string} rawContent
 * @param {{ matchIndex: number, leadingContent: string, fence: string }} block
 * @returns {number}
 */
export function getMermaidLangLineNumber(rawContent, block) {
  const backtickPos = rawContent.indexOf(block.fence, block.matchIndex + block.leadingContent.length);
  const beforeBacktick = rawContent.substring(0, backtickPos);
  return (beforeBacktick.match(/\n/g) || []).length;
}

/**
 * 按预览区 index 获取对应编辑器 mermaid 块
 * @param {string} rawContent
 * @param {number} previewIndex
 * @returns {ReturnType<typeof listMermaidBlocks>[number] | null}
 */
export function getMermaidBlockAtPreviewIndex(rawContent, previewIndex) {
  if (previewIndex < 0) {
    return null;
  }
  const blocks = listMermaidBlocks(rawContent);
  return blocks[previewIndex] || null;
}

/**
 * 按源码内容查找 mermaid 块在编辑器中的 index（删邻居块后 index 会变化）
 * @param {string} rawContent
 * @param {string} codeBody 选中时记录的代码块正文
 * @param {number} [preferredIndex=-1] 多个块正文相同时，优先命中该 index
 * @returns {number} index，未找到返回 -1
 */
export function findMermaidBlockIndexByCodeBody(rawContent, codeBody, preferredIndex = -1) {
  if (!codeBody) {
    return -1;
  }
  const blocks = listMermaidBlocks(rawContent);
  const matchedIndices = blocks.reduce((indices, block, index) => {
    if (block.codeBody === codeBody) {
      indices.push(index);
    }
    return indices;
  }, /** @type {number[]} */ ([]));
  if (matchedIndices.length === 0) {
    return -1;
  }
  if (matchedIndices.length === 1) {
    return matchedIndices[0];
  }
  if (preferredIndex >= 0 && matchedIndices.includes(preferredIndex)) {
    return preferredIndex;
  }
  return matchedIndices[0];
}

/**
 * 构建 mermaid 布局编辑所需的编辑器选区信息
 * @param {string} rawContent
 * @param {number} previewIndex 预览区 figure index
 * @param {import('@codemirror/state').Text} doc CM6 文档
 * @returns {{
 *   previewIndex: number,
 *   anchorBody: string,
 *   langLineNum: number,
 *   extendFrom: number,
 *   extendTo: number,
 *   size: string,
 *   align: string,
 *   hasExtend: boolean,
 * } | null}
 */
export function buildMermaidEditContext(rawContent, previewIndex, doc) {
  const block = getMermaidBlockAtPreviewIndex(rawContent, previewIndex);
  if (!block || !doc) {
    return null;
  }

  const langLineNum = getMermaidLangLineNumber(rawContent, block);
  const fullLangLine = rawContent.split('\n')[langLineNum] || '';
  const layout = parseMermaidLayoutFromLangLine(fullLangLine);
  const lineStart = doc.line(langLineNum + 1).from;

  const extendFrom = lineStart + layout.extendStartInLine;
  const extendTo = layout.hasExtend ? extendFrom + layout.extendLength : extendFrom;

  return {
    previewIndex,
    anchorBody: block.codeBody,
    langLineNum,
    extendFrom,
    extendTo,
    size: layout.size,
    align: layout.align,
    hasExtend: layout.hasExtend,
  };
}
