/**
 * 复制内容到剪贴板
 * @param {string} [text] - 可选的纯文本内容 (text/plain)
 * @param {string} [html] - 可选的 HTML 内容 (text/html)
 * @returns {Promise<void>}
 * @throws {Error}
 */
export function copyToClip(text?: string, html?: string): Promise<void>;
