/**
 * 插入“引用”的按钮
 */
export default class Quote extends MenuBase {
    constructor($cherry: any);
    /**
     * click handler
     * @param {string} selection selection in editor
     * @returns
     */
    onClick(selection: string): any;
}
import MenuBase from "@/toolbars/MenuBase";
