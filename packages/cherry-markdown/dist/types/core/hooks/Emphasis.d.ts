export default class Emphasis extends SyntaxBase {
    constructor({ config }?: {
        config: any;
    });
    allowWhitespace: boolean;
    makeHtml(str: any, sentenceMakeFunc: any): any;
    test(str: any, flavor: any): any;
    /**
     * TODO: fix type errors, prefer use `rules` for multiple spec instead
     * @returns
     */
    rule({ config }?: {
        config: any;
    }): any;
}
import SyntaxBase from "@/core/SyntaxBase";
