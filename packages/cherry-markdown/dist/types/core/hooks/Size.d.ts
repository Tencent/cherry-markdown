export default class Size extends SyntaxBase {
    toHtml(whole: any, m1: any, m2: any, m3: any): string;
    makeHtml(str: any): any;
    rule(): {
        begin: string;
        end: string;
        content: string;
    };
}
import SyntaxBase from "@/core/SyntaxBase";
