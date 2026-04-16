/**
 * 利用window.print导出成PDF
 * @param {HTMLElement} previewDom 预览区域的dom
 * @param {String} fileName 导出PDF文件名
 */
export function exportPDF(previewDom: HTMLElement, fileName: string): void;
/**
 * 利用canvas将html内容导出成图片
 * @param {HTMLElement} previewDom 预览区域的dom
 * @param {String} fileName 导出图片文件名
 */
export function exportScreenShot(previewDom: HTMLElement, fileName: string): void;
/**
 * 利用canvas将dom节点导出成图片
 * @param {HTMLElement} dom 目标dom节点
 * @param {String} fileName 导出图片文件名
 * @param {Object} options 导出选项
 */
export function canvas2img(dom: HTMLElement, fileName: string, options?: any): void;
/**
 * 导出 markdown 文件
 * @param {String} markdownText markdown文本
 * @param {String} fileName 导出markdown文件名
 */
export function exportMarkdownFile(markdownText: string, fileName: string): void;
/**
 * 导出预览区 HTML 文件
 * @param {String} HTMLText HTML文本
 * @param {String} fileName 导出HTML文件名
 */
export function exportHTMLFile(HTMLText: string, fileName: string): void;
export { exportWordFile } from "./exportWord";
