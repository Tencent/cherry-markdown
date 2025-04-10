/**
 * 插入“简单表格”的按钮
 * 所谓简单表格，是源于[TAPD](https://tapd.cn) wiki应用里的一种表格语法
 * 该表格语法不是markdown通用语法，请慎用
 */
export default class QuickTable extends MenuBase {
    constructor($cherry: any);
    /**
     * 响应点击事件
     * @param {string} selection 编辑器里选中的内容
     * @param {string} shortKey 本函数不处理快捷键
     * @returns
     */
    onClick(selection: string, shortKey?: string): string;
}
import MenuBase from "@/toolbars/MenuBase";
