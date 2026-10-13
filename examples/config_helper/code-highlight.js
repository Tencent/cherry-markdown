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
  return { start, end: afterEnd };
}

const CODE_TOKEN = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|([A-Za-z_$][\w$]*(?=\s*:))|\b(const|let|var|new|true|false|function|return|if|else|export|import|default)\b|\b(\d+(?:\.\d+)?)\b/g;

function highlightText(code, focusRange = null) {
  let html = '';
  let offset = 0;
  let focusStarted = false;
  let focusOpen = false;
  const syncFocus = position => {
    if (!focusRange) return;
    if (!focusStarted && position === focusRange.start) {
      html += '<span class="code-focus-token">';
      focusStarted = true;
      focusOpen = true;
    }
    if (focusOpen && position === focusRange.end) {
      html += '</span>';
      focusOpen = false;
    }
  };
  const appendSegment = (text, start, className) => {
    const end = start + text.length;
    const boundaries = [start, end];
    if (focusRange?.start > start && focusRange.start < end) boundaries.push(focusRange.start);
    if (focusRange?.end > start && focusRange.end < end) boundaries.push(focusRange.end);
    boundaries.sort((a, b) => a - b);
    for (let i = 0; i < boundaries.length - 1; i++) {
      const from = boundaries[i];
      const to = boundaries[i + 1];
      syncFocus(from);
      const escaped = escapeHtml(text.slice(from - start, to - start));
      html += className ? `<span class="${className}">${escaped}</span>` : escaped;
    }
  };
  CODE_TOKEN.lastIndex = 0;
  for (const match of code.matchAll(CODE_TOKEN)) {
    appendSegment(code.slice(offset, match.index), offset);
    const className = match[1] ? 'source-comment' : match[2] ? 'source-string'
      : match[3] ? 'source-property' : match[4] ? 'source-keyword' : 'source-number';
    appendSegment(match[0], match.index, className);
    offset = match.index + match[0].length;
  }
  appendSegment(code.slice(offset), offset);
  syncFocus(code.length);
  return html;
}

function findLineValueRange(code, lineIndex) {
  if (lineIndex < 0) return null;
  const lines = code.split('\n');
  const line = lines[lineIndex];
  if (!line) return null;
  const separator = line.indexOf(':');
  if (separator === -1) return null;
  const valueStart = separator + 1 + (line.slice(separator + 1).match(/^\s*/) || [''])[0].length;
  const valueEnd = line.endsWith(',') ? line.length - 1 : line.length;
  const isContainer = /^[\[{]$/.test(line.slice(valueStart, valueEnd));
  const start = isContainer ? line.search(/\S/) : valueStart;
  const lineOffset = lines.slice(0, lineIndex).reduce((length, previous) => length + previous.length + 1, 0);
  return { start: lineOffset + start, end: lineOffset + valueEnd };
}

export function highlightCode(el, focusLine = -1, focusRange = null) {
  const code = el.textContent;
  const range = focusRange || findLineValueRange(code, focusLine);
  el.innerHTML = highlightText(code, range);
}

export function escapeHtml(str) {
  return str.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}
