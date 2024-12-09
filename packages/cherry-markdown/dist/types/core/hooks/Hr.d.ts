/**
 * 分割线语法
 */
export default class Hr extends ParagraphBase {
    constructor();
    beforeMakeHtml(str: any): any;
    rule(): {
        begin: string;
        end: string;
        content: string;
    };
}
import ParagraphBase from "@/core/ParagraphBase";
