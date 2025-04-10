/**
 * 切换预览/编辑模式的按钮
 * 该按钮不支持切换到双栏编辑模式
 * 只能切换成纯编辑模式和纯预览模式
 **/
export default class SwitchModel extends MenuBase {
    constructor($cherry: any);
    instanceId: any;
    attachEventListeners(): void;
    onClick(): void;
}
import MenuBase from "@/toolbars/MenuBase";
