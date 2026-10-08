export function findConfigLine(code, path) {
  if (!path) return -1;
  const lines = code.split('\n');
  let lineIndex = -1;
  for (const [depth, part] of path.split('.').entries()) {
    const property = /^[A-Za-z_$][\w$]*$/.test(part) ? part : JSON.stringify(part);
    const prefix = `${'  '.repeat(depth + 1)}${property}:`;
    const nextIndex = lines.findIndex((line, index) => index > lineIndex && line.startsWith(prefix));
    if (nextIndex === -1) break;
    lineIndex = nextIndex;
  }
  return lineIndex;
}

export function findChangedRange(before, after) {
  if (before === after) return null;
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (beforeEnd > start && afterEnd > start && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd--;
    afterEnd--;
  }
  const changedText = after.slice(start, afterEnd);
  return changedText.length <= 160 && !changedText.includes('\n') ? { start, end: afterEnd } : null;
}

export function highlightCode(el, focusLine = -1, focusRange = null) {
  let code = el.textContent;
  if (focusRange) {
    code = `${code.slice(0, focusRange.start)}\uE000${code.slice(focusRange.start, focusRange.end)}\uE001${code.slice(focusRange.end)}`;
  } else if (focusLine >= 0) {
    const lines = code.split('\n');
    const line = lines[focusLine];
    const separator = line.indexOf(':');
    if (separator !== -1) {
      const valueStart = separator + 1 + (line.slice(separator + 1).match(/^\s*/) || [''])[0].length;
      const valueEnd = line.endsWith(',') ? line.length - 1 : line.length;
      const isContainer = /^[\[{]$/.test(line.slice(valueStart, valueEnd));
      const start = isContainer ? line.search(/\S/) : valueStart;
      lines[focusLine] = `${line.slice(0, start)}\uE000${line.slice(start, valueEnd)}\uE001${line.slice(valueEnd)}`;
    }
    code = lines.join('\n');
  }
  let html = escapeHtml(code);
  // 关键字
  html = html.replace(/\b(const|let|var|new|true|false|function|return|if|else|export|import|default)\b/g,
    '<span class="source-keyword">$1</span>');
  // 字符串
  html = html.replace(/'([^']*)'/g, '<span class="source-string">\'$1\'</span>');
  // 数字
  html = html.replace(/\b(\d+)\b/g, '<span class="source-number">$1</span>');
  // 注释
  html = html.replace(/(\/\/.*)/g, '<span class="source-comment">$1</span>');
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="source-comment">$1</span>');
  // 属性名
  html = html.replace(/(\w+)(?=\s*:)/g, '<span class="source-property">$1</span>');

  html = html.replace('\uE000', '<span class="code-focus-token">').replace('\uE001', '</span>');
  el.innerHTML = html;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
