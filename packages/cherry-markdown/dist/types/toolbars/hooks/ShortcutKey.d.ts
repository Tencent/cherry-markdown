/**
 * 快捷键配置
 */
export default class ShortcutKey extends MenuBase {
    constructor($cherry: any);
    disabledHideAllSubMenu: boolean;
    shortcutKeyMap: {
        [x: string]: {
            hookName: string;
            sub: string;
            aliasName: any;
        };
    };
    hideOtherSubMenu(hideAllSubMenu: any): any;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数，本函数不处理这个参数
     */
    onClick(selection: string, shortKey?: string): string;
    shortcutKeyConfigPanel: ShortcutKeyConfigPanel;
}
import MenuBase from "@/toolbars/MenuBase";
import ShortcutKeyConfigPanel from "@/toolbars/ShortcutKeyConfigPanel";
