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
    timer: NodeJS.Timeout;
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
    updateTocList(onlyScroll?: boolean): void;
}
