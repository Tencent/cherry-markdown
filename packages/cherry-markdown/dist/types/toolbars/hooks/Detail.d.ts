/**
 * 插入手风琴
 */
export default class Detail extends MenuBase {
    constructor($cherry: any);
    detailRule: any;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string): string;
}
import MenuBase from "@/toolbars/MenuBase";
