export default class MathBlock extends ParagraphBase {
    constructor({ config }: {
        config: any;
    });
    /**
     * 块级公式语法
     * 该语法具有排他性，并且需要优先其他段落级语法进行渲染
     * @type {'katex' | 'MathJax' | 'node'}
     */
    engine: 'katex' | 'MathJax' | 'node';
    katex: any;
    MathJax: any;
    toHtml(wholeMatch: any, lineSpace: any, leadingChar: any, content: any): string;
    beforeMakeHtml(str: any): any;
    makeHtml(str: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from "@/core/ParagraphBase";
