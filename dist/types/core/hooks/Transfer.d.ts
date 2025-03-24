export default class Transfer extends SyntaxBase {
    rule(): {
        begin: string;
        content: string;
        end: string;
        reg: RegExp;
    };
    beforeMakeHtml(str: any): any;
    afterMakeHtml(str: any): any;
}
import SyntaxBase from "../SyntaxBase.js";
