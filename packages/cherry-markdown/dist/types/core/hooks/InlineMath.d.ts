/**
 * 行内公式的语法
 * 虽然叫做行内公式，Cherry依然将其视为“段落级语法”，因为其具备排他性并且需要优先渲染
 */
export default class InlineMath extends ParagraphBase {
    constructor({ config, cherry }: {
        config: any;
        cherry: any;
    });
    /** @type {'katex' | 'MathJax' | 'node'} */
    engine: "katex" | "MathJax" | "node";
    katex: any;
    MathJax: any;
    TeXDelimiter: boolean;
    $cherry: any;
    /**
     * 这里本意是用来存储「上一轮」成功渲染里的最后一个公式
     * 但因为偷懒，存的是「上一次」成功渲染里的公式，所以这里有个大大的「TODO」
     * 同时，mermaid渲染那里也有同样的问题，也有个大大的「TODO」
     */
    lastCode: string;
    toHtml(wholeMatch: any, leadingChar: any, m1: any): any;
    isSelfClosing(): any;
    $dealUnclosingMath(str: any): any;
    beforeMakeHtml(str: any): string;
    /**
     * 归一化非表格路径下的 `\(...\)`。整体流程为：
     *   Step 1: 先跑一次 makeInlineMath，把用户原生 ~D..~D 段冻结到 cache——形成保护壳，
     *           避免下一步的 \(..\) 归一化误吞已闭合的 $..$ 内部的 \( 或 \)。
     *   Step 2: 正则替换 \(...\) → ~D...~D（带反斜杠转义感知 + 空内容保护）。
     *   Step 3: selfClosing 场景下补开定界符，让下游 $dealUnclosingMath 能识别半开公式。
     * 归一化后的结果会由 makeInlineMathWithSelfClosing 再走一次 makeInlineMath 完成最终渲染。
     *
     * 当 TeXDelimiter 关闭时，仅保留 Step 1 的冻结能力，不对 \(..\) 做归一化。
     */
    normalizeTexInlineMath(str: any): any;
    /** 将 `\(...\)` 归一化为 `~D...~D`。空白内容不归一化，等价于旧 mathDelimiter 的 content.trim() 判空。 */
    rewriteParenInline(str: any): any;
    /** selfClosing 场景下补开定界符：把"未闭合 \("补一个 ~D 前缀。 */
    rewriteOpenOnlyParen(str: any): any;
    /** 表格 td 里将 `\[...\]` 归一化为 `~D...~D`。空白内容不归一化。 */
    rewriteBracketBlockInTd(str: any): any;
    makeInlineMathWithSelfClosing(str: any): any;
    transformBlockMathToInlineMath(str: any): any;
    makeInlineMath(str: any): any;
    makeHtml(str: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from '../../core/ParagraphBase';
