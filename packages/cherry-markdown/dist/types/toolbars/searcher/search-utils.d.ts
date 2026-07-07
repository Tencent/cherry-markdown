/**
 * 转义正则表达式中的特殊字符
 * @param {string} str
 * @returns {string}
 */
export function escapeRegExp(str: string): string;
/**
 * 构建搜索正则表达式
 * @param {string} query
 * @param {boolean} caseSensitive
 * @param {boolean} wholeWord
 * @param {boolean} [useRegex=false] 为 true 时将 query 作为正则源字符串解析
 * @returns {RegExp | null}
 */
export function buildSearchRegex(query: string, caseSensitive: boolean, wholeWord: boolean, useRegex?: boolean): RegExp | null;
/**
 * 用已有正则收集匹配区间
 * @param {string} text
 * @param {RegExp} regex
 * @returns {Array<{ from: number; to: number }>}
 */
export function collectMatches(text: string, regex: RegExp): Array<{
    from: number;
    to: number;
}>;
/**
 * 在文档文本中查找所有匹配项
 * @param {string} text
 * @param {string} query
 * @param {boolean} caseSensitive
 * @param {boolean} wholeWord
 * @param {boolean} [useRegex=false]
 * @returns {Array<{ from: number; to: number }>}
 */
export function findMatches(text: string, query: string, caseSensitive: boolean, wholeWord: boolean, useRegex?: boolean): Array<{
    from: number;
    to: number;
}>;
/**
 * 根据光标位置查找最近的匹配项索引
 * @param {Array<{ from: number; to: number }>} matches
 * @param {number} cursorPos
 * @returns {number}
 */
export function findNearestMatchIndex(matches: Array<{
    from: number;
    to: number;
}>, cursorPos: number): number;
