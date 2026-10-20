export default class LinkFormatter extends ParagraphBase {
    constructor();
    linkRule: any;
    beforeMakeHtml(str: any): any;
    makeHtml(str: any): any;
    afterMakeHtml(str: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
        reg: RegExp;
    };
}
import ParagraphBase from '../../core/ParagraphBase';
