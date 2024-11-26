/**
 * 设置代码块的主题
 * 本功能依赖[prism组件](https://github.com/PrismJS/prism)
 */
export default class CodeTheme extends MenuBase {
    constructor($cherry: any);
    subMenuConfig: ({
        noIcon: boolean;
        name: string;
        iconName: string;
        onclick: any;
    } | {
        noIcon: boolean;
        name: string;
        onclick: any;
        iconName?: undefined;
    })[];
    getActiveSubMenuIndex(subMenuDomPanel: any): -1 | 0;
    /**
     * 响应点击事件
     * @param {string} shortKey 快捷键参数，本函数不处理这个参数
     * @param {string} codeTheme 具体的代码块主题
     */
    onClick(shortKey: string, codeTheme: string): void;
}
import MenuBase from "@/toolbars/MenuBase";
