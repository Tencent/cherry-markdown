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
 * @param {boolean} [useRegex=false] 为 true 时将 query 作为正则源字符串解析
 * @returns {RegExp | null}
 */
export function buildSearchRegex(query, caseSensitive, wholeWord, useRegex = false) {
  if (!query) {
    return null;
  }

  let pattern;
  if (useRegex) {
    pattern = query;
  } else {
    pattern = escapeRegExp(query);
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
  }

  const flags = caseSensitive ? 'g' : 'gi';
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

/**
 * 用已有正则收集匹配区间
 * @param {string} text
 * @param {RegExp} regex
 * @returns {Array<{ from: number; to: number }>}
 */
export function collectMatches(text, regex) {
  return Array.from(text.matchAll(regex), (match) => ({
    from: match.index,
    to: match.index + match[0].length,
  }));
}

/**
 * 在文档文本中查找所有匹配项
 * @param {string} text
 * @param {string} query
 * @param {boolean} caseSensitive
 * @param {boolean} wholeWord
 * @param {boolean} [useRegex=false]
 * @returns {Array<{ from: number; to: number }>}
 */
export function findMatches(text, query, caseSensitive, wholeWord, useRegex = false) {
  const regex = buildSearchRegex(query, caseSensitive, wholeWord, useRegex);
  if (!regex) {
    return [];
  }

  return collectMatches(text, regex);
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

  // 光标落在匹配项内部，或选区 head 落在匹配末尾（to）时，仍视为当前匹配
  const insideIndex = matches.findIndex((item) => cursorPos >= item.from && cursorPos <= item.to);
  if (insideIndex !== -1) {
    return insideIndex;
  }

  const nextIndex = matches.findIndex((item) => item.from >= cursorPos);
  return nextIndex !== -1 ? nextIndex : 0;
}
