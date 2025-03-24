/**
 * 行内公式的语法
 * 虽然叫做行内公式，Cherry依然将其视为“段落级语法”，因为其具备排他性并且需要优先渲染
 */
export default class InlineMath extends ParagraphBase {
    constructor({ config }: {
        config: any;
    });
    /** @type {'katex' | 'MathJax' | 'node'} */
    engine: 'katex' | 'MathJax' | 'node';
    katex: any;
    MathJax: any;
    toHtml(wholeMatch: any, leadingChar: any, m1: any): any;
    beforeMakeHtml(str: any): any;
    makeInlineMath(str: any): any;
    makeHtml(str: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from "@/core/ParagraphBase";
