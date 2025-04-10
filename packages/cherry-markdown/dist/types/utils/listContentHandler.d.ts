export default class ListHandler {
    /**
     * @param {string} trigger 触发方式
     * @param {HTMLParagraphElement} target 目标dom
     * @param {HTMLDivElement} container bubble容器
     * @param {HTMLDivElement} previewerDom 预览器dom
     * @param {import('../Editor').default} editor 编辑器实例
     */
    constructor(trigger: string, target: HTMLParagraphElement, container: HTMLDivElement, previewerDom: HTMLDivElement, editor: import('../Editor').default, options?: {});
    /** @type{HTMLElement} */
    bubbleContainer: HTMLElement;
    regList: RegExp;
    /** @type{Array.<import('codemirror').Position>} */
    range: Array<import('codemirror').Position>;
    /** @type{import('codemirror').Position} */
    position: import('codemirror').Position;
    input: boolean;
    isCheckbox: boolean;
    trigger: string;
    target: HTMLParagraphElement;
    container: HTMLDivElement;
    previewerDom: HTMLDivElement;
    editor: import("../Editor").default;
    insertLineBreak: boolean;
    handleEditablesInputBinded: any;
    handleEditablesUnfocusBinded: any;
    /**
     * 触发事件
     * @param {string} type 事件类型
     * @param {Event} event 事件对象
     */
    emit(type: string, event: Event): void;
    remove(): void;
    setSelection(): void;
    /**
     * 处理contenteditable元素的输入事件
     * @param {InputEvent} event
     */
    handleEditablesInput(event: InputEvent): void;
    /**
     * 处理contenteditable元素的失去焦点事件
     * @param {FocusEvent} event
     */
    handleEditablesUnfocus(event: FocusEvent): void;
    /**
     * @param {InputEvent} event
     */
    handleInsertLineBreak(event: InputEvent): void;
}
