/**
 * 悬浮目录
 */
export default class Toc {
    constructor(options: any);
    $cherry: any;
    editor: any;
    tocStr: string;
    updateLocationHash: any;
    defaultModel: any;
    showAutoNumber: any;
    position: any;
    cssText: any;
    init(): void;
    timer: number;
    getModelFromLocalStorage(): any;
    setModelToLocalStorage(model: any): void;
    drawDom(): void;
    tocClose: HTMLElement;
    tocOpen: HTMLElement;
    tocListDom: HTMLDivElement;
    tocDom: HTMLDivElement;
    bindClickEvent(): void;
    $switchModel(model?: string): void;
    model: string;
    $getClosestNode(node: any, targetNodeName: any): any;
    makeHtmlStringToNode(newHtml: any): ChildNode;
    updateTocList(onlyScroll?: boolean): void;
}
