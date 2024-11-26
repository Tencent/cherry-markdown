export default class Ruby extends SyntaxBase {
    makeHtml(str: any): any;
    rule(): {
        begin: string;
        end: string;
        content: string;
    };
}
import SyntaxBase from "@/core/SyntaxBase";
