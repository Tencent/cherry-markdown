export function makeChecklist(text: any): any;
export default class List extends ParagraphBase {
    constructor({ config }: {
        config: any;
    });
    config: any;
    tree: any[];
    emptyLines: number;
    indentSpace: number;
    addNode(node: any, current: any, parent: any, last: any): void;
    buildTree(html: any, sentenceMakeFunc: any): void;
    renderSubTree(node: any, children: any, type: any): string;
    renderTree(current: any): string;
    toHtml(wholeMatch: any, sentenceMakeFunc: any): string;
    $getLineNum(str: any): any;
    makeHtml(str: any, sentenceMakeFunc: any): string;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from "@/core/ParagraphBase";
