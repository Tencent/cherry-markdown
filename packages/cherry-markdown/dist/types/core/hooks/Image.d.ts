export default class Image extends SyntaxBase {
    constructor({ config, globalConfig }: {
        config: any;
        globalConfig: any;
    });
    config: any;
    extendMedia: {
        tag: string[];
    };
    RULE: {
        begin: string;
        content: string;
        end: string;
    };
    replaceToHtml(type: any, match: any, leadingChar: any, alt: any, link: any, title: any, poster: any): any;
    toHtml(match: any, leadingChar: any, alt: any, link: any, title: any, ref: any, extendAttrs: any): any;
    toMediaHtml(match: any, leadingChar: any, mediaType: any, alt: any, link: any, title: any, ref: any, posterWrap: any, poster: any, ...args: any[]): any;
    makeHtml(str: any): any;
    testMedia(str: any): any;
    rule(extendMedia: any): {
        begin: string;
        content: string;
        end: string;
    };
}
import SyntaxBase from "@/core/SyntaxBase";
