/**
 * 切换语言按钮
 **/
export default class ChangeLocale extends MenuBase {
    constructor($cherry: any);
    changeLocale: any;
    subMenuConfig: {
        iconName: any;
        name: any;
        onclick: any;
    }[];
    nameMap: {};
    onClick(selection: any, shortKey: any): void;
}
import MenuBase from "@/toolbars/MenuBase";
