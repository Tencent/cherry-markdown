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
    afterMakeHtml(str: any): any;
}
import ParagraphBase from '@/core/ParagraphBase';
