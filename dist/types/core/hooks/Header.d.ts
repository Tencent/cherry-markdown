export default class Header extends ParagraphBase {
    constructor({ externals, config }?: {
        config: any;
        externals: any;
    });
    strict: boolean;
    RULE: any;
    headerIDCache: any[];
    headerIDCounter: {};
    config: any;
    $parseTitleText(html?: string): string;
    /**
     * refer:
     * @see https://github.com/vsch/flexmark-java/blob/8bf621924158dfed8b84120479c82704020a6927/flexmark
     * /src/main/java/com/vladsch/flexmark/html/renderer/HeaderIdGenerator.java#L90-L113
     *
     * @param {string} headerText
     * @param {boolean} [toLowerCase]
     * @returns
     */
    $generateId(headerText: string, toLowerCase?: boolean): string;
    generateIDNoDup(headerText: any): string;
    $wrapHeader(text: any, level: any, dataLines: any, sentenceMakeFunc: any): {
        html: string;
        sign: string;
    };
    $getAnchor(anchorID: any): string;
    beforeMakeHtml(str: any): any;
    test(str: any, flavor: any): any;
    /**
     * TODO: fix type errors, prefer use `rules` for multiple spec instead
     * @returns
     */
    rule(): any;
}
import ParagraphBase from "@/core/ParagraphBase";
