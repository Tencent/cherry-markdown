export function escapeHTMLEntitiesWithoutSemicolon(content: any): string;
export function escapeHTMLSpecialChar(content: any, enableQuote: any): string;
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
