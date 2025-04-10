export default class HighLight extends SyntaxBase {
    makeHtml(str: any): any;
    rule(): {
        begin: string;
        end: string;
        content: string;
    };
}
import SyntaxBase from "../SyntaxBase.js";
