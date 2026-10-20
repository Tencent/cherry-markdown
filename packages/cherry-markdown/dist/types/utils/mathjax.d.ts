/**
 * 装饰器，挂载对应的模块到实例上
 */
export function LoadMathModule(): void;
/**
 * 公式渲染失败时的兜底：回显原始源码，并把其中的非法控制字符用红色标出。
 * @param {string} content 原始公式源码（不含 $ / $$ 定界符）
 * @param {boolean} isDisplayMode 是否为块级公式（决定用 $$ 还是 $ 包裹）
 * @returns {string} HTML 字符串
 */
export function renderMathFallback(content: string, isDisplayMode: boolean): string;
export function configureMathJax(usePlugins: any): void;
export function escapeFormulaPunctuations(formula: any): any;
declare const _default: {};
export default _default;
