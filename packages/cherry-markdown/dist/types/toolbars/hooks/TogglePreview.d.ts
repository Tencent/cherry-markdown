/**
 * 关闭/展示预览区域的按钮
 */
export default class TogglePreview extends MenuBase {
    constructor($cherry: any);
    /** @type {boolean} 当前预览状态 */
    $previewerHidden: boolean;
    instanceId: any;
    /**
     * 绑定预览事件
     */
    attachEventListeners(): void;
    set isHidden(arg: boolean);
    get isHidden(): boolean;
    /**
     * 响应点击事件
     */
    onClick(): void;
}
import MenuBase from "@/toolbars/MenuBase";
