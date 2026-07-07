/**
 * 构建搜索面板 innerHTML（不含根节点 `.cherry-searcher`）
 * @param {boolean} enableReplace 是否包含替换行与展开按钮
 * @returns {string}
 */
export function buildSearcherPanelHtml(enableReplace: boolean): string;
/**
 * 应用替换行初始展开态
 * @param {HTMLElement} root 面板根节点
 * @param {boolean} replaceExpanded
 */
export function applyReplaceExpandedDomState(root: HTMLElement, replaceExpanded: boolean): void;
