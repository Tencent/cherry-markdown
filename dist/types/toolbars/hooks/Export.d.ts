export default class Export extends MenuBase {
    constructor($cherry: any);
    subMenuConfig: {
        noIcon: boolean;
        name: string;
        onclick: any;
    }[];
    onClick(shortKey: string, type: any): void;
}
import MenuBase from "@/toolbars/MenuBase";
