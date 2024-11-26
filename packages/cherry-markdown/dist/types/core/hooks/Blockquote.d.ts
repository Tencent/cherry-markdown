export default class Blockquote extends ParagraphBase {
    constructor();
    handleMatch(str: any, sentenceMakeFunc: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from "@/core/ParagraphBase";
