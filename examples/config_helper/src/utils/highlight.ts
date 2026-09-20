/**
 * 简单的 JS 代码语法高亮（基于正则，输出带 class 的 HTML 字符串）
 */

/**
 * 转义文本节点中的 HTML 特殊字符。
 * 只处理 & < >：结果仅用于元素内容（不会放进属性），
 * 且保留引号原样，便于后续用正则识别字符串字面量。
 */
export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 对代码字符串做高亮，返回 HTML。
 * 输入会先经过 escapeHtml，因此可安全地用于 dangerouslySetInnerHTML。
 */
export function highlightCode(code: string): string {
  let html = escapeHtml(code);
  // 关键字
  html = html.replace(
    /\b(const|let|var|new|true|false|function|return|if|else|export|import|default)\b/g,
    '<span class="source-keyword">$1</span>',
  );
  // 字符串
  html = html.replace(/'([^']*)'/g, "<span class=\"source-string\">'$1'</span>");
  // 数字
  html = html.replace(/\b(\d+)\b/g, '<span class="source-number">$1</span>');
  // 注释
  html = html.replace(/(\/\/.*)/g, '<span class="source-comment">$1</span>');
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="source-comment">$1</span>');
  // 属性名
  html = html.replace(/(\w+)(?=\s*:)/g, '<span class="source-property">$1</span>');
  return html;
}
