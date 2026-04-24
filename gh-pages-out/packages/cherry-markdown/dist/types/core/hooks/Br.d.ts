export default class Br extends ParagraphBase {
    constructor(options: any);
    classicBr: any;
    beforeMakeHtml(str: any): any;
    makeHtml(str: any, sentenceMakeFunc: any): any;
    rule(): {
        begin: string;
        end: string;
        content: string;
    };
}
import ParagraphBase from '@/core/ParagraphBase';
