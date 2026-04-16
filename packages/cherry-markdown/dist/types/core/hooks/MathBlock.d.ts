export default class MathBlock extends ParagraphBase {
    constructor({ config, cherry }: {
        config: any;
        cherry: any;
    });
    /**
     * 块级公式语法
     * 该语法具有排他性，并且需要优先其他段落级语法进行渲染
     * @type {'katex' | 'MathJax' | 'node'}
     */
    engine: "katex" | "MathJax" | "node";
    katex: any;
    MathJax: any;
    $cherry: any;
    lastCode: string;
    toHtml(wholeMatch: any, lineSpace: any, leadingChar: any, content: any): string;
    isSelfClosing(): any;
    $dealUnclosingMath(str: any): any;
    makeMath(str: any): any;
    beforeMakeHtml(str: any): any;
    makeHtml(str: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from '@/core/ParagraphBase';
