export default class HtmlBlock extends ParagraphBase {
    constructor({ config }: {
        config: any;
    });
    filterStyle: any;
    removeTrailingNewline: any;
    isAutoLinkTag(tagMatch: any): boolean;
    isHtmlComment(match: any): boolean;
    beforeMakeHtml(str: any, sentenceMakeFunc: any): any;
    /**
     * @property
     * @type {false | RegExp}
     */
    htmlWhiteListAppend: false | RegExp;
    /**
     * @property
     * @type {string[]}
     */
    htmlWhiteList: string[];
    makeHtml(str: any, sentenceMakeFunc: any): any;
    /**
     * 按顶层块级边界拆分 HTML 字符串。
     * 遍历标签的同时维护嵌套深度，仅在 depth === 0 时进行切分。
     * 这样可以保证每一段都是一个完整闭合的"第一层 child"，
     * 从而让下游的分批处理与 sanitize 缓存不依赖于具体的块级标签类型
     * （p / div / blockquote / pre / h* / table ...）都能正确工作。
     * @param {string} html
     * @returns {string[]}
     */
    $splitTopLevelChildren(html: string): string[];
    afterMakeHtml(str: any): any;
}
import ParagraphBase from '../ParagraphBase.js';
