/**
 * 预览区域切换到“移动端视图”的按钮
 */
export default class MobilePreview extends MenuBase {
    constructor($cherry: any);
    previewer: any;
    /**
     * 响应点击事件
     * 因为是预览区域的按钮，所以不用关注编辑区的选中内容
     */
    onClick(): void;
}
import MenuBase from "@/toolbars/MenuBase";
