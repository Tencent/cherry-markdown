/**
 * 撤销/重做 里的“重做”按键
 * 依赖codemirror的undo接口
 */
export default class Redo extends MenuBase {
    constructor($cherry: any);
    /**
     * 直接调用codemirror的redo方法就好了
     */
    onClick(): void;
}
import MenuBase from "@/toolbars/MenuBase";
