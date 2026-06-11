/**
 * 公式引擎初始化入口（按需加载 MathJax / katex 并在加载完成后回填渲染）
 * @param {import('../Engine').default} engine Engine 实例
 * @param {Partial<import('../Cherry').CherryOptions>} opts 初始化选项
 */
export function initMathEngines(engine: import("../Engine").default, opts: Partial<import("../Cherry").CherryOptions>): void;
export type MathBlockOptions = {
    engine?: "katex" | "MathJax";
    src?: string;
    css?: string;
    plugins?: boolean;
    selfClosing?: boolean;
};
export type InlineMathOptions = {
    engine?: "katex" | "MathJax";
    src?: string;
    selfClosing?: boolean;
};
export type ResolvedMathSyntax = {
    mathBlock: MathBlockOptions;
    inlineMath: InlineMathOptions;
};
