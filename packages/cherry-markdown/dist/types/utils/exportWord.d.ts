/**
 * 在隐藏容器中渲染 HTML，并将指定元素转为 base64 图片
 * @param {string} htmlString - 需要处理的 HTML 片段（预览区的 innerHTML）
 * @returns {Promise<string>} - 处理后的 HTML 字符串
 */
export function preprocessHTMLForWord(htmlString: string): Promise<string>;
/**
 * 导出到 Word (通过复制 HTML 到剪贴板)
 * @param {String} HTMLText HTML文本
 * @param {String} fileName 文件名
 */
export function exportWordFile(HTMLText: string, fileName: string): Promise<void>;
declare namespace _default {
    export { preprocessHTMLForWord };
    export { exportWordFile };
}
export default _default;
