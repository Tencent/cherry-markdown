/**
 * 判断语言行是否为 mermaid 类型
 * @param {string} langLine
 * @returns {boolean}
 */
export function isMermaidLangLine(langLine: string): boolean;
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
export function parseMermaidLayoutFromLangLine(fullLangLine: string): {
    size: string;
    align: string;
    hasExtend: boolean;
    extendStartInLine: number;
    extendLength: number;
};
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
export function listMermaidBlocks(rawContent: string): {
    index: number;
    codeBody: string;
    langLine: string;
    matchIndex: number;
    leadingContent: string;
    fence: string;
}[];
/**
 * 计算代码块语言行在文档中的行号（0-based）
 * @param {string} rawContent
 * @param {{ matchIndex: number, leadingContent: string, fence: string }} block
 * @returns {number}
 */
export function getMermaidLangLineNumber(rawContent: string, block: {
    matchIndex: number;
    leadingContent: string;
    fence: string;
}): number;
/**
 * 按预览区 index 获取对应编辑器 mermaid 块
 * @param {string} rawContent
 * @param {number} previewIndex
 * @returns {ReturnType<typeof listMermaidBlocks>[number] | null}
 */
export function getMermaidBlockAtPreviewIndex(rawContent: string, previewIndex: number): ReturnType<typeof listMermaidBlocks>[number] | null;
/**
 * 按源码内容查找 mermaid 块在编辑器中的 index（删邻居块后 index 会变化）
 * @param {string} rawContent
 * @param {string} codeBody 选中时记录的代码块正文
 * @param {number} [preferredIndex=-1] 多个块正文相同时，优先命中该 index
 * @returns {number} index，未找到返回 -1
 */
export function findMermaidBlockIndexByCodeBody(rawContent: string, codeBody: string, preferredIndex?: number): number;
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
export function buildMermaidEditContext(rawContent: string, previewIndex: number, doc: import("@codemirror/state").Text): {
    previewIndex: number;
    anchorBody: string;
    langLineNum: number;
    extendFrom: number;
    extendTo: number;
    size: string;
    align: string;
    hasExtend: boolean;
} | null;
/**
 * mermaid 编辑器侧代码块解析
 *
 * 职责（维护入口集中在此文件）：
 * - 识别编辑器中的 mermaid 代码块
 * - 按源码正文锚定块（删邻居后 rebind）
 * - 解析语言行上的尺寸/对齐扩展参数
 */
/** @type {RegExp} 与 PreviewerBubble 历史逻辑保持一致 */
export const MERMAID_CODE_BLOCK_REG: RegExp;
