/**
 * 撤销回退按钮，点击后触发编辑器的undo操作
 * 依赖codemirror的undo接口
 **/
export default class Undo extends MenuBase {
    constructor($cherry: any);
    onClick(): void;
}
import MenuBase from "@/toolbars/MenuBase";
