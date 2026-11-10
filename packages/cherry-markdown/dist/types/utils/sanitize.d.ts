export function escapeHTMLEntitiesWithoutSemicolon(content: any): string;
export function escapeHTMLSpecialChar(content: any, enableQuote: any): string;
/**
 * 属性上下文的最小转义：只转义会闭合属性或形成标签的字符，保留 `&` 及其字符实体语义。
 * 仅用于已确认处于属性值内的场景（如代码块语言名）；文本节点请使用 escapeHTMLSpecialChar。
 * @param {string} content 待转义的字符串
 * @returns {string}
 */
export function escapeHTMLAttribute(content: string): string;
export function unescapeHTMLSpecialChar(content: any): string;
export function escapeHTMLSpecialCharOnce(content: any, enableQuote: any): string;
export function convertHTMLNumberToName(html: any): any;
export function unescapeHTMLNumberEntities(html: any): any;
export function unescapeHTMLHexEntities(html: any): any;
export function isValidScheme(url: any): boolean;
/**
 * ref: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
 * RFC3986 encodeURIComponent
 * @param {string} str
 */
export function encodeURIComponentRFC3986(str: string): string;
/**
 * ref: https://stackoverflow.com/questions/9245333/should-encodeuri-ever-be-used
 * @param {string} str
 */
export function encodeURIOnce(str: string): string;
export const blockNames: string;
export const inlineNames: string;
export const inlineBlock: "br|img|hr";
export const whiteList: RegExp;
