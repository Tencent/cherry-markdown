export default class FormulaHandler {
    /**
     * @param {string} trigger 触发方式
     * @param {Element} target 目标dom
     * @param {HTMLDivElement} container bubble容器
     * @param {HTMLDivElement} previewerDom 预览器dom
     * @param {import('../Cherry').default} $cherry Cherry实例（流式渲染场景下不依赖 editor）
     */
    constructor(trigger: string, target: Element, container: HTMLDivElement, previewerDom: HTMLDivElement, $cherry: import("../Cherry").default);
    /** @type{HTMLElement} */
    bubbleContainer: HTMLElement;
    trigger: string;
    target: Element;
    container: HTMLDivElement;
    previewerDom: HTMLDivElement;
    $cherry: import("..").default;
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
    /**
     * 从 DOM 的 data-content 属性获取 latex 源码
     * @returns {string|null} latex 源码
     */
    getLatexFromDOM(): string | null;
    remove(): void;
    /**
     * bubble 上的点击事件
     * @param {Event} e
     */
    bubbleClickHandler(e: Event): void;
    getFormulaSource(): string;
}
