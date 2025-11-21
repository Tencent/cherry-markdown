/**
 * 插入“画图”的按钮
 * 本功能依赖[Mermaid.js](https://mermaid-js.github.io)组件，请保证调用CherryMarkdown前已加载mermaid.js组件
 */
export default class Graph extends MenuBase {
    constructor($cherry: any);
    localeName: any;
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
     * @param {string} selection 被用户选中的文本内容，本函数不处理选中的内容，会直接清空用户选中的内容
     * @param {1|2|3|4|5|6|'1'|'2'|'3'|'4'|'5'|'6'|'flow'|'sequence'|'state'|'class'|'pie'|'gantt'|''} shortKey 快捷键参数
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: 1 | 2 | 3 | 4 | 5 | 6 | '1' | '2' | '3' | '4' | '5' | '6' | 'flow' | 'sequence' | 'state' | 'class' | 'pie' | 'gantt' | ''): string;
    /**
     * 画图的markdown源码模版
     * @param {string} type 画图的类型
     * @returns
     */
    $getSampleCode(type: string): any;
}
import MenuBase from "@/toolbars/MenuBase";
