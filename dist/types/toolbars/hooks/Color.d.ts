/**
 * 插入字体颜色或者字体背景颜色的按钮
 */
export default class Color extends MenuBase {
    constructor($cherry: any);
    bubbleColor: BubbleColor;
    $testIsColor(type: any, selection: any): boolean;
    $testIsShortKey(shortKey: any): boolean;
    $getTypeAndColor(shortKey: any): boolean | {
        type: string;
        color: any;
    };
    hideOtherSubMenu(hideAllSubMenu: any): void;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数，color: #000000 | background-color: #000000
     * @param {Event & {target:HTMLElement}} event 点击事件，用来从被点击的调色盘中获得对应的颜色
     * @returns 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey: string, event: Event & {
        target: HTMLElement;
    }): any;
}
import MenuBase from "@/toolbars/MenuBase";
/**
 * 调色盘
 */
declare class BubbleColor {
    constructor($cherry: any);
    editor: any;
    $cherry: any;
    /**
     * 定义调色盘每个色块的颜色值
     */
    colorStack: string[];
    /**
     * 用来暂存选中的内容
     * @param {string} selection 编辑区选中的文本内容
     */
    setSelection(selection: string): void;
    selection: string;
    getFontColorDom(title: any): string;
    getDom(): HTMLDivElement;
    init(): void;
    dom: HTMLDivElement;
    onClick(): string;
    initAction(): void;
    colorValue: string;
    type: string;
    /**
     * 在对应的坐标展示/关闭调色盘
     * @param {Object} 坐标
     */
    toggle({ left, top, $color }: any): void;
    $color: any;
}
export {};
