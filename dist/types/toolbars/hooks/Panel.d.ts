/**
 * 插入面板
 */
export default class Panel extends MenuBase {
    constructor($cherry: any);
    panelRule: any;
    subMenuConfig: {
        iconName: string;
        name: string;
        onclick: any;
    }[];
    /**
     * 从字符串中找打面板的name
     * @param {string} str
     * @returns {string | false}
     */
    $getNameFromStr(str: string): string | false;
    $getTitle(str: any): string;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): string;
}
import MenuBase from "@/toolbars/MenuBase";
