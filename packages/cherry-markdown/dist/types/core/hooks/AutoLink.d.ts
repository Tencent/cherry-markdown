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
    /**
     * 检查指定位置和长度的字符串是否位于HTML标签的属性值中
     * @param {string} str - 要检查的完整字符串
     * @param {number} index - 链接字符串的起始位置
     * @param {number} linkLength - 链接字符串的长度
     * @returns {boolean} 如果链接位于HTML属性值中则返回true，否则返回false
     */
    isLinkInHtmlAttribute(str: string, index: number, linkLength: number): boolean;
    /**
     * 判断链接是否被包裹在a标签内部，如果被包裹，则不识别为自动链接
     * @param {string} str
     * @param {number} index
     * @param {number} linkLength
     */
    isLinkInATag(str: string, index: number, linkLength: number): boolean;
    /**
     * 将字符串中的URL或电子邮件地址转换为HTML链接
     * @param {string} str - 包含可能URL或电子邮件地址的原始字符串
     * @param {Function} [sentenceMakeFunc] - 可选的回调函数，用于处理句子生成
     * @returns {string} 转换后的HTML字符串，其中URL和电子邮件地址被替换为<a>标签
     * @throws {Error} 如果输入不是字符串可能会抛出错误
     */
    makeHtml(str: string, sentenceMakeFunc?: Function): string;
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
import SyntaxBase from '@/core/SyntaxBase';
