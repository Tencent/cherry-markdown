/**
 * 工具栏里的分割线，用来切分不同类型按钮的区域
 * 一个实例中可以配置多个分割线
 */
export default class Split extends MenuBase {
    constructor($cherry: any);
    /**
     * 重载创建按钮逻辑
     * @returns {HTMLElement} 分割线标签
     */
    createBtn(): HTMLElement;
}
import MenuBase from "@/toolbars/MenuBase";
