/**
 * 插入时间线
 * 复用 Panel 的 :::xxx ... ::: 交互逻辑，插入的模板内部包含多条 "- [status] time title" 条目
 */
export default class Timeline extends MenuBase {
    constructor($cherry: any);
    panelRule: any;
    noSubMenu: boolean;
    $getTitle(): any;
    /**
     * 点击工具栏按钮时，插入一个时间线模板。
     * 复用父类 Panel.onClick 的骨架：把 shortKey 固定为 'timeline'，
     * 并把默认的 "内容" 替换为多条示例条目。
     */
    onClick(selection: any): string;
}
import MenuBase from '@/toolbars/MenuBase';
