/**
 * 插入表格的辅助面板
 */
export default class BubbleTableMenu {
    constructor({ row, col }: {
        row: any;
        col: any;
    }, className: any);
    afterClick: (...args: any[]) => void;
    init(row: any, col: any, className: any): HTMLTableElement;
    dom: HTMLTableElement;
    cell: any[][];
    maxRow: any;
    maxCol: any;
    activeRow: any;
    activeCol: any;
    initEventListeners(): void;
    setActiveCell(row: any, col: any): void;
    handleMouseMove(event: any): void;
    handleMouseUp(event: any): void;
    show(callback: any): void;
    hide(): void;
}
