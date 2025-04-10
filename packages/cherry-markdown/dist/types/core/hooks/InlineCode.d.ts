export default class InlineCode extends ParagraphBase {
    makeHtml(str: any): any;
    $cleanCache(): void;
    rule(): {
        begin: string;
        end: string;
        content: string;
    };
}
import ParagraphBase from "@/core/ParagraphBase";
