/**
 * 转义正则表达式中的特殊字符
 * @param {string} str
 * @returns {string}
 */
export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 构建搜索正则表达式
 * @param {string} query
 * @param {boolean} caseSensitive
 * @param {boolean} wholeWord
 * @returns {RegExp | null}
 */
export function buildSearchRegex(query, caseSensitive, wholeWord) {
  if (!query) {
    return null;
  }

  let pattern = escapeRegExp(query);
  if (wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }

  const flags = caseSensitive ? 'g' : 'gi';
  return new RegExp(pattern, flags);
}

/**
 * 在文档文本中查找所有匹配项
 * @param {string} text
 * @param {string} query
 * @param {boolean} caseSensitive
 * @param {boolean} wholeWord
 * @returns {Array<{ from: number; to: number }>}
 */
export function findMatches(text, query, caseSensitive, wholeWord) {
  const regex = buildSearchRegex(query, caseSensitive, wholeWord);
  if (!regex) {
    return [];
  }

  /** @type {Array<{ from: number; to: number }>} */
  const matches = [];
  let match = regex.exec(text);

  while (match) {
    matches.push({
      from: match.index,
      to: match.index + match[0].length,
    });
    if (match[0].length === 0) {
      regex.lastIndex += 1;
    }
    match = regex.exec(text);
  }

  return matches;
}

/**
 * 根据光标位置查找最近的匹配项索引
 * @param {Array<{ from: number; to: number }>} matches
 * @param {number} cursorPos
 * @returns {number}
 */
export function findNearestMatchIndex(matches, cursorPos) {
  if (matches.length === 0) {
    return -1;
  }

  const nextIndex = matches.findIndex((item) => item.from >= cursorPos);
  return nextIndex !== -1 ? nextIndex : 0;
}
