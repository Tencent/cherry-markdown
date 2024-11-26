/**
 * 用于解决块级元素边距合并问题
 * @param {HTMLElement} element
 */
export function getBlockTopAndHeightWithMargin(element: HTMLElement): {
    height: number;
    offsetTop: number;
};
/**
 * document.elementsFromPoint polyfill
 * ref: https://github.com/JSmith01/elementsfrompoint-polyfill/blob/master/index.js
 * @param {number} x
 * @param {number} y
 */
export function elementsFromPoint(x: number, y: number): any;
export function getHTML(who: any, deep: any): string;
/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tagName 标签名
 * @param {string} className 元素类名
 * @param {Record<string,string>} attributes 附加属性
 * @returns {HTMLElementTagNameMap[K]}
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, className?: string, attributes?: Record<string, string>): HTMLElementTagNameMap[K];
