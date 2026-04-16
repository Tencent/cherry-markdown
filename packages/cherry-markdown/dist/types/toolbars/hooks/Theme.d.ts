/**
 * 修改主题
 */
export default class Theme extends MenuBase {
    constructor($cherry: any);
    subMenuConfig: any[];
    /**
     * 绑定子菜单点击事件
     * @param {HTMLDivElement} subMenuDomPanel
     * @returns {number} 当前激活的子菜单索引
     */
    getActiveSubMenuIndex(subMenuDomPanel: HTMLDivElement): number;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): string;
}
import MenuBase from '@/toolbars/MenuBase';
