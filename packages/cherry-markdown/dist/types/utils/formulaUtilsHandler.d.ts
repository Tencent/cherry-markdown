export default class FormulaHandler {
    /**
     * @param {string} trigger 触发方式
     * @param {Element} target 目标dom
     * @param {HTMLDivElement} container bubble容器
     * @param {HTMLDivElement} previewerDom 预览器dom
     * @param {import('../Editor').default} editor 编辑器实例
     */
    constructor(trigger: string, target: Element, container: HTMLDivElement, previewerDom: HTMLDivElement, editor: import('../Editor').default);
    /** @type{HTMLElement} */
    bubbleContainer: HTMLElement;
    trigger: string;
    target: Element;
    container: HTMLDivElement;
    previewerDom: HTMLDivElement;
    editor: import("../Editor").default;
    /**
     * 触发事件
     * @param {string} type 事件类型
     * @param {Event} event 事件对象
     */
    emit(type: string, event: Event): void;
    /**
     * 绘制公式操作bubble容器
     */
    drawBubble(): void;
    /**
     * 显示bubble
     * @param {number} x
     * @param {number} y
     */
    showBubble(x: number, y: number): void;
    collectFormulaCode(): void;
    formulaCode: any[];
    remove(): void;
    /**
     * bubble 上的点击事件
     * @param {Event} e
     */
    bubbleClickHandler(e: Event): void;
}
