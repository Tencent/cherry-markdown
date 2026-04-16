/**
 * 连续空格
 */
export default class Space extends SyntaxBase {
    makeHtml(str: any, sentenceMakeFunc: any): any;
    rule(): {
        begin: string;
        end: string;
        content: string;
    };
}
import SyntaxBase from '@/core/SyntaxBase';
