/**
 * mermaid 预览可见性判断
 * 用于决定右侧尺寸编辑框是否应继续展示（figure 壳子可能还在，但预览图表已消失）
 */

/**
 * 统计预览区 mermaid figure 数量
 * @param {ParentNode} previewerDom
 * @returns {number}
 */
export function countMermaidFigures(previewerDom) {
  if (!previewerDom) {
    return 0;
  }
  return previewerDom.querySelectorAll('figure[data-type="mermaid"]').length;
}

/**
 * 按 index 解析 mermaid figure
 * @param {ParentNode} previewerDom
 * @param {number} index
 * @param {number} [expectedFigureCount=-1] 传入时须与当前 figure 数量一致，-1 表示不校验
 * @returns {HTMLElement | null}
 */
export function getMermaidFigureByIndex(previewerDom, index, expectedFigureCount = -1) {
  if (!previewerDom || index < 0) {
    return null;
  }
  const figures = previewerDom.querySelectorAll('figure[data-type="mermaid"]');
  if (expectedFigureCount >= 0 && figures.length !== expectedFigureCount) {
    return null;
  }
  return /** @type {HTMLElement | null} */ (figures[index] || null);
}

/**
 * 获取 mermaid 预览内容根节点（工具栏模式下为 preview panel，否则为 figure 本身）
 * @param {HTMLElement} figure
 * @returns {HTMLElement}
 */
export function getMermaidPreviewRoot(figure) {
  const previewPanel = figure.querySelector('.cherry-mermaid-source-toolbar-panel[data-mode="preview"]');
  return /** @type {HTMLElement} */ (previewPanel || figure);
}

/**
 * 获取 mermaid 渲染后的可视节点（svg 或 svg 转 img）
 * @param {ParentNode} root
 * @returns {Element | null}
 */
export function getMermaidVisualElement(root) {
  const svg = root.querySelector('svg');
  if (svg) {
    return svg;
  }
  const svgImg = root.querySelector('img.svg-img');
  return svgImg || null;
}

/**
 * 读取元素可视尺寸（优先 layout，回退 attribute）
 * @param {Element} visual
 * @returns {{ width: number, height: number }}
 */
function getVisualSize(visual) {
  const htmlVisual = /** @type {HTMLElement} */ (visual);
  const rect = htmlVisual.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    return { width: rect.width, height: rect.height };
  }
  const width = htmlVisual.offsetWidth || Number.parseFloat(htmlVisual.getAttribute('width') || '') || 0;
  const height = htmlVisual.offsetHeight || Number.parseFloat(htmlVisual.getAttribute('height') || '') || 0;
  return { width, height };
}

/**
 * 预览区内是否存在已渲染且可见的 mermaid 图表
 * @param {ParentNode} root
 * @returns {boolean}
 */
export function hasMermaidRenderedContent(root) {
  const visual = getMermaidVisualElement(root);
  if (!visual) {
    return false;
  }
  const { width, height } = getVisualSize(visual);
  return width > 0 && height > 0;
}

/**
 * 判断 mermaid 预览是否仍可用于尺寸/对齐编辑
 * @param {HTMLElement | null | undefined} figure
 * @param {ParentNode | null | undefined} previewerDom
 * @returns {boolean}
 */
export function isMermaidPreviewVisible(figure, previewerDom) {
  if (!figure || !previewerDom || !document.contains(figure) || !previewerDom.contains(figure)) {
    return false;
  }
  if (figure.getAttribute('data-type') !== 'mermaid') {
    return false;
  }
  // 工具栏切到源码模式时不展示尺寸编辑框
  if (figure.querySelector('.cherry-mermaid-source-toolbar-panel.active[data-mode="source"]')) {
    return false;
  }
  const previewRoot = getMermaidPreviewRoot(figure);
  return hasMermaidRenderedContent(previewRoot);
}
