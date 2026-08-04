export default class Transfer extends ParagraphBase {
    constructor();
    rule(): {
        begin: string;
        content: string;
        end: string;
        reg: RegExp;
    };
    beforeMakeHtml(str: any): any;
    makeHtml(str: any): any;
}
import ParagraphBase from '@/core/ParagraphBase';
