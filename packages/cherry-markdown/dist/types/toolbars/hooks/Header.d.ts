/**
 * 插入1级~5级标题
 */
export default class Header extends MenuBase {
    subMenuConfig: {
        iconName: string;
        name: string;
        onclick: any;
    }[];
    shortcutKeyMap: {
        [x: string]: {
            hookName: string;
            aliasName: any;
        };
    };
    getSubMenuConfig(): {
        iconName: string;
        name: string;
        onclick: any;
    }[];
    /**
     * 解析快捷键，判断插入的标题级别
     * @param {string} shortKey 快捷键
     * @returns
     */
    $getFlagStr(shortKey: string): string;
    $testIsHead(selection: any): boolean;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): string;
}
import MenuBase from "@/toolbars/MenuBase";
