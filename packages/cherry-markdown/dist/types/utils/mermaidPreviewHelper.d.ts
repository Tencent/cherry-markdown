/**
 * mermaid 预览可见性判断
 * 用于决定右侧尺寸编辑框是否应继续展示（figure 壳子可能还在，但预览图表已消失）
 */
/**
 * 统计预览区 mermaid figure 数量
 * @param {ParentNode} previewerDom
 * @returns {number}
 */
export function countMermaidFigures(previewerDom: ParentNode): number;
/**
 * 按 index 解析 mermaid figure
 * @param {ParentNode} previewerDom
 * @param {number} index
 * @param {number} [expectedFigureCount=-1] 传入时须与当前 figure 数量一致，-1 表示不校验
 * @returns {HTMLElement | null}
 */
export function getMermaidFigureByIndex(previewerDom: ParentNode, index: number, expectedFigureCount?: number): HTMLElement | null;
/**
 * 获取 mermaid 预览内容根节点（工具栏模式下为 preview panel，否则为 figure 本身）
 * @param {HTMLElement} figure
 * @returns {HTMLElement}
 */
export function getMermaidPreviewRoot(figure: HTMLElement): HTMLElement;
/**
 * 获取 mermaid 渲染后的可视节点（svg 或 svg 转 img）
 * @param {ParentNode} root
 * @returns {Element | null}
 */
export function getMermaidVisualElement(root: ParentNode): Element | null;
/**
 * 预览区内是否存在已渲染且可见的 mermaid 图表
 * @param {ParentNode} root
 * @returns {boolean}
 */
export function hasMermaidRenderedContent(root: ParentNode): boolean;
/**
 * 判断 mermaid 预览是否仍可用于尺寸/对齐编辑
 * @param {HTMLElement | null | undefined} figure
 * @param {ParentNode | null | undefined} previewerDom
 * @returns {boolean}
 */
export function isMermaidPreviewVisible(figure: HTMLElement | null | undefined, previewerDom: ParentNode | null | undefined): boolean;
