/**
 * 插入行内公式
 * @see https://github.com/QianJianTech/LaTeXLive/blob/master/README.md
 */
export default class Formula extends MenuBase {
    subBubbleFormulaMenu: BubbleFormula;
    catchOnce: string;
    shortcutKeyMap: {
        [x: string]: {
            hookName: string;
            aliasName: any;
        };
    };
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @returns {boolean} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): boolean;
}
import MenuBase from "@/toolbars/MenuBase";
import BubbleFormula from "../BubbleFormula";
