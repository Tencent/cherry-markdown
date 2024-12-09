/**
 * 插入有序/无序/checklist列表的按钮
 */
export default class List extends MenuBase {
    constructor($cherry: any);
    subMenuConfig: {
        iconName: string;
        name: string;
        onclick: any;
    }[];
    getSubMenuConfig(): {
        iconName: string;
        name: string;
        onclick: any;
    }[];
    /**
     * 响应点击事件
     * @param {string} selection 编辑区选中的文本内容
     * @param {1|2|3|'ol'|'1'|'2'|'3'|'ul'|'checklist'|''} shortKey 快捷键：ol(1)有序列表，ul(2)无序列表，checklist(3) 检查项
     * @returns 对应markdown的源码
     */
    onClick(selection: string, shortKey?: 1 | 2 | 3 | 'ol' | '1' | '2' | '3' | 'ul' | 'checklist' | ''): string;
}
import MenuBase from "@/toolbars/MenuBase";
