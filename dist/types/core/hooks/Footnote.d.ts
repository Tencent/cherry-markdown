export default class Footnote extends ParagraphBase {
    constructor({ externals, config }: {
        externals: any;
        config: any;
    });
    footnoteCache: {};
    footnoteMap: {};
    footnote: any[];
    $cleanCache(): void;
    pushFootnoteCache(key: any, cache: any): void;
    getFootnoteCache(key: any): any;
    pushFootNote(key: any, note: any): any;
    getFootNote(): any[];
    formatFootNote(): string;
    beforeMakeHtml(str: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from "@/core/ParagraphBase";
