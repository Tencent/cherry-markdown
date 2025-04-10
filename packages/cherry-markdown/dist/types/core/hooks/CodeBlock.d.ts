export default class CodeBlock extends ParagraphBase {
    static inlineCodeCache: {};
    constructor({ externals, config }: {
        externals: any;
        config: any;
    });
    codeCache: {};
    customLang: any[];
    customParser: any;
    lineNumber: any;
    copyCode: any;
    expandCode: any;
    editCode: any;
    changeLang: any;
    selfClosing: any;
    mermaid: any;
    indentedCodeBlock: any;
    INLINE_CODE_REGEX: RegExp;
    customHighlighter: any;
    $codeCache(sign: any, str: any): any;
    parseCustomLanguage(lang: any, codeSrc: any, props: any): string | false;
    fillTag(lines: any): any;
    renderLineNumber(code: any): any;
    /**
     * 判断内置转换语法是否被覆盖
     * @param {string} lang
     */
    isInternalCustomLangCovered(lang: string): boolean;
    /**
     * 预处理代码块
     * @param {string} match
     * @param {string} leadingContent
     * @param {string} code
     */
    computeLines(match: string, leadingContent: string, code: string): {
        sign: string;
        lines: number;
    };
    /**
     * 补齐用codeBlock承载的mermaid
     * @param {string} $code
     * @param {string} $lang
     */
    appendMermaid($code: string, $lang: string): string[];
    /**
     * 包裹代码块，解决单行代码超出长度
     * @param {string} $code
     * @param {string} lang
     */
    wrapCode($code: string, lang: string): string;
    /**
     * 使用渲染引擎处理代码块
     * @param {string} $code
     * @param {string} $lang
     * @param {string} sign
     * @param {number} lines
     */
    renderCodeBlock($code: string, $lang: string, sign: string, lines: number): string;
    /**
     * 获取缩进代码块语法的正则
     * 缩进代码块必须要以连续两个以上的换行符开头
     */
    $getIndentedCodeReg(): RegExp;
    /**
     * 生成缩进代码块（没有行号、没有代码高亮）
     */
    $getIndentCodeBlock(str: any): any;
    /**
     * 预处理缩进代码块，将缩进代码块里的高亮代码块和行内代码进行占位处理
     */
    $replaceCodeInIndent(str: any): any;
    /**
     * 恢复预处理的内容
     */
    $recoverCodeInIndent(str: any): any;
    $dealUnclosingCode(str: any): any;
    beforeMakeHtml(str: any, sentenceMakeFunc: any, markdownParams: any): any;
    makeInlineCode(str: any): any;
    makeHtml(str: any): any;
    $replaceSpecialChar(str: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
        reg: RegExp;
    };
    mounted(dom: any): void;
}
import ParagraphBase from "@/core/ParagraphBase";
