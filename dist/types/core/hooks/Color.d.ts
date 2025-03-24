export default class Color extends SyntaxBase {
    toHtml(whole: any, leadingChar: any, m1: any, m2: any): string;
    makeHtml(str: any): any;
    rule(): {
        begin: string;
        end: string;
        content: string;
    };
}
import SyntaxBase from "@/core/SyntaxBase";
