export default class AutoLink extends SyntaxBase {
    static escapePreservedSymbol: (text: any) => any;
    constructor({ config, globalConfig }: {
        config: any;
        globalConfig: any;
    });
    enableShortLink: boolean;
    shortLinkLength: any;
    target: string;
    rel: string;
    isLinkInHtmlAttribute(str: any, index: any, linkLength: any): boolean;
    /**
     * 判断链接是否被包裹在a标签内部，如果被包裹，则不识别为自动链接
     * @param {string} str
     * @param {number} index
     * @param {number} linkLength
     */
    isLinkInATag(str: string, index: number, linkLength: number): boolean;
    makeHtml(str: any, sentenceMakeFunc: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
    /**
     * 渲染链接为a标签，返回html
     * @param {string} url src链接
     * @param {string} [text] 展示的链接文本，不传默认使用url
     * @returns 渲染的a标签
     */
    renderLink(url: string, text?: string): string;
}
import SyntaxBase from "@/core/SyntaxBase";
