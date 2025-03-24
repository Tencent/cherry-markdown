export default class Publish extends MenuBase {
    previewer: import("../../Previewer").default;
    /**
     * 子菜单点击事件
     * @param {string} selection 编辑器中选中的内容
     * @param {import('../../../types/cherry').CherryPublishToolbarOption} shortcut 子菜单配置项
     */
    onClick(selection: string, shortcut: import('../../../types/cherry').CherryPublishToolbarOption): void;
    /**
     * 获取所有的样式表
     * @returns {string}
     */
    getAllStyleSheets(): string;
}
export type SupportPlatform = import('../../../types/cherry').SupportPlatform;
import MenuBase from "@/toolbars/MenuBase";
